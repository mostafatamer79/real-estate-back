import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MarketingService } from './marketing.service';
import { MarketingController } from './marketing.controller';
import {
  EmailMarketing,
  EmailMarketingApprovalStatus,
  MarketingCategory,
  MarketingFrequency,
  MarketingScheduleMode,
} from './entities/email-marketing.entity';
import { Invoice, InvoiceStatus } from '../financial/entities/invoice.entity';
import { PaymentMethod } from '../financial/entities/financial-transaction.entity';
import { FinancialService } from '../financial/financial.service';
import { GeideaService } from '../payment/geidea.service';
import { Role } from '../user/user-entity';
import { ALLOW_UNVERIFIED_KEY } from '../common/decorators/allow-unverified.decorator';
import { SKIP_DEPARTMENTS_GUARD_KEY } from '../common/decorators/skip-departments.decorator';
import { SKIP_SUBSCRIPTION_GUARD_KEY } from '../common/decorators/skip-subscription.decorator';
import { ROLES_KEY } from '../common/decorators/roles.decorators';
import {
  EMAIL_MARKETING_INVOICE_REFERENCE_TYPE,
  preparePaidAdCampaign,
  publishPaidAd,
} from './publish-paid-ad';

describe('EmailMarketing paid publication workflow', () => {
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const otherUserId = '22222222-2222-4222-8222-222222222222';
  const campaignId = '33333333-3333-4333-8333-333333333333';
  const invoiceId = '44444444-4444-4444-8444-444444444444';

  const makeCampaign = (overrides: Partial<EmailMarketing> = {}): EmailMarketing =>
    ({
      id: campaignId,
      ownerId,
      category: MarketingCategory.OFFERS,
      subject: 'إعلان عقاري مميز',
      content: 'فيلا للبيع في الرياض',
      frequency: MarketingFrequency.WEEKLY,
      scheduleMode: MarketingScheduleMode.MANUAL,
      sortOrder: 0,
      isActive: false,
      approvalStatus: EmailMarketingApprovalStatus.PENDING,
      publicationFee: null,
      invoiceId: null,
      mediaFiles: [],
      ...overrides,
    }) as EmailMarketing;

  const makeInvoice = (overrides: Partial<Invoice> = {}): Invoice =>
    ({
      id: invoiceId,
      userId: ownerId,
      amount: 250,
      serviceFee: 0,
      tax: 0,
      total: 250,
      status: InvoiceStatus.UNPAID,
      referenceType: EMAIL_MARKETING_INVOICE_REFERENCE_TYPE,
      referenceId: campaignId,
      description: 'فاتورة نشر إعلان: إعلان عقاري مميز',
      ...overrides,
    }) as Invoice;

  const createServiceWithState = (initialCampaign?: EmailMarketing, initialInvoices: Invoice[] = []) => {
    const campaigns = initialCampaign ? [initialCampaign] : [];
    const invoices = [...initialInvoices];
    let seq = 1;

    const manager = {
      find: jest.fn(async (entity: unknown) => {
        if (entity === Invoice) return invoices;
        return [];
      }),
      findOne: jest.fn(async (entity: unknown, opts: any) => {
        if (entity === EmailMarketing) {
          return campaigns.find((c) => c.id === opts?.where?.id) ?? null;
        }
        if (entity === Invoice) {
          return invoices.find((i) => i.id === opts?.where?.id) ?? null;
        }
        return null;
      }),
      create: jest.fn((_entity: unknown, data: any) => ({
        id: `generated-${seq++}`,
        ...data,
      })),
      save: jest.fn(async (entity: unknown, record: any) => {
        if (entity === Invoice) {
          const idx = invoices.findIndex((i) => i.id === record.id);
          if (idx >= 0) invoices[idx] = record;
          else invoices.push(record);
        }
        if (entity === EmailMarketing) {
          const idx = campaigns.findIndex((c) => c.id === record.id);
          if (idx >= 0) campaigns[idx] = record;
          else campaigns.push(record);
        }
        return record;
      }),
    };

    const emailRepo = {
      create: jest.fn((x: any) => x),
      save: jest.fn(async (x: any) => x),
      find: jest.fn(async () => campaigns),
      createQueryBuilder: jest.fn(() => {
        let filterOwner: string | undefined;
        const qb: any = {
          where: jest.fn(() => qb),
          andWhere: jest.fn((_sql: string, params: any) => {
            if (params?.ownerId) filterOwner = params.ownerId;
            return qb;
          }),
          setLock: jest.fn(() => qb),
          innerJoin: jest.fn(() => qb),
          orderBy: jest.fn(() => qb),
          addOrderBy: jest.fn(() => qb),
          getOne: jest.fn(async () => {
            const c = campaigns[0];
            if (!c) return null;
            if (filterOwner && c.ownerId !== filterOwner) return null;
            return c;
          }),
          getMany: jest.fn(async () => []),
        };
        return qb;
      }),
      manager: {
        transaction: jest.fn(async (cb: (m: typeof manager) => Promise<any>) => cb(manager)),
      },
    };

    Object.assign(manager, { getRepository: () => emailRepo });

    const invoiceRepo = {
      find: jest.fn(async () => invoices),
      findOne: jest.fn(async (opts: any) => invoices.find((i) => i.id === opts?.where?.id) ?? null),
    };

    const service = new MarketingService(
      {} as never,
      {} as never,
      {} as never,
      emailRepo as never,
      {} as never,
      invoiceRepo as never,
      {} as never,
      {} as never,
    );

    return { service, campaigns, invoices, emailRepo, invoiceRepo };
  };

  it('forces newly created ads to start pending and inactive even if isActive or approvalStatus are sent', async () => {
    const { service } = createServiceWithState();
    const created = await service.createEmailMarketing(
      {
        category: MarketingCategory.OFFERS,
        content: 'New ad',
        frequency: MarketingFrequency.WEEKLY,
        isActive: true,
        approvalStatus: EmailMarketingApprovalStatus.PUBLISHED,
        publicationFee: 0,
        invoiceId: 'forged-invoice',
      } as any,
      ownerId,
    );

    expect(created.isActive).toBe(false);
    expect(created.approvalStatus).toBe(EmailMarketingApprovalStatus.PENDING);
    expect(created.publicationFee).toBeNull();
    expect(created.invoiceId).toBeNull();
    expect(created.ownerId).toBe(ownerId);
  });

  it('blocks malicious owner and admin update bypasses', async () => {
    const pendingCampaign = makeCampaign();
    const { service } = createServiceWithState(pendingCampaign);

    await expect(
      service.updateEmailMarketing(campaignId, ownerId, { isActive: true } as any, Role.USER),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      service.updateEmailMarketing(
        campaignId,
        ownerId,
        { approvalStatus: EmailMarketingApprovalStatus.PUBLISHED } as any,
        Role.USER,
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.updateEmailMarketing(
        campaignId,
        ownerId,
        { approvalStatus: EmailMarketingApprovalStatus.PUBLISHED } as any,
        Role.ADMIN,
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.updateEmailMarketing(campaignId, ownerId, { isActive: true } as any, Role.ADMIN),
    ).rejects.toThrow(BadRequestException);
  });

  it('enforces owner boundaries and freezes content/media edits after pricing', async () => {
    const awaitingCampaign = makeCampaign({
      approvalStatus: EmailMarketingApprovalStatus.AWAITING_PAYMENT,
      publicationFee: 250,
      invoiceId,
    });
    const { service } = createServiceWithState(awaitingCampaign, [makeInvoice()]);

    await expect(
      service.getEmailMarketingById(campaignId, otherUserId, Role.USER),
    ).rejects.toThrow(NotFoundException);

    await expect(
      service.updateEmailMarketing(campaignId, ownerId, { content: 'Swapped content' }, Role.USER),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      service.addMedia(campaignId, ['/uploads/marketing/x.jpg'], ownerId, Role.USER),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows admin to toggle isActive only when published with a paid matching invoice', async () => {
    const publishedCampaign = makeCampaign({
      approvalStatus: EmailMarketingApprovalStatus.PUBLISHED,
      publicationFee: 250,
      invoiceId,
      isActive: false,
    });
    const paidInvoice = makeInvoice({ status: InvoiceStatus.PAID });
    const { service } = createServiceWithState(publishedCampaign, [paidInvoice]);

    const updated = await service.updateEmailMarketing(campaignId, 'admin-id', { isActive: true }, Role.ADMIN);
    expect(updated.isActive).toBe(true);
  });

  it.each([0, -10, NaN, Infinity, 10000000000, 10.123])(
    'rejects invalid publicationFee %s',
    async (fee) => {
      const { service } = createServiceWithState(makeCampaign());
      await expect(service.approveEmailMarketing(campaignId, fee)).rejects.toThrow(BadRequestException);
    },
  );

  it('handles approval invoice creation, same-price idempotency, repricing, and rejection', async () => {
    const { service, campaigns, invoices } = createServiceWithState(makeCampaign());

    const first = await service.approveEmailMarketing(campaignId, 250.5);
    expect(first.campaign.approvalStatus).toBe(EmailMarketingApprovalStatus.AWAITING_PAYMENT);
    expect(first.campaign.isActive).toBe(false);
    expect(first.campaign.publicationFee).toBe(250.5);
    expect(first.invoice.userId).toBe(ownerId);
    expect(first.invoice.referenceType).toBe(EMAIL_MARKETING_INVOICE_REFERENCE_TYPE);
    expect(first.invoice.referenceId).toBe(campaignId);
    expect(first.invoice.serviceFee).toBe(0);
    expect(first.invoice.tax).toBe(0);
    expect(first.invoice.total).toBe(250.5);
    expect(first.invoice.status).toBe(InvoiceStatus.UNPAID);

    // Idempotent repeat with same price returns same invoice
    const repeat = await service.approveEmailMarketing(campaignId, 250.5);
    expect(repeat.invoice.id).toBe(first.invoice.id);
    expect(invoices).toHaveLength(1);

    // Repricing cancels old unpaid invoice and creates a new one
    const repriced = await service.approveEmailMarketing(campaignId, 300);
    expect(repriced.invoice.id).not.toBe(first.invoice.id);
    expect(invoices[0].status).toBe(InvoiceStatus.CANCELLED);
    expect(repriced.invoice.total).toBe(300);
    expect(campaigns[0].invoiceId).toBe(repriced.invoice.id);

    // Rejecting cancels unpaid invoice and marks rejected
    const rejected = await service.rejectEmailMarketing(campaignId, 'غير مطابق');
    expect(rejected.approvalStatus).toBe(EmailMarketingApprovalStatus.REJECTED);
    expect(rejected.isActive).toBe(false);
    expect(repriced.invoice.status).toBe(InvoiceStatus.CANCELLED);
  });

  it('prevents repricing a published or paid ad', async () => {
    const published = makeCampaign({
      approvalStatus: EmailMarketingApprovalStatus.PUBLISHED,
      publicationFee: 250,
      invoiceId,
      isActive: true,
    });
    const { service } = createServiceWithState(published, [makeInvoice({ status: InvoiceStatus.PAID })]);

    await expect(service.approveEmailMarketing(campaignId, 500)).rejects.toThrow(BadRequestException);
  });
  it('does not issue a second invoice if an approval won the campaign lock concurrently', async () => {
    const { service, invoices } = createServiceWithState(makeCampaign({
      approvalStatus: EmailMarketingApprovalStatus.AWAITING_PAYMENT, invoiceId, publicationFee: 250,
    }));
    // The earlier invoice query predates another transaction's first approval.
    await expect(service.approveEmailMarketing(campaignId, 250)).rejects.toThrow('concurrently');
    expect(invoices).toHaveLength(0);
  });

  it('requires published + paid canonical invoice in public queries and scheduled emails', async () => {
    const { service, emailRepo } = createServiceWithState();
    await service.findPublicEmailMarketing();
    await service.sendScheduledEmails();

    const qbCalls = emailRepo.createQueryBuilder.mock.results.map((r) => r.value);
    expect(qbCalls.length).toBe(2);
    for (const qb of qbCalls) {
      expect(qb.innerJoin).toHaveBeenCalledWith(
        Invoice,
        'inv',
        expect.stringContaining('inv.id = campaign.invoiceId'),
        expect.objectContaining({
          refType: EMAIL_MARKETING_INVOICE_REFERENCE_TYPE,
          paidStatus: InvoiceStatus.PAID,
        }),
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        'campaign.approvalStatus = :published',
        { published: EmailMarketingApprovalStatus.PUBLISHED },
      );
    }
  });

  it('blocks forged EmailMarketing invoice creation in FinancialService.createInvoice', async () => {
    const financialService = new FinancialService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      financialService.createInvoice(ownerId, {
        amount: 1,
        referenceType: EMAIL_MARKETING_INVOICE_REFERENCE_TYPE,
        referenceId: campaignId,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('publishes ad atomically via FinancialService.payInvoice (wallet)', async () => {
    const campaign = makeCampaign({
      approvalStatus: EmailMarketingApprovalStatus.AWAITING_PAYMENT,
      publicationFee: 250,
      invoiceId,
      isActive: false,
    });
    const invoice = makeInvoice({ status: InvoiceStatus.UNPAID, total: 250 });

    const manager = {
      findOne: jest.fn(async (entity: unknown, opts: any) => {
        if (opts?.where?.id === ownerId) return { id: ownerId };
        if (entity === Invoice) return invoice;
        if (entity === EmailMarketing) return campaign;
        return null;
      }),
      find: jest.fn(async () => [
        { toUserId: ownerId, fromUserId: null, amount: 500, status: 'completed', type: 'deposit' },
      ]),
      save: jest.fn(async (_entity: unknown, obj: any) => obj),
    };

    const financialService = new FinancialService(
      {} as never,
      {
        findOne: jest.fn(async () => invoice),
        manager: { transaction: jest.fn(async (cb: any) => cb(manager)) },
      } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const paidInvoice = await financialService.payInvoice(ownerId, invoiceId, PaymentMethod.WALLET);
    expect(paidInvoice.status).toBe(InvoiceStatus.PAID);
    expect(campaign.approvalStatus).toBe(EmailMarketingApprovalStatus.PUBLISHED);
    expect(campaign.isActive).toBe(true);
  });

  it('publishes ad atomically via GeideaService settlement and rejects stale/mismatched invoices', async () => {
    const campaign = makeCampaign({
      approvalStatus: EmailMarketingApprovalStatus.AWAITING_PAYMENT,
      publicationFee: 250,
      invoiceId,
      isActive: false,
    });
    const invoice = makeInvoice({ status: InvoiceStatus.UNPAID, total: 250 });

    const manager = {
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === Invoice) return invoice;
        if (entity === EmailMarketing) return campaign;
        return null;
      }),
      save: jest.fn(async (_entity: unknown, obj: any) => obj),
    };

    const billing = { fulfillInvoice: jest.fn(async () => undefined) };
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'GEIDEA_MERCHANT_PUBLIC_KEY') return 'pk';
        if (key === 'GEIDEA_API_PASSWORD') return 'pw';
        if (key === 'GEIDEA_MODE') return 'test';
        return 'KSA';
      }),
    };
    const dataSource = {
      transaction: jest.fn(async (cb: any) => cb(manager)),
    };

    const geidea = new GeideaService(
      config as never,
      dataSource as never,
      {} as never,
      {} as never,
      billing as never,
    );

    // Mock Geidea order verification response
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        responseCode: '000',
        order: {
          orderId: '55555555-5555-4555-8555-555555555555',
          merchantReferenceId: invoiceId,
          merchantPublicKey: 'pk',
          amount: 250,
          currency: 'SAR',
          status: 'Success',
          detailedStatus: 'Paid',
          isTest: true,
        },
      }),
    } as Response);

    const res = await geidea.verifyOrder('55555555-5555-4555-8555-555555555555', { id: ownerId });
    expect(res).toEqual({ paid: true });
    expect(invoice.status).toBe(InvoiceStatus.PAID);
    expect(campaign.approvalStatus).toBe(EmailMarketingApprovalStatus.PUBLISHED);
    expect(campaign.isActive).toBe(true);

    jest.restoreAllMocks();
  });

  it('rejects stale, mismatched, or cancelled invoices in publishPaidAd helper', async () => {
    const campaign = makeCampaign({
      approvalStatus: EmailMarketingApprovalStatus.AWAITING_PAYMENT,
      publicationFee: 250,
      invoiceId,
    });
    const manager = {
      findOne: jest.fn(async () => campaign),
      save: jest.fn(),
    } as any;

    await expect(
      preparePaidAdCampaign(manager, makeInvoice({ id: 'old-invoice-id' })),
    ).rejects.toThrow('Stale or superseded');

    await expect(
      preparePaidAdCampaign(manager, makeInvoice({ status: InvoiceStatus.CANCELLED })),
    ).rejects.toThrow('no longer payable');

    await expect(
      preparePaidAdCampaign(manager, makeInvoice({ userId: otherUserId })),
    ).rejects.toThrow('owner mismatch');

    await expect(
      preparePaidAdCampaign(manager, makeInvoice({ total: 100 })),
    ).rejects.toThrow('does not match');

    await expect(
      publishPaidAd(manager, makeInvoice({ total: 100 })),
    ).rejects.toThrow('does not match');
  });

  it('enforces controller permissions, identity verification, and real actor id resolution', () => {
    const reflector = new Reflector();
    const customerMethods = [
      MarketingController.prototype.createEmailMarketing,
      MarketingController.prototype.findAllEmailMarketing,
      MarketingController.prototype.findOneEmailMarketing,
      MarketingController.prototype.updateEmailMarketing,
      MarketingController.prototype.createEmailMarketingAlias,
      MarketingController.prototype.findAllEmailMarketingAlias,
      MarketingController.prototype.findOneEmailMarketingAlias,
      MarketingController.prototype.updateEmailMarketingAlias,
      MarketingController.prototype.uploadMedia,
    ];

    for (const method of customerMethods) {
      expect(reflector.get(SKIP_DEPARTMENTS_GUARD_KEY, method)).toBe(true);
      expect(reflector.get(SKIP_SUBSCRIPTION_GUARD_KEY, method)).toBe(true);
      expect(reflector.get(ALLOW_UNVERIFIED_KEY, method)).toBeUndefined();
    }

    expect(reflector.get(ROLES_KEY, MarketingController.prototype.approveEmailMarketing)).toEqual([Role.ADMIN]);
    expect(reflector.get(ROLES_KEY, MarketingController.prototype.approveEmailMarketingAlias)).toEqual([Role.ADMIN]);

    const mockService = { createEmailMarketing: jest.fn() };
    const controller = new MarketingController(mockService as never, {} as never);
    controller.createEmailMarketing({ content: 'test' }, { user: { id: 'real-id-123' } });
    expect(mockService.createEmailMarketing).toHaveBeenCalledWith({ content: 'test' }, 'real-id-123');
  });
});
