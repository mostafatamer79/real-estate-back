import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(
    @Request() req,
    @Query('limit') limit: string = '20',
    @Query('offset') offset: string = '0',
  ) {
    const userId = req.user.userId;
    const result = await this.notificationService.findAllByUser(
      userId,
      parseInt(limit),
      parseInt(offset),
    );

    return result;
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const userId = req.user.userId;
    const count = await this.notificationService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    const notification = await this.notificationService.markAsRead(id, userId);
    return notification;
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req) {
    const userId = req.user.userId;
    await this.notificationService.markAllAsRead(userId);
    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    await this.notificationService.delete(id, userId);
    return { message: 'Notification deleted' };
  }
}
