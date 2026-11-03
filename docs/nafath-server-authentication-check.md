# Nafath server authentication check — 2026-10-20

The actual running production API was inspected through its PM2 process and initial process environment, not just the environment file. No credential values are recorded here. No live environment, database schema, process, subscription, or customer identity was changed during these checks.

## Environment precedence

The App ID agrees between the backend `.env`, PM2 and the running process. The App key and base URL do not agree:

- `.env` contains one key and points at `/nafath-sandbox`.
- The running process and PM2 contain another key and point at the production root URL.
- PM2's inherited process values take precedence over `.env` loading. Reloading a file alone does not replace these cached process values.
- Both key values are populated, have no outer whitespace/non-ASCII characters, and are not obvious placeholders.
- `NAFATH_AUDIENCE`, `NAFATH_CLIENT_IP` and `NAFATH_RETURN_URL` are absent in both sources. These settings are required by the prepared OIDC implementation.
- Access/refresh token secrets for normal platform login agree between `.env` and the running process.

## Provider evidence

Requests used the documented App ID/key headers, required forwarding IP header, UUID request ID and `locale=ar`. Header aliases were checked separately and did not resolve the rejected requests. No national ID was submitted, and no citizen verification was started.

| Key source | Environment | Endpoint | Result |
| --- | --- | --- | --- |
| `.env` | Sandbox | `/api/v1/mfa/jwk` | 403 `Authentication failed` |
| `.env` | Production | `/api/v1/mfa/jwk` | 403 `Authentication failed` |
| `.env` | Staging | `/api/v1/mfa/jwk` | 403 `Authentication failed` |
| PM2/running process | Production | `/api/v1/mfa/jwk` | 403 `Authentication failed` |
| PM2/running process | Production | `/api/v2/oidc/session` | 403 `Authentication failed` |
| PM2/running process | Sandbox | `/api/v1/mfa/jwk` | 200, one signing key |
| PM2/running process | Staging | `/api/v1/mfa/jwk` | 200, one signing key |
| PM2/running process | Sandbox | `/api/v2/oidc/session` | 422 `Couldn't find the requested record`, code `422-016-023` |
| PM2/running process | Staging | `/api/v2/oidc/session` | 422 `Couldn't find the requested record`, code `422-016-023` |
| PM2/running process | Sandbox | `/api/v2/oidc/jwk` | 403 `Authentication failed` |
| PM2/running process | Staging | `/api/v2/oidc/jwk` | 404 `No Mapping Rule matched` |
| PM2/running process | Production | `/api/v2/oidc/jwk` | 404 `No Mapping Rule matched` |

These results establish that the PM2 key can authenticate to the MFA test endpoints. They do not establish that it is enabled for production or for the web OIDC product. The OIDC session endpoint's record-not-found error is consistent with a missing provider application/profile/callback record, but only Elm can confirm its exact cause. Missing local audience/return URL settings do not cause these direct provider requests to fail; those settings will also need completing before rollout.

The customer's email refers to Nafath App (experimental), whereas the supplied Postman collection is Nafath-OIDC V2 web. Confirm the actual subscribed product with Elm before selecting the integration protocol. Do not change the production site to test credentials or treat test-environment identities as production proof merely because a signing-key request succeeds.

## Platform checks

- Public offer browsing: HTTP 200.
- Profile without a platform login token: HTTP 401.
- Profile with an invalid login token: HTTP 401.

These are checks of public access and token rejection, not a completed email-OTP login or completed Nafath identity proof.

## Next required input

Elm/Rabet needs to confirm whether this App ID is enabled for Nafath App or web OIDC, supply the correct environment/credentials for that product, and configure the provider Entity ID/callback/profile. If only Nafath App is enabled, obtain its matching integration guide/collection. Once the intended pair is confirmed, synchronize `.env` and PM2 deliberately, complete the missing OIDC settings where applicable, and repeat session/callback/JWT verification before enabling production restrictions.

The isolated release and rollback snapshots remain under `/var/www/digitalbrokerage/releases/nafath-profile-20261020`. The running release remains unchanged.

## Exact Postman collection replay

The attached collection was re-read in full. It contains no collection variables with actual values, no inherited authentication, no request/collection scripts and no saved successful responses. `BASE_URL`, `APP-ID` and `APP-KEY` are unresolved placeholders requiring a separate Postman environment. The Get JWT request contains a literal sample App ID that differs from the running server's App ID and omits APP-KEY; do not copy that literal into the application. The ValidateToken sample JWT expired on 2022-08-21.

GetSession was replayed exactly as the collection specifies (`requestId=1`, locale=ar, APP-ID and APP-KEY only), then compared with the PDF's UUID request ID and forwarding-IP header. With the key accepted by the MFA signing-key endpoint, both request formats return HTTP422 code422-016-023 in both sandbox and staging. No signed session URL was returned. Thus the collection/PDF request-ID discrepancy and forwarding-header difference do not explain the observed provider record-not-found error. The collection does not contain the missing provider profile, callback registration or a replacement live credential set.

