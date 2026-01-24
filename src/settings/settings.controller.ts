
import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorators';
import { Role } from '../user/user-entity';

@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) {}

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles([Role.ADMIN])
    async findAll() {
        return this.settingsService.findAll();
    }

    @Get('public/:key')
    async getPublicSetting(@Param('key') key: string) {
        // Allow public access to appointment price if needed?
        // Usually price is needed for UI.
        const setting = await this.settingsService.findOne(key);
        return { value: setting ? setting.value : null };
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles([Role.ADMIN])
    async updateSetting(@Body() body: { key: string; value: string; description?: string }) {
        return this.settingsService.setSetting(body.key, body.value, body.description);
    }
}
