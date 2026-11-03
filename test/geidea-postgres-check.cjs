// Uses an isolated schema and fake gateway responses. Never submits a payment.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createRequire } = require('node:module');
const path = require('node:path');
const appRequire = createRequire(path.join(process.cwd(), 'package.json'));
const { Client } = appRequire('pg');
const { DataSource, EntitySchema } = appRequire('typeorm');
const { ConfigService } = appRequire('@nestjs/config');
const { Invoice } = appRequire('./dist/src/financial/entities/invoice.entity.js');
const { Booking } = appRequire('./dist/src/booking/entities/booking.entity.js');
const { User } = appRequire('./dist/src/user/user-entity.js');
const { Subscription } = appRequire('./dist/src/subscription/subscription.entity.js');
const { ManagementPackage } = appRequire('./dist/src/subscription/management-package/management-package.entity.js');
const { ServiceRequest } = appRequire('./dist/src/service/service-request.entity.js');
const { FinancialTransaction } = appRequire('./dist/src/financial/entities/financial-transaction.entity.js');
const { GeideaService } = appRequire('./dist/src/payment/geidea.service.js');
const { GeideaBillingService } = appRequire('./dist/src/payment/geidea-billing.service.js');
const { SubscriptionService } = appRequire('./dist/src/subscription/subscription.service.js');
const { FinancialService } = appRequire('./dist/src/financial/financial.service.js');

const connection = {
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};
const schema = 'geidea_check_' + Date.now() + '_' + randomUUID().slice(0, 8);
const primary = { type: 'uuid', primary: true, generated: 'uuid' };
const text = { type: 'varchar', nullable: true };
const money = { type: 'decimal', precision: 14, scale: 2, default: 0 };
const json = { type: 'jsonb', nullable: true };
function entity(target, tableName, columns, relations = {}) {
  return new EntitySchema({ name: target.name, target, tableName, schema, columns: { id: primary, ...columns }, relations });
}
const models = [
  entity(User, 'users', { departments: json, departmentPermissions: json }),
  entity(Invoice, 'invoices', { userId: text, amount: money, total: money, tax: money, serviceFee: money,
    status: text, referenceType: text, referenceId: text, description: text }),
  entity(Booking, 'bookings', { userId: text, price: money, status: text }),
  entity(ServiceRequest, 'service_requests', { userId: text, price: money, category: text, serviceType: text,
    paymentStatus: text, adminAccepted: { type: Boolean, default: false } }),
  entity(ManagementPackage, 'management_packages', { administrations: json }),
  entity(Subscription, 'subscriptions', { userId: text, amount: money, status: text, subscriptionType: text,
    startDate: { type: 'date' }, endDate: { type: 'date' }, selectedDepartments: json, paymentReference: text,
    paidAt: { type: 'timestamptz', nullable: true }, paymentMethod: text, customPeriodMonths: { type: Number, nullable: true },
    noExpiry: { type: Boolean, default: false }, packageId: { type: 'uuid', nullable: true } },
    { managementPackage: { type: 'many-to-one', target: 'ManagementPackage', joinColumn: { name: 'packageId' }, nullable: true } }),
  entity(FinancialTransaction, 'financial_transaction', { type: text, amount: money, fromUserId: { type: 'uuid', nullable: true },
    toUserId: { type: 'uuid', nullable: true }, status: text, paymentMethod: text, referenceType: text, referenceId: text,
    description: text, commissionBreakdown: json, transactionDate: { type: 'timestamptz', createDate: true } },
    { fromUser: { type: 'many-to-one', target: 'User', joinColumn: { name: 'fromUserId' }, nullable: true },
      toUser: { type: 'many-to-one', target: 'User', joinColumn: { name: 'toUserId' }, nullable: true } }),
];

