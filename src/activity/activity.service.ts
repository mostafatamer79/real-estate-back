import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity, ActivityType } from '../common/entities/activity.entity';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async create(type: ActivityType, title?: string, description?: string, metadata?: any, userId?: string): Promise<Activity> {
    const activity = this.activityRepository.create({
      type,
      title,
      description,
      metadata,
      userId,
    });
    return await this.activityRepository.save(activity);
  }

  async findByUser(userId: string, limit: number = 10): Promise<Activity[]> {
    return await this.activityRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findAll(limit: number = 10): Promise<Activity[]> {
    return await this.activityRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getRecentActivities(): Promise<Activity[]> {
    return await this.findAll(5);
  }
}
