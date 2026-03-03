
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './settings.entity';

@Injectable()
export class SettingsService {
    constructor(
        @InjectRepository(Setting)
        private readonly settingsRepository: Repository<Setting>,
    ) {}

    async findAll(): Promise<Setting[]> {
        return this.settingsRepository.find();
    }

    async findOne(key: string): Promise<Setting | null> {
        const setting = await this.settingsRepository.findOne({ where: { key } });
        if (!setting) {
             // Return a default if not found, or throw?
             // For appointment_price, maybe return 0 if not set.
             return null;
        }
        return setting;
    }

    async setSetting(key: string, value: string, description?: string): Promise<Setting> {
        let setting = await this.settingsRepository.findOne({ where: { key } });
        if (setting) {
            setting.value = value;
            if (description) setting.description = description;
        } else {
            setting = this.settingsRepository.create({ key, value, description });
        }
        return this.settingsRepository.save(setting);
    }

    async getAppointmentPrice(): Promise<number> {
        const setting = await this.findOne('appointment_price');
        return setting ? parseFloat(setting.value) : 0;
    }

    async getPurchaseServiceFee(): Promise<number> {
        const setting = await this.findOne('purchase_service_fee_percentage');
        return setting ? parseFloat(setting.value) : 2.5; // Default 2.5%
    }

    async getTaxPercentage(): Promise<number> {
        const setting = await this.findOne('tax_percentage');
        return setting ? parseFloat(setting.value) : 15; // Default 15%
    }
}
