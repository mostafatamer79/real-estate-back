# Nafath profile verification implementation plan

**Goal:** Keep email/phone login and browsing available; verify the signed-in account from its profile through the supplied Elm OIDC integration. Require identity verification before business mutations.

**Architecture:** Authenticated session creation binds an expiring OIDC transaction to the current user. The provider's state is correlated with its session hash, exchanged on the server, and its RS256 token validated with Elm JWKs. A database transaction locks the pending verification and account before storing the verified national ID and `nafathVerifiedAt`. No new account or platform login token is issued. Legacy email OTP endpoints are removed. Global HTTP write authorization and the chat service enforce verified identity; auth and profile maintenance remain available. Admin administration remains available.

**Constraints:** Preserve existing unrelated working-tree changes. No dependency or framework upgrades. No provider/account writes, subscription purchases, deployment, or messages to Elm. Production enablement needs the customer-provided Rabet account and registered callback.

- [x] Replace MFA tests with OIDC contract, signed-token, state correlation, expiry, ownership, replay and duplicate-identity tests; run red, implement and run green.
- [x] Add additive schema migration for session state/IP and a distinct user verification timestamp; remove mock verification and prevent profile identity edits.
- [x] Test and implement global business-write restrictions, retaining reads/auth/profile and provider webhooks. Enforce chat sending in the service for both HTTP and sockets.
- [x] Replace profile email-OTP dialog with OIDC redirect/return/status UI, remove login option and route profile-completion redirect so browsing stays available. Provide a clear verification-required response in Arabic/English.
- [x] Run targeted regression tests, type checks, lint and builds as applicable; inspect final diffs. Document environment/callback setup, documentation inconsistencies, and untested live-provider prerequisites.

## Integration evidence and decisions

The attached v3.0.1 PDF describes GET `/api/v2/oidc/session`, POST `/api/v2/oidc/jwt`, and a callback containing only `state`. Its JWK page still names `/api/v1/mfa/jwk`; the supplied OIDC V2 collection names `/api/v2/oidc/jwk`. Use the collection's OIDC JWK path with an explicit environment override for provider-confirmed alternatives. The sample OIDC token issuer is `https://www.iam.gov.sa/userauth`; audience must match the registered Entity ID. Verify callback state against SHA-256 of state (base64/hex/base64url), never requestId alone. Require sandbox confirmation of state encoding and callback browser transport before production.

## Final review and validation

Independent reviewer identified three defects during implementation: injected verification timestamps in employee-created accounts, browser form callbacks rejected by normal API CORS, and stale polling expiration overwriting a completed callback. Regression tests were added; creation paths now force a null proof timestamp, the exact callback route accepts cross-origin form navigation without granting CORS response access, and polling shares the callback row lock. The reviewer confirmed these fixes by inspection. Verified national IDs also cannot be edited through profile/admin updates.

Local production builds passed for both repositories (frontend required network access for its existing Google Fonts). New core backend files pass targeted ESLint. The frontend type check passes. Fourteen of fifteen frontend test suites pass; the unchanged mobile-header-footer-polish test fails at line 32. A broader backend tsc run including tests also exposes an unrelated existing Map inference error in the pre-existing untracked geidea-billing.service.spec.ts; the production backend build excludes tests and passes.

Database migration and live-provider acceptance remain rollout tasks: no local backend .env or Nafath environment credentials are configured. See ../../nafath-profile-verification.md for exact setup and acceptance checks. No database, deployment, subscription or provider-account changes were performed.
