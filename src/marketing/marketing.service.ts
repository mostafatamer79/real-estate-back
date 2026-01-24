import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingRequest } from './entities/marketing-request.entity';
import { CreateMarketingRequestDto, UpdateMarketingRequestDto } from './dto/marketing-request.dto';

@Injectable()
export class MarketingService {
  constructor(
    @InjectRepository(MarketingRequest)
    private marketingRequestRepository: Repository<MarketingRequest>,
  ) {}

  async create(createDto: CreateMarketingRequestDto, userId: string): Promise<MarketingRequest> {
    const request = this.marketingRequestRepository.create({
      ...createDto,
      clientId: userId,
    });
    return this.marketingRequestRepository.save(request);
  }

  async findAll(): Promise<MarketingRequest[]> {
    return this.marketingRequestRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findByClient(clientId: string): Promise<MarketingRequest[]> {
      return this.marketingRequestRepository.find({ where: { clientId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<MarketingRequest> {
    const request = await this.marketingRequestRepository.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Marketing request with ID ${id} not found`);
    }
    return request;
  }

  async update(id: string, updateDto: UpdateMarketingRequestDto): Promise<MarketingRequest> {
    const request = await this.findOne(id);
    Object.assign(request, updateDto);
    return this.marketingRequestRepository.save(request);
  }

  async remove(id: string): Promise<void> {
    const request = await this.findOne(id);
    await this.marketingRequestRepository.remove(request);
  }
}
