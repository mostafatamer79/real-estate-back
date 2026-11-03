import { ConfigService } from '@nestjs/config';
import { PaylinkService } from './paylink.service';
import { User } from '../user/user-entity';
const id = '3b834bd0-dc9d-4e58-9936-67d845b6015e';
const owner = { id: 'fixture-owner' } as User;
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
function service(returnUrl = 'https://www.digitalbrokerage.sa/wallet') {
  return new PaylinkService(new ConfigService({ GEIDEA_ENABLED: 'true', GEIDEA_RETURN_URL: returnUrl }),
    { findOne: async () => ({ id, price: 15, status: 'accepted' }) } as never,
    { findInvoiceById: async () => ({ id, total: 15, status: 'unpaid' }) } as never,
    {} as never, { findOne: async () => null } as never);
}
describe('older checkout clients', () => {
  it.each(['invoiceId', 'bookingId', 'subscriptionId'])('hands %s to fresh Geidea checkout without contacting Paylink', async target => {
    let networkCalls = 0;
    global.fetch = (async () => { networkCalls++; throw new Error('Unexpected Paylink request'); }) as typeof fetch;
    const result = await service().createInvoice({ [target]: id }, owner);
    expect(result.paymentUrl).toBe(`https://www.digitalbrokerage.sa/checkout?${target}=${id}`);
    expect(networkCalls).toBe(0);
  });
  it.each([{}, { invoiceId: 'invalid' }, { invoiceId: id, bookingId: id }])('rejects malformed or ambiguous handoffs: %j', async target => {
    await expect(service().createInvoice(target, owner)).rejects.toThrow();
  });
  it('requires a signed-in caller before handing off', async () => {
    await expect(service().createInvoice({ invoiceId: id }, undefined as never)).rejects.toThrow();
  });
  it('rejects an insecure configured return URL', async () => {
    await expect(service('http://example.test/wallet').createInvoice({ invoiceId: id }, owner)).rejects.toThrow();
  });
});
