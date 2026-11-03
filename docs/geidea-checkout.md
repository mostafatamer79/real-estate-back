# Geidea checkout setup and testing

The backend creates signed checkout sessions. The frontend loads Geidea's HPP
SDK only when payment starts. Card data goes to Geidea. API credentials stay on
the backend. The integration supports one-time booking, invoice, subscription and wallet top-up
payments in SAR. It does not implement automatic recurring charges.

## Current connection check (15 October 2026)

The first supplied credential pair returned `110.080`, `Cash on Delivery and
Online payment are not configured`, without creating a session. Its test/live
classification remains unconfirmed.

A subsequent credential pair, explicitly labelled **Live** in Geidea's merchant
email, successfully created a signed SAR 1 session: HTTP `200`, response code
`000`, detailed response code `000`, status `Initiated`. The session was not
opened and no card details or payment were submitted. This confirms session
creation with the live credentials; it does not verify a completed payment,
website callback, or sandbox account. No real keys were saved in this repository.

The diagnostic request used non-delivering `example.invalid` callback and return
URLs and did not exercise website callbacks.

### Deployment discovered through SSH

Read-only inspection of SSH alias `digital` confirmed:

| Setting | Value |
| --- | --- |
| Canonical website | `https://www.digitalbrokerage.sa` |
| API base | `https://www.digitalbrokerage.sa/api` |
| Geidea callback to configure | `https://www.digitalbrokerage.sa/api/payment/geidea/callback` |
| Geidea return page to configure | `https://www.digitalbrokerage.sa/wallet` |
| Frontend directory | `/var/www/digitalbrokerage/real-estate-front` |
| Backend directory | `/var/www/digitalbrokerage/real-estate-back` |
| Frontend process | PM2 `digitalbrokerage-front`, port `3000` |
| Backend process | PM2 `digitalbrokerage-api`, port `3030`, entry `dist/src/main.js` |

Nginx redirects the bare domain to `www`, proxies `/api/` to the backend and `/`
to the frontend. The Geidea integration is deployed with live mode enabled. An
authenticated request against an existing unpaid invoice returned HTTP `201`
and a Geidea checkout session. Creating that session did not submit a payment or
change the invoice status. Public health checks returned website HTTP `200`,
unauthenticated session HTTP `401`, and an empty callback HTTP `400`.

The Apple Pay association URL still returns HTTP `404`: the original attachment
was not supplied or found in either deployed project. Nginx now has an exact
static route ready for that file. Apple Pay activation remains pending the file
and Geidea's domain configuration.

The appended download-and-execute payload was removed from backend
`eslint.config.mjs` locally and on the server. Originals are retained in private
deployment backups. Existing backend `.env` changes were preserved; the new live
Geidea keys are stored outside both Git repositories at
`/etc/digitalbrokerage/geidea.env` (directory mode `0700`, file mode `0600`).
The PM2 ecosystem file loads this protected configuration only into the API app.
Its existing missing-comma syntax errors were repaired, and PM2's saved process
configuration is restricted to `0600`. A scan of built frontend assets found no
Geidea API password.

Backups are under `/var/backups/digitalbrokerage/`. The first activation was
automatically rolled back because plain `tsc` did not rewrite the project's
absolute `src/` imports. Production builds must use
`node node_modules/@nestjs/cli/bin/nest.js build`. A later runtime check also
caught Geidea's non-RFC GUID variant; provider session/order IDs now accept
Geidea's hexadecimal GUID format, while local item IDs remain UUID-validated.

## Configuration

Use the merchant **test gateway** public key and API password from Payment
Gateway → Gateway Settings. Portal email/password are not API credentials.
Geidea uses region-specific hosts; test/live operation is determined by the
merchant gateway credentials. `GEIDEA_MODE=test` validates fetched orders' `isTest`
flag; it does not convert live keys into test keys.

Configure the backend through its deployment secret manager or an ignored env
file in a clean checkout:

