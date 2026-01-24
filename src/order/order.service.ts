import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../user/user-entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async create(createOrderDto: CreateOrderDto, user: User): Promise<Order> {
    const order = this.orderRepository.create({
      ...createOrderDto,
      user,
    });
    return this.orderRepository.save(order);
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Order | null> {
    return this.orderRepository.findOne({ where: { id } });
  }

  async findByUser(userId: string): Promise<Order[]> {
    return this.orderRepository.find({ where: { user: { id: userId } }, order: { createdAt: 'DESC' } });
  }

  async remove(id: string): Promise<void> {
    await this.orderRepository.delete(id);
  }
}
