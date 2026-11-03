import { ConflictException, Injectable, Logger, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, createPublicKey, createVerify, randomUUID } from 'crypto';
import type { JsonWebKey } from 'crypto';
import { Repository } from 'typeorm';
import { User } from '../../user/user-entity';
import { NafathTransaction } from './nafath-transaction.entity';

interface NafathConfig {
  baseUrl: string;
  appId: string;
  appKey: string;
  audience: string;
  issuer: string;
  clientIp: string;
  jwkPath: string;
  returnUrl: string;
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

interface IdentityClaims {
  sub: string;
  userid?: string;
  iss: string;
  aud: string | string[];
  exp: number;
  nbf?: number;
  iat?: number;
}

@Injectable()
export class NafathService {
  private readonly logger = new Logger(NafathService.name);

  constructor(
    @InjectRepository(NafathTransaction)
    private readonly transactionRepository: Repository<NafathTransaction>,
    private readonly configService: ConfigService,
  ) {}

  availability(): { configured: boolean } {
    try {
      this.config();
      this.getReturnUrl();
      return { configured: true };
    } catch {
      return { configured: false };
    }
  }

  private config(): NafathConfig {
    const config = this.configService.get<NafathConfig>('nafath');
    if (!config?.baseUrl || !config.appId || !config.appKey || !config.audience || !config.issuer || !config.clientIp) {
      throw new ServiceUnavailableException('Nafath verification is not configured. Please contact support.');
    }
    try {
      if (new URL(config.baseUrl).protocol !== 'https:') throw new Error();
    } catch {
      throw new ServiceUnavailableException('Invalid Nafath server configuration');
    }
    return config;
  }

