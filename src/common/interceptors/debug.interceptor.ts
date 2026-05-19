import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class DebugInterceptor implements NestInterceptor {
  private readonly logger = new Logger('DebugInterceptor');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(`${method} ${url} ${Date.now() - now}ms - SUCCESS`);
      }),
      catchError((err) => {
        this.logger.error(
          `${method} ${url} ${Date.now() - now}ms - ERROR: ${err.message} (${err.status || 500})`,
        );
        return throwError(() => err);
      }),
    );
  }
}
