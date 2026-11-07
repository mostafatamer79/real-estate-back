// Local disposable browser fixture. This file is never imported by the application.
require('reflect-metadata');
const fs = require('node:fs'), path = require('node:path');
process.env.NODE_PATH = path.resolve('dist'); require('node:module').Module._initPaths();
const { Client } = require('pg');
const { DataSource, getMetadataArgsStorage } = require('typeorm');
const { Test } = require('@nestjs/testing');
const { APP_GUARD } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { JwtModule, JwtService } = require('@nestjs/jwt');
const { PassportModule } = require('@nestjs/passport');
const { ConfigService } = require('@nestjs/config');
const { getRepositoryToken } = require('@nestjs/typeorm');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
for (const file of walk('src').filter(file => file.endsWith('.ts') && !file.endsWith('.spec.ts') && fs.readFileSync(file, 'utf8').includes('@Entity('))) require(path.resolve(file.replace(/^src\//, 'dist/src/').replace(/\.ts$/, '.js')));
const load = name => require(`../dist/src/${name}`);
const { User, Role } = load('user/user-entity');
const { ServiceRequest, ServiceStatus } = load('service/service-request.entity');
const { Invoice, InvoiceStatus } = load('financial/entities/invoice.entity');
const { Setting } = load('settings/settings.entity');
const { Notification } = load('notification/notification.entity');
const { ProviderService } = load('provider/provider.service');
const { ProviderController } = load('provider/provider.controller');
const { UserService } = load('user/user.service');
const { UserController } = load('user/user.controller');
const { ServiceRequestService } = load('service/service-request.service');
const { ServiceRequestController } = load('service/service-request.controller');
const { SettingsService } = load('settings/settings.service');
const { SettingsController } = load('settings/settings.controller');
const { NotificationService } = load('notification/notification.service');
const { FileUploadService } = load('document/file-upload.service');
const { ChatService } = load('chat/chat.service');
const { JwtAuthGuard } = load('common/guards/jwt.guard');
const { JwtStrategy } = load('common/guards/jwt.strategy');
const { RolesGuard } = load('common/guards/roles.guard');
const { IdentityVerificationGuard } = load('common/guards/identity-verification.guard');
const connection = { host: '127.0.0.1', port: 55439, user: 'mostafa', database: 'postgres' };
const database = `provider_browser_${Date.now()}`;
const testUploadRoot = '/tmp/provider-browser-uploads-' + Date.now();
fs.mkdirSync(testUploadRoot, {recursive:true});
const uploadService = Object.create(FileUploadService.prototype); uploadService.uploadPath = testUploadRoot;
let source, app, admin;
async function cleanup() {
  if (app) await app.close();
  if (source?.isInitialized) await source.destroy();
  if (admin) { await admin.query(`DROP DATABASE IF EXISTS "${database}"`); await admin.end(); }
  fs.rmSync(testUploadRoot, {recursive:true, force:true});
}
(async () => {
  admin = new Client(connection); await admin.connect(); await admin.query(`CREATE DATABASE "${database}"`);
  source = new DataSource({ type: 'postgres', ...connection, database, entities: [...new Set(getMetadataArgsStorage().tables.map(table => table.target))], synchronize: true });
  await source.initialize();
  const users = source.getRepository(User), requests = source.getRepository(ServiceRequest), invoices = source.getRepository(Invoice);
  const settings = new SettingsService(source.getRepository(Setting), source);
  const notifications = new NotificationService(source.getRepository(Notification));
  const providers = new ProviderService(users, requests, invoices, source, settings);
  const userService = Object.create(UserService.prototype); userService.userRepository = users;
  const requestService = new ServiceRequestService(requests, users, invoices, settings, {}, notifications);
  const owner = await users.save({ firstName: 'عميل تجريبي', email: 'owner@example.test', city: 'الرياض', role: Role.USER, isActive: true, nafathVerifiedAt: new Date(), onboardingStatus: 'completed' });
  const provider = await users.save({ firstName: 'موثق تجريبي', email: 'provider@example.test', phone: '0550000001', city: 'الرياض', role: Role.USER, isActive: true, nafathVerifiedAt: new Date(), onboardingStatus: 'completed' });
  const reviewer = await users.save({ firstName: 'إدارة تجريبية', email: 'admin@example.test', role: Role.ADMIN, isActive: true, onboardingStatus: 'completed' });
  const unverified = await users.save({ firstName: 'عميل غير موثق', email: 'unverified@example.test', role: Role.USER, isActive: true, onboardingStatus: 'completed' });
  const request = await requests.save(requests.create({ userId: owner.id, category: 'legal', serviceType: 'توثيق صك الملكية', city: 'الرياض', district: 'حي اختبار', clientName: owner.firstName, phone: '0550000002', quantity: 1, status: ServiceStatus.PENDING, metadata: {} }));
  const secret = 'isolated-local-browser-verification';
  const module = await Test.createTestingModule({
    imports: [PassportModule, JwtModule.register({ secret })], controllers: [ProviderController, UserController, ServiceRequestController, SettingsController],
    providers: [
      { provide: ProviderService, useValue: providers }, { provide: UserService, useValue: userService }, { provide: ServiceRequestService, useValue: requestService },
      { provide: SettingsService, useValue: settings }, { provide: ChatService, useValue: {} },
      { provide: FileUploadService, useValue: uploadService },
      { provide: getRepositoryToken(User), useValue: users }, { provide: ConfigService, useValue: { get: key => key === 'auth.secret' ? secret : undefined } }, JwtStrategy,
      { provide: APP_GUARD, useClass: JwtAuthGuard }, { provide: APP_GUARD, useClass: IdentityVerificationGuard }, { provide: APP_GUARD, useClass: RolesGuard },
    ],
  }).compile();
  app = module.createNestApplication({ logger: false }); app.enableCors({ origin: 'http://127.0.0.1:3350', credentials: true }); app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true, transformOptions: { enableImplicitConversion: true } }));
  for (const section of ['services', 'wallet', 'details', 'offers', 'orders', 'customerservice', 'info', 'disputes']) await settings.setSetting(`section_${section}`, 'open');
  for (const category of ['postPurchase', 'construction', 'marketing', 'legal', 'other']) await settings.setSetting(`module_services_${category}`, 'enabled');
  await settings.setSetting('theme_contactEmail', 'support@example.test');
  const jwt = new JwtService({ secret });
  const records = { owner, provider, admin: reviewer, unverified };
  const tokens = Object.fromEntries(Object.entries(records).map(([role, user]) => [role, jwt.sign({ sub: user.id })]));
  const express = app.getHttpAdapter().getInstance();
  const actor = async req => { const payload = jwt.verify(String(req.headers.authorization || '').replace(/^Bearer /, '')); return users.findOneBy({ id: payload.sub }); };
  express.get('/api/auth/nafath/availability', (_req, res) => res.json({ configured: false }));
  express.get('/api/financial/my-wallet', (_req, res) => res.json({ balance: 0, transactions: [] }));
  express.get('/api/financial/invoices/my', async (req, res) => { try { const user = await actor(req); res.json(await invoices.findBy({ userId: user.id })); } catch { res.status(401).json({ message: 'Test authentication required' }); } });
  for (const route of ['/financial/commissions/my', '/financial/files/my', '/financial/chart-data', '/properties/stats', '/activities/me', '/marketing/email-marketing/public', '/subscriptions/my', '/notifications', '/offers', '/chat/rooms']) express.get('/api' + route, (_req, res) => res.json([]));
  express.get('/api/notifications/unread-count', (_req, res) => res.json({ count: 0 }));
  express.post('/__test/reset', async (_req, res) => { await invoices.delete({ referenceId: request.id }); await users.update(provider.id, { providerProfile: null }); await requests.update(request.id, { status: ServiceStatus.PENDING, assignedAgentId: null, adminAccepted: false, invoiceSent: false, invoicePrice: null, metadata: {} }); res.json({ ok: true }); });
  express.post('/__test/confirm-payment', async (_req, res) => { const selected = await requests.findOneBy({ id: request.id }); if (!selected?.metadata?.providerSelection) return res.status(409).json({ message: 'Offer not accepted' }); await invoices.update(selected.metadata.providerSelection.invoiceId, { status: InvoiceStatus.PAID }); res.json({ ok: true }); });
  await app.init();
  await app.listen(3351, '127.0.0.1');
  fs.writeFileSync('/tmp/realestate-provider-browser-fixtures.json', JSON.stringify({ records, tokens, requestId: request.id }));
  console.log('Local provider browser fixture ready on 127.0.0.1:3351; disposable database only.');
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => { cleanup().then(() => process.exit(0)); });
})().catch(async error => { console.error(error.message); await cleanup(); process.exitCode = 1; });
