import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Opinion } from './entities/opinion.entity';
import { CreateOpinionDto } from './dto/create-opinion.dto';

@Injectable()
export class OpinionService {
  constructor(
    @InjectRepository(Opinion)
    private opinionRepository: Repository<Opinion>,
  ) {}

  async create(createOpinionDto: CreateOpinionDto): Promise<Opinion> {
    const opinion = this.opinionRepository.create(createOpinionDto);
    return this.opinionRepository.save(opinion);
  }

  async findAll(): Promise<Opinion[]> {
    return this.opinionRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string): Promise<Opinion> {
    const opinion = await this.opinionRepository.findOne({ where: { id } });
    if (!opinion) {
      throw new NotFoundException(`Opinion with ID ${id} not found`);
    }
    opinion.isRead = true;
    return this.opinionRepository.save(opinion);
  }
}
