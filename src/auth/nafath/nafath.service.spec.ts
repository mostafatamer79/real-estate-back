import { createHash, generateKeyPairSync, sign } from 'crypto';
import { NafathService } from './nafath.service';
import { NafathTransaction } from './nafath-transaction.entity';
import { User } from '../../user/user-entity';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'elm-test', alg: 'RS256', use: 'sig' };
const state = 'provider-state+with/base64=';
const hashedState = createHash('sha256').update(state).digest('base64');
const settings = {
  baseUrl: 'https://nafath.example.test/nafath-sandbox', appId: 'app', appKey: 'key',
  audience: 'https://site.example.test', issuer: 'https://www.iam.gov.sa/userauth',
  clientIp: '203.0.113.1', jwkPath: '/api/v2/oidc/jwk', returnUrl: 'https://site.example.test/profile',
};
function token(overrides = {}, key = privateKey) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'elm-test' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: '1000000000', userid: '1000000000', iss: settings.issuer, aud: settings.audience,
    exp: Math.floor(Date.now() / 1000) + 120, nbf: Math.floor(Date.now() / 1000) - 1,
    ...overrides,
  })).toString('base64url');
  return `${header}.${payload}.${sign('RSA-SHA256', Buffer.from(`${header}.${payload}`), key).toString('base64url')}`;
}
function setup() {
  const user: any = { id: 'owner', isActive: true, nationalId: null, nafathVerifiedAt: null };
  const tx: any = { requestId: 'request', userId: 'owner', hashedState, endUserIp: '198.51.100.10',
    clientSecretHash: createHash('sha256').update('secret').digest('hex'), status: 'WAITING', expiresAt: new Date(Date.now() + 60000) };
  const transactions = { create: jest.fn(v => v), save: jest.fn(async v => v), findOne: jest.fn(async () => tx) };
  const users = { findOne: jest.fn(async ({ where }) => where.id ? user : null), save: jest.fn(async v => v) };
  const manager: any = { getRepository: jest.fn(entity => entity === NafathTransaction ? transactions : users) };
  const repository: any = { ...transactions, manager: { transaction: jest.fn(async fn => fn(manager)) } };
  const config = { get: jest.fn(() => settings) };
  const fetchMock = jest.fn(async (url: any) => ({ ok: true, status: 200, json: async () =>
    String(url).includes('/session') ? { id: 'session', requestId: new URL(url).searchParams.get('requestId'), url: 'https://iam.example.test/auth', hashedState }
      : String(url).includes('/jwk') ? { keys: [jwk] } : { state, token: token() } }));
  global.fetch = fetchMock as any;
  // Extra legacy dependencies allow these regression tests to run against the old constructor.
  const service = new (NafathService as any)(repository, config, {}, {});
  return { service, tx, user, repository, transactions, users, fetchMock, config };
}
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

