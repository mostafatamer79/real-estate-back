import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionStatus, SubscriptionType } from './subscription.entity';
import { User } from '../user/user-entity';
import { Property } from '../property/entities/property.entity';
import { Unit } from '../property/entities/unit.entity';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  CancelSubscriptionDto,
} from './dto/create-subscription.dto';
import { ManagementPackageService } from './management-package/management-package.service';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Property)
    private propertyRepository: Repository<Property>,
    @InjectRepository(Unit)
    private unitRepository: Repository<Unit>,
    private managementPackageService: ManagementPackageService,
  ) {}

  async create(
    userId: string,
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<Subscription> {
    // Validate property or unit exists if provided
    if (createSubscriptionDto.propertyId) {
      const property = await this.propertyRepository.findOne({
        where: { id: createSubscriptionDto.propertyId },
      });
      if (!property) {
        throw new NotFoundException('Property not found');
      }
    }

    if (createSubscriptionDto.unitId) {
      const unit = await this.unitRepository.findOne({
        where: { id: createSubscriptionDto.unitId },
      });
      if (!unit) {
        throw new NotFoundException('Unit not found');
      }
    }

    if (createSubscriptionDto.packageId) {
       const pkg = await this.managementPackageService.findOne(createSubscriptionDto.packageId);
       
       let basePrice = 0;
       if (createSubscriptionDto.subscriptionType === SubscriptionType.YEARLY) {
         basePrice = Number(pkg.yearlyPrice);
       } else if (createSubscriptionDto.subscriptionType === SubscriptionType.MONTHLY) {
         basePrice = Number(pkg.monthlyPrice);
       }

       if (basePrice > 0) {
          const discountAmount = basePrice * (Number(pkg.discount) / 100);
          createSubscriptionDto.amount = basePrice - discountAmount;
       } else {
          createSubscriptionDto.amount = 0;
       }
    }

    // Calculate end date based on subscription type
    const startDate = new Date(createSubscriptionDto.startDate);
    const endDate = new Date(startDate);

    switch (createSubscriptionDto.subscriptionType) {
      case SubscriptionType.YEARLY:
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      case SubscriptionType.MONTHLY:
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case SubscriptionType.CUSTOM:
        if (!createSubscriptionDto.customPeriodMonths) {
          throw new BadRequestException(
            'Custom period months required for custom subscription type',
          );
        }
        endDate.setMonth(endDate.getMonth() + createSubscriptionDto.customPeriodMonths);
        break;
    }

    const subscription = this.subscriptionRepository.create({
      userId,
      propertyId: createSubscriptionDto.propertyId,
      unitId: createSubscriptionDto.unitId,
      packageId: createSubscriptionDto.packageId,
      subscriptionType: createSubscriptionDto.subscriptionType,
      customPeriodMonths: createSubscriptionDto.customPeriodMonths,
      amount: createSubscriptionDto.amount,
      startDate,
      endDate,
      paymentMethod: createSubscriptionDto.paymentMethod,
      notes: createSubscriptionDto.notes,
      paymentReference: createSubscriptionDto.paymentReference,
      status: SubscriptionStatus.PENDING,
    });

    return await this.subscriptionRepository.save(subscription);
  }

  async findAll(userId?: string): Promise<Subscription[]> {
    const query = this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.user', 'user')
      .leftJoinAndSelect('subscription.property', 'property')
      .leftJoinAndSelect('subscription.unit', 'unit')
      .leftJoinAndSelect('subscription.package', 'package');

    if (userId) {
      query.where('subscription.userId = :userId', { userId });
    }

    return await query.orderBy('subscription.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['user', 'property', 'unit', 'package'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async findMySubscriptions(userId: string): Promise<Subscription[]> {
    return await this.subscriptionRepository.find({
      where: { userId },
      relations: ['property', 'unit', 'package'],
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveSubscriptions(userId: string): Promise<Subscription[]> {
    return await this.subscriptionRepository.find({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['property', 'unit', 'package'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    userId: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
  ): Promise<Subscription> {
    const subscription = await this.findOne(id);

    if (subscription.userId !== userId) {
      throw new ForbiddenException('You can only update your own subscription');
    }

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Cannot update a cancelled subscription');
    }

    Object.assign(subscription, updateSubscriptionDto);

    return await this.subscriptionRepository.save(subscription);
  }

  async cancel(
    id: string,
    userId: string,
    cancelSubscriptionDto: CancelSubscriptionDto,
  ): Promise<Subscription> {
    const subscription = await this.findOne(id);

    if (subscription.userId !== userId) {
      throw new ForbiddenException(
        'You can only cancel your own subscription',
      );
    }

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Subscription is already cancelled');
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelledAt = new Date();
    subscription.cancelledBy = userId;
    subscription.cancellationReason = cancelSubscriptionDto.cancellationReason;

    return await this.subscriptionRepository.save(subscription);
  }

  async activate(id: string): Promise<Subscription> {
    const subscription = await this.findOne(id);

    if (subscription.status === SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Subscription is already active');
    }

    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.paidAt = new Date();

    return await this.subscriptionRepository.save(subscription);
  }

  async checkExpiredSubscriptions(): Promise<void> {
    const now = new Date();

    const expiredSubscriptions = await this.subscriptionRepository
      .createQueryBuilder('subscription')
      .where('subscription.status = :status', {
        status: SubscriptionStatus.ACTIVE,
      })
      .andWhere('subscription.endDate < :now', { now })
      .getMany();

    for (const subscription of expiredSubscriptions) {
      subscription.status = SubscriptionStatus.EXPIRED;
      await this.subscriptionRepository.save(subscription);
    }
  }

  async getSubscriptionsByProperty(propertyId: string): Promise<Subscription[]> {
    return await this.subscriptionRepository.find({
      where: { propertyId },
      relations: ['user', 'unit'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSubscriptionsByUnit(unitId: string): Promise<Subscription[]> {
    return await this.subscriptionRepository.find({
      where: { unitId },
      relations: ['user', 'property'],
      order: { createdAt: 'DESC' },
    });
  }
}
