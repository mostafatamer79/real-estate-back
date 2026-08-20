import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SettingsService } from '../../settings/settings.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Cache the free-trial flag for 30 s to avoid a DB hit on every request
  private freeTrialCache: { value: boolean; expiresAt: number } | null = null;
  private readonly CACHE_TTL_MS = 30_000;

  constructor(
    private reflector: Reflector,
    private settingsService: SettingsService,
  ) {
    super();
  }

  private async getGlobalFreeTrial(): Promise<boolean> {
    const now = Date.now();
    if (this.freeTrialCache && now < this.freeTrialCache.expiresAt) {
      return this.freeTrialCache.value;
    }
    const setting = await this.settingsService.findOne('ui_enable_global_free_trial');
    const value = setting?.value === 'true';
    this.freeTrialCache = { value, expiresAt: now + this.CACHE_TTL_MS };
    return value;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const req = context.switchToHttp().getRequest();

    // When global free trial is active every route behaves like @Public()
    const isGlobalFreeTrial = await this.getGlobalFreeTrial();

    req.__isPublicRoute = isPublic || isGlobalFreeTrial;

    if (isPublic || isGlobalFreeTrial) {
      const hasBearerToken =
        typeof req.headers?.authorization === 'string' &&
        req.headers.authorization.startsWith('Bearer ');

      if (!hasBearerToken) {
        return true;
      }
    }

    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest(err: any, user: any, _info: unknown, context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    if (req?.__isPublicRoute) {
      return err ? null : user ?? null;
    }

    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
