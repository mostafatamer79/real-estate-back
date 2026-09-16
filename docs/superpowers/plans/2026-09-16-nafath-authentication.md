# Nafath Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add verified Nafath authentication for desktop and mobile browsers while retaining email OTP fallback.

**Architecture:** The backend owns all Elm/Rabet credentials and persists each short-lived Nafath transaction. A callback validates the signed JWT against Elm JWKs before associating or creating a user; the browser polls using a per-transaction secret and receives the existing platform tokens only after completion.

**Tech Stack:** NestJS, TypeORM, Node crypto, Next.js.

**Spec:** Approved in this conversation on 2026-09-16.

## Global Constraints

- Never expose APP-KEY to the browser.
- Verify RS256 JWT signatures, issuer, audience, expiry, request ID, and transaction ID before login.
- Preserve email OTP as a fallback.
- Support desktop and mobile browsers; only mobile attempts the Nafath app deep link.

---

### Task 1: Persistent Nafath request service

**Files:**
- Create: `src/auth/nafath/nafath-transaction.entity.ts`
- Create: `src/auth/nafath/nafath.service.ts`
- Test: `src/auth/nafath/nafath.service.spec.ts`

- [ ] Write a failing test for a request that sends credentials only from the server and persists the returned transaction ID and matching number.
- [ ] Implement the transaction entity and minimal request service.
- [ ] Run the focused Jest test.

### Task 2: Verified callback and session completion

**Files:**
- Modify: `src/auth/nafath/nafath.service.ts`
- Modify: `src/user/user.service.ts`
- Test: `src/auth/nafath/nafath.service.spec.ts`

- [ ] Write failing tests for rejecting unverified callbacks and creating a verified user after a valid completed callback.
- [ ] Implement JWK-backed RS256 verification, callback correlation, and user upsert.
- [ ] Run the focused Jest test.

### Task 3: Public API and configuration

**Files:**
- Modify: `src/auth/auth.controller.ts`
- Modify: `src/auth/auth.module.ts`
- Modify: `.env.example`

- [ ] Add request, status, and callback endpoints with strict input validation.
- [ ] Document all required Nafath environment variables.
- [ ] Run backend type-check and tests.

### Task 4: Cross-platform login interface

**Files:**
- Modify: `../real-estate-front/app/login/page.tsx`
- Create: `../real-estate-front/app/nafath-login/page.tsx`

- [ ] Add a Nafath sign-in option and National ID form.
- [ ] Display the matching number, poll status, and offer the mobile deep link without requiring it on desktop.
- [ ] Run frontend lint and build.
