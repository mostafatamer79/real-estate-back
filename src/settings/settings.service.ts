
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Setting } from './settings.entity';

@Injectable()
export class SettingsService {
    constructor(
        @InjectRepository(Setting)
        private readonly settingsRepository: Repository<Setting>,
        private readonly dataSource: DataSource,
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

    async findPublicOne(key: string): Promise<Setting | null> {
        const setting = await this.findOne(key);
        return setting ? this.normalizeLegacyPublicSetting(setting) : null;
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

    async findAllPublic(): Promise<Setting[]> {
        const settings = await this.settingsRepository.createQueryBuilder('setting')
            .where('setting.key LIKE :theme', { theme: 'theme_%' })
            .orWhere('setting.key LIKE :txt', { txt: 'txt_%' })
            .orWhere('setting.key LIKE :section', { section: 'section_%' })
            .orWhere('setting.key LIKE :sectionMsg', { sectionMsg: 'section_%_message' })
            .orWhere('setting.key LIKE :module', { module: 'module_%' })
            .orWhere('setting.key LIKE :detailsPart', { detailsPart: 'details_part_%' })
            .orWhere('setting.key LIKE :login', { login: 'login_%' })
            .orWhere('setting.key LIKE :ui', { ui: 'ui_%' })
            .orWhere('setting.key IN (:...keys)', { keys: ['appointment_price', 'purchase_service_fee_percentage', 'tax_percentage'] })
            .getMany();

        return settings.map((setting) => this.normalizeLegacyPublicSetting(setting));
    }

    private normalizeLegacyPublicSetting(setting: Setting): Setting {
        const normalized = { ...setting };

        if (normalized.key === 'theme_appName' || normalized.key === 'txt_project.name') {
            if (normalized.value === 'دير عقارك') normalized.value = 'الوساطة الرقمية';
            if (normalized.value === 'Deer Aqarak') normalized.value = 'Digital Brokerage';
        }

        if (normalized.key === 'theme_description') {
            normalized.value = normalized.value
                .replace(/دير عقارك/g, 'الوساطة الرقمية')
                .replace(/Deer Aqarak/g, 'Digital Brokerage');
        }

        return normalized as Setting;
    }

    /**
     * Atomically upsert multiple settings in a single transaction.
     * Accepts an array of { key, value, description? } objects.
     */
    async batchSave(entries: { key: string; value: string; description?: string }[]): Promise<Setting[]> {
        return this.dataSource.transaction(async (manager) => {
            const repo = manager.getRepository(Setting);
            const saved: Setting[] = [];

            for (const { key, value, description } of entries) {
                let setting = await repo.findOne({ where: { key } });
                if (setting) {
                    setting.value = value;
                    if (description !== undefined) setting.description = description;
                } else {
                    setting = repo.create({ key, value, description });
                }
                saved.push(await repo.save(setting));
            }

            return saved;
        });
    }

    async seedDefaultSettings(): Promise<void> {
        const defaults = [
            // Branding
            { key: 'theme_appName', value: 'الوساطة الرقمية', description: 'اسم النظام (العلامة التجارية)' },
            { key: 'txt_project.name', value: 'الوساطة الرقمية', description: 'اسم المشروع العام' },
            { key: 'theme_description', value: 'الوساطة الرقمية - منصة عقارية شاملة لإدارة الأملاك والتسويق العقاري', description: 'وصف النظام (لتحسين محركات البحث)' },
            { key: 'theme_contactEmail', value: 'info@digital-brokerage.com', description: 'البريد الإلكتروني للتواصل' },
            { key: 'theme_contactPhone', value: '', description: 'رقم الهاتف للتواصل' },
            { key: 'theme_contactTwitter', value: '@DigitalBrokerage', description: 'حساب X / تويتر للتواصل' },
            { key: 'theme_reportCoverUrl', value: '', description: 'صورة غلاف تقارير مسح الخريطة' },
            { key: 'theme_soonBadgeBg', value: '#ffffff', description: 'خلفية شارة "قريباً"' },
            { key: 'theme_soonBadgeText', value: '#000000', description: 'لون نص شارة "قريباً"' },
            // Pricing
            { key: 'appointment_price', value: '0', description: 'سعر حجز الموعد' },
            { key: 'purchase_service_fee_percentage', value: '2.5', description: 'نسبة عمولة الشراء' },
            { key: 'tax_percentage', value: '15', description: 'نسبة الضريبة القيمة المضافة' },
            // Section flags (all open by default)
            { key: 'section_details', value: 'open', description: 'صفحة التفاصيل' },
            { key: 'section_buildingmanagement', value: 'open', description: 'إدارة المباني' },
            { key: 'section_wallet', value: 'open', description: 'المحفظة' },
            { key: 'section_services', value: 'open', description: 'الخدمات' },
            { key: 'section_offers', value: 'open', description: 'العروض' },
            { key: 'section_orders', value: 'open', description: 'الطلبات' },
            { key: 'section_chat', value: 'open', description: 'الدردشة' },
            { key: 'section_subscriptions', value: 'open', description: 'الاشتراكات' },
            { key: 'section_map', value: 'open', description: 'الخارطة الاستكشافية' },
            { key: 'section_financial', value: 'open', description: 'المالية' },
            { key: 'section_info', value: 'open', description: 'مركز المعلومات' },
            { key: 'section_profile', value: 'open', description: 'الملف الشخصي' },
            { key: 'section_marketing', value: 'open', description: 'التسويق' },
            // Module flags: enabled | soon | disabled
            { key: 'module_marketing', value: 'enabled', description: 'إظهار/إخفاء قسم التسويق (الإدارة الداخلية)' },
            { key: 'module_properties', value: 'enabled', description: 'إظهار/إخفاء قسم الأملاك (الإدارة الداخلية)' },
            { key: 'module_finance', value: 'enabled', description: 'إظهار/إخفاء قسم المالية (الإدارة الداخلية)' },
            { key: 'module_legal', value: 'enabled', description: 'إظهار/إخفاء قسم القانونية (الإدارة الداخلية)' },
            { key: 'module_employees', value: 'enabled', description: 'إظهار/إخفاء قسم الموظفين (الإدارة الداخلية)' },
            { key: 'module_offers', value: 'enabled', description: 'إظهار/إخفاء تبويب العروض (الإدارة الداخلية)' },
            { key: 'module_orders', value: 'enabled', description: 'إظهار/إخفاء تبويب الطلبات (الإدارة الداخلية)' },
            { key: 'module_chat', value: 'enabled', description: 'إظهار/إخفاء الدردشة' },
            { key: 'module_service_requests', value: 'enabled', description: 'إظهار/إخفاء طلبات الخدمات' },
            { key: 'module_internal_stats', value: 'enabled', description: 'إظهار/إخفاء الإحصاءات (الإدارة الداخلية)' },
            { key: 'module_subscriptions', value: 'enabled', description: 'إظهار/إخفاء الباقات والاشتراكات' },
            // Optional per-module message when module is "soon"
            { key: 'module_subscriptions_message', value: '', description: 'رسالة "قريباً" للباقات' },
            // Services cards (services page)
            { key: 'module_services_postPurchase', value: 'enabled', description: 'بطاقة: خدمات ما بعد الشراء' },
            { key: 'module_services_legal', value: 'enabled', description: 'بطاقة: الخدمات القانونية' },
            { key: 'module_services_construction', value: 'enabled', description: 'بطاقة: البناء والمقاولات' },
            { key: 'module_services_marketing', value: 'enabled', description: 'بطاقة: خدمات التسويق' },
            { key: 'module_services_other', value: 'enabled', description: 'بطاقة: أخرى' },
            { key: 'module_services_postPurchase_message', value: '', description: 'رسالة قريباً: خدمات ما بعد الشراء' },
            { key: 'module_services_legal_message', value: '', description: 'رسالة قريباً: الخدمات القانونية' },
            { key: 'module_services_construction_message', value: '', description: 'رسالة قريباً: البناء والمقاولات' },
            { key: 'module_services_marketing_message', value: '', description: 'رسالة قريباً: خدمات التسويق' },
            { key: 'module_services_other_message', value: '', description: 'رسالة قريباً: أخرى' },
            // Legal request flow tiles (4 boxes)
            { key: 'module_legal_disputes', value: 'enabled', description: 'قانوني: المنازعات العقارية' },
            { key: 'module_legal_contracts', value: 'enabled', description: 'قانوني: العقود' },
            { key: 'module_legal_documentation', value: 'enabled', description: 'قانوني: التوثيق' },
            { key: 'module_legal_other', value: 'enabled', description: 'قانوني: أخرى' },
            { key: 'module_legal_disputes_message', value: '', description: 'رسالة قريباً: المنازعات العقارية' },
            { key: 'module_legal_contracts_message', value: '', description: 'رسالة قريباً: العقود' },
            { key: 'module_legal_documentation_message', value: '', description: 'رسالة قريباً: التوثيق' },
            { key: 'module_legal_other_message', value: '', description: 'رسالة قريباً: أخرى' },
            // Login controls
            { key: 'login_email_enabled', value: 'true', description: 'تفعيل تسجيل الدخول بالبريد الإلكتروني' },
            { key: 'login_phone_enabled', value: 'false', description: 'تفعيل تسجيل الدخول بالهاتف' },
            { key: 'login_phone_label', value: 'قريباً', description: 'نص شارة الهاتف' },
            // UI element flags (all visible by default)
            { key: 'ui_show_map', value: 'true', description: 'إظهار الخارطة في صفحة العقار' },
            { key: 'ui_show_stats', value: 'true', description: 'إظهار بطاقات الإحصائيات' },
            { key: 'ui_show_charts', value: 'true', description: 'إظهار قسم الرسوم البيانية' },
            { key: 'ui_show_quick_actions', value: 'true', description: 'إظهار الإجراءات السريعة' },
            { key: 'ui_icon_rent', value: 'true', description: 'إظهار أيقونة خدمات الإيجار' },
            { key: 'ui_icon_buy', value: 'true', description: 'إظهار أيقونة خدمات الشراء' },
            { key: 'ui_icon_sell', value: 'true', description: 'إظهار أيقونة خدمات البيع' },
            { key: 'ui_icon_invest', value: 'true', description: 'إظهار أيقونة خدمات الاستثمار' },
            { key: 'ui_icon_legal', value: 'true', description: 'إظهار أيقونة الخدمات القانونية' },
            { key: 'ui_icon_maintenance', value: 'true', description: 'إظهار أيقونة خدمات الصيانة' },
            { key: 'ui_icon_cleaning', value: 'true', description: 'إظهار أيقونة خدمات التنظيف' },
        ];

        for (const { key, value, description } of defaults) {
            const existing = await this.settingsRepository.findOne({ where: { key } });
            if (!existing) {
                const setting = this.settingsRepository.create({ key, value, description });
                await this.settingsRepository.save(setting);
            } else if (key.includes('appName') || key.includes('project.name')) {
                if (!existing.value || existing.value.trim() === '' || existing.value.includes('مفقود')) {
                    existing.value = value;
                    await this.settingsRepository.save(existing);
                }
            }
        }
    }
}
