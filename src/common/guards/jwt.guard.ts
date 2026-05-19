import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const req = context.switchToHttp().getRequest();
    req.__isPublicRoute = isPublic;

    if (isPublic) {
      const hasBearerToken =
        typeof req.headers?.authorization === 'string' &&
        req.headers.authorization.startsWith('Bearer ');

      if (!hasBearerToken) {
        return true;
      }
    }

    return super.canActivate(context);
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
