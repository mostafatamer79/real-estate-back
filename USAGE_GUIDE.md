# Real Estate Backend - Usage Guide

## English

### Project Overview

This is the backend API for the Real Estate Platform. It is built with NestJS, TypeORM, and supports PostgreSQL/SQLite databases.

### Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Configure required values in `.env`:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
   - `DB_SYNCHRONIZE`
   - `ACCESS_TOKEN_SECRET`
   - `REFRESH_TOKEN_SECRET`
   - `CORS_ORIGIN`

4. Run in development mode:
   ```bash
   npm run start:dev
   ```

5. Run in production:
   ```bash
   npm run build
   npm run start:prod
   ```

### Main Modules

| Module | Route | Purpose |
|--------|-------|---------|
| Auth | `/auth` | OTP-based login with email or phone |
| Users | `/users` | User management and roles |
| Properties | `/properties` | Property, unit, tenant, lease, and payment management |
| Offers | `/offers` | Buy/sell offers |
| Orders | `/orders` | Property buy/rent requests |
| Subscriptions | `/subscriptions` | Subscription plans and billing |
| Payments | `/payments` | Stripe payment processing |
| Bookings | `/bookings` | Visit appointments |
| Chat | `/chat` | Real-time messaging rooms |
| Notifications | `/notifications` | Push and in-app notifications |
| Wallet/Finance | `/financial` | Invoices, commissions, wallet balance |
| Legal Disputes | `/legal-disputes` | Legal case tracking |
| Customer Service | `/customer-service-feedback` | Support tickets |
| Marketing | `/marketing` | Campaigns and marketing content |
| Dashboard | `/dashboard` | Statistics and analytics |
| Settings | `/settings` | Platform configuration |
| Service Requests | `/service-requests` | Service order management |

### Authentication Flow

1. Client posts email or phone to `/auth/register`
2. Server sends OTP code
3. Client posts email/phone + OTP to `/auth/verify-otp`
4. Server returns access token and refresh token
5. Client sends access token in `Authorization: Bearer <token>` header
6. Use `/auth/refresh` to refresh tokens
7. Call `/auth/logout` to invalidate session

### User Roles

| Role | Access |
|------|--------|
| admin | Full platform control |
| user | Standard beneficiary |
| viewer | Read-only access |
| agent | Real estate agent |
| broker | Real estate office |
| owner | Property owner |
| manager | Manager |
| employee | Employee |
| marketing / marketing_admin | Marketing department |
| legal / legal_admin | Legal department |
| finance / finance_admin | Finance department |

### Admin First-Time Setup

1. Login as admin via `/auth/register` and `/auth/verify-otp`
2. Go to frontend `/admin/settings` or call `/settings` endpoints to configure:
   - Application name and logo
   - Section flags (enable/disable features)
   - Login method flags (email/phone)
   - Module messages
3. Create subscription packages via `/admin/packages` frontend or `/management-packages` API
4. Invite or manage users via `/admin/users` frontend or `/users` API
5. Review dashboard statistics via `/dashboard` or `/financial/dashboard-stats`

### Running Tests

```bash
npm test
npm run test:e2e
```

### Production Notes

- `DB_SYNCHRONIZE=true` should only be used when you intentionally want schema auto-migration.
- Set `DB_SSL=true` when hosted Postgres requires SSL.
- Uploaded files use `/tmp/uploads` in serverless/production mode.

---

## العربية

### نظرة عامة

هذا هو الواجهة الخلفية (Backend API) لمنصة العقارات. مبني باستخدام NestJS وTypeORM ويدعم قواعد بيانات PostgreSQL وSQLite.

### البدء السريع

1. تثبيت الاعتماديات:
   ```bash
   npm install
   ```

2. نسخ متغيرات البيئة:
   ```bash
   cp .env.example .env
   ```

3. ضبط القيم المطلوبة في `.env`:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
   - `DB_SYNCHRONIZE`
   - `ACCESS_TOKEN_SECRET`
   - `REFRESH_TOKEN_SECRET`
   - `CORS_ORIGIN`

