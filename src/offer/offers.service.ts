import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from './offer-entity';
import { CreateOfferDto, UpdateOfferDto } from './create-offer.dto';
import { Role } from '../user/user-entity';
import { PurchaseRequest, PurchaseRequestStatus } from './entities/purchase-request.entity';
import { VisitRequest, VisitStatus, VisitType } from './entities/visit-request.entity';
import { Invoice, InvoiceStatus } from '../financial/entities/invoice.entity';
import { SettingsService } from '../settings/settings.service';

import { OfferView } from './entities/offer-view.entity';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offersRepository: Repository<Offer>,
    @InjectRepository(PurchaseRequest)
    private readonly purchaseRequestRepository: Repository<PurchaseRequest>,
    @InjectRepository(VisitRequest)
    private readonly visitRequestRepository: Repository<VisitRequest>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(OfferView)
    private readonly offerViewRepository: Repository<OfferView>,
    private readonly settingsService: SettingsService,
  ) {}

  // ✅ Increment view count by IP
  async incrementViewCount(offerId: string, ip: string): Promise<void> {
    // Check if this IP has already viewed this offer in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const existingView = await this.offerViewRepository.createQueryBuilder('view')
      .where('view.offerId = :offerId', { offerId })
      .andWhere('view.ip = :ip', { ip })
      .andWhere('view.createdAt >= :twentyFourHoursAgo', { twentyFourHoursAgo })
      .getOne();

    if (!existingView) {
      // Create new view record
      const newView = this.offerViewRepository.create({ offerId, ip });
      await this.offerViewRepository.save(newView);

      // Increment offer views count
      await this.offersRepository.increment({ id: offerId }, 'views', 1);
    }
  }


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
    const query = this.offersRepository.createQueryBuilder('offer').where('1=1');


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

  // ✅ Find offers by user
  async findByUser(userId: string): Promise<Offer[]> {
    return this.offersRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  // ✅ Create Purchase Request
  async createPurchaseRequest(offerId: string, user: any): Promise<any> {
    const offer = await this.findOne(offerId, user);
    
    // 1. Create Purchase Request
    const purchaseRequest = this.purchaseRequestRepository.create({
      offerId: offer.id,
      userId: user.id, // Assuming user.id exists, verify if it's user.userId based on create method
      status: PurchaseRequestStatus.PENDING,
    });
    await this.purchaseRequestRepository.save(purchaseRequest);

    // 2. Update Property Status
    offer.status = 'pending';
    await this.offersRepository.save(offer);

    // 3. Create Draft Invoice
    const price = Number(offer.price);
    const serviceFeePercentage = await this.settingsService.getPurchaseServiceFee();
    const taxPercentage = await this.settingsService.getTaxPercentage();

    const websiteFee = price * (serviceFeePercentage / 100);
    const tax = websiteFee * (taxPercentage / 100);
    const total = price + websiteFee + tax;

    const invoice = this.invoiceRepository.create({
      userId: user.id,
      amount: price,
      serviceFee: websiteFee,
      tax: tax,
      total: total,
      status: InvoiceStatus.DRAFT,
      description: `Purchase of property: ${offer.propertyType} in ${offer.city}`,
      referenceType: 'purchase_request',
      referenceId: purchaseRequest.id,
    });
    await this.invoiceRepository.save(invoice);

    return { purchaseRequest, invoice };
  }

  // ✅ Create Visit Request
  async createVisitRequest(offerId: string, user: any, body: any): Promise<any> {
     const offer = await this.findOne(offerId, user);
     const { visitType, selectedServices, visitDate } = body;

     // 1. Create Visit Request
     const visitRequest = this.visitRequestRepository.create({
       offerId: offer.id,
       userId: user.id,
       visitType,
       selectedServices: visitType === VisitType.AGENT ? selectedServices : null,
       visitDate: visitType === VisitType.SELF ? visitDate : null,
       status: VisitStatus.PENDING,
     });
     await this.visitRequestRepository.save(visitRequest);

     // 2. Create Invoice if Agent Visit
     let invoice: Invoice | null = null;
     if (visitType === VisitType.AGENT) {
       const serviceFee = 100; // Example base fee
       const websiteFee = 50; 
       const total = serviceFee + websiteFee;

       invoice = this.invoiceRepository.create({
         userId: user.id,
         amount: 0, // No property amount
         serviceFee: total,
         tax: total * 0.15,
         total: total * 1.15,
         status: InvoiceStatus.UNPAID,
         description: `Agent Visit Request for: ${offer.propertyType}`,
         referenceType: 'visit_request',
         referenceId: visitRequest.id,
       });
       await this.invoiceRepository.save(invoice);
     }

     return { visitRequest, invoice };
  }
}
