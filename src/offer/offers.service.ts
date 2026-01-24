import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from './offer-entity';
import { CreateOfferDto, UpdateOfferDto } from './create-offer.dto';
import { Role } from 'src/user/user-entity';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offersRepository: Repository<Offer>,
  ) {}

  // ✅ Create offer with user
  async create(dto: CreateOfferDto, user: any): Promise<Offer> {
    console.log('Creating offer for user:', user);
    const offer = this.offersRepository.create({
      ...dto,
      userId: user.userId,
      isActive: true,
    });
    return this.offersRepository.save(offer);
  }

  // ✅ Get all offers with filters & ownership
  async findAll(user: any, filters?: any): Promise<Offer[]> {
    const query = this.offersRepository.createQueryBuilder('offer');


    if (filters?.status) query.andWhere('offer.status = :status', { status: filters.status });
    if (filters?.propertyType) query.andWhere('offer.propertyType = :propertyType', { propertyType: filters.propertyType });
    if (filters?.city) query.andWhere('offer.city = :city', { city: filters.city });
    if (filters?.minPrice) query.andWhere('offer.price >= :minPrice', { minPrice: filters.minPrice });
    if (filters?.maxPrice) query.andWhere('offer.price <= :maxPrice', { maxPrice: filters.maxPrice });
    if (filters?.isActive !== undefined) query.andWhere('offer.isActive = :isActive', { isActive: filters.isActive });

    return query.orderBy('offer.createdAt', 'DESC').getMany();
  }

  // ✅ Get single offer
  async findOne(id: string, user: any): Promise<Offer> {
    const offer = await this.offersRepository.findOne({ where: { id } });
    if (!offer) throw new NotFoundException('Offer not found');
    return offer;
  }

  // ✅ Update offer
  async update(id: string, dto: UpdateOfferDto, user: any): Promise<Offer> {
    const offer = await this.findOne(id, user);
    Object.assign(offer, dto);
    return this.offersRepository.save(offer);
  }

  // ✅ Soft delete
  async remove(id: string, user: any): Promise<Offer> {
    const offer = await this.findOne(id, user);
    offer.isActive = false;
    return this.offersRepository.save(offer);
  }

  // ✅ Hard delete
  async delete(id: string, user: any): Promise<void> {
    const offer = await this.findOne(id, user);
    await this.offersRepository.delete(offer.id);
  }

  // ✅ Add media files
  async addMedia(id: string, files: string[], user: any): Promise<Offer> {
    const offer = await this.findOne(id, user);
    offer.mediaFiles = [...(offer.mediaFiles || []), ...files];
    return this.offersRepository.save(offer);
  }

  // ✅ Add 3D videos
  async addThreeDVideos(id: string, files: string[], user: any): Promise<Offer> {
    const offer = await this.findOne(id, user);
    offer.threeDVideos = [...(offer.threeDVideos || []), ...files];
    return this.offersRepository.save(offer);
  }

  // ✅ Update status
  async updateStatus(id: string, status: string, user: any): Promise<Offer> {
    const offer = await this.findOne(id, user);
    offer.status = status;
    return this.offersRepository.save(offer);
  }

  // ✅ Search offers
  async search(searchTerm: string, user: any): Promise<Offer[]> {
    const query = this.offersRepository.createQueryBuilder('offer')
      .where('offer.city ILIKE :searchTerm OR offer.neighborhood ILIKE :searchTerm OR offer.propertyType ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .andWhere('offer.isActive = :isActive', { isActive: true });

    if (user.role !== Role.ADMIN) query.andWhere('offer.userId = :userId', { userId: user.id });

    return query.orderBy('offer.createdAt', 'DESC').getMany();
  }
}
