import { Controller, Get, Post, Put, Body, UseGuards, Param, Query } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { Permission } from '../common/decorators/permission.decorator';
import { PermissionGuard } from '../common/guards/permission.guard';
import { Public } from '../common/decorators/public.decorator';
import { SkipSubscriptionGuard } from '../common/decorators/skip-subscription.decorator';
import type { ServiceFormDef } from './service-form.defaults';

@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) {}

    @Public()
    @SkipSubscriptionGuard()
    @Get('service-forms')
    async getServiceForms() {
        return this.settingsService.resolveAllServiceForms();
    }

    @Public()
    @SkipSubscriptionGuard()
    @Get('service-forms/:category')
    async getServiceForm(@Param('category') category: string) {
        return this.settingsService.resolveServiceForm(category);
    }

    @Put('service-forms/:category')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @Permission('settings')
    async updateServiceForm(@Param('category') category: string, @Body() body: ServiceFormDef) {
        return this.settingsService.saveServiceForm(category, body);
    }

    @Post('service-forms/:category/reset')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @Permission('settings')
    async resetServiceForm(@Param('category') category: string) {
        return this.settingsService.resetServiceForm(category);
    }

    @Get()
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @Permission('settings')
    async findAll(
        @Query('category') category?: string,
        @Query('subcategory') subcategory?: string,
    ) {
        return this.settingsService.findAll(category, subcategory);
    }

    @Public()
    @SkipSubscriptionGuard()
    @Get('public/:key')
    async getPublicSetting(@Param('key') key: string) {
        const setting = await this.settingsService.findPublicOne(key);
        return { value: setting ? setting.value : null };
    }

    @Public()
    @SkipSubscriptionGuard()
    @Get('public')
    async findAllPublic(
        @Query('category') category?: string,
        @Query('subcategory') subcategory?: string,
    ) {
        return this.settingsService.findAllPublic(category, subcategory);
    }

    @Post()
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @Permission('settings')
    async updateSetting(@Body() body: { key: string; value: string; description?: string }) {
        return this.settingsService.setSetting(body.key, body.value, body.description);
    }

    @Post('batch')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @Permission('settings')
    async batchUpdateSettings(@Body() body: { settings: { key: string; value: string; description?: string }[] }) {
        return this.settingsService.batchSave(body.settings);
    }
}