async function run() {
  const control = new Client({ ...connection, user: connection.username });
  await control.connect();
  let database;
  const originalFetch = global.fetch;
  let checks = 0;
  try {
    await control.query('CREATE SCHEMA "' + schema + '"');
    database = new DataSource({ type: 'postgres', ...connection, schema, entities: models, synchronize: true });
    await database.initialize();
    const sessions = [];
    const orders = new Map();
    global.fetch = async (url, init) => {
      if (String(url).endsWith('/session')) {
        sessions.push(JSON.parse(init.body));
        return new Response(JSON.stringify({ responseCode: '000', session: { id: '0b02b503-fbf8-49dd-cdec-08dcdb056790' } }));
      }
      const order = orders.get(String(url).split('/').at(-1));
      assert.ok(order, 'Unexpected fake gateway lookup');
      return new Response(JSON.stringify({ responseCode: '000', order }));
    };
    const subscriptions = new SubscriptionService({}, {}, {}, {}, {}, {});
    const billing = new GeideaBillingService(subscriptions);
    const geidea = new GeideaService(new ConfigService({
      GEIDEA_ENABLED: 'true', GEIDEA_MODE: 'test', GEIDEA_MERCHANT_PUBLIC_KEY: 'isolated-test-key',
      GEIDEA_API_PASSWORD: 'isolated-test-secret', GEIDEA_CALLBACK_URL: 'https://example.invalid/callback',
      GEIDEA_RETURN_URL: 'https://example.invalid/return',
    }), database, database.getRepository(Invoice), database.getRepository(Booking), billing);
    const finances = new FinancialService(database.getRepository(FinancialTransaction), database.getRepository(Invoice), {},
      database.getRepository(User), database.getRepository(Booking), database.getRepository(ServiceRequest), {}, {});
    const user = await database.manager.save(User, { departments: [], departmentPermissions: {} });
    const stranger = await database.manager.save(User, { departments: [], departmentPermissions: {} });
    const remoteOrder = (reference, amount, status = 'Success') => {
      const orderId = randomUUID();
      orders.set(orderId, { orderId, merchantReferenceId: reference, merchantPublicKey: 'isolated-test-key',
        amount, currency: 'SAR', status, detailedStatus: status === 'Success' ? 'Paid' : status, isTest: true });
      return orderId;
    };
    await geidea.createSession({ walletTopupAmount: 100 }, user);
    const topupId = sessions.at(-1).merchantReferenceId;
    assert.equal(await finances.getUserBalance(user.id), 0); checks++;
    const topupOrder = remoteOrder(topupId, 100);
    await Promise.all(Array.from({ length: 8 }, () => geidea.verifyOrder(topupOrder)));
    assert.equal(await finances.getUserBalance(user.id), 100);
    assert.equal(await database.getRepository(FinancialTransaction).count(), 1); checks++;
    await assert.rejects(geidea.verifyOrder(topupOrder, stranger)); checks++;

    await geidea.createSession({ walletTopupAmount: 50 }, user);
    const failedId = sessions.at(-1).merchantReferenceId;
    assert.equal((await geidea.verifyOrder(remoteOrder(failedId, 50, 'Failed'))).paid, false);
    assert.equal(await finances.getUserBalance(user.id), 100); checks++;
    await assert.rejects(geidea.verifyOrder(remoteOrder(failedId, 1)));
    assert.equal(await finances.getUserBalance(user.id), 100); checks++;
    await assert.rejects(finances.payInvoice(user.id, failedId, 'wallet')); checks++;

    const subscription = await database.manager.save(Subscription, { userId: user.id, amount: 40, status: 'معلق',
      subscriptionType: 'شهري', startDate: '2026-01-01', endDate: '2026-02-01', selectedDepartments: ['legal', 'finance'] });
    await geidea.createSession({ subscriptionId: subscription.id }, user);
    const subscriptionInvoice = sessions.at(-1).merchantReferenceId;
    await geidea.createSession({ subscriptionId: subscription.id }, user);
    assert.equal(sessions.at(-1).merchantReferenceId, subscriptionInvoice); checks++;
    const subscriptionOrder = remoteOrder(subscriptionInvoice, 40);
    await Promise.all(Array.from({ length: 6 }, () => geidea.verifyOrder(subscriptionOrder)));
    const active = await database.manager.findOneByOrFail(Subscription, { id: subscription.id });
    const updatedUser = await database.manager.findOneByOrFail(User, { id: user.id });
    assert.equal(active.status, 'نشط');
    assert.ok(new Date(active.endDate) > new Date());
    assert.deepEqual(updatedUser.departments.sort(), ['finance', 'legal']);
    assert.equal(updatedUser.departmentPermissions.legal, true);
    assert.equal(await finances.getUserBalance(user.id), 100);
    assert.equal(await database.getRepository(FinancialTransaction).count(), 2); checks++;

    const ordinary = await database.manager.save(Invoice, { userId: user.id, amount: 15, total: 15, status: 'unpaid' });
    await geidea.verifyOrder(remoteOrder(ordinary.id, 15));
    assert.equal(await finances.getUserBalance(user.id), 100); checks++;
    const settledCount = await database.getRepository(FinancialTransaction).count();
    const ordinaryOrder = remoteOrder(ordinary.id, 15);
    await Promise.all(Array.from({ length: 8 }, () => geidea.verifyOrder(ordinaryOrder)));
    assert.equal(await database.getRepository(FinancialTransaction).count(), settledCount); checks++;
    const booking = await database.manager.save(Booking, { userId: user.id, price: 12, status: 'accepted' });
    const bookingOrder = remoteOrder(booking.id, 12);
    await Promise.all(Array.from({ length: 8 }, () => geidea.verifyOrder(bookingOrder)));
    assert.equal((await database.manager.findOneByOrFail(Booking, { id: booking.id })).status, 'paid');
    assert.equal(await database.getRepository(FinancialTransaction).count(), settledCount + 1);
    assert.equal(await finances.getUserBalance(user.id), 100); checks++;
    const first = await database.manager.save(Invoice, { userId: user.id, total: 75, amount: 75, status: 'unpaid' });
    const second = await database.manager.save(Invoice, { userId: user.id, total: 75, amount: 75, status: 'unpaid' });
    const competing = await Promise.allSettled([finances.payInvoice(user.id, first.id, 'wallet'), finances.payInvoice(user.id, second.id, 'wallet')]);
    assert.equal(competing.filter(item => item.status === 'fulfilled').length, 1);
    assert.equal(await finances.getUserBalance(user.id), 25); checks++;
    const withdrawals = await Promise.allSettled([finances.requestWithdrawal(user.id, 20), finances.requestWithdrawal(user.id, 20)]);
    assert.equal(withdrawals.filter(item => item.status === 'fulfilled').length, 1);
    assert.equal(await finances.getUserBalance(user.id), 5); checks++;

    await control.query('ALTER TABLE "' + schema + '"."financial_transaction" ADD CONSTRAINT reject_fixture CHECK (amount <> 13)');
    await geidea.createSession({ walletTopupAmount: 13 }, user);
    const rollbackTopup = sessions.at(-1).merchantReferenceId;
    await assert.rejects(geidea.verifyOrder(remoteOrder(rollbackTopup, 13)));
    assert.equal(await finances.getUserBalance(user.id), 5);
    assert.equal((await database.manager.findOneByOrFail(Invoice, { id: rollbackTopup })).status, 'unpaid'); checks++;
    const rollbackUser = await database.manager.save(User, { departments: [], departmentPermissions: {} });
    const rollbackSub = await database.manager.save(Subscription, { userId: rollbackUser.id, amount: 13, status: 'معلق',
      subscriptionType: 'شهري', startDate: '2026-01-01', endDate: '2026-02-01', selectedDepartments: ['legal'] });
    await geidea.createSession({ subscriptionId: rollbackSub.id }, rollbackUser);
    const rollbackInvoice = sessions.at(-1).merchantReferenceId;
    await assert.rejects(geidea.verifyOrder(remoteOrder(rollbackInvoice, 13)));
    assert.equal((await database.manager.findOneByOrFail(Subscription, { id: rollbackSub.id })).status, 'معلق');
    assert.deepEqual((await database.manager.findOneByOrFail(User, { id: rollbackUser.id })).departments, []);
    assert.equal((await database.manager.findOneByOrFail(Invoice, { id: rollbackInvoice })).status, 'unpaid'); checks++;
    console.log(JSON.stringify({ result: 'POSTGRES_BILLING_CHECKS_PASSED', checks, realPaymentsSubmitted: 0, productionRowsChanged: 0 }));
  } finally {
    global.fetch = originalFetch;
    if (database?.isInitialized) await database.destroy();
    await control.query('DROP SCHEMA IF EXISTS "' + schema + '" CASCADE');
    await control.end();
  }
}
run().catch(error => { console.error('ISOLATED_CHECK_FAILED', error.name, String(error.message).slice(0, 300)); process.exitCode = 1; });