  private async providerRequest(path: string, endUserIp: string, body?: object): Promise<Record<string, unknown>> {
    const config = this.config();
    try {
      const response = await fetch(`${config.baseUrl.replace(/\/+$/, '')}${path}`, {
        method: body ? 'POST' : 'GET',
        headers: {
          'APP-ID': config.appId,
          'APP-KEY': config.appKey,
          // Rabet's live portal also requires the gateway header names.
          app_id: config.appId,
          app_key: config.appKey,
          'X-Forwarded-For': `${endUserIp},${config.clientIp}`,
          'Content-Type': 'application/json',
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(10_000),
        redirect: 'error',
      });
      if (!response.ok) {
        // Never log credentials, provider response bodies, state or identity claims.
        this.logger.warn(`Nafath ${path.split('?')[0]} returned HTTP ${response.status}`);
        throw new Error('Provider rejected request');
      }
      const data: unknown = await response.json();
      if (!isRecord(data)) throw new Error('Invalid provider response');
      return data;
    } catch {
      throw new ServiceUnavailableException('Nafath is unavailable. Please try again later.');
    }
  }

  async startAuthentication(userId: string, endUserIp: string, locale: 'ar' | 'en') {
    this.getReturnUrl();
    const requestId = randomUUID();
    const clientSecret = randomUUID();
    const query = new URLSearchParams({ locale, requestId });
    const data = await this.providerRequest(`/api/v2/oidc/session?${query}`, endUserIp);
    const { url, id, hashedState, requestId: returnedRequestId } = data;
    const validId = (typeof id === 'string' && id.length > 0) || (typeof id === 'number' && Number.isSafeInteger(id) && id >= 0);
    if (typeof url !== 'string' || !validId || typeof hashedState !== 'string' || !hashedState || returnedRequestId !== requestId) {
      throw new ServiceUnavailableException('Invalid Nafath session response');
    }
    let redirectUrl: URL;
    try {
      redirectUrl = new URL(url);
      if (redirectUrl.protocol !== 'https:' || redirectUrl.username || redirectUrl.password) throw new Error();
    } catch {
      throw new ServiceUnavailableException('Invalid Nafath session response');
    }
    const transaction = this.transactionRepository.create({
      requestId, clientSecretHash: this.hash(clientSecret), userId,
      hashedState, endUserIp,
      // Retain the legacy MFA columns until a separate cleanup migration.
      transId: String(id), random: '', nationalId: '',
      status: 'WAITING', expiresAt: new Date(Date.now() + 5 * 60_000),
    });
    await this.transactionRepository.save(transaction);
    return { requestId, clientSecret, url: redirectUrl.toString(), expiresAt: transaction.expiresAt };
  }

  getReturnUrl(): string {
    try {
      const url = new URL(this.configService.get<NafathConfig>('nafath')!.returnUrl);
      if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/profile') throw new Error();
      return url.toString();
    } catch {
      throw new ServiceUnavailableException('Nafath profile return URL is not configured');
    }
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  async getAuthenticationStatus(requestId: string, clientSecret: string, userId: string) {
    // Use the same row lock as callback processing: a status check near expiry
    // must wait for an in-flight verification instead of overwriting its result.
    return this.transactionRepository.manager.transaction(async manager => {
      const transactions = manager.getRepository(NafathTransaction);
      const transaction = await transactions.findOne({ where: { requestId }, lock: { mode: 'pessimistic_write' } });
      if (!transaction || transaction.userId !== userId || !transaction.hashedState || transaction.clientSecretHash !== this.hash(clientSecret)) {
        throw new UnauthorizedException('Invalid Nafath transaction');
      }
      if (transaction.status === 'WAITING' && (!transaction.expiresAt || transaction.expiresAt.getTime() <= Date.now())) {
        transaction.status = 'EXPIRED';
        await transactions.save(transaction);
      }
      return { status: transaction.status };
    });
  }

  async completeAuthentication(requestId: string, clientSecret: string, userId: string, state: string) {
    await this.getAuthenticationStatus(requestId, clientSecret, userId);
    await this.handleCallback({ state }, requestId);
    return this.getAuthenticationStatus(requestId, clientSecret, userId);
  }

  async handleCallback(callback: { state: string }, expectedRequestId?: string) {
    if (!callback.state || callback.state.length > 4096) throw new UnauthorizedException('Invalid Nafath state');
    const hashes = ['base64', 'hex', 'base64url'].map(encoding =>
      createHash('sha256').update(callback.state).digest(encoding as 'base64' | 'hex' | 'base64url'));
    // Lock serializes duplicate callbacks so a single-use state is exchanged only once.
    await this.transactionRepository.manager.transaction(async manager => {
      const transactions = manager.getRepository(NafathTransaction);
      const transaction = await transactions.findOne({
        where: hashes.map(hashedState => ({ hashedState })),
        lock: { mode: 'pessimistic_write' },
      });
      if (!transaction || !transaction.hashedState || !hashes.includes(transaction.hashedState) || !transaction.userId ||
        (expectedRequestId && transaction.requestId !== expectedRequestId)) {
        throw new UnauthorizedException('Unknown Nafath transaction');
      }
      if (transaction.status === 'COMPLETED') return;
      if (transaction.status !== 'WAITING' || !transaction.expiresAt || transaction.expiresAt.getTime() <= Date.now()) {
        throw new UnauthorizedException('Nafath transaction expired. Start verification again.');
      }
      const users = manager.getRepository(User);
      const user = await users.findOne({ where: { id: transaction.userId }, lock: { mode: 'pessimistic_write' } });
      if (!user || !user.isActive) throw new UnauthorizedException('Account is unavailable');
      const result = await this.providerRequest('/api/v2/oidc/jwt', transaction.endUserIp || '', { state: callback.state });
      if (result.state !== callback.state || typeof result.token !== 'string') {
        throw new UnauthorizedException('Invalid Nafath state exchange');
      }
      const claims = await this.verifyToken(result.token, transaction.endUserIp || '');
      const nationalId = claims.sub;
      const existing = await users.findOne({ where: { nationalId } });
      if (existing && existing.id !== user.id) throw new ConflictException('This identity is already linked to another account');
      if (user.nafathVerifiedAt && user.nationalId !== nationalId) {
        throw new ConflictException('The verified identity on this account cannot be changed');
      }
      user.nationalId = nationalId;
      user.isVerified = true;
      user.nafathVerifiedAt = new Date();
      try {
        await users.save(user);
      } catch (error) {
        // The unique index also covers concurrent callbacks on different accounts.
        if ((error as { code?: string }).code === '23505') throw new ConflictException('This identity is already linked to another account');
        throw error;
      }
      transaction.nationalId = nationalId;
      transaction.status = 'COMPLETED';
      await transactions.save(transaction);
    });
  }

  private async verifyToken(token: string, endUserIp: string): Promise<IdentityClaims> {
    let header: { alg: string; kid: string };
    let claims: IdentityClaims;
    const parts = token.split('.');
    try {
      if (parts.length !== 3 || parts.some(part => !part || !/^[\w-]+$/.test(part))) throw new Error();
      header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8')) as typeof header;
      claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as IdentityClaims;
    } catch {
      throw new UnauthorizedException('Malformed Nafath token');
    }
    const config = this.config();
    const now = Math.floor(Date.now() / 1000);
    if (!header || !claims || header.alg !== 'RS256' || !header.kid ||
      typeof claims.exp !== 'number' || !Number.isFinite(claims.exp) || claims.exp <= now ||
      (claims.nbf !== undefined && (typeof claims.nbf !== 'number' || !Number.isFinite(claims.nbf) || claims.nbf > now)) ||
      (claims.iat !== undefined && (typeof claims.iat !== 'number' || !Number.isFinite(claims.iat) || claims.iat > now)) ||
      claims.iss !== config.issuer || !(Array.isArray(claims.aud) ? claims.aud.includes(config.audience) : claims.aud === config.audience) ||
      typeof claims.sub !== 'string' || !/^\d{10}$/.test(claims.sub) ||
      (claims.userid !== undefined && claims.userid !== claims.sub)) {
      throw new UnauthorizedException('Invalid Nafath token claims');
    }
    const jwks = await this.providerRequest(config.jwkPath || '/api/v2/oidc/jwk', endUserIp);
    const keys = Array.isArray(jwks.keys) ? jwks.keys as unknown[] : [];
    const jwk = keys.find((key): key is JsonWebKey => isRecord(key) &&
      key.kid === header.kid && key.kty === 'RSA' && typeof key.n === 'string' && typeof key.e === 'string' &&
      (!key.use || key.use === 'sig') && (!key.alg || key.alg === 'RS256'));
    if (!jwk) throw new UnauthorizedException('Unknown Nafath signing key');
    try {
      const verifier = createVerify('RSA-SHA256');
      verifier.update(`${parts[0]}.${parts[1]}`);
      verifier.end();
      if (!verifier.verify(createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(parts[2], 'base64url'))) throw new Error();
    } catch {
      throw new UnauthorizedException('Invalid Nafath token signature');
    }
    return claims;
  }
}
