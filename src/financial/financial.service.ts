import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In, ObjectLiteral } from 'typeorm';
import { execFile } from 'child_process';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { copyFile, mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'fs/promises';
import { homedir, tmpdir } from 'os';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { promisify } from 'util';
import { FinancialTransaction, TransactionType, TransactionStatus } from './entities/financial-transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { Commission, CommissionStatus } from '../commission/commission.entity';
import { PaymentMethod } from './entities/financial-transaction.entity';
import { User } from '../user/user-entity';
import { Booking, BookingStatus } from '../booking/entities/booking.entity';
import { ServiceRequest, PaidStatus } from '../service/service-request.entity';
import { PlacesService } from '../place/place.service';
import { SettingsService } from '../settings/settings.service';

const execFileAsync = promisify(execFile);

type ScanReportPlace = {
  id?: string;
  name?: string;
  type?: string;
  city?: string;
  latitude: number;
  longitude: number;
  distance?: number;
};

type ScanReportFile = {
  id: string;
  type: 'scan_report_pdf' | 'scan_report_excel';
  name: string;
  locationName?: string;
  url: string;
  date: Date;
  description: string;
};

@Injectable()
export class FinancialService {
  constructor(
    @InjectRepository(FinancialTransaction)
    private transactionRepository: Repository<FinancialTransaction>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Commission)
    private commissionRepository: Repository<Commission>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(ServiceRequest)
    private serviceRequestRepository: Repository<ServiceRequest>,
    private placesService: PlacesService,
    private settingsService: SettingsService,
  ) {}

  private isAdmin(user: any): boolean {
    return user?.role === 'admin';
  }

  private async getScopedUserIds(user: any): Promise<string[]> {
    const userId = user?.userId || user?.id;
    if (!userId) return [];
    if (this.isAdmin(user)) return [];
    const managedUsers = await this.userRepository.find({
      where: { parentId: userId } as any,
      select: ['id'] as any,
    });
    return [userId, ...managedUsers.map((u) => u.id)];
  }

  private async applyTransactionScope<T extends ObjectLiteral>(query: SelectQueryBuilder<T>, alias: string, user: any) {
    if (this.isAdmin(user)) return query;
    const ids = await this.getScopedUserIds(user);
    if (!ids.length) {
      query.andWhere('1 = 0');
      return query;
    }
    query.andWhere(`(${alias}.fromUserId IN (:...scopedIds) OR ${alias}.toUserId IN (:...scopedIds))`, { scopedIds: ids });
    return query;
  }

  private async applyInvoiceScope<T extends ObjectLiteral>(query: SelectQueryBuilder<T>, alias: string, user: any) {
    if (this.isAdmin(user)) return query;
    const ids = await this.getScopedUserIds(user);
    if (!ids.length) {
      query.andWhere('1 = 0');
      return query;
    }
    query.andWhere(`${alias}.userId IN (:...scopedIds)`, { scopedIds: ids });
    return query;
  }

  private getUploadsRoot() {
    return join(__dirname, '..', '..', 'uploads');
  }

  private getUserScanReportsDir(userId: string) {
    return join(this.getUploadsRoot(), 'scan-reports', userId);
  }

  private getPublicUploadUrl(...parts: string[]) {
    const path = `/uploads/${parts.map((part) => encodeURIComponent(part)).join('/')}`;
    const publicBase = process.env.PUBLIC_UPLOADS_URL || process.env.PUBLIC_BASE_URL || process.env.API_PUBLIC_URL;
    if (!publicBase) return path;
    return `${publicBase.replace(/\/+$/, '').replace(/\/api$/, '')}${path}`;
  }

  private sanitizeFilePart(value: string) {
    return value
      .replace(/[\\/:*?"<>|]/g, ' ')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'scan-report';
  }

  private prettifyScanReportLocationFromFile(name: string) {
    const withoutExt = name.replace(/\.(pdf|xls)$/i, '');
    const match = withoutExt.match(/^(.+)-\d{4}-\d{2}-\d{2}T/);
    if (!match) return 'موقع غير محدد';
    return match[1].replace(/-/g, ' ');
  }

  private async resolveReportImageSource(url?: string | null): Promise<string | undefined> {
    if (!url) return undefined;
    if (url.startsWith('data:image/')) return url;

    let cleanUrl = url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      if (url.includes('/uploads/')) {
        const idx = url.indexOf('/uploads/');
        const sub = url.slice(idx); // e.g. "/uploads/logo.png"
        const relative = decodeURIComponent(sub.replace(/^\/uploads\//, ''));
        const filePath = join(this.getUploadsRoot(), relative);
        if (existsSync(filePath)) {
          const data = await readFile(filePath);
          const ext = filePath.toLowerCase().endsWith('.png') ? 'png' : filePath.toLowerCase().endsWith('.webp') ? 'webp' : 'jpeg';
          return `data:image/${ext};base64,${data.toString('base64')}`;
        }
      }

      // Dynamic HTTP fetch fallback
      try {
        const res = await fetch(url);
        if (res.ok) {
          const buffer = Buffer.from(await res.arrayBuffer());
          const contentType = res.headers.get('content-type') || 'image/jpeg';
          return `data:${contentType};base64,${buffer.toString('base64')}`;
        }
      } catch (err) {
        console.error(`Failed to fetch report image from URL ${url}:`, err);
      }
      return url;
    }

    if (url.startsWith('/uploads/')) {
      const relative = decodeURIComponent(url.replace(/^\/uploads\//, ''));
      const filePath = join(this.getUploadsRoot(), relative);
      if (!existsSync(filePath)) return undefined;
      const data = await readFile(filePath);
      const ext = filePath.toLowerCase().endsWith('.png') ? 'png' : filePath.toLowerCase().endsWith('.webp') ? 'webp' : 'jpeg';
      return `data:image/${ext};base64,${data.toString('base64')}`;
    }

    return undefined;
  }

  private async resolveSeederReportImage(fileName: string): Promise<string | undefined> {
    const candidates = [
      join(process.cwd(), 'src', 'seeders', fileName),
      join(process.cwd(), 'dist', 'seeders', fileName),
      join(__dirname, '..', 'seeders', fileName),
      join(__dirname, '..', '..', 'src', 'seeders', fileName),
    ];

    for (const filePath of candidates) {
      if (!existsSync(filePath)) continue;
      const data = await readFile(filePath);
      const lower = filePath.toLowerCase();
      const ext = lower.endsWith('.png') ? 'png' : lower.endsWith('.webp') ? 'webp' : 'jpeg';
      return `data:image/${ext};base64,${data.toString('base64')}`;
    }

    return undefined;
  }

  private escapeHtml(value: unknown) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const radius = 6371000;
    const toRad = (value: number) => (value * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return radius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  private formatReportDate(date = new Date()) {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private buildExcelReportHtml(params: {
    latitude: number;
    longitude: number;
    radius: number;
    places: ScanReportPlace[];
    generatedAt: Date;
  }) {
    const rows = params.places.map((place, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${this.escapeHtml(place.name || 'غير محدد')}</td>
        <td>${this.escapeHtml(place.type || 'غير محدد')}</td>
        <td>${Math.round(place.distance || 0)}</td>
        <td>${Number(place.latitude).toFixed(6)}</td>
        <td>${Number(place.longitude).toFixed(6)}</td>
        <td>${this.escapeHtml(place.city || '')}</td>
      </tr>
    `).join('');

    return `<!doctype html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, Tahoma, sans-serif; direction: rtl; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: right; }
            th { background: #0f172a; color: #fff; }
            .meta td { background: #f8fafc; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>تقرير مسح المنطقة</h1>
          <table class="meta">
            <tr><td>تاريخ الإصدار</td><td>${this.escapeHtml(this.formatReportDate(params.generatedAt))}</td></tr>
            <tr><td>الإحداثيات</td><td>${params.latitude.toFixed(6)}, ${params.longitude.toFixed(6)}</td></tr>
            <tr><td>نطاق البحث</td><td>${params.radius.toLocaleString()} متر</td></tr>
            <tr><td>عدد المواقع</td><td>${params.places.length}</td></tr>
          </table>
          <br />
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>الاسم</th>
                <th>النوع</th>
                <th>المسافة بالمتر</th>
                <th>خط العرض</th>
                <th>خط الطول</th>
                <th>المدينة</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>`;
  }

  private buildPdfReportHtml(params: {
    latitude: number;
    longitude: number;
    radius: number;
    places: ScanReportPlace[];
    generatedAt: Date;
    mapImage?: string;
    coverImage?: string;
    startImage?: string;
    endImage?: string;
    logoBlackImage?: string;
    logoWhiteImage?: string;
    locationName: string;
  }) {
    const total = params.places.length;
    const typeCounts = params.places.reduce<Record<string, number>>((acc, place) => {
      const type = place.type || 'غير محدد';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    const topTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const nearest = [...params.places].sort((a, b) => (a.distance || 0) - (b.distance || 0));
    const nearest30 = nearest.slice(0, 10);
    const avgDistance = total ? Math.round(nearest.reduce((sum, place) => sum + Number(place.distance || 0), 0) / total) : 0;
    const medianDistance = total ? Math.round(Number(nearest[Math.floor(total / 2)]?.distance || 0)) : 0;
    const farthestDistance = total ? Math.round(Number(nearest[nearest.length - 1]?.distance || 0)) : 0;
    const within500 = nearest.filter((place) => Number(place.distance || 0) <= 500).length;
    const within1000 = nearest.filter((place) => Number(place.distance || 0) <= 1000).length;
    const within2000 = nearest.filter((place) => Number(place.distance || 0) <= 2000).length;
    const outside2000 = Math.max(0, total - within2000);
    const density = params.radius > 0 ? Number((total / (Math.PI * Math.pow(params.radius / 1000, 2))).toFixed(2)) : 0;
    const diversityScore = Math.min(100, Math.round((Object.keys(typeCounts).length / 18) * 100));
    const accessibilityScore = Math.min(100, Math.round((within1000 / Math.max(total, 1)) * 100 + Math.min(total, 50)));
    const serviceScore = Math.min(100, Math.round((diversityScore * 0.35) + (accessibilityScore * 0.45) + Math.min(density * 4, 20)));
    const generatedDate = this.escapeHtml(this.formatReportDate(params.generatedAt));
    const reportCode = `MS-${params.generatedAt.getTime().toString().slice(-8)}`;
    const escapedLocationName = this.escapeHtml(params.locationName);

    const topTypeRows = topTypes.map(([type, count], index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${this.escapeHtml(type)}</td>
        <td>${count}</td>
        <td>${total ? ((count / total) * 100).toFixed(1) : '0.0'}%</td>
      </tr>
    `).join('');
    const nearestRows = nearest30.map((place, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${this.escapeHtml(place.name || 'غير محدد')}</td>
        <td>${this.escapeHtml(place.type || 'غير محدد')}</td>
        <td>${Math.round(place.distance || 0)} م</td>
        <td>${Number(place.latitude).toFixed(5)}, ${Number(place.longitude).toFixed(5)}</td>
      </tr>
    `).join('');
    const appendixRows = nearest.slice(0, 22).map((place, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${this.escapeHtml(place.name || 'غير محدد')}</td>
        <td>${this.escapeHtml(place.type || 'غير محدد')}</td>
        <td>${Math.round(place.distance || 0)}</td>
        <td>${this.escapeHtml(place.city || '')}</td>
      </tr>
    `).join('');

    const barChart = topTypes.map(([type, count], index) => {
      const width = total ? Math.max(12, Math.round((count / Math.max(topTypes[0]?.[1] || 1, 1)) * 380)) : 0;
      const y = 32 + index * 34;
      return `
        <text x="585" y="${y + 15}" font-size="12" fill="#334155" text-anchor="end">${this.escapeHtml(type).slice(0, 38)}</text>
        <rect x="${190 + (380 - width)}" y="${y}" width="${width}" height="18" rx="8" fill="#0f172a"/>
        <text x="175" y="${y + 14}" font-size="12" fill="#0f172a" font-weight="700">${count}</text>
      `;
    }).join('');
    const ringChart = [
      { label: '0-500م', count: within500, color: '#16a34a' },
      { label: '0-1000م', count: within1000, color: '#2563eb' },
      { label: '0-2000م', count: within2000, color: '#f59e0b' },
      { label: 'كامل النطاق', count: total, color: '#0f172a' },
    ].map((bucket, index) => {
      const width = total ? Math.max(6, Math.round((bucket.count / total) * 420)) : 0;
      const y = 44 + index * 54;
      return `
        <text x="560" y="${y + 18}" font-size="14" fill="#334155" text-anchor="end">${bucket.label}</text>
        <rect x="100" y="${y}" width="420" height="22" rx="11" fill="#e2e8f0"/>
        <rect x="${520 - width}" y="${y}" width="${width}" height="22" rx="11" fill="${bucket.color}"/>
        <text x="72" y="${y + 17}" font-size="13" fill="#0f172a" font-weight="800">${bucket.count}</text>
      `;
    }).join('');
    const mapDots = nearest.slice(0, 120).map((place, index) => {
      const latDelta = (Number(place.latitude) - params.latitude) / (params.radius / 111000);
      const lngDelta = (Number(place.longitude) - params.longitude) / (params.radius / 111000);
      const x = Math.max(26, Math.min(574, 300 + lngDelta * 250));
      const y = Math.max(26, Math.min(289, 180 - latDelta * 130));
      const palette = ['#0f172a', '#2563eb', '#16a34a', '#f59e0b', '#dc2626'];
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${index < 20 ? 4 : 2.6}" fill="${palette[index % palette.length]}" opacity=".78"/>`;
    }).join('');
    const mapVisual = params.mapImage
      ? `<img src="${params.mapImage}" alt="Map Snapshot" style="width:100%; height:315px; object-fit:cover; display:block;" />`
      : `<svg width="100%" height="315" viewBox="0 0 640 315" xmlns="http://www.w3.org/2000/svg">
          <rect width="640" height="315" fill="#eef2f7"/>
          <circle cx="300" cy="210" r="70" fill="none" stroke="#cbd5e1" stroke-width="2"/>
          <circle cx="300" cy="210" r="140" fill="none" stroke="#cbd5e1" stroke-width="2"/>
          <circle cx="300" cy="210" r="210" fill="none" stroke="#cbd5e1" stroke-width="2"/>
          <line x1="300" y1="20" x2="300" y2="300" stroke="#dbe3ee" stroke-width="2"/>
          <line x1="40" y1="210" x2="600" y2="210" stroke="#dbe3ee" stroke-width="2"/>
          ${mapDots}
          <circle cx="300" cy="210" r="10" fill="#dc2626"/>
          <text x="300" y="198" font-size="13" fill="#0f172a" text-anchor="middle" font-weight="900">الموقع</text>
          <text x="300" y="300" font-size="12" fill="#64748b" text-anchor="middle">مخطط تمثيلي وليس صورة جوية حقيقية</text>
        </svg>`;
    const localAerialBlocks = nearest.slice(0, 36).map((place, index) => {
      const col = index % 9;
      const row = Math.floor(index / 9);
      const baseX = 76 + col * 54 + row * 18;
      const baseY = 72 + row * 38 + col * 8;
      const distanceFactor = Math.max(0.25, 1 - Math.min(Number(place.distance || 0), params.radius) / Math.max(params.radius, 1));
      const height = Math.round(18 + distanceFactor * 72 + (index < 8 ? 18 : 0));
      const palette = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0f766e'];
      const color = palette[index % palette.length];
      return `
        <g opacity=".92">
          <polygon points="${baseX},${baseY} ${baseX + 24},${baseY - 12} ${baseX + 48},${baseY} ${baseX + 24},${baseY + 14}" fill="#dbeafe"/>
          <polygon points="${baseX},${baseY - height} ${baseX + 24},${baseY - height - 12} ${baseX + 48},${baseY - height} ${baseX + 24},${baseY - height + 14}" fill="${color}"/>
          <polygon points="${baseX},${baseY} ${baseX},${baseY - height} ${baseX + 24},${baseY - height + 14} ${baseX + 24},${baseY + 14}" fill="${color}" opacity=".78"/>
          <polygon points="${baseX + 48},${baseY} ${baseX + 48},${baseY - height} ${baseX + 24},${baseY - height + 14} ${baseX + 24},${baseY + 14}" fill="${color}" opacity=".55"/>
          ${index < 10 ? `<text x="${baseX + 24}" y="${baseY + 31}" font-size="8" fill="#334155" text-anchor="middle">${Math.round(place.distance || 0)}م</text>` : ''}
        </g>
      `;
    }).join('');
    const localAerialRoads = [0, 1, 2, 3, 4].map((row) => `
      <path d="M${36 + row * 34} ${84 + row * 32} L${550 + row * 16} ${170 + row * 32}" stroke="#cbd5e1" stroke-width="10" stroke-linecap="round" opacity=".82"/>
      <path d="M${42 + row * 34} ${84 + row * 32} L${556 + row * 16} ${170 + row * 32}" stroke="#f8fafc" stroke-width="2" stroke-dasharray="10 12" opacity=".9"/>
    `).join('');
    const aerialVisual = `<svg width="100%" height="250" viewBox="0 0 640 250" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="aerialSky" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#e0f2fe"/>
          <stop offset="52%" stop-color="#f8fafc"/>
          <stop offset="100%" stop-color="#dcfce7"/>
        </linearGradient>
      </defs>
      <rect width="640" height="250" fill="url(#aerialSky)"/>
      <polygon points="24,198 300,52 620,178 338,240" fill="#ecfccb" opacity=".72"/>
      <polygon points="74,182 305,72 560,176 330,224" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="2"/>
      ${localAerialRoads}
      ${localAerialBlocks}
      <g>
        <circle cx="312" cy="150" r="18" fill="#ef4444" opacity=".2"/>
        <circle cx="312" cy="150" r="8" fill="#dc2626"/>
        <text x="312" y="135" font-size="12" fill="#0f172a" text-anchor="middle" font-weight="900">المركز</text>
      </g>
      <text x="600" y="32" font-size="13" fill="#0f172a" text-anchor="end" font-weight="900">مشهد جوي 3D مولد محلياً</text>
      <text x="600" y="52" font-size="10" fill="#64748b" text-anchor="end">ارتفاع المباني يعكس قرب وكثافة الخدمات المرصودة</text>
    </svg>`;
    const scoreBars = [
      ['درجة الجاذبية الخدمية', serviceScore],
      ['تنوع الخدمات', diversityScore],
      ['سهولة الوصول', accessibilityScore],
      ['كثافة الخدمات', Math.min(100, Math.round(density * 5))],
    ].map(([label, value]: any, index) => {
      const y = 56 + index * 58;
      const width = Math.round((Number(value) / 100) * 390);
      return `
        <text x="560" y="${y + 18}" font-size="14" fill="#334155" text-anchor="end">${label}</text>
        <rect x="120" y="${y}" width="390" height="24" rx="12" fill="#e2e8f0"/>
        <rect x="${510 - width}" y="${y}" width="${width}" height="24" rx="12" fill="#0f172a"/>
        <text x="82" y="${y + 18}" font-size="14" fill="#0f172a" font-weight="900">${value}%</text>
      `;
    }).join('');
    const isoBars = topTypes.slice(0, 8).map(([type, count], index) => {
      const x = 70 + (index % 4) * 125;
      const y = 270 + Math.floor(index / 4) * 110;
      const h = Math.max(28, Math.min(150, Math.round((count / Math.max(topTypes[0]?.[1] || 1, 1)) * 150)));
      const color = ['#0f172a', '#1d4ed8', '#047857', '#b45309', '#be123c', '#6d28d9', '#0f766e', '#334155'][index % 8];
      return `
        <polygon points="${x},${y} ${x + 46},${y - 22} ${x + 92},${y} ${x + 46},${y + 24}" fill="#cbd5e1"/>
        <polygon points="${x},${y - h} ${x + 46},${y - h - 22} ${x + 92},${y - h} ${x + 46},${y - h + 24}" fill="${color}"/>
        <polygon points="${x},${y} ${x},${y - h} ${x + 46},${y - h + 24} ${x + 46},${y + 24}" fill="${color}" opacity=".78"/>
        <polygon points="${x + 92},${y} ${x + 92},${y - h} ${x + 46},${y - h + 24} ${x + 46},${y + 24}" fill="${color}" opacity=".55"/>
        <text x="${x + 46}" y="${y + 48}" font-size="10" fill="#334155" text-anchor="middle">${this.escapeHtml(type).slice(0, 18)}</text>
        <text x="${x + 46}" y="${y - h - 30}" font-size="13" fill="#0f172a" text-anchor="middle" font-weight="900">${count}</text>
      `;
    }).join('');
    const matchesKeywords = (place: ScanReportPlace, keywords: string[]) => {
      const text = `${place.type || ''} ${place.name || ''}`.toLowerCase();
      return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
    };
    const serviceGroups = [
      { label: 'تعليم', keywords: ['school', 'university', 'college', 'education', 'مدرس', 'جامعة', 'كلية', 'تعليم'], ideal: 5, note: 'يرفع ملاءمة السكن العائلي وطول مدة الإشغال.' },
      { label: 'صحة', keywords: ['hospital', 'clinic', 'pharmacy', 'medical', 'health', 'مستشفى', 'عيادة', 'صيدلية', 'طبي', 'صحة'], ideal: 4, note: 'مهم للطلب السكني اليومي وتقليل مخاطر الموقع.' },
      { label: 'تجزئة وخدمات يومية', keywords: ['mall', 'market', 'store', 'supermarket', 'shop', 'retail', 'مول', 'سوق', 'متجر', 'سوبر', 'تجزئة'], ideal: 7, note: 'يدعم الحركة اليومية وقابلية التأجير التجاري.' },
      { label: 'مطاعم وضيافة', keywords: ['restaurant', 'cafe', 'coffee', 'food', 'hotel', 'مطعم', 'كافيه', 'قهوة', 'فندق'], ideal: 6, note: 'يرفع حيوية الموقع ومؤشر الزيارات المتكررة.' },
      { label: 'نقل ووصول', keywords: ['metro', 'station', 'bus', 'parking', 'transport', 'محطة', 'مترو', 'مواقف', 'نقل'], ideal: 3, note: 'يؤثر مباشرة على سهولة الوصول وقيمة الاستخدام.' },
      { label: 'بنوك وخدمات مالية', keywords: ['bank', 'atm', 'finance', 'بنك', 'صراف', 'مالي'], ideal: 3, note: 'مفيد للمكاتب والتجارة والخدمات المهنية.' },
      { label: 'ترفيه ومساحات عامة', keywords: ['park', 'gym', 'cinema', 'entertainment', 'sport', 'حديقة', 'نادي', 'سينما', 'ترفيه', 'رياضة'], ideal: 4, note: 'يدعم جودة الحياة وجاذبية الإقامة.' },
      { label: 'ديني ومجتمعي', keywords: ['mosque', 'church', 'community', 'مسجد', 'كنيسة', 'مجتمع'], ideal: 3, note: 'يعزز قابلية السكن والاندماج المجتمعي.' },
    ];
    const serviceGroupSummary = serviceGroups.map((group) => {
      const matched = nearest.filter((place) => matchesKeywords(place, group.keywords));
      const closest = matched.length ? Math.min(...matched.map((place) => Number(place.distance || 0))) : null;
      const score = Math.min(100, Math.round((matched.length / group.ideal) * 100));
      return { ...group, count: matched.length, closest, score };
    });
    const serviceGroupRows = serviceGroupSummary.map((group, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${group.label}</td>
        <td>${group.count}</td>
        <td>${group.closest === null ? 'غير متاح' : `${Math.round(group.closest)} م`}</td>
        <td>${group.score}%</td>
        <td>${group.note}</td>
      </tr>
    `).join('');
    const proximityScore = Math.min(100, Math.round(
      (total ? (within500 / total) * 65 : 0) +
      (total ? (within1000 / total) * 35 : 0),
    ));
    const evidenceScore = total >= 90 ? 100 : total >= 60 ? 90 : total >= 35 ? 78 : total >= 18 ? 62 : total >= 8 ? 45 : 25;
    const concentrationShare = total ? Math.round(((topTypes[0]?.[1] || 0) / total) * 100) : 0;
    const balanceScore = Math.max(0, 100 - Math.max(0, concentrationShare - 25) * 2);
    const decisionScore = Math.min(100, Math.round(
      (serviceScore * 0.30) +
      (diversityScore * 0.20) +
      (proximityScore * 0.20) +
      (evidenceScore * 0.15) +
      (balanceScore * 0.15),
    ));
    const decisionBand = decisionScore >= 80 ? 'قوي للقرار' : decisionScore >= 65 ? 'جيد مع تحقق ميداني' : decisionScore >= 50 ? 'متوسط يحتاج مقارنة' : 'ضعيف حالياً';
    const decisionRows = [
      { factor: 'قوة الخدمات المحيطة', weight: '30%', value: `${serviceScore}%`, read: serviceScore >= 75 ? 'داعمة بقوة' : serviceScore >= 45 ? 'متوسطة' : 'محدودة' },
      { factor: 'تنوع التصنيفات', weight: '20%', value: `${diversityScore}%`, read: Object.keys(typeCounts).length >= 12 ? 'تنوع واسع' : Object.keys(typeCounts).length >= 7 ? 'تنوع مقبول' : 'تنوع منخفض' },
      { factor: 'القرب وسهولة الوصول', weight: '20%', value: `${proximityScore}%`, read: within1000 >= Math.ceil(total * 0.45) ? 'وصول سريع' : 'يحتاج فحص الطرق' },
      { factor: 'قوة عينة البيانات', weight: '15%', value: `${evidenceScore}%`, read: total >= 35 ? 'عينة جيدة' : 'العينة تحتاج توسعة' },
      { factor: 'توازن السوق المحيط', weight: '15%', value: `${balanceScore}%`, read: concentrationShare > 45 ? 'تركيز مرتفع' : 'توازن مقبول' },
    ].map((item) => `
      <tr><td>${item.factor}</td><td>${item.weight}</td><td>${item.value}</td><td>${item.read}</td></tr>
    `).join('');
    const riskClass = (level: string) => level === 'مرتفع' ? 'risk-high' : level === 'متوسط' ? 'risk-mid' : 'risk-low';
    const risks = [
      {
        name: 'مخاطر نقص البيانات',
        signal: `${total} موقع مرصود`,
        level: total < 15 ? 'مرتفع' : total < 35 ? 'متوسط' : 'منخفض',
        action: 'توسيع نصف القطر أو إعادة المسح قبل اعتماد قرار نهائي.',
      },
      {
        name: 'مخاطر الاعتماد على تصنيف واحد',
        signal: `أكبر تصنيف يمثل ${concentrationShare}%`,
        level: concentrationShare > 50 ? 'مرتفع' : concentrationShare > 35 ? 'متوسط' : 'منخفض',
        action: 'مراجعة الطلب الحقيقي على التصنيف المسيطر ومقارنته بالمنافسين.',
      },
      {
        name: 'مخاطر ضعف الوصول القريب',
        signal: `${within500} موقع داخل 500م`,
        level: within500 < Math.max(3, Math.ceil(total * 0.08)) ? 'مرتفع' : within500 < Math.ceil(total * 0.18) ? 'متوسط' : 'منخفض',
        action: 'التحقق من المشي، المداخل، المواقف، والطرق الفعلية.',
      },
      {
        name: 'مخاطر نقص الخدمات الأساسية',
        signal: `${serviceGroupSummary.filter((group) => group.score >= 60).length} مجموعات قوية من ${serviceGroupSummary.length}`,
        level: serviceGroupSummary.filter((group) => group.score >= 60).length < 3 ? 'مرتفع' : serviceGroupSummary.filter((group) => group.score >= 60).length < 5 ? 'متوسط' : 'منخفض',
        action: 'تحديد فجوات الصحة والتعليم والتجزئة قبل اختيار الاستخدام.',
      },
    ];
    const riskRows = risks.map((risk) => `
      <tr>
        <td>${risk.name}</td>
        <td>${risk.signal}</td>
        <td><span class="risk-pill ${riskClass(risk.level)}">${risk.level}</span></td>
        <td>${risk.action}</td>
      </tr>
    `).join('');
    const residentialScore = Math.round((
      (serviceGroupSummary.find((group) => group.label === 'تعليم')?.score || 0) +
      (serviceGroupSummary.find((group) => group.label === 'صحة')?.score || 0) +
      (serviceGroupSummary.find((group) => group.label === 'تجزئة وخدمات يومية')?.score || 0) +
      diversityScore
    ) / 4);
    const commercialScore = Math.round((
      (serviceGroupSummary.find((group) => group.label === 'تجزئة وخدمات يومية')?.score || 0) +
      (serviceGroupSummary.find((group) => group.label === 'مطاعم وضيافة')?.score || 0) +
      (serviceGroupSummary.find((group) => group.label === 'نقل ووصول')?.score || 0) +
      proximityScore
    ) / 4);
    const officeScore = Math.round((
      (serviceGroupSummary.find((group) => group.label === 'بنوك وخدمات مالية')?.score || 0) +
      (serviceGroupSummary.find((group) => group.label === 'مطاعم وضيافة')?.score || 0) +
      (serviceGroupSummary.find((group) => group.label === 'نقل ووصول')?.score || 0) +
      balanceScore
    ) / 4);
    const mixedUseScore = Math.round((residentialScore + commercialScore + officeScore + serviceScore) / 4);
    const fitRows = [
      { use: 'سكني عائلي', score: residentialScore, reason: 'يقيس التعليم والصحة والخدمات اليومية وتنوع البيئة.' },
      { use: 'تجاري يومي', score: commercialScore, reason: 'يقيس التجزئة والمطاعم والنقل والقرب من الحركة.' },
      { use: 'مكاتب وخدمات مهنية', score: officeScore, reason: 'يقيس البنوك والضيافة والنقل وتوازن السوق.' },
      { use: 'مختلط الاستخدام', score: mixedUseScore, reason: 'يجمع بين السكني والتجاري والخدمي.' },
    ].sort((a, b) => b.score - a.score).map((item) => `
      <tr><td>${item.use}</td><td>${item.score}%</td><td>${item.score >= 75 ? 'ملائم جداً' : item.score >= 55 ? 'ملائم بشروط' : 'يحتاج حذر'}</td><td>${item.reason}</td></tr>
    `).join('');
    const gapRows = serviceGroupSummary
      .filter((group) => group.score < 65)
      .sort((a, b) => a.score - b.score)
      .slice(0, 6)
      .map((group) => `
        <tr>
          <td>${group.label}</td>
          <td>${group.count}</td>
          <td>${group.score}%</td>
          <td>${group.score < 35 ? 'فجوة واضحة يمكن أن تصبح فرصة إذا كان الطلب مثبتاً.' : 'فجوة متوسطة تحتاج مقارنة مع المناطق البديلة.'}</td>
        </tr>
      `).join('') || '<tr><td colspan="4">لا توجد فجوات كبيرة ظاهرة ضمن المجموعات الأساسية.</td></tr>';

    const recommendation = serviceScore >= 75
      ? 'الموقع يظهر قوة خدمية مرتفعة وتنوعاً جيداً ضمن نطاق المسح، مما يدعم الاستخدامات السكنية/التجارية ذات الاعتماد على الوصول السريع للخدمات.'
      : serviceScore >= 45
        ? 'الموقع متوسط الجاذبية الخدمية ويحتاج إلى تقييم نوعية الخدمات الأقرب قبل اتخاذ قرار نهائي.'
        : 'الموقع منخفض نسبياً في كثافة أو تنوع الخدمات ضمن النطاق الحالي، وينصح بتوسيع نطاق المقارنة أو مراجعة بدائل قريبة.';

    return `<!doctype html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800;900&display=swap');
            @page { size: A4; margin: 0; }
            * { box-sizing: border-box; }
            body { margin: 0; font-family: 'Cairo', Arial, Tahoma, sans-serif; color: #0f172a; background: #fff; direction: rtl; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page { width: 210mm; min-height: 297mm; padding: 42px 48px 80px; page-break-after: always; position: relative; overflow: hidden; background: #fff; }
            .page::before { content: ""; position: absolute; inset: 0; background-image: var(--report-cover); background-size: cover; background-position: center; opacity: .20; pointer-events: none; }
            .page > * { position: relative; z-index: 1; }
            .cover { background: linear-gradient(135deg, #0b1528 0%, #0f172a 40%, #1e293b 100%); color: #fff; display: flex; flex-direction: column; justify-content: space-between; }
            .cover-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .92; }
            .cover-shade { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(8,17,31,.88), rgba(15,23,42,.62), rgba(30,41,59,.4)); }
            .cover-content { position: relative; z-index: 2; }
            .cover:before { content: ""; position: absolute; inset: 42px; border: 1px solid rgba(255,255,255,.14); border-radius: 34px; pointer-events: none; }
            .artwork-page { padding: 0; background: #fff; }
            .artwork-page::before { display: none; }
            .artwork-img { width: 210mm; height: 297mm; object-fit: cover; display: block; }
            .artwork-stamp { position: absolute; left: 34px; right: 34px; bottom: 30px; z-index: 2; display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 12px 16px; border-radius: 18px; background: rgba(15,23,42,.72); color: #fff; font-size: 11px; font-weight: 900; backdrop-filter: blur(8px); }
            .brand { font-size: 18px; font-weight: 900; letter-spacing: 1px; }
            .eyebrow { color: #38bdf8; font-size: 13px; font-weight: 800; margin-top: 95px; }
            .title { font-size: 48px; line-height: 1.25; font-weight: 900; margin: 18px 0; letter-spacing: 0; }
            .subtitle { color: #cbd5e1; font-size: 16px; line-height: 1.9; max-width: 650px; }
            .cover-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-top: 44px; }
            .cover-card { border: 1px solid rgba(255,255,255,.12); border-radius: 18px; padding: 18px; background: rgba(255,255,255,.06); backdrop-filter: blur(12px); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.15); }
            .cover-card span { display: block; color: #94a3b8; font-size: 12px; margin-bottom: 8px; font-weight: 600; }
            .cover-card strong { font-size: 18px; font-weight: 700; }
            .footer { position: absolute; bottom: 28px; left: 42px; right: 42px; display: flex; justify-content: space-between; color: #94a3b8; font-size: 12px; z-index: 2; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; margin-bottom: 26px; }
            .header h2 { margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
            .header p { margin: 6px 0 0; color: #64748b; font-size: 12.5px; font-weight: 600; }
            .page-no { display: none !important; }
            .section-title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 16px; letter-spacing: -0.5px; }
            .notice { border-right: 4px solid #0f172a; border-left: 1px solid #e2e8f0; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; background: #f8fafc; padding: 20px; border-radius: 12px; line-height: 2.05; color: #334155; font-size: 13.5px; font-weight: 400; }
            .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 22px; }
            .stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; min-height: 94px; text-align: center; }
            .stat span { display: block; color: #64748b; font-size: 11px; margin-bottom: 8px; font-weight: 700; }
            .stat strong { font-size: 26px; color: #0f172a; font-weight: 800; }
            .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .panel { border: 1px solid #e2e8f0; background: #fff; border-radius: 18px; padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
            .panel.dark { background: #0f172a; color: #fff; border-color: #0f172a; }
            .panel.dark h3 { color: #fff !important; }
            .muted { color: #64748b; line-height: 1.8; font-size: 13px; }
            .large-number { font-size: 38px; font-weight: 800; color: #0f172a; letter-spacing: -1px; }
            table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-top: 12px; font-size: 11px; }
            th { background: #0f172a; color: #fff; padding: 12px 14px; text-align: right; font-weight: 700; font-size: 11.5px; }
            td { border-bottom: 1px solid #e2e8f0; padding: 10px 14px; color: #334155; font-size: 11px; font-weight: 400; }
            tr:last-child td { border-bottom: none; }
            tr:nth-child(even) td { background: #f8fafc; }
            .agenda { border: none !important; border-radius: 0; }
            .agenda tr { border-bottom: 1px dashed #e2e8f0; }
            .agenda tr:last-child { border-bottom: none; }
            .agenda td { border: none !important; padding: 10px 0; font-size: 13px; font-weight: 600; color: #1e293b; }
            .agenda td:first-child { color: #2563eb; width: 50px; font-weight: 800; }
            .diagram { width: 100%; border: 1px solid #e2e8f0; border-radius: 20px; background: #f8fafc; overflow: hidden; margin-top: 16px; }
            .rec { font-size: 16px; line-height: 1.9; font-weight: 600; background: #f8fafc; border-right: 5px solid #2563eb; border-left: 1px solid #e2e8f0; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #0f172a; }
            .small-list { margin: 0; padding-right: 20px; color: #334155; line-height: 2; font-size: 13px; }
            .bottom { position: absolute; bottom: 48px; left: 42px; right: 42px; color: #94a3b8; font-size: 11px; display: flex; justify-content: space-between; padding-top: 10px; font-weight: 600; }
            .ai-badge { display: inline-flex; align-items: center; gap: 8px; border-radius: 999px; background: rgba(34,197,94,.14); color: #22c55e; border: 1px solid rgba(34,197,94,.35); padding: 9px 14px; font-size: 12px; font-weight: 800; margin-top: 18px; }
            .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
            .metric { border: 1px solid #e2e8f0; border-top: 4px solid #3b82f6; border-radius: 16px; padding: 18px; background: #fff; min-height: 118px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
            .metric:nth-child(2) { border-top-color: #ef4444; }
            .metric:nth-child(3) { border-top-color: #10b981; }
            .metric:nth-child(4) { border-top-color: #f59e0b; }
            .metric:nth-child(5) { border-top-color: #8b5cf6; }
            .metric:nth-child(6) { border-top-color: #64748b; }
            .metric span { display: block; color: #64748b; font-size: 11px; font-weight: 700; margin-bottom: 10px; }
            .metric strong { display: block; color: #0f172a; font-size: 32px; font-weight: 800; letter-spacing: -1px; }
            .metric p { margin: 8px 0 0; color: #64748b; font-size: 11px; line-height: 1.6; font-weight: 600; }
            .decision-hero { display: grid; grid-template-columns: 190px 1fr; gap: 18px; align-items: stretch; margin-bottom: 18px; }
            .decision-score { border-radius: 22px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #fff; padding: 24px; text-align: center; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08); }
            .decision-score span { display: block; color: #cbd5e1; font-size: 12px; font-weight: 700; margin-bottom: 12px; }
            .decision-score strong { display: block; font-size: 58px; font-weight: 800; line-height: 1; color: #38bdf8; }
            .decision-score p { margin: 12px 0 0; color: #e2e8f0; font-size: 13.5px; font-weight: 700; }
            .score-note { border: 1px solid #e2e8f0; border-radius: 22px; padding: 20px; background: #f8fafc; line-height: 1.9; color: #334155; font-size: 13.5px; font-weight: 400; }
            .risk-pill { display: inline-block; min-width: 68px; text-align: center; border-radius: 9999px; padding: 4px 12px; font-size: 10px; font-weight: 700; }
            .risk-low { color: #15803d; background: #dcfce7; }
            .risk-mid { color: #b45309; background: #fef3c7; }
            .risk-high { color: #b91c1c; background: #fee2e2; }
            .visual-caption { display: grid; grid-template-columns: 1.2fr .8fr; gap: 14px; margin-top: 14px; }
            .explain-card { border: 1px solid #e2e8f0; border-radius: 18px; background: #fff; padding: 14px 16px; }
            .explain-card h4 { margin: 0 0 8px; color: #0f172a; font-size: 14px; font-weight: 800; }
            .explain-card p { margin: 0; color: #64748b; font-size: 11px; line-height: 1.8; font-weight: 400; }
            .legend-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .legend-item { display: flex; align-items: center; gap: 8px; color: #334155; font-size: 10px; font-weight: 700; }
            .legend-dot { width: 9px; height: 9px; border-radius: 999px; display: inline-block; }
          </style>
        </head>
        <body style="${params.coverImage ? `--report-cover: url('${params.coverImage}')` : ''}">
          <section class="page cover" style="padding: 0; min-height: 297mm; display: flex; flex-direction: column; justify-content: space-between;">
            ${params.coverImage ? `<img class="cover-img" src="${params.coverImage}" alt="Cover Background" />` : ''}
            <div class="cover-shade"></div>
            <div class="cover-content" style="height: 297mm; display: flex; flex-direction: column; justify-content: space-between; padding: 60px 60px 80px 60px; box-sizing: border-box; position: relative;">
              <div class="brand-section" style="display: flex; justify-content: space-between; align-items: center; z-index: 5;">
                ${params.logoWhiteImage ? `<img src="${params.logoWhiteImage}" style="height: 55px; object-fit: contain;" />` : `<span class="brand" style="color: #fff; font-size: 24px; font-weight: 900;">الوساطة الرقمية</span>`}
                <span class="ai-badge" style="margin-top: 0; background: rgba(255,255,255,0.12); color: #fff; border: 1px solid rgba(255,255,255,0.25); border-radius: 12px; padding: 6px 14px; font-size: 12px; font-weight: bold; backdrop-filter: blur(4px);">تقرير مسح استكشافي</span>
              </div>
              
              <div class="title-section" style="margin-top: 60px; text-align: right; z-index: 5;">
                <div class="eyebrow" style="margin-top: 0; color: #38bdf8; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">منصة الوساطة العقارية الذكية</div>
                <h1 class="title" style="color: #fff; font-size: 42px; font-weight: 900; margin: 15px 0 25px; line-height: 1.3;">تقرير مسح خريطة الموقع<br/><span style="color: #38bdf8;">${escapedLocationName}</span></h1>
                <p class="subtitle" style="color: #94a3b8; font-size: 14.5px; line-height: 1.8; max-width: 550px;">دراسة إحصائية وتحليلية شاملة للخدمات العامة، الأنشطة التجارية، وكثافة المرافق والملاءمة الاستثمارية المحيطة بالموقع الجغرافي المحدد.</p>
              </div>

              <div class="cover-grid" style="margin-top: 50px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; z-index: 5;">
                <div class="cover-card" style="background: rgba(15,23,42,0.65); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 18px;">
                  <span style="color: #94a3b8; font-size: 11.5px; font-weight: bold; display: block; margin-bottom: 6px;">الإحداثيات الجغرافية</span>
                  <strong style="color: #fff; font-size: 14px; font-weight: 800;">${params.latitude.toFixed(6)} , ${params.longitude.toFixed(6)}</strong>
                </div>
                <div class="cover-card" style="background: rgba(15,23,42,0.65); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 18px;">
                  <span style="color: #94a3b8; font-size: 11.5px; font-weight: bold; display: block; margin-bottom: 6px;">نطاق البحث الجغرافي</span>
                  <strong style="color: #fff; font-size: 14px; font-weight: 800;">${params.radius.toLocaleString()} متر</strong>
                </div>
                <div class="cover-card" style="background: rgba(15,23,42,0.65); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 18px;">
                  <span style="color: #94a3b8; font-size: 11.5px; font-weight: bold; display: block; margin-bottom: 6px;">تاريخ إصدار التقرير</span>
                  <strong style="color: #fff; font-size: 14px; font-weight: 800;">${generatedDate}</strong>
                </div>
                <div class="cover-card" style="background: rgba(15,23,42,0.65); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 18px;">
                  <span style="color: #94a3b8; font-size: 11.5px; font-weight: bold; display: block; margin-bottom: 6px;">رمز التقرير المعتمد</span>
                  <strong style="color: #fff; font-size: 14px; font-weight: 800;">${reportCode}</strong>
                </div>
              </div>
            </div>
          </section>

          ${params.startImage ? `
          <section class="page cover" style="padding: 0; min-height: 297mm; display: flex; flex-direction: column; justify-content: center; align-items: center;">
            <img class="cover-img" src="${params.startImage}" alt="Start Background" />
            <div class="cover-shade" style="background: rgba(15, 23, 42, 0.75);"></div>
            <div class="cover-content" style="padding: 60px; text-align: center; z-index: 5; width: 100%;">
              <h2 style="color: #fff; font-size: 56px; font-weight: 900; margin: 0 0 24px; text-shadow: 0 4px 20px rgba(0,0,0,0.5);">الوساطة الرقمية</h2>
              <p style="color: #e2e8f0; font-size: 18px; line-height: 2.2; max-width: 700px; font-weight: 500; margin: 0 auto; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">
                يقدم هذا التقرير تحليلاً مكانياً دقيقاً وشاملاً لمحيط الموقع المختار. نهدف من خلال هذا المسح الاستكشافي إلى تحويل البيانات الجغرافية الخام إلى مؤشرات واضحة ورؤى استثمارية ذكية، تسهم في دعم متخذي القرار العقاري وتوضيح مدى الملاءمة والجاذبية للفرص المتاحة في السوق.
              </p>
            </div>
          </section>
          ` : ''}

          <section class="page">
            <div class="header">
              <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <div>
                  <h2>إخلاء المسؤولية القانونية</h2>
                  <p>${escapedLocationName} • ${params.latitude.toFixed(5)}, ${params.longitude.toFixed(5)}</p>
                </div>
                ${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 36px; object-fit: contain;" />` : ''}
              </div>
            </div>
            
            <div style="margin-top: 30px;">
              <h3 class="section-title">إخلاء مسؤولية</h3>
              <div class="notice" style="line-height: 2; font-size: 13.5px; padding: 24px; border-radius: 16px;">
                <ul style="margin: 0; padding-right: 18px; list-style-type: square;">
                  <li style="margin-bottom: 12px;">تم تقديم المعلومات والبيانات في هذا التقرير بهدف تقديم المعلومات العامة فقط، على الرغم من أننا نسعى للحفاظ على دقة وموثوقية البيانات المقدمة، إلا أننا لا نقدم أي تصريحات أو ضمانات صريحة أو ضمنية بشأن اكتمال أو ملاءمة أو دقة هذه المعلومات.</li>
                  <li style="margin-bottom: 12px;">لا تتحمل المنصة أي مسؤولية أو التزام بأي خطأ أو نقص في محتوى التقرير، كما يُنصح المستخدمون بالتحقق بشكل مستقل من المعلومات المقدمة، وإذا لزم الأمر البحث عن استشارة مهنية قبل اتخاذ أي قرارات استناداً على البيانات المقدمة.</li>
                  <li style="margin-bottom: 12px;">قد يحتوي هذا التقرير على توقعات، تقديرات، أو بيانات توجيهية أخرى قابلة للتغيير بناءً على عوامل متنوعة، ولا تتحمل المنصة أي التزام بتحديث أو إعلام المستخدمين بأي تغييرات من هذا القبيل.</li>
                  <li style="margin-bottom: 12px;">تخلي المنصة نفسها من جميع المسؤوليات عن أي خسارة أو ضرر أو إزعاج ناتج عن استخدام أو الاعتماد على المعلومات المقدمة في هذا التقرير، ويقر المستخدمون ويوافقون على الالتزام بالشروط والأحكام المبينة هنا وفي سياسة حدود الاستخدام لمنصة الوساطة الرقمية.</li>
                  <li style="margin-bottom: 12px;">لا تشكل محتويات هذا التقرير نصائح مالية أو مهنية، كما يُنصح المستخدمون باستشارة الخبراء العقاريين المؤهلين للحصول على نصائح شخصية مصممة وفقاً لظروفهم الفردية.</li>
                </ul>
                <p style="margin: 18px 0 0; font-weight: bold; line-height: 1.6; color: #0f172a;">من خلال الوصول إلى هذا التقرير واستخدامه، يقر المستخدمون ويوافقون على الالتزام بالشروط والأحكام المبينة هنا وفي سياسة حدود الاستخدام لمنصة الوساطة الرقمية.</p>
              </div>
            </div>
            <div class="bottom"><span style="display: flex; align-items: center; gap: 8px;">${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 16px; object-fit: contain;" />` : 'DigitalBrokerage'}<span style="color: #cbd5e1; font-weight: 300;">|</span><span>إخلاء المسؤولية القانونية</span></span><span>02</span></div>
          </section>

          <section class="page">
            <div class="header">
              <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <div>
                  <h2>أجندة تقرير مسح المنطقة</h2>
                  <p>${escapedLocationName} • ${params.latitude.toFixed(5)}, ${params.longitude.toFixed(5)}</p>
                </div>
                ${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 36px; object-fit: contain;" />` : ''}
              </div>
            </div>
            
            <div style="margin-top: 30px;">
              <h3 class="section-title" style="margin-bottom: 15px;">محتويات وأقسام التقرير</h3>
              <table class="agenda">
                <tr><td>01</td><td>غلاف التقرير والبيانات الأساسية للموقع</td></tr>
                <tr><td>02</td><td>إخلاء المسؤولية القانونية وشروط الاستخدام</td></tr>
                <tr><td>03</td><td>أجندة ومحتويات التقرير التفصيلية</td></tr>
                <tr><td>04</td><td>تفاصيل الموقع ونطاق البحث الجغرافي</td></tr>
                <tr><td>05</td><td>منهجية المسح والمعالجة الفنية للبيانات</td></tr>
                <tr><td>06</td><td>مؤشرات وتقييم الخدمات العامة المحيطة</td></tr>
                <tr><td>07</td><td>توزيع التصنيفات والخدمات ضمن النطاق</td></tr>
                <tr><td>08</td><td>صورة تحليلية ومخطط مكاني لتوزيع المواقع</td></tr>
                <tr><td>09</td><td>النموذج ثلاثي الأبعاد لكثافة الخدمات</td></tr>
                <tr><td>10</td><td>تحليل المسافات وسهولة الوصول الجغرافي</td></tr>
                <tr><td>11</td><td>لوحة أرقام وإحصائيات البحث التفصيلية</td></tr>
                <tr><td>12</td><td>لوحة قرار الاستثمار والتقييم العقاري</td></tr>
                <tr><td>13</td><td>فجوات الخدمات والفرص الاستثمارية المرصودة</td></tr>
                <tr><td>14</td><td>مصفوفة المخاطر وملاءمة الاستخدام</td></tr>
                <tr><td>15</td><td>التوصية النهائية والملخص التنفيذي للموقع</td></tr>
                <tr><td>16</td><td>ملحق البيانات وعينة النتائج التفصيلية</td></tr>
              </table>
            </div>
            <div class="bottom"><span style="display: flex; align-items: center; gap: 8px;">${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 16px; object-fit: contain;" />` : 'DigitalBrokerage'}<span style="color: #cbd5e1; font-weight: 300;">|</span><span>أجندة تقرير مسح المنطقة</span></span><span>03</span></div>
          </section>

          <section class="page">
            <div class="header"><div style="display: flex; justify-content: space-between; align-items: center; width: 100%;"><div><h2>تفاصيل الموقع</h2><p>ملخص كمي للمسح الحالي</p></div>${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 30px; object-fit: contain; margin-left: 10px;" />` : ''}</div><div class="page-no">04</div></div>
            <div class="stats">
              <div class="stat"><span>عدد المواقع</span><strong>${total}</strong></div>
              <div class="stat"><span>عدد التصنيفات</span><strong>${Object.keys(typeCounts).length}</strong></div>
              <div class="stat"><span>متوسط المسافة</span><strong>${avgDistance}م</strong></div>
              <div class="stat"><span>كثافة المواقع/كم²</span><strong>${density}</strong></div>
            </div>
            <div class="two-col">
              <div class="panel"><h3 class="section-title">إحداثيات المركز</h3><div class="large-number" style="font-size:26px">${params.latitude.toFixed(5)}</div><div class="large-number" style="font-size:26px">${params.longitude.toFixed(5)}</div><p class="muted">تم حساب المسافات من نقطة المركز المختارة في الخريطة.</p></div>
              <div class="panel"><h3 class="section-title">نطاق البحث</h3><div class="large-number">${params.radius.toLocaleString()}م</div><p class="muted">المساحة التقريبية المغطاة: ${(Math.PI * Math.pow(params.radius / 1000, 2)).toFixed(2)} كم²</p></div>
            </div>
            <div class="bottom"><span style="display: flex; align-items: center; gap: 8px;">${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 16px; object-fit: contain;" />` : 'DigitalBrokerage'}<span style="color: #cbd5e1; font-weight: 300;">|</span><span>تفاصيل الموقع</span></span><span>04</span></div>
          </section>

          <section class="page">
            <div class="header"><div style="display: flex; justify-content: space-between; align-items: center; width: 100%;"><div><h2>منهجية المسح</h2><p>طريقة تجميع وتحليل بيانات الخريطة</p></div>${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 30px; object-fit: contain; margin-left: 10px;" />` : ''}</div><div class="page-no">05</div></div>
            <div class="notice">
              يقوم النظام بجلب جميع المواقع الواقعة داخل نصف قطر البحث، ثم يحسب المسافة الجغرافية بين كل موقع ونقطة المركز باستخدام معادلة Haversine.
              بعد ذلك يتم ترتيب النتائج حسب القرب، واستخراج التوزيع حسب التصنيف، وحساب كثافة الخدمات، ومؤشرات التنوع وسهولة الوصول.
            </div>
            <div class="two-col" style="margin-top:20px">
              <div class="panel dark"><h3>مصادر القياس</h3><ul class="small-list" style="color:#cbd5e1"><li>الإحداثيات المختارة من المستخدم</li><li>نطاق البحث بالمتر</li><li>قاعدة بيانات الأماكن المحيطة</li><li>حسابات مسافة مباشرة</li></ul></div>
              <div class="panel"><h3 class="section-title">حدود التحليل</h3><p class="muted">التقرير يقيس القرب المكاني وليس جودة الخدمة أو الازدحام أو ساعات العمل. لذلك يعتبر أداة بحث أولية قوية وليست بديلاً عن التحقق الميداني.</p></div>
            </div>
            <div class="bottom"><span style="display: flex; align-items: center; gap: 8px;">${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 16px; object-fit: contain;" />` : 'DigitalBrokerage'}<span style="color: #cbd5e1; font-weight: 300;">|</span><span>منهجية المسح</span></span><span>05</span></div>
          </section>

          <section class="page">
            <div class="header"><div style="display: flex; justify-content: space-between; align-items: center; width: 100%;"><div><h2>مؤشرات الخدمات العامة</h2><p>درجات كمية مركبة من نتائج المسح</p></div>${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 30px; object-fit: contain; margin-left: 10px;" />` : ''}</div><div class="page-no">06</div></div>
            <div class="stats">
              <div class="stat"><span>درجة الجاذبية</span><strong>${serviceScore}%</strong></div>
              <div class="stat"><span>تنوع الخدمات</span><strong>${diversityScore}%</strong></div>
              <div class="stat"><span>سهولة الوصول</span><strong>${accessibilityScore}%</strong></div>
              <div class="stat"><span>داخل 1000م</span><strong>${within1000}</strong></div>
            </div>
            <div class="diagram">
              <svg width="100%" height="300" viewBox="0 0 640 300" xmlns="http://www.w3.org/2000/svg">
                <rect width="640" height="300" fill="#f8fafc"/>
                ${scoreBars}
              </svg>
            </div>
            <div class="bottom"><span style="display: flex; align-items: center; gap: 8px;">${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 16px; object-fit: contain;" />` : 'DigitalBrokerage'}<span style="color: #cbd5e1; font-weight: 300;">|</span><span>مؤشرات الخدمات العامة</span></span><span>06</span></div>
          </section>

          <section class="page">
            <div class="header"><div style="display: flex; justify-content: space-between; align-items: center; width: 100%;"><div><h2>توزيع التصنيفات</h2><p>أكثر التصنيفات تكراراً ضمن نطاق البحث</p></div>${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 30px; object-fit: contain; margin-left: 10px;" />` : ''}</div><div class="page-no">07</div></div>
            <div class="diagram">
              <svg width="100%" height="410" viewBox="0 0 640 410" xmlns="http://www.w3.org/2000/svg">
                <rect width="640" height="410" fill="#f8fafc"/>
                ${barChart}
              </svg>
            </div>
            <table><thead><tr><th>#</th><th>التصنيف</th><th>العدد</th><th>النسبة</th></tr></thead><tbody>${topTypeRows}</tbody></table>
            <div class="bottom"><span style="display: flex; align-items: center; gap: 8px;">${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 16px; object-fit: contain;" />` : 'DigitalBrokerage'}<span style="color: #cbd5e1; font-weight: 300;">|</span><span>توزيع التصنيفات والخدمات</span></span><span>07</span></div>
          </section>

          <section class="page">
            <div class="header"><div style="display: flex; justify-content: space-between; align-items: center; width: 100%;"><div><h2>صورة تحليلية للموقع</h2><p>تمثيل مكاني تقريبي لتوزيع المواقع حول نقطة المركز</p></div>${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 30px; object-fit: contain; margin-left: 10px;" />` : ''}</div><div class="page-no">08</div></div>
            <div class="diagram">
              ${mapVisual}
            </div>
            <div class="visual-caption">
              <div class="explain-card">
                <h4>كيف تقرأ المخطط؟</h4>
                <p>النقطة الحمراء تمثل مركز الموقع. كل نقطة حولها تمثل خدمة أو مرفقاً مرصوداً داخل نطاق البحث. قرب النقاط من المركز يعني سهولة وصول أعلى، وكثرة الألوان تعني تنوعاً أكبر في البيئة المحيطة.</p>
              </div>
              <div class="explain-card">
                <h4>دليل سريع</h4>
                <div class="legend-grid">
                  <div class="legend-item"><span class="legend-dot" style="background:#dc2626"></span>مركز الموقع</div>
                  <div class="legend-item"><span class="legend-dot" style="background:#2563eb"></span>خدمات قريبة</div>
                  <div class="legend-item"><span class="legend-dot" style="background:#16a34a"></span>خدمات داعمة</div>
                  <div class="legend-item"><span class="legend-dot" style="background:#f59e0b"></span>فرص/تصنيفات</div>
                </div>
              </div>
            </div>
            <h3 class="section-title" style="margin-top:16px">مشهد تحليلي ثلاثي الأبعاد</h3>
            <div class="diagram" style="margin-top:10px">
              ${aerialVisual}
            </div>
            <p class="muted" style="margin-top:10px">
              ارتفاع الأعمدة يعبر عن قوة حضور الخدمات وقربها من المركز. الأعمدة الأطول تعني مواقع أقرب أو أكثر تأثيراً في قرار الموقع، بينما انخفاض الأعمدة يعني تأثيراً أقل أو بعداً نسبياً.
            </p>
            <div class="bottom"><span style="display: flex; align-items: center; gap: 8px;">${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 16px; object-fit: contain;" />` : 'DigitalBrokerage'}<span style="color: #cbd5e1; font-weight: 300;">|</span><span>صورة تحليلية ومخطط مكاني</span></span><span>08</span></div>
          </section>

          <section class="page">
            <div class="header"><div style="display: flex; justify-content: space-between; align-items: center; width: 100%;"><div><h2>نموذج ثلاثي الأبعاد</h2><p>تصوير بحثي لكثافة الخدمات حسب التصنيف</p></div>${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 30px; object-fit: contain; margin-left: 10px;" />` : ''}</div><div class="page-no">09</div></div>
            <div class="diagram">
              <svg width="100%" height="430" viewBox="0 0 640 430" xmlns="http://www.w3.org/2000/svg">
                <rect width="640" height="430" fill="#f8fafc"/>
                <text x="320" y="36" font-size="18" fill="#0f172a" text-anchor="middle" font-weight="900">نموذج 3D لكثافة الخدمات حسب التصنيف</text>
                <text x="320" y="62" font-size="12" fill="#64748b" text-anchor="middle">ارتفاع كل عمود يمثل قوة حضور التصنيف داخل نطاق المسح</text>
                ${isoBars}
              </svg>
            </div>
            <div class="bottom"><span style="display: flex; align-items: center; gap: 8px;">${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 16px; object-fit: contain;" />` : 'DigitalBrokerage'}<span style="color: #cbd5e1; font-weight: 300;">|</span><span>النموذج ثلاثي الأبعاد لكثافة الخدمات</span></span><span>09</span></div>
          </section>

          <section class="page">
            <div class="header"><div style="display: flex; justify-content: space-between; align-items: center; width: 100%;"><div><h2>تحليل المسافات والوصول</h2><p>توزيع النتائج حسب القرب من المركز</p></div>${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 30px; object-fit: contain; margin-left: 10px;" />` : ''}</div><div class="page-no">10</div></div>
            <div class="diagram">
              <svg width="100%" height="300" viewBox="0 0 640 300" xmlns="http://www.w3.org/2000/svg">
                <rect width="640" height="300" fill="#f8fafc"/>
                ${ringChart}
              </svg>
            </div>
            <h3 class="section-title" style="margin-top:22px">أقرب المواقع</h3>
            <table>
              <thead><tr><th>#</th><th>الاسم</th><th>النوع</th><th>المسافة</th><th>الإحداثيات</th></tr></thead>
              <tbody>${nearestRows}</tbody>
            </table>
            <div class="bottom"><span style="display: flex; align-items: center; gap: 8px;">${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 16px; object-fit: contain;" />` : 'DigitalBrokerage'}<span style="color: #cbd5e1; font-weight: 300;">|</span><span>تحليل المسافات والوصول الجغرافي</span></span><span>10</span></div>
          </section>

          <section class="page">
            <div class="header"><div style="display: flex; justify-content: space-between; align-items: center; width: 100%;"><div><h2>لوحة أرقام البحث</h2><p>أرقام تشغيلية مختصرة قبل قراءة القرار</p></div>${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 30px; object-fit: contain; margin-left: 10px;" />` : ''}</div><div class="page-no">11</div></div>
            <div class="metric-grid">
              <div class="metric"><span>أقرب موقع</span><strong>${nearest[0] ? Math.round(nearest[0].distance || 0) : 0}م</strong><p>${this.escapeHtml(nearest[0]?.name || 'لا يوجد')}</p></div>
              <div class="metric"><span>أبعد موقع داخل النطاق</span><strong>${farthestDistance}م</strong><p>يعكس مدى انتشار النتائج داخل نصف القطر.</p></div>
              <div class="metric"><span>وسيط المسافة</span><strong>${medianDistance}م</strong><p>نصف المواقع أقرب من هذا الرقم تقريباً.</p></div>
              <div class="metric"><span>نسبة داخل 500م</span><strong>${total ? Math.round((within500 / total) * 100) : 0}%</strong><p>${within500} موقع في نطاق مشي قريب.</p></div>
              <div class="metric"><span>نسبة داخل 1000م</span><strong>${total ? Math.round((within1000 / total) * 100) : 0}%</strong><p>${within1000} موقع ضمن نطاق وصول سريع.</p></div>
              <div class="metric"><span>خارج 2000م</span><strong>${outside2000}</strong><p>مواقع أبعد نسبياً وتؤثر أقل على سهولة الوصول.</p></div>
            </div>
            <div class="bottom"><span style="display: flex; align-items: center; gap: 8px;">${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 16px; object-fit: contain;" />` : 'DigitalBrokerage'}<span style="color: #cbd5e1; font-weight: 300;">|</span><span>لوحة أرقام وإحصائيات البحث التفصيلية</span></span><span>11</span></div>
          </section>

          <section class="page">
            <div class="header"><div style="display: flex; justify-content: space-between; align-items: center; width: 100%;"><div><h2>لوحة قرار الاستثمار</h2><p>مؤشر مركب يساعد على المقارنة بين المواقع</p></div>${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 30px; object-fit: contain; margin-left: 10px;" />` : ''}</div><div class="page-no">12</div></div>
            <div class="decision-hero">
              <div class="decision-score"><span>Decision Score</span><strong>${decisionScore}</strong><p>${decisionBand}</p></div>
              <div class="score-note">
                تم بناء الدرجة من قوة الخدمات، تنوع التصنيفات، القرب، قوة عينة البيانات، وتوازن السوق المحيط.
                هذه الدرجة لا تعني شراء أو عدم شراء مباشرة، لكنها تجعل المقارنة بين المواقع أسرع وأكثر انضباطاً.
              </div>
            </div>
            <table>
              <thead><tr><th>العامل</th><th>الوزن</th><th>القيمة</th><th>قراءة القرار</th></tr></thead>
              <tbody>${decisionRows}</tbody>
            </table>
            <h3 class="section-title" style="margin-top:22px">تحليل الخدمات الأساسية</h3>
            <table>
              <thead><tr><th>#</th><th>المجموعة</th><th>العدد</th><th>الأقرب</th><th>الدرجة</th><th>أثرها على القرار</th></tr></thead>
              <tbody>${serviceGroupRows}</tbody>
            </table>
            <div class="bottom"><span style="display: flex; align-items: center; gap: 8px;">${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 16px; object-fit: contain;" />` : 'DigitalBrokerage'}<span style="color: #cbd5e1; font-weight: 300;">|</span><span>لوحة قرار الاستثمار والتقييم العقاري</span></span><span>12</span></div>
          </section>

          <section class="page">
            <div class="header"><div style="display: flex; justify-content: space-between; align-items: center; width: 100%;"><div><h2>فجوات الخدمات والفرص</h2><p>قراءة الفجوات التي قد تتحول إلى مخاطر أو فرص</p></div>${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 30px; object-fit: contain; margin-left: 10px;" />` : ''}</div><div class="page-no">13</div></div>
            <div class="notice">
              الفجوة لا تعني دائماً ضعف الموقع. أحياناً تعني وجود فرصة تشغيلية إذا كان الطلب مثبتاً ولا توجد منافسة قوية.
              لذلك يجب قراءة هذه الصفحة مع الزيارة الميدانية وسعر الأرض أو العقار ونمو المنطقة.
            </div>
            <table>
              <thead><tr><th>المجموعة الناقصة</th><th>العدد المرصود</th><th>درجة التغطية</th><th>قراءة الفرصة</th></tr></thead>
              <tbody>${gapRows}</tbody>
            </table>
            <div class="two-col" style="margin-top:22px">
              <div class="panel"><h3 class="section-title">أفضل استخدامات حسب البيانات</h3><table><thead><tr><th>الاستخدام</th><th>الدرجة</th><th>الحكم</th><th>السبب</th></tr></thead><tbody>${fitRows}</tbody></table></div>
              <div class="panel"><h3 class="section-title">أسئلة القرار قبل الاعتماد</h3><ul class="small-list"><li>هل السعر يعكس قوة الموقع أو يبالغ فيها؟</li><li>هل الخدمات الأقرب تعمل فعلياً وبجودة مقبولة؟</li><li>هل توجد مشاريع مستقبلية تغير الطلب؟</li><li>هل الوصول الفعلي أسهل من المسافة المباشرة؟</li></ul></div>
            </div>
            <div class="bottom"><span style="display: flex; align-items: center; gap: 8px;">${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 16px; object-fit: contain;" />` : 'DigitalBrokerage'}<span style="color: #cbd5e1; font-weight: 300;">|</span><span>فجوات الخدمات والفرص الاستثمارية</span></span><span>13</span></div>
          </section>

          <section class="page">
            <div class="header"><div style="display: flex; justify-content: space-between; align-items: center; width: 100%;"><div><h2>مصفوفة المخاطر</h2><p>تحويل نتائج المسح إلى عناصر تحقق واضحة</p></div>${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 30px; object-fit: contain; margin-left: 10px;" />` : ''}</div><div class="page-no">14</div></div>
            <table>
              <thead><tr><th>الخطر</th><th>الإشارة من البيانات</th><th>المستوى</th><th>إجراء التخفيف</th></tr></thead>
              <tbody>${riskRows}</tbody>
            </table>
            <div class="two-col" style="margin-top:26px">
              <div class="panel dark"><h3>قراءة القرار المختصرة</h3><p style="line-height:2;color:#cbd5e1">الدرجة الحالية: <strong style="color:#fff;font-size:24px">${decisionScore}%</strong><br/>الحكم: ${decisionBand}<br/>أكبر تصنيف: ${this.escapeHtml(topTypes[0]?.[0] || 'غير محدد')} (${concentrationShare}%).</p></div>
              <div class="panel"><h3 class="section-title">ما الذي يجعل القرار أقوى؟</h3><ul class="small-list"><li>مقارنة موقعين أو ثلاثة بنفس التقرير.</li><li>رفع النطاق عند انخفاض عدد النتائج.</li><li>إضافة صور ميدانية وملاحظات المرور.</li><li>مراجعة السعر والعائد المتوقع خارج هذا التقرير.</li></ul></div>
            </div>
            <div class="bottom"><span style="display: flex; align-items: center; gap: 8px;">${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 16px; object-fit: contain;" />` : 'DigitalBrokerage'}<span style="color: #cbd5e1; font-weight: 300;">|</span><span>مصفوفة المخاطر وملاءمة الاستخدام</span></span><span>14</span></div>
          </section>

          <section class="page">
            <div class="header"><div style="display: flex; justify-content: space-between; align-items: center; width: 100%;"><div><h2>التوصية النهائية</h2><p>قراءة تنفيذية مبنية على نتائج المسح</p></div>${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 30px; object-fit: contain; margin-left: 10px;" />` : ''}</div><div class="page-no">15</div></div>
            <div class="rec">${this.escapeHtml(recommendation)}</div>
            <div class="two-col" style="margin-top:24px">
              <div class="panel"><h3 class="section-title">نقاط القوة</h3><ul class="small-list"><li>عدد مواقع مرصود: ${total}</li><li>تصنيفات مختلفة: ${Object.keys(typeCounts).length}</li><li>مواقع ضمن 500م: ${within500}</li><li>مواقع ضمن 1000م: ${within1000}</li></ul></div>
              <div class="panel"><h3 class="section-title">ما يجب التحقق منه</h3><ul class="small-list"><li>جودة الخدمات الأقرب وساعات عملها</li><li>سهولة الوصول الفعلية بالسيارة والمشي</li><li>حركة المرور ومداخل الموقع</li><li>مطابقة البيانات مع زيارة ميدانية</li></ul></div>
            </div>
            <div class="bottom"><span style="display: flex; align-items: center; gap: 8px;">${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 16px; object-fit: contain;" />` : 'DigitalBrokerage'}<span style="color: #cbd5e1; font-weight: 300;">|</span><span>التوصية النهائية والملخص التنفيذي للموقع</span></span><span>15</span></div>
          </section>

          <section class="page">
            <div class="header"><div style="display: flex; justify-content: space-between; align-items: center; width: 100%;"><div><h2>ملحق البيانات</h2><p>عينة موسعة من نتائج المسح، والملف الكامل متوفر في Excel</p></div>${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 30px; object-fit: contain; margin-left: 10px;" />` : ''}</div><div class="page-no">16</div></div>
            <table>
              <thead><tr><th>#</th><th>الاسم</th><th>النوع</th><th>المسافة بالمتر</th><th>المدينة</th></tr></thead>
              <tbody>${appendixRows}</tbody>
            </table>
            <div class="bottom"><span style="display: flex; align-items: center; gap: 8px;">${params.logoBlackImage ? `<img src="${params.logoBlackImage}" style="height: 16px; object-fit: contain;" />` : 'DigitalBrokerage'}<span style="color: #cbd5e1; font-weight: 300;">|</span><span>ملحق البيانات وعينة النتائج التفصيلية</span></span><span>16</span></div>
          </section>

          ${params.endImage ? `
          <section class="page artwork-page">
            <img class="artwork-img" src="${params.endImage}" alt="Report closing page" />
            <div class="artwork-stamp">
              <span>DigitalBrokerage AI Research</span>
              <span>${reportCode}</span>
            </div>
          </section>
          ` : ''}
        </body>
      </html>`;
  }

  private async renderPdfFromHtml(html: string, htmlPath: string, pdfPath: string) {
    await writeFile(htmlPath, html, 'utf8');
    const tempRootCandidates = [
      process.env.CHROME_TEMP_DIR,
      '/root/snap/chromium/common',
      join(homedir(), 'snap', 'chromium', 'common'),
      tmpdir(),
    ].filter(Boolean) as string[];
    const tempRoot = tempRootCandidates.find((dir) => {
      try {
        return existsSync(dir);
      } catch {
        return false;
      }
    }) || tmpdir();
    await mkdir(tempRoot, { recursive: true });
    const tempDir = await mkdtemp(join(tempRoot, 'scan-report-'));
    const tempHtmlPath = join(tempDir, 'report.html');
    const tempPdfPath = join(tempDir, 'report.pdf');
    await writeFile(tempHtmlPath, html, 'utf8');
    const htmlUrl = pathToFileURL(tempHtmlPath).href;

    const candidates = [
      process.env.CHROME_PATH,
      'google-chrome',
      'google-chrome-stable',
      'chromium-browser',
      'chromium',
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium',
    ].filter(Boolean) as string[];

    const failures: string[] = [];
    const waitForPdf = async (filePath: string) => {
      for (let attempt = 0; attempt < 20; attempt += 1) {
        try {
          const fileStat = await stat(filePath);
          if (fileStat.size > 0) return true;
        } catch {
          // Chromium snap can report "bytes written" before the host sees the file.
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return false;
    };
    const copyRenderedPdf = async () => {
      await copyFile(tempPdfPath, pdfPath);
      const copied = await waitForPdf(pdfPath);
      if (!copied) {
        throw new Error(`PDF was created in temp but could not be copied to ${pdfPath}`);
      }
    };

    try {
      for (const browser of candidates) {
        await rm(tempPdfPath, { force: true }).catch(() => undefined);
        try {
          const result = await execFileAsync(browser, [
            '--headless',
            '--disable-gpu',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--allow-file-access-from-files',
            '--no-pdf-header-footer',
            `--user-data-dir=${join(tempDir, 'chrome-profile')}`,
            `--print-to-pdf=${tempPdfPath}`,
            htmlUrl,
          ]);
          if (!(await waitForPdf(tempPdfPath))) {
            const stdout = String((result as any)?.stdout || '').trim();
            const stderr = String((result as any)?.stderr || '').trim();
            throw new Error(`Chrome command completed but PDF was not created at ${tempPdfPath}${stdout ? ` stdout=${stdout}` : ''}${stderr ? ` stderr=${stderr}` : ''}`);
          }
          await copyRenderedPdf();
          return;
        } catch (error: any) {
          if (await waitForPdf(tempPdfPath)) {
            await copyRenderedPdf();
            return;
          }
          failures.push(`${browser}: ${error?.code || 'ERROR'} ${error?.message || ''}`.trim());
        }
      }

      throw new Error(`Unable to render scan report PDF. Attempts: ${failures.join(' | ')}`);
    } finally {
      await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  private async listUserScanReportFiles(userId: string): Promise<ScanReportFile[]> {
    const dir = this.getUserScanReportsDir(userId);
    if (!existsSync(dir)) return [];

    const entries = await readdir(dir);
    const files = await Promise.all(entries
      .filter((name) => name.endsWith('.pdf') || name.endsWith('.xls'))
      .map(async (name): Promise<ScanReportFile> => {
        const filePath = join(dir, name);
        const fileStat = await stat(filePath);
        const isPdf = name.endsWith('.pdf');
        const locationName = this.prettifyScanReportLocationFromFile(name);
        return {
          id: `scan-report-${name}`,
          type: isPdf ? 'scan_report_pdf' : 'scan_report_excel',
          name: `DigitalBrokerage - ${locationName} - ${isPdf ? 'PDF' : 'Excel'}`,
          locationName,
          url: this.getPublicUploadUrl('scan-reports', userId, name),
          date: fileStat.mtime,
          description: `تقرير مسح خريطة مولد بالذكاء الاصطناعي لـ ${locationName}`,
        };
      }));

    return files;
  }

  async generateScanReportFiles(userId: string, dto: { latitude: number; longitude: number; radius: number; mapImage?: string; locationName?: string }) {
    const latitude = Number(dto.latitude);
    const longitude = Number(dto.longitude);
    const radius = Math.max(100, Math.min(Number(dto.radius) || 1000, 10000));
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error('Invalid coordinates');
    }

    const rawPlaces = await this.placesService.getPlaces(latitude, longitude, radius);
    const places: ScanReportPlace[] = rawPlaces.map((place: any) => ({
      id: place.id,
      name: place.name,
      type: place.type,
      city: place.city,
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
      distance: this.calculateDistance(latitude, longitude, Number(place.latitude), Number(place.longitude)),
    })).sort((a, b) => (a.distance || 0) - (b.distance || 0));

    const generatedAt = new Date();
    const inferredLocationName = dto.locationName || places[0]?.city || places[0]?.name || `موقع-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
    const fileLocationName = this.sanitizeFilePart(inferredLocationName);
    const reportId = `${fileLocationName}-${generatedAt.toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`;
    const dir = this.getUserScanReportsDir(userId);
    await mkdir(dir, { recursive: true });

    const excelName = `map-scan-${reportId}.xls`;
    const htmlName = `map-scan-${reportId}.html`;
    const pdfName = `map-scan-${reportId}.pdf`;
    const excelPath = join(dir, excelName);
    const htmlPath = join(dir, htmlName);
    const pdfPath = join(dir, pdfName);

    const mapImage = typeof dto.mapImage === 'string' && dto.mapImage.startsWith('data:image/') && dto.mapImage.length < 8_000_000
      ? dto.mapImage
      : undefined;
    const coverSetting = await this.settingsService.findOne('theme_reportCoverUrl');
    const logoBlackSetting = await this.settingsService.findOne('theme_logoBlackUrl');
    const logoWhiteSetting = await this.settingsService.findOne('theme_logoWhiteUrl');

    const localCoverImage = await this.resolveSeederReportImage('cover.jpeg');
    const startImage = await this.resolveSeederReportImage('start.jpeg');
    const endImage = await this.resolveSeederReportImage('end.jpeg');

    const coverImage = (coverSetting?.value ? await this.resolveReportImageSource(coverSetting.value) : undefined) || localCoverImage;
    const logoBlackImage = logoBlackSetting?.value ? await this.resolveReportImageSource(logoBlackSetting.value) : undefined;
    const logoWhiteImage = logoWhiteSetting?.value ? await this.resolveReportImageSource(logoWhiteSetting.value) : undefined;

    const payload = {
      latitude,
      longitude,
      radius,
      places,
      generatedAt,
      mapImage,
      coverImage,
      startImage,
      endImage,
      logoBlackImage,
      logoWhiteImage,
      locationName: inferredLocationName,
    };
    await writeFile(excelPath, `\ufeff${this.buildExcelReportHtml(payload)}`, 'utf8');
    await this.renderPdfFromHtml(this.buildPdfReportHtml(payload), htmlPath, pdfPath);

    return {
      count: places.length,
      files: [
        {
          id: `scan-report-${pdfName}`,
          type: 'scan_report_pdf',
          name: `DigitalBrokerage - ${inferredLocationName} - PDF`,
          locationName: inferredLocationName,
          url: this.getPublicUploadUrl('scan-reports', userId, pdfName),
          date: generatedAt,
        },
        {
          id: `scan-report-${excelName}`,
          type: 'scan_report_excel',
          name: `DigitalBrokerage - ${inferredLocationName} - Excel`,
          locationName: inferredLocationName,
          url: this.getPublicUploadUrl('scan-reports', userId, excelName),
          date: generatedAt,
        },
      ],
    };
  }

  async createTransaction(createDto: CreateTransactionDto): Promise<FinancialTransaction> {
    const transaction = this.transactionRepository.create(createDto);
    return this.transactionRepository.save(transaction);
  }

  async updateTransaction(id: string, dto: Partial<CreateTransactionDto>): Promise<FinancialTransaction> {
    const transaction = await this.transactionRepository.findOne({ where: { id } });
    if (!transaction) throw new Error('Transaction not found');
    Object.assign(transaction, dto);
    return this.transactionRepository.save(transaction);
  }

  async deleteTransaction(id: string): Promise<void> {
    const transaction = await this.transactionRepository.findOne({ where: { id } });
    if (!transaction) throw new Error('Transaction not found');
    await this.transactionRepository.remove(transaction);
  }

  async createExpense(createDto: CreateTransactionDto): Promise<FinancialTransaction> {
    createDto.type = TransactionType.EXPENSE;
    createDto.status = TransactionStatus.COMPLETED; // Expenses are usually recorded as completed
    return this.createTransaction(createDto);
  }

  async requestWithdrawal(userId: string, amount: number): Promise<FinancialTransaction> {
    const balance = await this.getUserBalance(userId);
    if (balance < amount) {
      throw new Error('Insufficient balance');
    }

    const transaction = this.transactionRepository.create({
      type: TransactionType.WITHDRAWAL,
      amount: amount,
      fromUserId: userId,
      status: TransactionStatus.PENDING,
      description: 'Withdrawal request',
    });
    return this.transactionRepository.save(transaction);
  }

  async findAll(user: any): Promise<FinancialTransaction[]> {
    const query = this.transactionRepository
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.fromUser', 'fromUser')
      .leftJoinAndSelect('tx.toUser', 'toUser')
      .orderBy('tx.transactionDate', 'DESC');
    await this.applyTransactionScope(query, 'tx', user);
    return query.getMany();
  }

  private escapeCsvValue(value: unknown) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    const escaped = str.replace(/"/g, '""');
    if (/[",\n\r]/.test(escaped)) return `"${escaped}"`;
    return escaped;
  }

  async exportTransactionsCsv(
    user: any,
    filters?: { type?: string; status?: string; startDate?: string; endDate?: string; search?: string },
  ): Promise<string> {
    const query = this.transactionRepository
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.fromUser', 'fromUser')
      .leftJoinAndSelect('tx.toUser', 'toUser')
      .orderBy('tx.transactionDate', 'DESC');

    await this.applyTransactionScope(query, 'tx', user);

    if (filters?.type && filters.type !== 'all') {
      query.andWhere('tx.type = :type', { type: filters.type });
    }
    if (filters?.status && filters.status !== 'all') {
      query.andWhere('tx.status = :status', { status: filters.status });
    }
    if (filters?.startDate) {
      const start = new Date(filters.startDate);
      if (!isNaN(start.getTime())) query.andWhere('tx.transactionDate >= :start', { start: start.toISOString() });
    }
    if (filters?.endDate) {
      const end = new Date(filters.endDate);
      if (!isNaN(end.getTime())) query.andWhere('tx.transactionDate <= :end', { end: end.toISOString() });
    }
    if (filters?.search) {
      const search = `%${filters.search}%`;
      query.andWhere(
        `(
          tx.description ILIKE :search
          OR tx.referenceId ILIKE :search
          OR CAST(tx.id AS text) ILIKE :search
          OR fromUser.firstName ILIKE :search
          OR fromUser.lastName ILIKE :search
          OR toUser.firstName ILIKE :search
          OR toUser.lastName ILIKE :search
        )`,
        { search },
      );
    }

    const rows = await query.getMany();

    const headers = [
      'ID',
      'Reference',
      'Description',
      'Type',
      'Amount',
      'Status',
      'Payment Method',
      'From User',
      'To User',
      'Date',
    ];

    const lines = [
      headers.map((h) => this.escapeCsvValue(h)).join(','),
      ...rows.map((tx) => {
        const fromName = [tx.fromUser?.firstName, tx.fromUser?.lastName].filter(Boolean).join(' ');
        const toName = [tx.toUser?.firstName, tx.toUser?.lastName].filter(Boolean).join(' ');
        return [
          tx.id,
          (tx as any).referenceId || '',
          tx.description || '',
          tx.type || '',
          tx.amount ?? '',
          tx.status || '',
          (tx as any).paymentMethod || '',
          fromName,
          toName,
          tx.transactionDate ? new Date(tx.transactionDate).toISOString() : '',
        ]
          .map((v) => this.escapeCsvValue(v))
          .join(',');
      }),
    ];

    // BOM improves Arabic rendering in Excel
    return `\ufeff${lines.join('\r\n')}`;
  }

  // Get User Transactions (Where user is sender OR receiver)
  async getUserTransactions(userId: string): Promise<FinancialTransaction[]> {
    return this.transactionRepository.find({
      where: [
        { fromUserId: userId },
        { toUserId: userId },
      ],
      order: { transactionDate: 'DESC' },
      relations: ['fromUser', 'toUser']
    });
  }

  // Calculate User Balance (In - Out)
  async getUserBalance(userId: string): Promise<number> {
    const transactions = await this.getUserTransactions(userId);
    let balance = 0.0;

    for (const tx of transactions) {
      if (tx.status === TransactionStatus.FAILED || tx.status === TransactionStatus.CANCELLED) continue;

      // Income
      if (tx.toUserId === userId && tx.status === TransactionStatus.COMPLETED) {
        balance += Number(tx.amount);
      }

      // Outgoing (including pending withdrawals to freeze amount)
      if (tx.fromUserId === userId && (tx.status === TransactionStatus.COMPLETED || tx.type === TransactionType.WITHDRAWAL)) {
        balance -= Number(tx.amount);
      }
    }
    return balance;
  }

  // Dashboard Stats (Admin view usually, or general stats)
  async getDashboardStats(user: any) {
    const scopedIds = await this.getScopedUserIds(user);

    // Financial Stats
    const totalSales = await this.sumAmountByType(TransactionType.SALE, user);
    const totalRentals = await this.sumAmountByType(TransactionType.RENT, user);
    const totalCommission = await this.sumCommission(user);
    const totalRevenue = totalCommission; // Assuming revenue is commission
    const totalTax = await this.sumTax(user);
    const totalExpenses = await this.sumAmountByType(TransactionType.EXPENSE, user);
    const netProfit = totalCommission - totalExpenses;

    // User Stats
    const totalUsers = this.isAdmin(user)
      ? await this.userRepository.count()
      : scopedIds.length;

    // Operations Stats (Bookings)
    // Active = Pending, Accepted, Paid (Not Completed or Cancelled)
    const bookingWhere = this.isAdmin(user)
      ? [
          { status: BookingStatus.PENDING },
          { status: BookingStatus.ACCEPTED },
          { status: BookingStatus.PAID },
        ]
      : [
          { userId: In(scopedIds), status: BookingStatus.PENDING } as any,
          { userId: In(scopedIds), status: BookingStatus.ACCEPTED } as any,
          { userId: In(scopedIds), status: BookingStatus.PAID } as any,
        ];

    const activeOperations = await this.bookingRepository.count({ where: bookingWhere as any });

    const totalBookings = this.isAdmin(user)
      ? await this.bookingRepository.count()
      : await this.bookingRepository.count({ where: { userId: In(scopedIds) } as any });
    const completedBookings = this.isAdmin(user)
      ? await this.bookingRepository.count({ where: { status: BookingStatus.COMPLETED } })
      : await this.bookingRepository.count({ where: { userId: In(scopedIds), status: BookingStatus.COMPLETED } as any });

    // Conversion Rate: Completed / Total (Prevent division by zero)
    const conversionRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0;

    const invoiceBase = this.invoiceRepository.createQueryBuilder('inv');
    await this.applyInvoiceScope(invoiceBase, 'inv', user);
    const invoiceRows = await invoiceBase.getMany();
    const invoiceStats = {
      paidCount: invoiceRows.filter((inv) => inv.status === InvoiceStatus.PAID).length,
      unpaidCount: invoiceRows.filter((inv) => inv.status === InvoiceStatus.UNPAID).length,
      draftCount: invoiceRows.filter((inv) => inv.status === InvoiceStatus.DRAFT).length,
      paidTotal: invoiceRows.filter((inv) => inv.status === InvoiceStatus.PAID).reduce((sum, inv) => sum + Number(inv.total || 0), 0),
      outstandingTotal: invoiceRows.filter((inv) => inv.status === InvoiceStatus.UNPAID).reduce((sum, inv) => sum + Number(inv.total || 0), 0),
    };

    const recentTransactionsQuery = this.transactionRepository
      .createQueryBuilder('tx')
      .orderBy('tx.transactionDate', 'DESC')
      .take(8);
    await this.applyTransactionScope(recentTransactionsQuery, 'tx', user);
    const recentTransactions = await recentTransactionsQuery.getMany();

    const expenseBreakdownQuery = this.transactionRepository
      .createQueryBuilder('tx')
      .select(`COALESCE(tx.expenseCategory, 'Other')`, 'category')
      .addSelect('COALESCE(SUM(tx.amount), 0)', 'total')
      .where('tx.type = :type', { type: TransactionType.EXPENSE })
      .andWhere('tx.status = :status', { status: TransactionStatus.COMPLETED })
      .groupBy('tx.expenseCategory')
      .orderBy('total', 'DESC')
      .limit(6);
    await this.applyTransactionScope(expenseBreakdownQuery, 'tx', user);
    const expenseBreakdown = await expenseBreakdownQuery.getRawMany().then((rows) =>
      rows.map((row) => ({
        category: row.category || 'Other',
        total: Number(row.total || 0),
      })),
    );

    const monthlyTotals = await this.getMonthlyWorkspaceTotals(user);

    return {
      totalUsers,
      activeOperations,
      totalRevenue,
      conversionRate,
      // Extra details if needed by chart or other views
      totalSales,
      totalRentals,
      totalCommission,
      totalExpenses,
      totalTax,
      netProfit,
      invoiceStats,
      recentTransactions,
      expenseBreakdown,
      monthlyTotals,
    };
  }

  async createInvoice(userId: string, dto: {
    amount: number;
    referenceType?: string;
    referenceId?: string;
    description?: string;
    documentUrl?: string;
  }): Promise<Invoice> {
    const serviceFee = 0;
    const tax = dto.amount * 0.15;
    const total = dto.amount + serviceFee + tax;
    const invoice = this.invoiceRepository.create({
      userId,
      amount: dto.amount,
      serviceFee,
      tax,
      total,
      status: InvoiceStatus.UNPAID,
      referenceType: dto.referenceType,
      referenceId: dto.referenceId,
      description: dto.description,
      documentUrl: dto.documentUrl,
    });
    return this.invoiceRepository.save(invoice);
  }

  async getUserInvoices(userId: string): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllInvoices(user: any): Promise<Invoice[]> {
    const query = this.invoiceRepository
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.user', 'user')
      .orderBy('inv.createdAt', 'DESC');
    await this.applyInvoiceScope(query, 'inv', user);
    return query.getMany();
  }

  async findInvoiceById(id: string): Promise<Invoice | null> {
    return this.invoiceRepository.findOne({ where: { id } });
  }

  async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) throw new Error('Invoice not found');
    invoice.status = status;
    return this.invoiceRepository.save(invoice);
  }

  async updateInvoice(id: string, dto: {
    amount?: number;
    description?: string;
    status?: string;
    documentUrl?: string | null;
  }): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) throw new Error('Invoice not found');

    if (typeof dto.amount === 'number' && dto.amount >= 0) {
      invoice.amount = dto.amount;
      invoice.tax = dto.amount * 0.15;
      invoice.total = dto.amount + Number(invoice.serviceFee || 0) + Number(invoice.tax || 0);
    }

    if (dto.description !== undefined) {
      invoice.description = dto.description;
    }

    if (dto.status !== undefined && Object.values(InvoiceStatus).includes(dto.status as InvoiceStatus)) {
      invoice.status = dto.status as InvoiceStatus;
    }

    if (dto.documentUrl !== undefined) {
      invoice.documentUrl = dto.documentUrl || null;
    }

    return this.invoiceRepository.save(invoice);
  }

  async deleteInvoice(id: string): Promise<void> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) throw new Error('Invoice not found');
    await this.invoiceRepository.remove(invoice);
  }

  async payInvoice(userId: string, invoiceId: string, paymentMethod: PaymentMethod): Promise<Invoice> {
    let invoice = await this.invoiceRepository.findOne({
        where: [
            { id: invoiceId, userId },
            { referenceId: invoiceId, userId, referenceType: 'ServiceRequest' }
        ]
    });

    // Auto-generate missing invoice for legacy ServiceRequests
    if (!invoice) {
        const serviceRequest = await this.serviceRequestRepository.findOne({ where: { id: invoiceId, userId }});
        if (serviceRequest && serviceRequest.paymentStatus === PaidStatus.UNPAID) {
            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (user) {
                invoice = this.invoiceRepository.create({
                    user,
                    userId,
                    amount: serviceRequest.price || 0,
                    total: serviceRequest.price || 0,
                    status: InvoiceStatus.UNPAID,
                    description: `فاتورة خدمة: ${serviceRequest.serviceType}`,
                    referenceType: 'ServiceRequest',
                    referenceId: serviceRequest.id,
                });
                invoice = await this.invoiceRepository.save(invoice);
            }
        }
    }

    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === InvoiceStatus.PAID) throw new Error('Invoice already paid');

    if (paymentMethod === PaymentMethod.WALLET) {
      const balance = await this.getUserBalance(userId);
      if (balance < invoice.total) {
        throw new Error('Insufficient balance');
      }

      // Create a transaction to deduct from balance
      const transaction = this.transactionRepository.create({
        type: TransactionType.EXPENSE,
        amount: invoice.total,
        fromUserId: userId,
        status: TransactionStatus.COMPLETED,
        paymentMethod: PaymentMethod.WALLET,
        description: `Payment for Invoice #${invoice.id.substring(0, 8)}: ${invoice.description}`,
        referenceType: 'invoice',
        referenceId: invoice.id,
      });
      await this.transactionRepository.save(transaction);
    }

    invoice.status = InvoiceStatus.PAID;

    // IF this invoice is linked to a ServiceRequest, update the ServiceRequest status
    if (invoice.referenceType === 'ServiceRequest' && invoice.referenceId) {
      const serviceRequest = await this.serviceRequestRepository.findOne({ where: { id: invoice.referenceId } });
      if (serviceRequest) {
        serviceRequest.paymentStatus = PaidStatus.PAID;
        // Auto-approve Construction and Legal on payment
        if (['construction', 'legal'].includes(serviceRequest.category)) {
            serviceRequest.adminAccepted = true;
        }
        await this.serviceRequestRepository.save(serviceRequest);
      }
    }

    return this.invoiceRepository.save(invoice);
  }

  async getUserCommissions(userId: string): Promise<Commission[]> {
    return this.commissionRepository.find({
      where: { creatorId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateCommissionForAdmin(id: string, dto: {
    status?: string;
    finalCommissionAmount?: number;
    notes?: string;
    attachmentUrl?: string;
  }, user: any): Promise<Commission> {
    const commission = await this.commissionRepository.findOne({ where: { id } });
    if (!commission) throw new Error('Commission not found');

    const previousStatus = commission.status;

    if (dto.status !== undefined && Object.values(CommissionStatus).includes(dto.status as CommissionStatus)) {
      commission.status = dto.status as CommissionStatus;
      if (commission.status === CommissionStatus.APPROVED && !commission.approvedAt) {
        commission.approvedAt = new Date();
        commission.reviewedAt = new Date();
        commission.reviewedById = user?.userId || user?.id;
      } else if (commission.status === CommissionStatus.REJECTED) {
        commission.reviewedAt = new Date();
        commission.reviewedById = user?.userId || user?.id;
      } else if (commission.status === CommissionStatus.PAID && !commission.paidAt) {
        commission.paidAt = new Date();
      }
    }

    if (typeof dto.finalCommissionAmount === 'number' && dto.finalCommissionAmount >= 0) {
      commission.finalCommissionAmount = dto.finalCommissionAmount;
    }

    if (dto.notes !== undefined) {
      commission.notes = dto.notes;
    }

    if (dto.attachmentUrl) {
      commission.attachments = [...(commission.attachments || []), dto.attachmentUrl];
    }

    const saved = await this.commissionRepository.save(commission);
    if (
      dto.status &&
      (saved.status === CommissionStatus.APPROVED || saved.status === CommissionStatus.PAID) &&
      previousStatus !== saved.status
    ) {
      await this.createCommissionTransaction(saved);
    }

    return saved;
  }

  async deleteCommissionForAdmin(id: string): Promise<void> {
    const commission = await this.commissionRepository.findOne({ where: { id } });
    if (!commission) throw new Error('Commission not found');
    await this.commissionRepository.remove(commission);
  }

  async removeCommissionAttachment(id: string, url: string): Promise<Commission> {
    const commission = await this.commissionRepository.findOne({ where: { id } });
    if (!commission) throw new Error('Commission not found');
    commission.attachments = (commission.attachments || []).filter((item) => item !== url);
    return this.commissionRepository.save(commission);
  }

  private async createCommissionTransaction(commission: Commission): Promise<void> {
    const existing = await this.transactionRepository.findOne({
      where: { referenceType: 'commission', referenceId: commission.id, toUserId: commission.creatorId },
    });
    if (existing) return;

    await this.createTransaction({
      type: TransactionType.COMMISSION,
      amount: commission.finalCommissionAmount || commission.commissionAmount,
      toUserId: commission.creatorId,
      commissionAmount: commission.commissionAmount,
      taxAmount: commission.taxAmount,
      status: TransactionStatus.COMPLETED,
      referenceType: 'commission',
      referenceId: commission.id,
      description: `Commission ${commission.commissionNumber} - ${commission.type}`,
    });
  }

  async getUserFiles(userId: string): Promise<any[]> {
    const invoices = await this.invoiceRepository.find({
      where: { userId },
      // Select all necessary fields for the modal
      select: ['id', 'documentUrl', 'createdAt', 'referenceType', 'description', 'amount', 'total', 'status', 'serviceFee', 'tax'],
    });

    const commissions = await this.commissionRepository.find({
      where: { creatorId: userId },
      select: ['id', 'attachments', 'createdAt', 'commissionNumber', 'type', 'totalAmount', 'commissionAmount', 'propertyType', 'city'],
    });

    const files: any[] = [];

    // Map Invoices with documents
    invoices.forEach(inv => {
        if (inv.documentUrl) {
            files.push({
                id: inv.id,
                type: 'invoice',
                name: `Invoice #${inv.id.substring(0, 8)}`,
                url: inv.documentUrl,
                date: inv.createdAt,
                description: inv.description,
                // Pass full object for modal
                raw: inv
            });
        }
    });

    // Map Commission attachments
    commissions.forEach(comm => {
        if (comm.attachments && comm.attachments.length > 0) {
            comm.attachments.forEach((url, index) => {
                files.push({
                    id: `${comm.id}-${index}`,
                    type: 'commission_doc',
                    name: `Commission #${comm.commissionNumber} - Doc ${index + 1}`,
                    url: url,
                    date: comm.createdAt,
                    description: `Document for Commission ${comm.commissionNumber}`,
                    // Pass full object for commission details if needed
                    raw: comm
                });
            });
        }
    });

    const scanReports = await this.listUserScanReportFiles(userId);
    files.push(...scanReports);

    return files.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getAllFiles(user: any): Promise<any[]> {
    const scopedUserIds = await this.getScopedUserIds(user);
    const users = this.isAdmin(user)
      ? await this.userRepository.find({ select: ['id', 'firstName', 'lastName', 'email', 'phone'] as any })
      : await this.userRepository.find({
          where: scopedUserIds.map((id) => ({ id })) as any,
          select: ['id', 'firstName', 'lastName', 'email', 'phone'] as any,
        });

    const allFiles = await Promise.all(users.map(async (fileUser) => {
      const files = await this.getUserFiles(fileUser.id);
      return files.map((file) => ({ ...file, user: fileUser, userId: fileUser.id }));
    }));

    return allFiles.flat().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getCommissions(user: any) {
      // Aggregate commissions by status or time
      // This is a placeholder for more complex aggregation if needed
      const query = this.transactionRepository
        .createQueryBuilder('tx')
        .where('tx.type = :type', { type: TransactionType.COMMISSION })
        .orderBy('tx.transactionDate', 'DESC');
      await this.applyTransactionScope(query, 'tx', user);
      return query.getMany();
  }

  private async sumAmountByType(type: TransactionType, user: any): Promise<number> {
    const query = this.transactionRepository
      .createQueryBuilder('tx')
      .select('SUM(tx.amount)', 'sum')
      .where('tx.type = :type', { type })
      .andWhere('tx.status = :status', { status: TransactionStatus.COMPLETED });
    await this.applyTransactionScope(query, 'tx', user);
    const { sum } = await query.getRawOne();
    return Number(sum) || 0;
  }

  private async sumCommission(user: any): Promise<number> {
    const query = this.transactionRepository
      .createQueryBuilder('tx')
      .select('SUM(tx.commissionAmount)', 'sum')
      .where('tx.status = :status', { status: TransactionStatus.COMPLETED });
    await this.applyTransactionScope(query, 'tx', user);
    const { sum } = await query.getRawOne();
    return Number(sum) || 0;
  }

  private async sumTax(user: any): Promise<number> {
    const query = this.transactionRepository
      .createQueryBuilder('tx')
      .select('SUM(tx.taxAmount)', 'sum')
      .where('tx.status = :status', { status: TransactionStatus.COMPLETED });
    await this.applyTransactionScope(query, 'tx', user);
    const { sum } = await query.getRawOne();
    return Number(sum) || 0;
  }

  private async getMonthlyWorkspaceTotals(user: any) {
    const today = new Date();
    const startD = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    const query = this.transactionRepository
      .createQueryBuilder('tx')
      .where('tx.transactionDate >= :startD', { startD })
      .andWhere('tx.status = :status', { status: TransactionStatus.COMPLETED });
    await this.applyTransactionScope(query, 'tx', user);
    const rows = await query.getMany();

    const buckets = Array.from({ length: 6 }).map((_, idx) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (5 - idx), 1);
      return {
        key: `${d.getFullYear()}-${d.getMonth()}`,
        month: d.toLocaleString('en-US', { month: 'short' }),
        income: 0,
        expenses: 0,
        net: 0,
      };
    });

    rows.forEach((tx) => {
      const d = new Date(tx.transactionDate);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = buckets.find((item) => item.key === key);
      if (!bucket) return;
      if ([TransactionType.SALE, TransactionType.RENT, TransactionType.COMMISSION, TransactionType.DEPOSIT, TransactionType.SETTLEMENT].includes(tx.type)) {
        bucket.income += Number(tx.amount || 0);
      } else if (tx.type === TransactionType.EXPENSE || tx.type === TransactionType.WITHDRAWAL || tx.type === TransactionType.TAX) {
        bucket.expenses += Number(tx.amount || 0);
      }
      bucket.net = bucket.income - bucket.expenses;
    });

    return buckets.map(({ key, ...rest }) => rest);
  }

  async getChartData(user: any, status?: string, startDate?: string, endDate?: string) {
    const today = new Date();
    let startD: Date;
    let endD: Date = today;

    if (startDate && endDate) {
        startD = new Date(startDate);
        endD = new Date(endDate);
    } else {
        // Fallback to last year if no range provided
        startD = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    }

    const query = this.transactionRepository.createQueryBuilder('tx')
      .where('tx.transactionDate >= :startD', { startD })
      .andWhere('tx.transactionDate <= :endD', { endD });
    await this.applyTransactionScope(query, 'tx', user);

    if (status && status !== 'ALL') {
      query.andWhere('tx.status = :status', { status });
    } else if (!status) {
        // Default to completed only if no status filter is applied explicitly
        query.andWhere('tx.status = :status', { status: TransactionStatus.COMPLETED });
    }

    const transactions = await query.getMany();

    const monthlyData = new Array(12).fill(0);

    transactions.forEach(tx => {
      const date = new Date(tx.transactionDate);
      const month = date.getMonth();
      monthlyData[month] += Number(tx.amount);
    });

    const result: number[] = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthIndex = d.getMonth();
        result.push(monthlyData[monthIndex]);
    }

    return result;
  }
}