describe('Nafath OIDC profile verification', () => {
  it('reports missing audience as unavailable without contacting the provider', () => {
    const { service, config, fetchMock } = setup();
    config.get.mockReturnValue({ ...settings, audience: '' });
    expect(service.availability()).toEqual({ configured: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('checks the return URL before reporting configuration ready', () => {
    const { service, config } = setup();
    config.get.mockReturnValue({ ...settings, returnUrl: '' });
    expect(service.availability()).toEqual({ configured: false });
  });
  it('reports complete local configuration without claiming identity completion', () => {
    const { service, fetchMock } = setup();
    expect(service.availability()).toEqual({ configured: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('creates an authenticated OIDC session with locale and mandatory headers', async () => {
    const { service, repository, fetchMock } = setup();
    const result = await service.startAuthentication('owner', '198.51.100.10', 'en');
    expect(String(fetchMock.mock.calls[0][0])).toContain('/nafath-sandbox/api/v2/oidc/session?locale=en&requestId=');
    expect((fetchMock.mock.calls[0] as any)[1]).toMatchObject({ method: 'GET', headers: {
      'APP-ID': 'app', 'APP-KEY': 'key', app_id: 'app', app_key: 'key', 'X-Forwarded-For': '198.51.100.10,203.0.113.1',
    } });
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ userId: 'owner', hashedState, status: 'WAITING' }));
    expect(result.url).toBe('https://iam.example.test/auth');
    expect(result.token).toBeUndefined();
  });
  it('accepts the integer session ID documented by the live Rabet portal', async () => {
    const { service, repository, fetchMock } = setup();
    fetchMock.mockImplementation(async (url: any) => ({ ok: true, status: 200, json: async () => ({
      id: 42, requestId: new URL(url).searchParams.get('requestId'), url: 'https://iam.example.test/auth', hashedState,
    }) }));
    const result = await service.startAuthentication('owner', '198.51.100.10', 'ar');
    expect(result.url).toBe('https://iam.example.test/auth');
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ transId: '42' }));
  });
  it('does not create a session when provider configuration is incomplete', async () => {
    const { service, config, fetchMock } = setup();
    config.get.mockReturnValue({ ...settings, appKey: '' });
    await expect(service.startAuthentication('owner', '198.51.100.10', 'ar')).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('exchanges state and verifies RS256 JWT before verifying the existing owner', async () => {
    const { service, tx, user, users, fetchMock } = setup();
    await service.handleCallback({ state });
    expect(fetchMock.mock.calls.map(c => String(c[0]))).toEqual([
      `${settings.baseUrl}/api/v2/oidc/jwt`, `${settings.baseUrl}/api/v2/oidc/jwk`,
    ]);
    expect((fetchMock.mock.calls[0] as any)[1]).toMatchObject({ method: 'POST', body: JSON.stringify({ state }) });
    expect(user).toMatchObject({ id: 'owner', nationalId: '1000000000', isVerified: true, nafathVerifiedAt: expect.any(Date) });
    expect(users.save).toHaveBeenCalledWith(user);
    expect(tx.status).toBe('COMPLETED');
  });
  it('rejects an unrelated state before exchanging it', async () => {
    const { service, fetchMock } = setup();
    await expect(service.handleCallback({ state: 'attacker-state' })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each(['expired', 'wrong issuer', 'wrong audience', 'missing expiry', 'future token', 'invalid signature', 'identity mismatch'])(
    'does not verify an account for %s', async problem => {
      const { service, user, fetchMock } = setup();
      const overrides = problem === 'expired' ? { exp: 1 } : problem === 'wrong issuer' ? { iss: 'attacker' }
        : problem === 'wrong audience' ? { aud: 'attacker' } : problem === 'missing expiry' ? { exp: undefined }
          : problem === 'future token' ? { nbf: Math.floor(Date.now()/1000) + 500 } : problem === 'identity mismatch' ? { userid: '2000000000' } : {};
      const signed = problem === 'invalid signature' ? token({}, generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey) : token(overrides);
      fetchMock.mockImplementation(async (url: any) => ({ ok: true, status: 200, json: async () => String(url).includes('/jwk') ? { keys: [jwk] } : { state, token: signed } }));
      await expect(service.handleCallback({ state })).rejects.toThrow();
      expect(user.nafathVerifiedAt).toBeNull();
    },
  );
  it('rejects an expired transaction before consuming the provider state', async () => {
    const { service, tx, fetchMock } = setup(); tx.expiresAt = new Date(0);
    await expect(service.handleCallback({ state })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('acknowledges duplicate callbacks without consuming state twice', async () => {
    const { service, tx, fetchMock } = setup(); tx.status = 'COMPLETED';
    await service.handleCallback({ state });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('does not assign an identity already bound to another account', async () => {
    const { service, users, user } = setup();
    users.findOne.mockImplementation(async ({ where }) => where.id ? user : { id: 'other' } as any);
    await expect(service.handleCallback({ state })).rejects.toThrow();
    expect(user.nafathVerifiedAt).toBeNull();
  });
  it('rejects polling by another signed-in user even with the polling secret', async () => {
    const { service } = setup();
    await expect(service.getAuthenticationStatus('request', 'secret', 'attacker')).rejects.toThrow();
  });
  it('serializes expiry checks with callbacks using the same transaction row lock', async () => {
    const { service, repository, transactions } = setup();
    await service.getAuthenticationStatus('request', 'secret', 'owner');
    expect(repository.manager.transaction).toHaveBeenCalled();
    expect(transactions.findOne).toHaveBeenCalledWith(expect.objectContaining({ lock: { mode: 'pessimistic_write' } }));
  });
  it('returns expiry and verification status without issuing platform tokens', async () => {
    const { service, tx } = setup(); tx.expiresAt = new Date(0);
    expect(await service.getAuthenticationStatus('request', 'secret', 'owner')).toEqual({ status: 'EXPIRED' });
    tx.status = 'COMPLETED';
    const result = await service.getAuthenticationStatus('request', 'secret', 'owner');
    expect(result).toEqual({ status: 'COMPLETED' });
  });
});
