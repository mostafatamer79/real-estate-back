import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../user/user-entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationGateway } from '../notification/notification.gateway';
import { NotificationType } from '../notification/notification.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private notificationService: NotificationService,
    private notificationGateway: NotificationGateway,
  ) {}

  async create(createOrderDto: CreateOrderDto, user: User): Promise<Order> {
    const order = this.orderRepository.create({
      ...createOrderDto,
      user,
    });
    const savedOrder = await this.orderRepository.save(order);

    // Create notification for the user
    const notification = await this.notificationService.create(
      user.id,
      NotificationType.ORDER,
      'طلب جديد',
      `تم إنشاء طلب جديد رقم ${savedOrder.id}`,
      { orderId: savedOrder.id }
    );

    // Send real-time notification
    await this.notificationGateway.sendNotificationToUser(user.id, notification);

    return savedOrder;
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({ 
      relations: ['user'],
      order: { createdAt: 'DESC' } 
    });
  }

  async findOne(id: string): Promise<Order | null> {
    return this.orderRepository.findOne({ 
      where: { id },
      relations: ['user']
    });
  }

  async findByUser(userId: string): Promise<Order[]> {
    return this.orderRepository.find({ 
      where: { user: { id: userId } }, 
      relations: ['user'],
      order: { createdAt: 'DESC' } 
    });
  }

  async remove(id: string): Promise<void> {
    await this.orderRepository.delete(id);
  }
}
