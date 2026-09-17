import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, createPublicKey, createVerify, randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../user/user.service';
import { NafathTransaction } from './nafath-transaction.entity';

interface NafathConfig {
  baseUrl: string;
  appId: string;
  appKey: string;
  audience: string;
  callbackSecret: string;
  service?: string;
  clientIp?: string;
  issuer?: string;
}

@Injectable()
export class NafathService {
  constructor(
    @InjectRepository(NafathTransaction)
    private readonly transactionRepository: Repository<NafathTransaction>,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async startAuthentication(nationalId: string, endUserIp: string, locale: 'ar' | 'en') {
    const config = this.configService.get<NafathConfig>('nafath')!;
    const requestId = randomUUID();
    const clientSecret = randomUUID();
    const url = new URL(`${config.baseUrl.replace(/\/$/, '')}/api/v1/mfa/request`);
    url.searchParams.set('local', locale);
    url.searchParams.set('requestId', requestId);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'APP-ID': config.appId,
        'APP-KEY': config.appKey,
        app_id: config.appId,
        app_key: config.appKey,
        'X-Forwarded-For': `${endUserIp},${config.clientIp || '127.0.0.1'}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nationalId, service: config.service || 'Login' }),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException('Nafath is unavailable. Please try again later.');
    }

    const data = await response.json() as { transId: string; random: string };
    const transaction = this.transactionRepository.create({
      requestId,
      clientSecretHash: this.hash(clientSecret),
      nationalId,
      transId: data.transId,
      random: data.random,
      status: 'WAITING',
      expiresAt: new Date(Date.now() + 200_000),
    });
    await this.transactionRepository.save(transaction);

    return {
      requestId,
      clientSecret,
      transId: data.transId,
      random: data.random,
      expiresAt: transaction.expiresAt,
    };
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  async getAuthenticationStatus(requestId: string, clientSecret: string) {
    const transaction = await this.transactionRepository.findOne({ where: { requestId } });
    if (!transaction || transaction.clientSecretHash !== this.hash(clientSecret)) {
      throw new UnauthorizedException('Invalid Nafath transaction');
    }
    if (transaction.status !== 'COMPLETED' || !transaction.userId) {
      return { status: transaction.status };
    }
    const user = await this.userService.findOne(transaction.userId);
    if (!user) throw new UnauthorizedException('Nafath user is unavailable');
    const payload = { sub: user.id, email: user.email, role: user.role, departments: user.departments, departmentPermissions: user.departmentPermissions };
    return {
      status: transaction.status,
      token: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload),
      user,
    };
  }

  async handleCallback(callback: { token: string; requestId: string; transId: string }) {
    const transaction = await this.transactionRepository.findOne({ where: { requestId: callback.requestId } });
    if (!transaction || transaction.transId !== callback.transId) {
      throw new UnauthorizedException('Unknown Nafath transaction');
    }
    const claims = await this.verifyCallbackToken(callback.token);
    if (claims.transId !== transaction.transId || claims.requestId && claims.requestId !== transaction.requestId) {
      throw new UnauthorizedException('Nafath callback correlation failed');
    }
    transaction.status = claims.status;
    if (claims.status === 'COMPLETED') {
      const nationalId = claims.nin || claims.nationalId || claims.iqamaNumber;
      if (nationalId !== transaction.nationalId) throw new UnauthorizedException('Nafath identity mismatch');
      const user = await this.userService.findOrCreateNafathUser({
        nationalId,
        firstName: claims.firstName || claims.englishFirstName,
        lastName: claims.familyName || claims.lastName || claims.englishLastName,
      });
      transaction.userId = user.id;
    }
    await this.transactionRepository.save(transaction);
  }

  private async verifyCallbackToken(token: string): Promise<any> {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
    if (!encodedHeader || !encodedPayload || !encodedSignature) throw new UnauthorizedException('Malformed Nafath token');
    const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8'));
    const claims = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    const config = this.configService.get<NafathConfig>('nafath')!;
    if (header.alg !== 'RS256' || !header.kid || claims.exp <= Math.floor(Date.now() / 1000) || claims.iss !== config.issuer || claims.aud !== config.audience) {
      throw new UnauthorizedException('Invalid Nafath token claims');
    }
    const jwkResponse = await fetch(`${config.baseUrl.replace(/\/$/, '')}/api/v1/mfa/jwk`, {
      headers: {
        'APP-ID': config.appId,
        'APP-KEY': config.appKey,
        app_id: config.appId,
        app_key: config.appKey,
        'Content-Type': 'application/json',
      },
    });
    if (!jwkResponse.ok) throw new ServiceUnavailableException('Unable to retrieve Nafath signing key');
    const jwks = await jwkResponse.json() as { keys: Array<{ kid?: string; kty?: string; [key: string]: string | undefined }> };
    const jwk = jwks.keys.find((key) => key.kid === header.kid && key.kty === 'RSA');
    if (!jwk) throw new UnauthorizedException('Unknown Nafath signing key');
    const verifier = createVerify('RSA-SHA256');
    verifier.update(`${encodedHeader}.${encodedPayload}`);
    verifier.end();
    if (!verifier.verify(createPublicKey({ key: jwk as any, format: 'jwk' }), Buffer.from(encodedSignature, 'base64url'))) {
      throw new UnauthorizedException('Invalid Nafath token signature');
    }
    return claims;
  }
}
