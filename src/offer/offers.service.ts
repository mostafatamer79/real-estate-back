import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from './offer-entity';
import { CreateOfferDto,UpdateOfferDto } from './create-offer.dto';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offersRepository: Repository<Offer>,
  ) {}

  // Create new offer
  async create(createOfferDto: CreateOfferDto): Promise<Offer> {
    const offer = this.offersRepository.create(createOfferDto);
    return await this.offersRepository.save(offer);
  }

  // Get all offers with filters
  async findAll(filters?: {
    status?: string;
    propertyType?: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    isActive?: boolean;
  }): Promise<Offer[]> {
    const query = this.offersRepository.createQueryBuilder('offer');

    if (filters) {
      if (filters.status) {
        query.andWhere('offer.status = :status', { status: filters.status });
      }
      if (filters.propertyType) {
        query.andWhere('offer.propertyType = :propertyType', { propertyType: filters.propertyType });
      }
      if (filters.city) {
        query.andWhere('offer.city = :city', { city: filters.city });
      }
      if (filters.minPrice) {
        query.andWhere('offer.price >= :minPrice', { minPrice: filters.minPrice });
      }
      if (filters.maxPrice) {
        query.andWhere('offer.price <= :maxPrice', { maxPrice: filters.maxPrice });
      }
      if (filters.isActive !== undefined) {
        query.andWhere('offer.isActive = :isActive', { isActive: filters.isActive });
      }
    }

    query.orderBy('offer.createdAt', 'DESC');

    return await query.getMany();
  }

  // Get single offer by ID
  async findOne(id: string): Promise<Offer> {
    const offer = await this.offersRepository.findOne({ where: { id } });

    if (!offer) {
      throw new NotFoundException(`Offer with ID ${id} not found`);
    }

    return offer;
  }

  // Update offer
  async update(id: string, updateOfferDto: UpdateOfferDto): Promise<Offer> {
    const offer = await this.findOne(id);

    Object.assign(offer, updateOfferDto);

    return await this.offersRepository.save(offer);
  }

  // Delete offer (soft delete - set isActive to false)
  async remove(id: string): Promise<Offer> {
    const offer = await this.findOne(id);

    offer.isActive = false;

    return await this.offersRepository.save(offer);
  }

  // Hard delete offer
  async delete(id: string): Promise<void> {
    const result = await this.offersRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Offer with ID ${id} not found`);
    }
  }

  // Add media files to offer
  async addMedia(id: string, mediaFiles: string[]): Promise<Offer> {
    const offer = await this.findOne(id);

    if (!offer.mediaFiles) {
      offer.mediaFiles = [];
    }

    offer.mediaFiles = [...offer.mediaFiles, ...mediaFiles];

    return await this.offersRepository.save(offer);
  }

  // Add 3D videos to offer
  async addThreeDVideos(id: string, videos: string[]): Promise<Offer> {
    const offer = await this.findOne(id);

    if (!offer.threeDVideos) {
      offer.threeDVideos = [];
    }

    offer.threeDVideos = [...offer.threeDVideos, ...videos];

    return await this.offersRepository.save(offer);
  }

  // Update offer status
  async updateStatus(id: string, status: string): Promise<Offer> {
    const offer = await this.findOne(id);

    offer.status = status;

    return await this.offersRepository.save(offer);
  }

  // Search offers
  async search(searchTerm: string): Promise<Offer[]> {
    return await this.offersRepository
      .createQueryBuilder('offer')
      .where('offer.city ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('offer.neighborhood ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('offer.propertyType ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .andWhere('offer.isActive = :isActive', { isActive: true })
      .orderBy('offer.createdAt', 'DESC')
      .getMany();
  }
}