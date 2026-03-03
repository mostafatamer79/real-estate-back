import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus, BookingType } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { OffersService } from '../offer/offers.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationGateway } from '../notification/notification.gateway';
import { NotificationType } from '../notification/notification.entity';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly offersService: OffersService,
    private notificationService: NotificationService,
    private notificationGateway: NotificationGateway,
  ) {}

  async create(createBookingDto: CreateBookingDto, user: any) {
    let agentId = createBookingDto.agentId;

    // Resolve Agent from Offer if not provided
    if (createBookingDto.offerId && !agentId) {
      const offer = await this.offersService.findOne(createBookingDto.offerId, user);
      agentId = offer.userId;
    }

    // Resolve Agent for Dispute? (Optional: if dispute has an assigned agent)

    if (!agentId && createBookingDto.type !== BookingType.DISPUTE_RESOLUTION) {
        // For visits/purchases, agent is required usually. But maybe we allow generic requests?
        // Proceeding without agentId might be valid for "Platform" requests.
    }

    const booking = this.bookingRepository.create({
      ...createBookingDto,
      userId: user.id,
      agentId: agentId, 
      status: BookingStatus.PENDING,
    });

    const savedBooking = await this.bookingRepository.save(booking);

    // Create notification for the user
    // Notification for User
    const notification = await this.notificationService.create(
      user.id,
      NotificationType.BOOKING,
      'تم استلام طلبك',
      `تم استلام طلب الحجز الخاص بك رقم ${savedBooking.id.substring(0, 8)} بنجاح. سيتم مراجعته قريباً.`,
      { bookingId: savedBooking.id, bookingType: savedBooking.type }
    );

    // Send real-time notification
    await this.notificationGateway.sendNotificationToUser(user.id, notification);

    // Notify agent if exists (or Owner if Purchase?)
    // If Purchase, notify Offer Owner
    if (createBookingDto.type === BookingType.PURCHASE && savedBooking.offer) {
        const ownerId = savedBooking.offer.userId; // Assuming relation is loaded or we have userId
        // We need to fetch offer with user to get ownerId if not available.
        // But logic above: "Resolve Agent from Offer if not provided" -> agentId = offer.userId
        
        if (agentId) { // agentId is the Owner for Purchase
             const ownerNotification = await this.notificationService.create(
                agentId,
                NotificationType.BOOKING,
                'طلب شراء جديد',
                `لديك طلب شراء جديد للعقار الخاص بك رقم ${savedBooking.id.substring(0, 8)}`,
                { bookingId: savedBooking.id, bookingType: savedBooking.type }
              );
              await this.notificationGateway.sendNotificationToUser(agentId, ownerNotification);
        }
    } else if (agentId) {
       // Visit Request with Agent
      const agentNotification = await this.notificationService.create(
        agentId,
        NotificationType.BOOKING,
        'طلب زيارة جديد',
        `لديك طلب زيارة جديد رقم ${savedBooking.id.substring(0, 8)}`,
        { bookingId: savedBooking.id, bookingType: savedBooking.type }
      );
      await this.notificationGateway.sendNotificationToUser(agentId, agentNotification);
    }

    return savedBooking;
  }

  async findAll(user: any) {
    return this.bookingRepository.find({
      where: { userId: user.id },
      relations: ['offer', 'dispute', 'agent'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: string) {
    return this.bookingRepository.find({
      where: { userId },
      relations: ['offer', 'agent'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByOffer(offerId: string) {
    return this.bookingRepository.find({
      where: { offerId },
      relations: ['user', 'agent'],
      order: { createdAt: 'DESC' },
    });
  }

  async findIncoming(user: any) {
    return this.bookingRepository.find({
      where: { agentId: user.id },
      relations: ['offer', 'dispute', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user: any) {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['offer', 'dispute', 'user', 'agent'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking #${id} not found`);
    }

    // Check ownership (User or Agent)
    // if (booking.userId !== user.id && booking.agentId !== user.id) {
    //   throw new ForbiddenException('You do not have permission to view this booking');
    // }

    return booking;
  }

  async updateStatus(id: string, status: BookingStatus, user: any) {
    const booking = await this.findOne(id, user);

    // Only Agent can Accept/Reject? Or User can Cancel?
    // Allow both for now, enforce role logic in controller or here if strict.
    
    booking.status = status;
    const updatedBooking = await this.bookingRepository.save(booking);

    // Notify user about status change
    const statusMessages: Record<string, string> = {
      'accepted': 'تم تأكيد حجزك',
      'rejected': 'تم رفض الحجز',
      'confirmed': 'تم تأكيد حجزك',
      'cancelled': 'تم إلغاء حجزك',
      'completed': 'تم إكمال حجزك',
      'paid': 'تم استلام الدفعة',
    };

    if (statusMessages[status]) {
      const notification = await this.notificationService.create(
        booking.userId,
        NotificationType.BOOKING,
        'تحديث حالة الطلب',
        `${statusMessages[status]} للطلب رقم ${booking.id.substring(0, 8)}`,
        { bookingId: booking.id, status }
      );
      await this.notificationGateway.sendNotificationToUser(booking.userId, notification);
    }

    return updatedBooking;
  }

  async remove(id: string, user: any) {
     const booking = await this.findOne(id, user);
     return this.bookingRepository.remove(booking);
  }

  // --- Admin Methods ---

  async findAllPurchaseRequestsAdmin() {
    return this.bookingRepository.find({
      where: { type: BookingType.PURCHASE },
      relations: ['user', 'offer'], 
      order: { createdAt: 'DESC' },
    });
  }

  async findAllVisitRequestsAdmin() {
    return this.bookingRepository.find({
      where: { type: BookingType.VISIT },
      relations: ['user', 'offer', 'agent'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllOrdersAdmin() {
    return this.bookingRepository.find({
      relations: ['user', 'offer', 'agent'],
      order: { createdAt: 'DESC' },
    });
  }

  async updatePurchaseStatusAdmin(id: string, status: BookingStatus, user: any) {
    const booking = await this.bookingRepository.findOne({
        where: { id },
        relations: ['offer']
    });

    if (!booking) {
        throw new NotFoundException(`Booking #${id} not found`);
    }

    booking.status = status;
    await this.bookingRepository.save(booking);

    if (booking.offer) {
        if (status === BookingStatus.ACCEPTED) {
             await this.offersService.updateStatus(booking.offer.id, 'reserved', user); 
        } else if (status === BookingStatus.PAID) {
             await this.offersService.updateStatus(booking.offer.id, 'sold', user);
        }
    }

    return booking;
  }

  async updateVisitStatusAdmin(id: string, status: BookingStatus, user: any) {
      const booking = await this.bookingRepository.findOne({ where: { id } });
      if (!booking) throw new NotFoundException('Booking not found');
      
      booking.status = status;
      return this.bookingRepository.save(booking);
  }

  async assignAgentAdmin(id: string, agentId: string, user: any) {
      const booking = await this.bookingRepository.findOne({ where: { id } });
       if (!booking) throw new NotFoundException('Booking not found');
       
       booking.agentId = agentId;
       booking.status = BookingStatus.ACCEPTED; 
       
       return this.bookingRepository.save(booking);
  }


}
