import { metadataRecord } from "./provider-metadata";
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { map } from "rxjs/operators";
import { Role } from "../user/user-entity";

export function redactProviderDetails(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactProviderDetails);
  if (!value || typeof value !== "object" || value instanceof Date)
    return value;
  const result: Record<string, unknown> = { ...metadataRecord(value) };
  if (Array.isArray(result.items))
    result.items = result.items.map(redactProviderDetails);
  if (metadataRecord(result.metadata).providerOffers) {
    result.metadata = {
      ...metadataRecord(result.metadata),
      providerOffers: Object.fromEntries(
        Object.entries(
          metadataRecord(metadataRecord(result.metadata).providerOffers),
        ).map(([id, raw]) => {
          const offer = metadataRecord(raw);
          return [
            id,
            {
              providerId: offer.providerId,
              amount: offer.amount,
              deliveryMode: offer.deliveryMode,
              createdAt: offer.createdAt,
            },
          ];
        }),
      ),
    };
  }
  return result;
}
@Injectable()
export class ProviderPrivacyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const admin =
      context.switchToHttp().getRequest<{ user?: { role: Role } }>().user
        ?.role === Role.ADMIN;
    return next
      .handle()
      .pipe(
        map((value: unknown) => (admin ? value : redactProviderDetails(value))),
      );
  }
}