## Confirmed App ID correction

The customer explicitly confirmed that `10fd6483` is the actual intended App ID. It must not be treated as merely a sample. Neither the current backend `.env` nor the running PM2 process uses this App ID.

The confirmed App ID was tested against both already-configured server keys in sandbox, staging and production using the documented OIDC session request. All six combinations returned HTTP403 `Authentication failed`; no session URL was created. The matching APP-KEY for this confirmed App ID is therefore needed before a successful credential pair can be established. Earlier successful MFA JWK and OIDC record-not-found results used the other server-configured App ID; they do not establish the service/profile status of `10fd6483`. Do not diagnose a missing OIDC profile for the confirmed App ID until its matching credentials authenticate.

No live configuration was changed to a key/ID pair known to be rejected. The staged release can be configured with the confirmed App ID and matching key once available, then verified before activation.


## Authoritative portal check in the customer's signed-in Chrome session

The Digital Brokerage application detail page `/portal/applications/1543` lists Rabet App ID `umbx0gj2`. The subscription `/portal/subscriptions/155120260520202931` is activated on Nafath App Trial. The customer's supplied `10fd6483` is not the Rabet App ID displayed for this application; do not replace the registered ID with the collection literal.

The portal's existing key was compared privately by a fingerprint, without exposing the key, regenerating it, or changing the Rabet account. It matches the running PM2 key and differs from the backend `.env` key. A protected backup was saved, and only the backend `.env` key was synchronized to the already-running, portal-confirmed key. No process was restarted, and no base URL or verification-enforcement setting was changed.

The live API documentation lists App create/status endpoints with APP-ID, APP-KEY, app_id and app_key. The web staging session endpoint additionally describes APP_ID and gateway names app_id/app_key. HTTP header names are case-insensitive; APP_ID and app_id cannot carry independent values. Tests using the confirmed gateway credentials and the collection's other ID did not produce an OIDC session. The live OIDC response schema defines session `id` as an integer, whereas the supplied PDF describes a string; the implementation now accepts and normalizes either valid form. Gateway header aliases are included on provider calls.

The active subscription provides an integration-guide PDF through a blob URL. The browser URL security policy blocked observing that PDF, so no alternative mechanism was used to bypass that restriction. The visible inline API documentation was read instead. The portal proves that credentials are present and current; it does not show a configured OIDC Entity ID/callback record. The 422 OIDC record-not-found response remains unresolved, and no actual identity verification has completed.


## Uploaded Nafath App OpenAPI contract (2026-10-20)

Reference: `/home/mostafa/Downloads/nafath-app.json`, title Nafath App v1.0. This is reference data, not operational authorization. It confirms POST `/api/v1/mfa/request` with query `local` and `requestId`, body `nationalId` and `service`, returning `transId` and `random`; POST `/api/v1/mfa/request/status` takes `nationalId`, `transId`, `random` and returns WAITING/EXPIRED/REJECTED/COMPLETED. It lists APP-ID/APP-KEY and app_id/app_key. The service field has no allowed values or examples. OIDC paths in this file are explicitly prefixed `/stg`. The previously supplied PDF/collection describe the web flow, not this App challenge flow.

Fresh checks from the production server, using the existing portal-matching credentials and all four documented App headers:

| Environment | MFA JWK | MFA status with empty JSON |
| --- | --- | --- |
| Production | 403 Authentication failed | 403 Authentication failed |
| /stg | 200 | 422 Invalid Request |
| /nafath-sandbox | 200 | 422 Invalid Request |

The empty status body intentionally contains no citizen identity and cannot represent a real verification request. A 422 only shows that this malformed request reached validation; it does not prove end-to-end verification. No create-request endpoint was called. File/runtime App ID and key agree with the portal. Production credential acceptance still requires resolution with Elm; confirm production entitlement and the assigned App service value. Do not mark trial/sandbox completion as production identity verification. No process restart, migration, code activation or base URL change was made.


## Deployment requested despite provider blocker

The user explicitly requested deployment for manual testing. The prepared profile OIDC release was activated on 2026-10-20 with the additive migration and strict business-action guard. Login and browsing remain available. Both live processes were restarted and PM2 state saved, with database schema synchronization disabled. Forty targeted tests and both production builds passed before activation.

Live temporary-account checks passed for profile read/edit and safe order listing, and business order creation returned403 NAFATH_VERIFICATION_REQUIRED. The temporary account was deleted. Nafath start returned503 with the controlled not-configured message: the registered audience remains unconfirmed. Production provider credential rejection and the App-vs-web integration configuration remain unresolved. This deployment does not establish successful Nafath verification.