```dotenv
GEIDEA_ENABLED=true
GEIDEA_REGION=KSA
GEIDEA_MODE=test
GEIDEA_MERCHANT_PUBLIC_KEY=<test gateway public key>
GEIDEA_API_PASSWORD=<test gateway API password>
GEIDEA_CALLBACK_URL=https://<your backend host>/api/payment/geidea/callback
GEIDEA_RETURN_URL=https://<your frontend host>/wallet
```

`GEIDEA_CALLBACK_URL` is a public HTTPS endpoint on **your backend**, not Geidea's
Create Session URL. A localhost backend cannot receive gateway callbacks without
a public HTTPS development tunnel. `GEIDEA_RETURN_URL` is on **your frontend**.
Allow the frontend origin in backend `CORS_ORIGIN`.

Configure and rebuild the frontend:

```dotenv
NEXT_PUBLIC_API_URL=https://<your backend host>/api
NEXT_PUBLIC_GEIDEA_ENABLED=true
```

Never prefix an API password with `NEXT_PUBLIC_`. Leaving the flag disabled
preserves the existing checkout options. Enabling it routes the normal card
option through Geidea for invoices/bookings and uses Geidea for booking payments
in chat.

### Live deployment

The credentials labelled Live by Geidea must be used with `GEIDEA_MODE=live`
on the backend. Keep live credentials in the deployment secret manager, and
configure the real public callback/return URLs before enabling checkout. This
mode permits real payments. Keep confirmed test credentials and a test database
for sandbox acceptance checks; the successful live session check does not replace
those checks.

### Apple Pay domain verification

Geidea's merchant email requests the exact attached domain-association file at:

```text
https://<your actual website host>/.well-known/apple-developer-merchantid-domain-association
```

The email text does not contain the attachment, and no matching file was found
in this workspace. Obtain the original attachment; do not generate a substitute.
For this Next.js frontend, place the supplied file unchanged at
`public/.well-known/apple-developer-merchantid-domain-association`, deploy it,
and verify that the public HTTPS URL returns the exact file without requiring
authentication. Share the actual website URL with Geidea so they can complete
Apple Pay configuration. This file belongs on the customer-facing website host;
it is separate from the backend payment callback.

## Routes and verification

- `POST /api/payment/geidea/session`: authenticated `{ invoiceId, language }` or
  `{ bookingId, language }`; exactly one ID. Ownership, payable status and stored
  amount are checked. Returns `{ sessionId, scriptUrl }`.
- `POST /api/payment/geidea/verify`: authenticated `{ orderId }`. The browser
  calls this after SDK success, and ownership is checked again.
- `POST /api/payment/geidea/callback`: public Geidea notification. Accepts
  `{ order: { orderId } }` or `{ orderId }`.

Both verification routes independently fetch the order with backend credentials
from `/pgw/api/v1/direct/order/{orderId}`. Webhook bodies and browser success
events are never trusted as proof of payment. The fetched merchant key, order ID,
merchant reference, SAR amount, test/live flag, `Success` status and `Paid`
detailed status must match. Invoice/booking UUIDs are used as merchant references.
Settlement uses a database transaction and row lock so duplicate notifications
do not apply the paid transition twice. Failed/cancelled orders do not mark items
paid, and cancelled local items cannot be resurrected.

When a paid invoice references a `ServiceRequest`, the same transaction marks
that request paid and applies the existing automatic approval rule for legal and
construction services.

The frontend displays success only after backend verification. If verification
is delayed, its next action rechecks the same order instead of creating another
payment. Pending state is held in the mounted checkout component; after a page
reload, inspect the invoice/booking status before starting another payment.
Callback settlement updates the paid status directly; it does not emit the
booking service's status-change notification.

## Sandbox acceptance checks

Use an isolated test database and confirmed test gateway keys. Once Geidea has
enabled online payments:

1. Sign into the site as the owner of an unpaid invoice or payable booking.
2. Select Geidea and confirm the amount matches the backend record.
3. Use Geidea's documented test Visa `4440000042200014`, expiry `01/39`, CVV `100`
   for the frictionless success scenario. Verify the item is marked paid in the
   backend and the transaction is visible in the merchant portal.
