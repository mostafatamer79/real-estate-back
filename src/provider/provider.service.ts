import { providerRequestCategory, providerCategoryExpression } from "./provider-category";
export { providerRequestCategory } from "./provider-category";
import { providerMetadata, metadataRecord } from "./provider-metadata";
import type { ProviderApplicationDto, ProviderReviewDto } from "./provider.dto";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, IsNull, Not } from "typeorm";
import { User, Role } from "../user/user-entity";
import {
  ServiceRequest,
  ServiceStatus,
  ClientDecision,
} from "../service/service-request.entity";
import { Invoice, InvoiceStatus } from "../financial/entities/invoice.entity";
import { SettingsService } from "../settings/settings.service";
import {
  Notification,
  NotificationType,
} from "../notification/notification.entity";
import {
  assertProviderCanOffer,
  contactIsUnlocked,
  validMoney,
  validLicenseDocument,
  validateProviderReview,
} from "./provider-policy";
import type {
  DeliveryMode,
  ProviderOffer,
  ProviderProfile,
} from "./provider-profile";

const modes = new Set(["online", "in_person"]);
const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
@Injectable()
export class ProviderService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(ServiceRequest)
    private readonly requests: Repository<ServiceRequest>,
    @InjectRepository(Invoice) private readonly invoices: Repository<Invoice>,
    private readonly dataSource: DataSource,
    private readonly settings: SettingsService,
  ) {}

  private async account(id: string) {
    const user = await this.users.findOne({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        city: true,
        role: true,
        isActive: true,
        providerProfile: true,
        nafathVerifiedAt: true,
      },
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }
  async mine(id: string) {
    return (await this.account(id)).providerProfile || null;
  }

  async apply(id: string, input: ProviderApplicationDto) {
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw new BadRequestException("Invalid provider application");
    const account = await this.account(id);
    const city = text(input.city, 100);
    const requestedCategories = Array.isArray(input.requestedCategories)
      ? [...new Set(input.requestedCategories)]
      : [];
    if (
      !city ||
      !requestedCategories.length ||
      requestedCategories.length > 30 ||
      requestedCategories.some(
        (c) =>
          typeof c !== "string" || !/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(c),
      )
    )
      throw new BadRequestException("Enter city and requested categories");
    const deliveryModes = Array.isArray(input.deliveryModes)
      ? [...new Set(input.deliveryModes)]
      : [];
    if (
      !deliveryModes.length ||
      deliveryModes.some((mode) => !modes.has(String(mode)))
    )
      throw new BadRequestException("Select an available delivery mode");
    if (input.kind !== "general" && input.kind !== "notary")
      throw new BadRequestException("Invalid provider type");
    const licenseDocument = text(input.licenseDocument, 2048);
    if (licenseDocument && !validLicenseDocument(licenseDocument))
      throw new BadRequestException("Invalid license document URL");
    const profile: ProviderProfile = {
      status: "pending",
      kind: input.kind,
      city,
      deliveryModes: deliveryModes,
      requestedCategories: requestedCategories,
      categories: [],
      licenseNumber: text(input.licenseNumber, 100),
      licenseDocument,
      notes: text(input.notes, 2000),
      submittedAt: new Date().toISOString(),
    };
    if (
      profile.kind === "notary" &&
      (!profile.licenseNumber || !profile.licenseDocument)
    )
      throw new BadRequestException(
        "Notary license number and document are required",
      );
    if (account.providerProfile?.status === "approved")
      throw new ConflictException(
        "Contact the administrator to change an approved provider profile",
      );
    await this.users.update(id, { providerProfile: profile });
    return profile;
  }

  async list(page = 1) {
    const [items, total] = await this.users.findAndCount({
      where: { providerProfile: Not(IsNull()) },
      order: { createAt: "DESC" },
      take: 30,
      skip: (page - 1) * 30,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        providerProfile: true,
      },
    });
    return { items, total, page };
  }

  async review(id: string, input: ProviderReviewDto, adminId: string) {
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw new BadRequestException("Invalid review");
    const account = await this.account(id);
    if (!account.providerProfile)
      throw new BadRequestException("No provider application");
    if (!["approved", "rejected", "suspended"].includes(String(input.status)))
      throw new BadRequestException("Invalid review status");
    const prior = account.providerProfile;
    const profile: ProviderProfile = {
      ...prior,
      status: input.status as ProviderProfile["status"],
      categories: Array.isArray(input.categories)
        ? (input.categories)
        : prior.categories,
      agreementType: input.agreementType ?? prior.agreementType,
      agreementValue: input.agreementValue ?? prior.agreementValue,
      minOffer: input.minOffer ?? prior.minOffer,
      maxOffer: input.maxOffer ?? prior.maxOffer,
      reviewNote: text(input.reviewNote, 2000),
      reviewedBy: adminId,
      reviewedAt: new Date().toISOString(),
    };
    if (profile.status === "approved") {
      validateProviderReview(profile);
      if (
        profile.kind === "notary" &&
        (!profile.licenseNumber || !profile.licenseDocument)
      )
        throw new BadRequestException("Notary license evidence is required");
    } else if (!profile.reviewNote)
      throw new BadRequestException(
        "Enter a reason for rejection or suspension",
      );
    await this.dataSource.transaction(async (manager) => {
      await manager.update(User, id, { providerProfile: profile });
      // The notification is committed with the review, so the user always has its reason.
      await manager.save(Notification, {
        userId: id,
        type: NotificationType.SYSTEM,
        title: "حالة طلب مزود الخدمة",
        message:
          profile.reviewNote ||
          "تم اعتمادك كمزود خدمة. يمكنك مشاهدة صلاحياتك واتفاقك من صفحة مزود الخدمة.",
        data: { providerStatus: profile.status },
      });
    });
    return profile;
  }

  async getControls() {
    const [fee, scope] = await Promise.all([
      this.settings.findOne("notary_platform_fee"),
      this.settings.findOne("notary_online_all_cities"),
    ]);
    const amount = fee ? Number(fee.value) : null;
    return {
      notaryPlatformFee:
        amount !== null && validMoney(amount) && amount > 0 ? amount : null,
      onlineAllCities: scope?.value === "true",
    };
  }
  async saveControls(input: {
    notaryPlatformFee?: number;
    onlineAllCities?: boolean;
  }) {
    if (!validMoney(input.notaryPlatformFee) || input.notaryPlatformFee <= 0)
      throw new BadRequestException(
        "Enter a positive platform fee with at most two decimals",
      );
    if (typeof input.onlineAllCities !== "boolean")
      throw new BadRequestException("Select the online city policy");
    await this.settings.batchSave([
      { key: "notary_platform_fee", value: String(input.notaryPlatformFee) },
      { key: "notary_online_all_cities", value: String(input.onlineAllCities) },
    ]);
    return this.getControls();
  }

  async opportunities(id: string, page: number, filter: { category?: string; service?: string } = {}) {
    const profile = (await this.account(id)).providerProfile;
    if (profile?.status !== "approved")
      throw new ForbiddenException("Provider approval is required");
    const controls = await this.getControls();
    const roots = [
      ...new Set(
        profile.categories.map((category) =>
          category.startsWith("legal_") ? "legal" : category,
        ),
      ),
    ];
    if (!roots.length) return { items: [], total: 0, page };
    const query = this.requests
      .createQueryBuilder("request")
      .where("request.category IN (:...categories)", { categories: roots })
      .andWhere("request.status = :status", { status: ServiceStatus.PENDING })
      .andWhere("request.assignedAgentId IS NULL")
      .andWhere("request.userId != :id", { id });
    if (
      profile.kind === "notary" &&
      !(controls.onlineAllCities && profile.deliveryModes.includes("online"))
    )
      query.andWhere("TRIM(request.city) = :city", {
        city: profile.city.trim(),
      });
    const grantParams: Record<string, string> = {};
    const grantConditions = profile.categories.map((grant, index) => {
      grantParams[`grant${index}`] = grant;
      grantParams[`grantPrefix${index}`] = `${grant}_`;
      return `((${providerCategoryExpression}) = :grant${index} OR starts_with((${providerCategoryExpression}), :grantPrefix${index}))`;
    });
    query.andWhere(`(${grantConditions.join(" OR ")})`, grantParams);
    if (profile.kind === "notary") query.andWhere(`(${providerCategoryExpression}) = 'legal_documentation'`);
    if (filter.category) {
      query.andWhere(filter.category === "legal" ? "request.category = :browseCategory" : `(${providerCategoryExpression}) = :browseCategory`, { browseCategory: filter.category });
    }
    if (filter.service) query.andWhere("request.serviceType = :browseService", { browseService: filter.service });
    const [items, total] = await query
      .orderBy("request.createdAt", "DESC")
      .skip((page - 1) * 30)
      .take(30)
      .getManyAndCount();
    return {
      items: items
        .filter((item) => {
          const category = providerRequestCategory(item);
          return (
            profile.categories.some(
              (grant) => grant === category || category.startsWith(`${grant}_`),
            ) &&
            (profile.kind !== "notary" || category === "legal_documentation")
          );
        })
        .map((item) => ({
          id: item.id,
          category: item.category,
          serviceCategory: providerRequestCategory(item),
          serviceType: item.serviceType,
          city: item.city,
          district: item.district,
          quantity: item.quantity,
          createdAt: item.createdAt,
          ownOffer:
            providerMetadata(item.metadata).providerOffers?.[id] || null,
        })),
      total,
      page,
    };
  }

  async offer(
    requestId: string,
    userId: string,
    input: { amount: number; deliveryMode: DeliveryMode; note?: string },
  ) {
    const provider = await this.account(userId);
    const controls = await this.getControls();
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(ServiceRequest, {
        where: { id: requestId },
        lock: { mode: "pessimistic_write" },
      });
      if (!request) throw new NotFoundException("Request not found");
      if (
        request.userId === userId ||
        request.status !== ServiceStatus.PENDING ||
        request.assignedAgentId
      )
        throw new BadRequestException("This request is not open for offers");
      const category = providerRequestCategory(request);
      if (
        provider.providerProfile?.kind === "notary" &&
        category !== "legal_documentation"
      )
        throw new ForbiddenException(
          "Notaries may offer documentation services only",
        );
      assertProviderCanOffer(
        provider.providerProfile,
        { ...request, category },
        input.amount,
        input.deliveryMode,
        controls.onlineAllCities,
      );
      if (
        Object.keys(providerMetadata(request.metadata).providerOffers || {})
          .length >= 100
      )
        throw new BadRequestException(
          "The maximum number of offers has been reached",
        );
      if (providerMetadata(request.metadata).providerOffers?.[userId])
        throw new ConflictException("An offer already exists for this request");
      const profile = provider.providerProfile;
      if (!profile)
        throw new ForbiddenException("Provider approval is required");
      const commission =
        profile.agreementType === "percentage"
          ? (input.amount * profile.agreementValue!) / 100
          : profile.agreementValue!;
      const offer: ProviderOffer = {
        providerId: userId,
        amount: input.amount,
        deliveryMode: input.deliveryMode,
        note: text(input.note, 2000),
        createdAt: new Date().toISOString(),
        commission: Math.round(commission * 100) / 100,
      };
      request.metadata = {
        ...providerMetadata(request.metadata),
        providerOffers: {
          ...providerMetadata(request.metadata).providerOffers,
          [userId]: offer,
        },
      };
      await manager.save(ServiceRequest, request);
      return offer;
    });
  }

  async offers(requestId: string, user: { id: string; role: Role }) {
    const request = await this.requests.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException("Request not found");
    if (user.role !== Role.ADMIN && request.userId !== user.id)
      throw new ForbiddenException("Access denied");
    const offers = Object.values(
      providerMetadata(request.metadata).providerOffers || {},
    );
    return {
      offers: offers.map(({ commission, note, ...offer }) =>
        user.role === Role.ADMIN ? { ...offer, commission, note } : offer,
      ),
      selection: providerMetadata(request.metadata).providerSelection || null,
    };
  }

  async assign(requestId: string, providerId: string) {
    const provider = await this.account(providerId);
    const controls = await this.getControls();
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(ServiceRequest, {
        where: { id: requestId },
        lock: { mode: "pessimistic_write" },
      });
      if (!request) throw new NotFoundException("Request not found");
      if (!request.userId)
        throw new BadRequestException(
          "Request owner is required before invoicing",
        );
      if (
        request.assignedAgentId ||
        providerMetadata(request.metadata).providerSelection ||
        [ServiceStatus.CANCELLED, ServiceStatus.COMPLETED].includes(
          request.status,
        )
      )
        throw new ConflictException("Request is already assigned or closed");
      const offer: ProviderOffer | undefined = providerMetadata(
        request.metadata,
      ).providerOffers?.[providerId];
      if (!offer)
        throw new BadRequestException("Provider has not submitted an offer");
      assertProviderCanOffer(
        provider.providerProfile,
        { ...request, category: providerRequestCategory(request) },
        offer.amount,
        offer.deliveryMode,
        controls.onlineAllCities,
      );
      const isNotary = provider.providerProfile?.kind === "notary";
      if (isNotary && controls.notaryPlatformFee === null)
        throw new BadRequestException(
          "Configure the platform fee before accepting a notary request",
        );
      const total = isNotary ? controls.notaryPlatformFee! : offer.amount;
      const existing = await manager.find(Invoice, {
        where: { referenceId: requestId, referenceType: "ServiceRequest" },
      });
      if (existing.some((invoice) => invoice.status === InvoiceStatus.PAID))
        throw new ConflictException("This request has already been paid");
      // Cancel earlier unpaid prices before issuing the accepted provider invoice.
      for (const invoice of existing)
        if (invoice.status !== InvoiceStatus.CANCELLED) {
          invoice.status = InvoiceStatus.CANCELLED;
          await manager.save(Invoice, invoice);
        }
      const invoice = await manager.save(
        Invoice,
        manager.create(Invoice, {
          userId: request.userId,
          referenceType: "ServiceRequest",
          referenceId: requestId,
          status: InvoiceStatus.UNPAID,
          amount: total,
          total,
          tax: 0,
          serviceFee: 0,
          description: isNotary
            ? `رسوم المنصة لطلب التوثيق: ${request.serviceType}`
            : `فاتورة خدمة: ${request.serviceType}`,
        }),
      );
      request.assignedAgentId = providerId;
      request.assignedAt = new Date();
      request.adminAccepted = true;
      request.status = ServiceStatus.ASSIGNED;
      request.invoiceSent = true;
      request.invoicePrice = total;
      request.price = total;
      request.invoiceGenerated = true;
      request.clientDecision = ClientDecision.ACCEPTED;
      request.metadata = {
        ...providerMetadata(request.metadata),
        providerSelection: {
          providerId,
          deliveryMode: offer.deliveryMode,
          amount: offer.amount,
          platformFee: isNotary ? total : offer.commission,
          acceptedAt: new Date().toISOString(),
          invoiceId: invoice.id,
          chargedAmount: total,
        },
      };
      await manager.save(ServiceRequest, request);
      await manager.save(Notification, {
        userId: request.userId,
        type: NotificationType.SERVICE_REQUEST,
        title: "تم قبول عرض مزود الخدمة",
        message: "يمكنك سداد الفاتورة من محفظتك لإتاحة رقم التواصل مع المزود.",
        data: { requestId, invoiceId: invoice.id },
      });
      return { requestId, invoiceId: invoice.id, total };
    });
  }

  async myRequests(id: string, page: number) {
    const [items, total] = await this.requests.findAndCount({
      where: { userId: id },
      order: { createdAt: "DESC" },
      take: 30,
      skip: (page - 1) * 30,
    });
    return {
      items: items.map((request) => ({
        id: request.id,
        category: request.category,
        serviceType: request.serviceType,
        city: request.city,
        quantity: request.quantity,
        metadata: {
          providerSelection:
            providerMetadata(request.metadata).providerSelection || null,
        },
      })),
      total,
      page,
    };
  }

  async contact(requestId: string, userId: string) {
    const request = await this.requests.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException("Request not found");
    if (request.userId !== userId)
      throw new ForbiddenException("Access denied");
    const invoice = await this.invoices.findOne({
      where: {
        id:
          providerMetadata(request.metadata).providerSelection?.invoiceId ||
          "00000000-0000-0000-0000-000000000000",
      },
    });
    if (!contactIsUnlocked(request, invoice, userId))
      return { unlocked: false, phone: null };
    const provider = await this.account(request.assignedAgentId);
    if (
      provider.providerProfile?.status !== "approved" ||
      provider.isActive === false
    )
      return { unlocked: false, phone: null };
    return {
      unlocked: true,
      phone: provider.phone || null,
      name: [provider.firstName, provider.lastName].filter(Boolean).join(" "),
    };
  }
}
