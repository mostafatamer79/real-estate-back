import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ManagementPackage } from './management-package.entity';
import { CreateManagementPackageDto, UpdateManagementPackageDto } from './dto/create-management-package.dto';

@Injectable()
export class ManagementPackageService {
  constructor(
    @InjectRepository(ManagementPackage)
    private packageRepository: Repository<ManagementPackage>,
  ) {}

  async create(createManagementPackageDto: CreateManagementPackageDto): Promise<ManagementPackage> {
    const newPackage = this.packageRepository.create(createManagementPackageDto);
    return this.packageRepository.save(newPackage);
  }

  async findAll(): Promise<ManagementPackage[]> {
    return this.packageRepository.find({ order: { yearlyPrice: 'ASC' } });
  }

  async findOne(id: string): Promise<ManagementPackage> {
    const pkg = await this.packageRepository.findOne({ where: { id } });
    if (!pkg) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }
    return pkg;
  }

  async update(id: string, updateDto: UpdateManagementPackageDto): Promise<ManagementPackage> {
    const pkg = await this.findOne(id);
    Object.assign(pkg, updateDto);
    return this.packageRepository.save(pkg);
  }

  async remove(id: string): Promise<void> {
    const pkg = await this.findOne(id);
    await this.packageRepository.remove(pkg);
  }
}
