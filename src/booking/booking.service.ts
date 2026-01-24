import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus, BookingType } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { OffersService } from '../offer/offers.service';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly offersService: OffersService,
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

    return this.bookingRepository.save(booking);
  }

  async findAll(user: any) {
    return this.bookingRepository.find({
      where: { userId: user.id },
      relations: ['offer', 'dispute', 'agent'],
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
    return this.bookingRepository.save(booking);
  }

  async remove(id: string, user: any) {
     const booking = await this.findOne(id, user);
     return this.bookingRepository.remove(booking);
  }
}