4. التشغيل في وضع التطوير:
   ```bash
   npm run start:dev
   ```

5. التشغيل في الإنتاج:
   ```bash
   npm run build
   npm run start:prod
   ```

### الوحدات الرئيسية

| الوحدة | المسار | الغرض |
|--------|--------|-------|
| Auth | `/auth` | تسجيل الدخول عبر OTP بالبريد أو الجوال |
| Users | `/users` | إدارة المستخدمين والأدوار |
| Properties | `/properties` | إدارة العقارات والوحدات والمستأجرين والعقود والمدفوعات |
| Offers | `/offers` | عروض البيع والشراء |
| Orders | `/orders` | طلبات شراء أو إيجار العقارات |
| Subscriptions | `/subscriptions` | خطط الاشتراك والفواتير |
| Payments | `/payments` | معالجة المدفوعات عبر Stripe |
| Bookings | `/bookings` | مواعيد الزيارة |
| Chat | `/chat` | غرف المحادثة الفورية |
| Notifications | `/notifications` | الإشعارات |
| Wallet/Finance | `/financial` | الفواتير والعمولات ورصيد المحفظة |
| Legal Disputes | `/legal-disputes` | متابعة القضايا القانونية |
| Customer Service | `/customer-service-feedback` | تذاكر الدعم |
| Marketing | `/marketing` | الحملات والتسويق |
| Dashboard | `/dashboard` | الإحصائيات والتحليلات |
| Settings | `/settings` | إعدادات المنصة |
| Service Requests | `/service-requests` | إدارة طلبات الخدمات |

### تدفق المصادقة

1. يرسل العميل البريد أو الجوال إلى `/auth/register`
2. يرسل الخادم رمز OTP
3. يرسل العميل البريد/الجوال + OTP إلى `/auth/verify-otp`
4. يرجع الخادم access token و refresh token
5. يرسل العميل التوكن في الهيدر `Authorization: Bearer <token>`
6. استخدم `/auth/refresh` لتجديد التوكن
7. استدعِ `/auth/logout` لإنهاء الجلسة

### أدوار المستخدمين

| الدور | الصلاحيات |
|------|-----------|
| admin | تحكم كامل بالمنصة |
| user | مستفيد عادي |
| viewer | صلاحية قراءة فقط |
| agent | وسيط عقاري |
| broker | مكتب عقاري |
| owner | صاحب عقار |
| manager | مدير |
| employee | موظف |
| marketing / marketing_admin | إدارة التسويق |
| legal / legal_admin | الإدارة القانونية |
| finance / finance_admin | الإدارة المالية |

### إعداد المسؤول لأول مرة

1. سجل الدخول كمسؤول عبر `/auth/register` ثم `/auth/verify-otp`
2. اذهب إلى واجهة `/admin/settings` أو استخدم نقاط النهاية `/settings` لضبط:
   - اسم التطبيق والشعار
   - أعلام الأقسام (تفعيل/تعطيل)
   - إعدادات تسجيل الدخول (بريد/جوال)
   - رسائل الوحدات
3. أنشئ باقات الاشتراك عبر `/admin/packages` أو API `/management-packages`
4. أضف أو أدر المستخدمين عبر `/admin/users` أو API `/users`
5. راجع إحصائيات لوحة التحكم عبر `/dashboard` أو `/financial/dashboard-stats`

### تشغيل الاختبارات

```bash
npm test
npm run test:e2e
```

### ملاحظات الإنتاج

- استخدم `DB_SYNCHRONIZE=true` فقط عندما تريد الترحيل التلقائي للمخطط بشكل مقصود.
- فعّل `DB_SSL=true` عندما يتطلب Postgres المستضاف SSL.
- الملفات المرفوعة تُستخدم في `/tmp/uploads` في وضع الإنتاج/الخادم بدون خادم.