4. Use documented decline expiry `05/39`; verify the item remains unpaid.
5. Cancel checkout; verify the item remains unpaid and the UI reports cancellation.
6. Redeliver the same order notification; verify no duplicate paid transition.
7. Try another user's item and a changed client-side amount; verify access is
   denied and pricing comes from the database.

Automated verification without real credentials:

```sh
# Backend (avoids the existing unsafe lint config)
node node_modules/jest/bin/jest.js --runInBand
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.build.json

# Frontend
node tests/geidea-checkout.test.cjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
```

Official references:

Final verification: 32 backend tests and all six Geidea checkout tests passed.
Both production builds passed. The deployed authenticated invoice-to-session
request returned HTTP `201`. No card payment, successful live webhook, or Apple
Pay transaction was submitted. The full frontend test run passed 14 of 15 files;
the existing `mobile-header-footer-polish.test.cjs` assertion still fails. Existing
chat lint errors also remain; Geidea production files have no lint errors.

- [HPP checkout](https://docs.geidea.net/docs/geidea-checkout-v2)
- [Create Session](https://docs.geidea.net/reference/create-session-v2-1)
- [Fetch order](https://docs.geidea.net/docs/fetch-1)
- [Gateway prerequisites](https://docs.geidea.net/docs/pre-requisites)
- [Test cards](https://docs.geidea.net/docs/test-cards)

## Wallet and subscriptions (16 October 2026)

Checkout accepts exactly one target: `bookingId`, `invoiceId`, `subscriptionId`,
or `walletTopupAmount`. Subscription totals come from the stored subscription.
Top-ups accept 1–10,000 SAR with at most two decimal places. A session creates
an unpaid invoice; only an independently fetched, matching Geidea paid order
credits the wallet or activates the subscription.

Settlement locks the invoice and performs invoice status, ledger entry, subscription
activation and department access changes in one transaction. Duplicate callbacks
produce one credit. Card purchases appear in wallet activity with the
`geidea_payment` reference type and do not subtract stored wallet funds. Wallet
spending and withdrawal reservations lock the user row to prevent concurrent
overspending. Service invoice fulfillment validates the linked service owner
and minimum stored price.

Non-admin users cannot directly activate paid subscriptions or change billing
fields to bypass checkout. Existing administrative activation remains available.
Pending browser order IDs persist in session storage scoped to customer and
payment target, allowing status verification after a temporary network failure.

`test/geidea-postgres-check.cjs` runs the actual billing, subscription and financial
services against a uniquely named PostgreSQL schema. Gateway responses are fake.
It verifies 12 scenarios including concurrent callbacks, competing wallet spends,
withdrawal reservations, ownership, failed/wrong-amount orders and transaction
rollback after a forced ledger failure. It drops the schema in `finally`. Run it
from the backend directory after the Nest build with DB_* connection variables
configured. It submits no payment and changes no production table rows.

A completed live card transaction has not been submitted during this work.
Apple Pay still requires the original association attachment at the exact public
path and Geidea's activation of `www.digitalbrokerage.sa`.

### Deployment verification

The wallet/subscription extension was deployed on 16 October 2026. Both PM2
services were online, public `/` and `/wallet` returned HTTP 200, unauthenticated
wallet access returned 401, and an authenticated invoice-to-Geidea session request
returned 201 with a real session. No card details or payment were submitted.
Validation: 56 backend tests, 8 checkout tests, backend build, frontend production
build and TypeScript, and 12 isolated PostgreSQL scenarios passed. Changed checkout
files linted without errors; existing wallet-page lint warnings remain. The wider
frontend suite has an unrelated `mobile-header-footer-polish.test.cjs` failure.

The first activation of this extension rolled back when the health probe treated
normal startup connection refusal as fatal. The corrected startup retry succeeded.
Its backup is `/var/backups/digitalbrokerage/geidea-wallet-20261016-02`.
