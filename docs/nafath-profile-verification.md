# Nafath verification from the profile

Users sign in using the existing email OTP flow. They may browse without completing their profile or verifying an identity. Non-admin accounts must complete Nafath verification before business writes (offers, bookings, requests, payments, messages, etc.). Auth, personal profile maintenance and profile uploads remain available. Normal role and department authorization still applies. Administrator administration remains exempt from the identity gate. A subscription is not required for an unverified account's read-only browsing; normal subscription rules resume after verification.

The profile starts verification through an authenticated backend endpoint and redirects the current browser tab to the signed URL returned by Elm. Successful verification updates the existing account. It never creates a second account or signs the user in as a different account.

## Source documents and differences

Read against the supplied `Nafath Authentication Service 3.0.1 1 8.pdf`, `Nafath-OIDC V2.postman_collection web 2.json`, and production requirements DOCX. These documents describe the **web OIDC service**. The pasted email refers to subscribing to **Nafath App (experimental)**. Confirm with Elm that the provisioned App ID is enabled for the supplied OIDC API; an App-only subscription and these web endpoints may be different entitlements. No purchase or message to Elm was made as part of the code change.

- Create session: GET `/api/v2/oidc/session?locale=ar|en&requestId=<UUID>`; store the returned session ID and hashed state against the signed-in user.
- Receive callback: `state`, not an MFA token/transId/random number.
- Retrieve JWT: POST `/api/v2/oidc/jwt` with `{ "state": "..." }`.
- Verify RS256 locally with a JWK matching `kid`; validate issuer, audience, expiry, optional not-before/issued-at, and identity claims before persistence.
- The PDF's JWK section still gives `/api/v1/mfa/jwk`; the OIDC collection gives `/api/v2/oidc/jwk`. Default to the collection and use `NAFATH_JWK_PATH` only when Elm confirms a different endpoint.
- The PDF does not define the `hashedState` encoding. Correlation supports SHA-256 of the returned raw state in base64, base64url or hex. Confirm the actual sandbox response before production. Request ID alone never authenticates a callback.

## Database rollout

Apply `docs/migrations/2026-10-20-nafath-profile-verification.sql` to the application database **before** deploying the backend. Production schema synchronization remains disabled. The additive migration introduces `users.nafathVerifiedAt` and nullable OIDC state/IP columns. Existing general `isVerified` values and mock OTP verifications do not become proof of Nafath verification. All account-creation paths ignore any supplied verification timestamp; only the verified provider callback may set it. Verified national IDs cannot be changed through ordinary profile/admin updates. There is deliberately no backfill.

If rolling application code back, retain the nullable columns. Do not delete or reassign existing identity data automatically. An identity already linked to a different account requires support review, including old mock identity values.

## Server configuration

Use server-only variables from `.env.example`:

| Variable | Meaning |
| --- | --- |
| `NAFATH_ENFORCE_VERIFICATION` | Defaults to true; an explicit false temporarily defers HTTP/chat action restrictions while provider activation is pending |
| `NAFATH_BASE_URL` | Sandbox `https://rabet-nafath.api.elm.sa/nafath-sandbox`, staging `https://rabet-nafath.api.elm.sa/stg`, production `https://rabet-nafath.api.elm.sa` |
| `NAFATH_APP_ID`, `NAFATH_APP_KEY` | Real Rabet credentials for the assigned environment/service |
| `NAFATH_AUDIENCE` | Exact Entity ID/domain registered with Elm, including scheme/trailing-slash spelling |
| `NAFATH_ISSUER` | Provider-confirmed issuer; defaults to the OIDC collection's `https://www.iam.gov.sa/userauth` |
| `NAFATH_JWK_PATH` | `/api/v2/oidc/jwk`, unless Elm confirms the PDF's older JWK path |
| `NAFATH_CLIENT_IP` | Client server's public outbound IP; sent after the end-user IP in `X-Forwarded-For` on every provider call |
| `NAFATH_RETURN_URL` | Fixed HTTPS frontend `/profile` URL, without query or fragment |
| `TRUST_PROXY` | Optional exact trusted reverse proxy IP/subnet, so Express `req.ip` reports the real end user; never enable trust for arbitrary incoming clients |

Do not expose credentials as `NEXT_PUBLIC_*` variables. Missing credentials/audience/client IP or an invalid return URL stop verification with a controlled error. Provider errors log only endpoint and HTTP status. Application Nafath query strings are redacted; configure equivalent redaction in reverse-proxy/access logs because callbacks and status requests carry state or a polling secret.

## Callback registration

The requirements document asks for the service-provider/platform names in Arabic and English, App ID, service description, and separate production/preproduction Entity IDs and callbacks. The callback must be a publicly accessible HTTPS endpoint under the registered Entity ID domain. The integration guide additionally requires hosting it inside Saudi Arabia. The supplied files contain requirements rather than proof that any account or callback is provisioned.

Register `https://<registered-domain>/api/auth/nafath/callback` with Elm and route that path to Nest. The same domain should serve/proxy the API to satisfy the DOCX's callback-domain rule. This exact public callback path accepts cross-origin form navigation without granting a CORS read permission; ordinary API CORS restrictions remain in force.

- **GET browser return:** exchanges the state, verifies the token, and redirects with HTTP 303 to the fixed profile return URL. Failure also returns to the profile with a retry message, without exposing tokens or identity data.
- **POST callback:** accepts JSON or form-urlencoded `state`. API/server callers receive HTTP 200 with `true`, as specified by the PDF. A browser form POST explicitly accepting `text/html` receives HTTP 303 back to the profile (including failures); this handles browser returns without leaving the user looking at a `true` response. Test the actual sandbox callback transport and Accept header before rollout.
- **Frontend state return:** the profile also accepts a browser return with `?state=...`; it sends that state to the authenticated `/auth/nafath/complete` endpoint with its pending request ID and secret. The server still requires ownership and the provider's state hash to match. Callback parameters are removed from the browser URL after reading.

The pending request is kept in sessionStorage, scoped to the initiating account and tab. It expires after five minutes. A successful public callback can be picked up by refreshing the profile even if browser storage was lost. Status responses never include new platform access or refresh tokens. Callback and polling/expiry processing share a database row lock; duplicate callbacks are serialized and acknowledged without exchanging the single-use state again.

## Required live acceptance checks

Local tests cover mocked Elm responses and real RSA signatures. They do not prove Rabet provisioning, state encoding, callback transport, outbound IP approval, Saudi hosting, or provider connectivity. A local backend `.env` is absent in this checkout, so the database migration and real provider calls were not performed.

With the actual sandbox credentials and registered callback:

1. Apply the additive SQL migration, set server configuration, and confirm the callback route is publicly reachable through the registered domain.
2. Sign in with email without Nafath; browse listings with an incomplete profile. Verify that creating a request/payment/offer and sending chat messages return `NAFATH_VERIFICATION_REQUIRED` and link to profile verification.
3. Start verification from the profile. Check the provider creates an OIDC session, preserves the right owner, and accepts the required headers and locale.
4. Complete/cancel the provider flow. Confirm the documented callback transport, state encoding, issuer, audience, JWK path and browser return. Never substitute unverified decoded claims for signature verification.
5. Confirm a successful callback updates only that account, persists the verified ID/timestamp, leaves the account's platform role unchanged, and enables actions subject to existing role/subscription rules. Retry an identical callback; verify it succeeds without exchanging state twice.
6. Test expiry, a different signed-in owner, an already-linked identity, and an invalid token. These must never verify a profile.
