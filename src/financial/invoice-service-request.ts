import { BadRequestException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { ServiceRequest } from '../service/service-request.entity';

export async function invoiceServiceRequest(manager: EntityManager, invoice: Invoice, lock = true): Promise<ServiceRequest | null> {
  if (invoice.referenceType !== 'ServiceRequest') return null;
  if (!invoice.referenceId) throw new BadRequestException('Invalid service request reference');
  const request = await manager.findOne(ServiceRequest, {
    where: { id: invoice.referenceId }, ...(lock ? { lock: { mode: 'pessimistic_write' as const } } : {}),
  });
  const price = Number(request?.invoicePrice ?? request?.price);
  if (!request || request.userId !== invoice.userId || !Number.isFinite(price) || price < 0
    || Math.round(Number(invoice.total) * 100) < Math.round(price * 100)) {
    throw new BadRequestException('Invoice does not match its service request');
  }
  return request;
}
