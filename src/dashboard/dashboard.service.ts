import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SettingsService } from '../settings/settings.service';
import { Role, User } from '../user/user-entity';
import { Property } from '../property/entities/property.entity';
import { Offer } from '../offer/offer-entity';
import { Order } from '../order/entities/order.entity';
import { MarketingRequest, MarketingRequestStatus } from '../marketing/entities/marketing-request.entity';
import { LegalDispute } from '../legal-dispute/legal-dispute.entity';
import { Contract } from '../legal-dispute/contract.entity';
import { LegalDocumentation } from '../legal-dispute/legal-documentation.entity';
import { Invoice } from '../financial/entities/invoice.entity';
import { InvoiceStatus } from '../financial/entities/invoice.entity';
import { ServiceStatus, LegalDisputeStatus } from '../legal-dispute/legal-dispute.entity';

type ModuleKey =
  | 'marketing'
  | 'properties'
  | 'finance'
  | 'legal'
  | 'employees'
  | 'offers'
  | 'orders'
  | 'service_requests'
  | 'internal_stats'
  | 'subscriptions'
  | 'chat';

@Injectable()
export class DashboardService {
  constructor(
    private readonly settingsService: SettingsService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Property) private readonly propertyRepo: Repository<Property>,
    @InjectRepository(Offer) private readonly offerRepo: Repository<Offer>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(MarketingRequest) private readonly marketingRepo: Repository<MarketingRequest>,
    @InjectRepository(LegalDispute) private readonly disputeRepo: Repository<LegalDispute>,
    @InjectRepository(Contract) private readonly contractRepo: Repository<Contract>,
    @InjectRepository(LegalDocumentation) private readonly docsRepo: Repository<LegalDocumentation>,
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
  ) {}

  private async moduleStatus(key: ModuleKey): Promise<'enabled' | 'soon' | 'disabled'> {
    const s = await this.settingsService.findOne(`module_${key}`);
    const v = (s?.value || 'enabled') as any;
    return v === 'soon' || v === 'disabled' ? v : 'enabled';
  }

  private canAccessModule(user: any, key: ModuleKey): boolean {
    if (!user) return false;
    if (user.role === Role.ADMIN) return true;
    const depts = Array.isArray(user.departments) ? user.departments : [];
    const perms = user.departmentPermissions || {};
    const p = perms[key];
    return depts.includes(key) || (p && p !== 'none');
  }

  private async getOwnerIds(user: any): Promise<string[]> {
    const userId = user?.userId || user?.id;
    if (!userId) return [];
    if (user.role === Role.ADMIN) return []; // special case: admin = global
    if (user.role !== Role.MANGER) return [userId];
    const subs = await this.userRepo.find({ where: { parentId: userId } as any, select: ['id'] as any });
    return [userId, ...subs.map((u) => u.id)];
  }

  async getManagerSummary(user: any) {
    const ownerIds = await this.getOwnerIds(user);

    // Respect module flags: disabled modules are omitted for non-admin.
    const allowed = async (k: ModuleKey) => user.role === Role.ADMIN || ((await this.moduleStatus(k)) === 'enabled' && this.canAccessModule(user, k));
    const can = async (k: ModuleKey) => user.role === Role.ADMIN || (await this.moduleStatus(k)) !== 'disabled';

    const out: any = {
      modules: {},
      counts: {},
      latestOrders: [],
    };

    // Properties
    if (await allowed('properties')) {
      out.counts.properties = user.role === Role.ADMIN
        ? await this.propertyRepo.count()
        : await this.propertyRepo.count({ where: { ownerId: In(ownerIds) } as any });
      out.modules.properties = true;
    } else if (await can('properties')) {
      out.modules.properties = false;
    }

    // Offers
    if (await allowed('offers')) {
      out.counts.offers = user.role === Role.ADMIN
        ? await this.offerRepo.count()
        : await this.offerRepo.count({ where: { userId: In(ownerIds) } as any });
      out.modules.offers = true;
    } else if (await can('offers')) out.modules.offers = false;

    // Orders + latest
    if (await allowed('orders')) {
      if (user.role === Role.ADMIN) {
        out.counts.orders = await this.orderRepo.count();
        out.latestOrders = await this.orderRepo.find({ order: { createdAt: 'DESC' }, take: 5 });
      } else {
        // Order has eager user relation; filter by user ids.
        out.counts.orders = await this.orderRepo.count({ where: { user: { id: In(ownerIds) } } as any });
        out.latestOrders = await this.orderRepo.find({
          where: { user: { id: In(ownerIds) } } as any,
          order: { createdAt: 'DESC' },
          take: 5,
        });
      }
      out.modules.orders = true;
    } else if (await can('orders')) out.modules.orders = false;

    // Employees
    if (await allowed('employees')) {
      if (user.role === Role.ADMIN) {
        out.counts.employees = await this.userRepo.count();
      } else {
        const uid = user?.userId || user?.id;
        out.counts.employees = await this.userRepo.count({ where: [{ parentId: uid } as any] });
      }
      out.modules.employees = true;
    } else if (await can('employees')) out.modules.employees = false;

    // Marketing
    if (await allowed('marketing')) {
      if (user.role === Role.ADMIN) {
        out.counts.marketing_pending = await this.marketingRepo.count({ where: { status: MarketingRequestStatus.PENDING } as any });
      } else {
        out.counts.marketing_pending = await this.marketingRepo.count({ where: { clientId: In(ownerIds), status: MarketingRequestStatus.PENDING } as any });
      }
      out.modules.marketing = true;
    } else if (await can('marketing')) out.modules.marketing = false;

    // Legal
    if (await allowed('legal')) {
      // These entities use Arabic status strings; fall back to total pending-ish counts where possible.
      if (user.role === Role.ADMIN) {
        out.counts.legal_disputes_pending = await this.disputeRepo.count({ where: { status: LegalDisputeStatus.PENDING } as any });
        out.counts.legal_contracts_pending = await this.contractRepo.count({ where: { status: ServiceStatus.PENDING } as any });
        out.counts.legal_docs_pending = await this.docsRepo.count({ where: { status: 'معلقة' } as any });
      } else {
        out.counts.legal_disputes_pending = await this.disputeRepo.count({ where: { userId: In(ownerIds), status: LegalDisputeStatus.PENDING } as any });
        out.counts.legal_contracts_pending = await this.contractRepo.count({ where: { userId: In(ownerIds), status: ServiceStatus.PENDING } as any });
        out.counts.legal_docs_pending = await this.docsRepo.count({ where: { userId: In(ownerIds), status: 'معلقة' } as any });
      }
      out.modules.legal = true;
    } else if (await can('legal')) out.modules.legal = false;

    // Finance
    if (await allowed('finance')) {
      if (user.role === Role.ADMIN) {
        out.counts.income = await this.invoiceRepo
          .createQueryBuilder('inv')
          .select('COALESCE(SUM(inv.total), 0)', 'sum')
          .where('inv.status = :st', { st: InvoiceStatus.PAID })
          .getRawOne()
          .then((r) => Number(r?.sum || 0));
      } else {
        out.counts.income = await this.invoiceRepo
          .createQueryBuilder('inv')
          .select('COALESCE(SUM(inv.total), 0)', 'sum')
          .where('inv.status = :st', { st: InvoiceStatus.PAID })
          .andWhere('inv.userId IN (:...ids)', { ids: ownerIds })
          .getRawOne()
          .then((r) => Number(r?.sum || 0));
      }
      out.modules.finance = true;
    } else if (await can('finance')) out.modules.finance = false;

    return out;
  }
}
