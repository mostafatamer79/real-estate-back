/* Disposable PostgreSQL verification. Never reads application database credentials. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { Client } = require("pg");
require("reflect-metadata");
const { DataSource, getMetadataArgsStorage } = require("typeorm");
const connection = {
  host: "127.0.0.1",
  port: 55439,
  user: "mostafa",
  database: "postgres",
};
const database = `provider_review_${Date.now()}`;
let source;
(async () => {
  const admin = new Client(connection);
  await admin.connect();
  await admin.query(`CREATE DATABASE "${database}"`);
  try {
    const walk = (dir) =>
      fs
        .readdirSync(dir, { withFileTypes: true })
        .flatMap((entry) =>
          entry.isDirectory()
            ? walk(path.join(dir, entry.name))
            : [path.join(dir, entry.name)],
        );
    for (const file of walk("src").filter(
      (file) =>
        file.endsWith(".ts") &&
        !file.endsWith(".spec.ts") &&
        fs.readFileSync(file, "utf8").includes("@Entity("),
    )) {
      require(
        path.resolve(
          file.replace(/^src\//, "dist/src/").replace(/\.ts$/, ".js"),
        ),
      );
    }
    const entities = [
      ...new Set(getMetadataArgsStorage().tables.map((table) => table.target)),
    ];
    source = new DataSource({
      type: "postgres",
      ...connection,
      database,
      entities,
      synchronize: true,
    });
    await source.initialize();
    // Prove the additive migration is rerunnable against the previous schema.
    await source.query('ALTER TABLE users DROP COLUMN "providerProfile"');
    await source.query(
      "ALTER TABLE service_requests ALTER COLUMN price TYPE integer USING price::integer",
    );
    const migration = fs.readFileSync(
      "migrations/20261106-provider-profile.sql",
      "utf8",
    );
    await source.query(migration);
    await source.query(migration);
    const { User, Role } = require("../dist/src/user/user-entity");
    const {
      ServiceRequest,
      ServiceStatus,
    } = require("../dist/src/service/service-request.entity");
    const {
      Invoice,
      InvoiceStatus,
    } = require("../dist/src/financial/entities/invoice.entity");
    const { Setting } = require("../dist/src/settings/settings.entity");
    const {
      Notification,
    } = require("../dist/src/notification/notification.entity");
    const {
      ProviderService,
    } = require("../dist/src/provider/provider.service");
    const users = source.getRepository(User),
      requests = source.getRepository(ServiceRequest),
      invoices = source.getRepository(Invoice);
    const settingsRepository = source.getRepository(Setting);
    const settings = {
      findOne: (key) => settingsRepository.findOneBy({ key }),
      batchSave: async (rows) => {
        for (const row of rows) {
          const previous = await settingsRepository.findOneBy({ key: row.key });
          await settingsRepository.save({ ...previous, ...row });
        }
      },
    };
    const service = new ProviderService(
      users,
      requests,
      invoices,
      source,
      settings,
    );
    const owner = await users.save({
      firstName: "Test owner",
      role: Role.USER,
      isActive: true,
      nafathVerifiedAt: new Date(),
    });
    const provider = await users.save({
      firstName: "Test notary",
      role: Role.USER,
      isActive: true,
      phone: "0550000001",
      nafathVerifiedAt: new Date(),
    });
    const reviewer = await users.save({
      firstName: "Test administrator",
      role: Role.ADMIN,
      isActive: true,
    });
    const application = await service.apply(provider.id, {
      kind: "notary",
      city: "الرياض",
      requestedCategories: ["legal_documentation"],
      deliveryModes: ["online", "in_person"],
      licenseNumber: "TEST-1",
      licenseDocument: "/uploads/profile-images/12345678-1234-1234-1234-123456789abc.pdf",
      status: "approved",
      categories: ["marketing"],
      minOffer: 0,
      maxOffer: 9999999999,
    });
    assert.equal(application.status, "pending");
    assert.deepEqual(application.categories, []);
    assert.equal(
      (await users.findOneBy({ id: provider.id })).providerProfile,
      undefined,
      "Provider agreement is excluded from default user queries",
    );
    await service.review(
      provider.id,
      {
        status: "approved",
        categories: ["legal_documentation"],
        agreementType: "percentage",
        agreementValue: 10,
        minOffer: 5,
        maxOffer: 500,
      },
      reviewer.id,
    );
    assert.equal(await source.getRepository(Notification).count(), 1);
    const createRequest = (city) =>
      requests.save(
        requests.create({
          userId: owner.id,
          category: "legal",
          serviceType: "توثيق صك الملكية",
          city,
          district: "حي اختبار",
          clientName: "Test owner",
          phone: "0550000002",
          quantity: 1,
          status: ServiceStatus.PENDING,
          metadata: {},
        }),
      );
    // Exercise real HTTP validation plus JWT, role and identity guards on the same isolated database.
    const { Test } = require("@nestjs/testing");
    const { APP_GUARD } = require("@nestjs/core");
    const { ValidationPipe } = require("@nestjs/common");
    const { JwtModule, JwtService } = require("@nestjs/jwt");
    const { PassportModule } = require("@nestjs/passport");
    const { ConfigService } = require("@nestjs/config");
    const { getRepositoryToken } = require("@nestjs/typeorm");
    const {
      ProviderController,
    } = require("../dist/src/provider/provider.controller");
    const { JwtAuthGuard } = require("../dist/src/common/guards/jwt.guard");
    const { JwtStrategy } = require("../dist/src/common/guards/jwt.strategy");
    const { RolesGuard } = require("../dist/src/common/guards/roles.guard");
    const {
      IdentityVerificationGuard,
    } = require("../dist/src/common/guards/identity-verification.guard");
    const secret = "local-disposable-provider-tests-only";
    const module = await Test.createTestingModule({
      imports: [PassportModule, JwtModule.register({ secret })],
      controllers: [ProviderController],
      providers: [
        { provide: ProviderService, useValue: service },
        { provide: getRepositoryToken(User), useValue: users },
        {
          provide: ConfigService,
          useValue: {
            get: (key) => (key === "auth.secret" ? secret : undefined),
          },
        },
        JwtStrategy,
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: IdentityVerificationGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    }).compile();
    const app = module.createNestApplication({ logger: false });
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
    const http = require("supertest")(app.getHttpServer());
    const jwt = new JwtService({ secret });
    const bearer = (user) => `Bearer ${jwt.sign({ sub: user.id })}`;
    try {
      await http.get("/api/service-providers").expect(401);
      await http
        .get("/api/service-providers")
        .set("Authorization", bearer(owner))
        .expect(403);
      await http
        .get("/api/service-providers")
        .set("Authorization", bearer(reviewer))
        .expect(200);
      await http
        .put("/api/service-providers/controls")
        .set("Authorization", bearer(owner))
        .send({ notaryPlatformFee: 1, onlineAllCities: true })
        .expect(403);
      await http
        .post("/api/service-providers/apply")
        .set("Authorization", bearer(owner))
        .send({
          kind: "general",
          city: "الرياض",
          requestedCategories: ["legal"],
          deliveryModes: ["online"],
          status: "approved",
        })
        .expect(400);
      const unverified = await users.save({
        firstName: "Unverified test",
        role: Role.USER,
        isActive: true,
      });
      await http
        .get("/api/service-providers/me")
        .set("Authorization", bearer(unverified))
        .expect(200);
      const blocked = await http
        .post("/api/service-providers/apply")
        .set("Authorization", bearer(unverified))
        .send({
          kind: "general",
          city: "الرياض",
          requestedCategories: ["legal"],
          deliveryModes: ["online"],
        })
        .expect(403);
      assert.equal(blocked.body.code, "NAFATH_VERIFICATION_REQUIRED");
      await http
        .put("/api/service-providers/controls")
        .set("Authorization", bearer(reviewer))
        .send({ notaryPlatformFee: "bad", onlineAllCities: true })
        .expect(400);
      await http
        .put("/api/service-providers/controls")
        .set("Authorization", bearer(reviewer))
        .send({ notaryPlatformFee: 1, onlineAllCities: "false" })
        .expect(400);
      await http
        .get("/api/service-providers/my-requests")
        .set("Authorization", bearer(owner))
        .expect(200);
    } finally {
      await app.close();
    }

    const request = await createRequest("الرياض");
    const otherCity = await createRequest("جدة");
    assert.equal((await service.opportunities(provider.id, 1)).items.length, 1);
    await assert.rejects(
      service.offer(otherCity.id, provider.id, {
        amount: 100,
        deliveryMode: "in_person",
      }),
    );
    await assert.rejects(
      service.offer(request.id, provider.id, {
        amount: 501,
        deliveryMode: "online",
      }),
    );
    await assert.rejects(
      service.offer(request.id, provider.id, {
        amount: 100,
        deliveryMode: "invalid",
      }),
    );
    // Two concurrent submissions serialize on the same request row.
    const offers = await Promise.allSettled(
      [1, 2].map(() =>
        service.offer(request.id, provider.id, {
          amount: 100,
          deliveryMode: "online",
          note: "private admin note",
        }),
      ),
    );
    assert.equal(
      offers.filter((result) => result.status === "fulfilled").length,
      1,
    );
    assert.equal(
      offers.filter((result) => result.status === "rejected").length,
      1,
    );
    assert.deepEqual(await service.contact(request.id, owner.id), {
      unlocked: false,
      phone: null,
    });
    await assert.rejects(
      service.assign(request.id, provider.id),
      /Configure the platform fee/,
    );
    assert.equal(
      (await requests.findOneBy({ id: request.id })).assignedAgentId,
      null,
      "Missing fee rolls back assignment",
    );
    await service.saveControls({
      notaryPlatformFee: 25.5,
      onlineAllCities: false,
    });
    const accepted = await service.assign(request.id, provider.id);
    assert.equal(accepted.total, 25.5);
    assert.equal((await requests.findOneBy({ id: request.id })).price, 25.5);
    assert.equal(
      (await invoices.findOneBy({ id: accepted.invoiceId })).status,
      InvoiceStatus.UNPAID,
    );
    assert.deepEqual(await service.contact(request.id, owner.id), {
      unlocked: false,
      phone: null,
    });
    const publicOffers = await service.offers(request.id, {
      id: owner.id,
      role: Role.USER,
    });
    assert.equal(publicOffers.offers[0].commission, undefined);
    assert.equal(publicOffers.offers[0].note, undefined);
    await assert.rejects(
      service.contact(request.id, reviewer.id),
      /Access denied/,
    );
    await invoices.update(accepted.invoiceId, {
      status: InvoiceStatus.PAID,
      total: 1,
    });
    assert.equal(
      (await service.contact(request.id, owner.id)).unlocked,
      false,
      "A paid invoice for the wrong amount cannot unlock contact",
    );
    await invoices.update(accepted.invoiceId, { total: 25.5 });
    assert.equal(
      (await service.contact(request.id, owner.id)).phone,
      provider.phone,
    );
    await service.review(
      provider.id,
      { status: "suspended", reviewNote: "License needs review" },
      reviewer.id,
    );
    assert.equal((await service.contact(request.id, owner.id)).unlocked, false);
    await assert.rejects(
      service.offer(otherCity.id, provider.id, {
        amount: 100,
        deliveryMode: "online",
      }),
    );
    assert.equal(await source.getRepository(Notification).count(), 3);
    console.log(
      "PASS: real JWT/role/identity HTTP guards and DTO validation; disposable PostgreSQL migration, applications, approval, grants, bounds, city, concurrent offers, missing fee rollback, invoice assignment, private offer fields, matching paid-only contact and suspension.",
    );
  } finally {
    if (source?.isInitialized) await source.destroy();
    await admin.query(`DROP DATABASE "${database}"`);
    await admin.end();
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
