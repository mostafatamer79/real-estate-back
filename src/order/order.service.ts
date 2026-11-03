import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { User, Role } from '../user/user-entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationGateway } from '../notification/notification.gateway';
import { NotificationType } from '../notification/notification.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationService: NotificationService,
    private notificationGateway: NotificationGateway,
  ) {}

  private async getOwnerIds(ownerId: string): Promise<string[]> {
    const user = await this.userRepository.findOne({ where: { id: ownerId } });
    if (!user) return [ownerId];

    if (user.role === Role.MANGER) {
      const subUsers = await this.userRepository.find({ where: { parentId: ownerId } });
      return [ownerId, ...subUsers.map((u) => u.id)];
    }

    return [ownerId];
  }

  async create(createOrderDto: CreateOrderDto, user: User): Promise<Order> {
    const targetUserId = user.role === Role.ADMIN && createOrderDto.userId ? createOrderDto.userId : user.id;

    const targetUser = await this.userRepository.findOne({ where: { id: targetUserId } });
    if (!targetUser) throw new NotFoundException('User not found');

    const order = this.orderRepository.create({
      ...createOrderDto,
      user: targetUser,
      department: createOrderDto.department || (user.departments && user.departments.length > 0 ? user.departments[0] : null),
    });
    const savedOrder = await this.orderRepository.save(order);

    const notification = await this.notificationService.create(
      targetUserId,
      NotificationType.ORDER,
      'طلب جديد',
      `تم إنشاء طلب جديد رقم ${savedOrder.id}`,
      { orderId: savedOrder.id },
    );

    await this.notificationGateway.sendNotificationToUser(targetUserId, notification);

    return savedOrder;
  }
 
  async findAll(user?: any): Promise<Order[]> {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.assignedTo', 'assignedTo')
      .orderBy('order.createdAt', 'DESC');

    if (user && user.role !== Role.ADMIN) {
      const userId = user.id || user.userId;
      const ownerIds = await this.getOwnerIds(userId);
      const departments = user.departments || [];

      if (departments.length > 0) {
        query.where('(order.userId IN (:...ownerIds) OR order.department IN (:...departments))', { ownerIds, departments });
      } else {
        query.where('order.userId IN (:...ownerIds)', { ownerIds });
      }
    }

    return query.getMany();
  }
 
  private async findAuthorized(id: string, user: any): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'assignedTo'],
    });
    if (!order) throw new NotFoundException('Order not found');
    const userId = user?.id || user?.userId;
    if (user?.role !== Role.ADMIN && order.user?.id !== userId && order.assignedTo?.id !== userId) {
      throw new ForbiddenException('You do not have permission to access this order');
    }
    return order;
  }

  async findOne(id: string, user: any): Promise<Order> {
    return this.findAuthorized(id, user);
  }

  async update(id: string, updateOrderDto: any, user: any): Promise<Order> {
    const order = await this.findAuthorized(id, user);
    Object.assign(order, updateOrderDto);
    return this.orderRepository.save(order);
  }

  async updateStatus(id: string, status: string, user: any): Promise<Order> {
    const order = await this.findAuthorized(id, user);
    order.status = status;
    return this.orderRepository.save(order);
  }

  async assignOrder(id: string, assignedToId: string | null, user: any): Promise<Order> {
    if (user?.role !== Role.ADMIN) throw new ForbiddenException('Only administrators can assign orders');
    const order = await this.findAuthorized(id, user);
    order.assignedToId = assignedToId;
    return this.orderRepository.save(order);
  }

  async findByUser(userId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'assignedTo'],
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: string, user: any): Promise<void> {
    await this.findAuthorized(id, user);
    await this.orderRepository.delete(id);
  }
}
