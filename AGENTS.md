# Full-Stack Engineering Constitution & AI Agent Rules

> **Recommended filename:** `AGENTS.md`
>
> **Purpose:** A living engineering constitution for humans and AI coding agents.
>
> **Last reviewed:** 2026-08-03
>
> **React/Next 2026 addendum reviewed:** 2026-08-16
>
> **Backend 2026 addendum reviewed:** 2026-08-26
>
> **Frontend animation libraries addendum reviewed:** 2026-08-17
>
> **Primary style:** Clean, explicit, modular, feature-oriented, secure, testable, and easy to change.
>
> **Status:** Opinionated defaults. Project requirements, business rules, security constraints, and existing architecture take precedence.

---

## Table of Contents

1. [Purpose and Scope](#1-purpose-and-scope)
2. [How to Interpret These Rules](#2-how-to-interpret-these-rules)
3. [Instruction Priority](#3-instruction-priority)
4. [2026 Production Baseline](#4-2026-production-baseline)
5. [Non-Negotiable Engineering Principles](#5-non-negotiable-engineering-principles)
6. [Required Agent Workflow](#6-required-agent-workflow)
7. [Architecture Decision Rules](#7-architecture-decision-rules)
8. [Clean Code Rules](#8-clean-code-rules)
9. [Naming and File Rules](#9-naming-and-file-rules)
10. [JavaScript Rules](#10-javascript-rules)
11. [TypeScript Rules](#11-typescript-rules)
12. [Data Structures and Algorithm Rules](#12-data-structures-and-algorithm-rules)
13. [Frontend Architecture](#13-frontend-architecture)
14. [Preferred Frontend Folder Structure](#14-preferred-frontend-folder-structure)
15. [Component Design Rules](#15-component-design-rules)
16. [Forms Architecture](#16-forms-architecture)
17. [React Rules](#17-react-rules)
18. [Next.js Rules](#18-nextjs-rules)
19. [TanStack Query Pattern](#19-tanstack-query-pattern)
20. [Frontend State Management](#20-frontend-state-management)
21. [Frontend Library Rules](#21-frontend-library-rules)
22. [Styling and Design-System Rules](#22-styling-and-design-system-rules)
23. [Frontend Performance](#23-frontend-performance)
24. [Frontend Accessibility](#24-frontend-accessibility)
25. [Frontend Testing](#25-frontend-testing)
26. [Backend Architecture](#26-backend-architecture)
27. [Preferred Backend Folder Structure](#27-preferred-backend-folder-structure)
28. [Node.js Runtime Rules](#28-nodejs-runtime-rules)
29. [Express Rules](#29-express-rules)
30. [Fastify Rules](#30-fastify-rules)
31. [PHP Rules](#31-php-rules)
32. [Laravel Rules](#32-laravel-rules)
33. [Backend Library Rules](#33-backend-library-rules)
34. [API Design Rules](#34-api-design-rules)
35. [Authentication and Authorization](#35-authentication-and-authorization)
36. [Application Security](#36-application-security)
37. [Database Selection](#37-database-selection)
38. [Relational Database Rules](#38-relational-database-rules)
39. [PostgreSQL Rules](#39-postgresql-rules)
40. [MySQL Rules](#40-mysql-rules)
41. [Non-Relational Database Rules](#41-non-relational-database-rules)
42. [MongoDB Rules](#42-mongodb-rules)
43. [Redis and Cache Rules](#43-redis-and-cache-rules)
44. [ORM and Query Builder Rules](#44-orm-and-query-builder-rules)
45. [Prisma Rules](#45-prisma-rules)
46. [Drizzle Rules](#46-drizzle-rules)
47. [Eloquent Rules](#47-eloquent-rules)
48. [Transactions and Concurrency](#48-transactions-and-concurrency)
49. [Migrations and Seed Data](#49-migrations-and-seed-data)
50. [Background Jobs and Queues](#50-background-jobs-and-queues)
51. [Caching Strategy](#51-caching-strategy)
52. [Logging, Monitoring, and Observability](#52-logging-monitoring-and-observability)
53. [Error Handling](#53-error-handling)
54. [Configuration and Secrets](#54-configuration-and-secrets)
55. [Testing Strategy](#55-testing-strategy)
56. [CI/CD and Quality Gates](#56-cicd-and-quality-gates)
57. [Performance Engineering](#57-performance-engineering)
58. [Git and Change Management](#58-git-and-change-management)
59. [Documentation Rules](#59-documentation-rules)
60. [Definition of Done](#60-definition-of-done)
61. [Forbidden Agent Behavior](#61-forbidden-agent-behavior)
62. [Technology Evaluation Checklist](#62-technology-evaluation-checklist)
63. [Maintenance and Update Policy](#63-maintenance-and-update-policy)
64. [Official Source Register](#64-official-source-register)
65. [Project-Specific Overrides](#65-project-specific-overrides)

---

## 1. Purpose and Scope

This file defines default engineering rules for projects that may use:

- JavaScript and TypeScript.
- React applications.
- Next.js applications using the App Router.
- Frontend libraries such as React Hook Form, Zod, TanStack Query, TanStack Table, Redux Toolkit, Zustand, and component libraries.
- Node.js backends.
- Express and Fastify.
- PHP and Laravel.
- REST APIs, background workers, and event-driven integrations.
- Relational databases such as PostgreSQL and MySQL.
- Non-relational databases such as MongoDB and Redis.
- ORMs and query builders such as Prisma, Drizzle, and Eloquent.
- Unit, integration, component, and end-to-end testing.
- AI-assisted implementation by Codex, Claude, Copilot, or another coding agent.

This document is intentionally broad, but it does **not** claim that one tool or one folder structure is best for every project. The correct solution depends on:

- The actual business problem.
- Existing project conventions.
- Runtime and deployment constraints.
- Team experience.
- Data consistency requirements.
- Expected scale and failure modes.
- Security and compliance requirements.

When a technology is not explicitly covered, the agent MUST apply the principles and evaluation checklist in this file rather than inventing an inconsistent pattern.

---

## 2. How to Interpret These Rules

The following words are normative:

- **MUST / MUST NOT**: Mandatory unless a higher-priority instruction overrides it.
- **SHOULD / SHOULD NOT**: Strong default. A deviation requires a concrete reason.
- **MAY**: Optional and context-dependent.

A rule is not satisfied by creating more files, abstractions, interfaces, or layers. It is satisfied when the code becomes easier to understand, test, secure, operate, and change.

### 2.1 Core interpretation rule

> Prefer the smallest architecture that preserves clear boundaries and can safely support the expected change.

### 2.2 Existing-project rule

An agent MUST improve the codebase without unexpectedly rewriting its architecture. It MUST follow existing valid conventions unless the task explicitly requests a migration or the existing convention creates a correctness, security, or maintainability problem.

---

## 3. Instruction Priority

When instructions conflict, follow this order:

1. Explicit task requirements and acceptance criteria.
2. Security, privacy, legal, and data-integrity requirements.
3. Existing business behavior and domain rules.
4. Existing public API and compatibility guarantees.
5. Existing project architecture and documented conventions.
6. Version-matched official documentation.
7. This file.
8. General community conventions.
9. Personal preference or agent assumptions.

The agent MUST identify conflicts instead of silently choosing whichever rule is easiest.

---

## 4. 2026 Production Baseline

This table is a review snapshot for **new projects**. Existing projects MUST use the versions declared by their manifests, lockfiles, containers, and deployment platform unless an upgrade is explicitly requested.

| Technology | 2026 default guidance |
|---|---|
| React | React 19.2 stable, latest compatible security patch |
| Next.js | Latest security-patched 16.2.x Active LTS; do not use canary/preview in production by default |
| Node.js | Node.js 24 LTS for production; Current releases are for evaluation unless approved |
| TypeScript | TypeScript 6.0 when ecosystem compatibility is verified; otherwise the project-compatible supported version |
| Express | Express 5 |
| Fastify | Fastify 5.x stable |
| PHP | PHP 8.5 for new compatible projects; respect Laravel/package requirements |
| Laravel | Laravel 13 for new compatible projects |
| PostgreSQL | PostgreSQL 18 when supported by the provider |
| MySQL | MySQL 8.4 LTS unless another supported version is required |
| MongoDB | A supported stable release; no preview release in production |
| Mongoose | Mongoose 9.x for new compatible MongoDB projects; installed project version remains authoritative |
| Redis | A supported stable release provided by the chosen platform |
| Prisma / Drizzle | Stable project-compatible release from the lockfile; no automatic RC/beta adoption |
| Motion for React | Prefer the stable `motion` package for new React work; review snapshot: Motion docs v12.43.x. Existing `framer-motion` projects are not migrated during unrelated work. |
| GSAP | Stable GSAP 3.x; review snapshot: 3.15.x. Use `@gsap/react` for React lifecycle integration when GSAP is selected. |
| Lenis | Optional stable 1.x smooth-scroll infrastructure only when the product explicitly benefits from it; native scrolling remains the default. |

### 4.1 Version rules

- MUST use supported stable or LTS releases in production.
- MUST inspect `package.json`, `composer.json`, lockfiles, container images, CI, and deployment runtime before changing a version.
- MUST NOT silently change the package manager.
- MUST NOT mix feature work with a major framework upgrade unless explicitly required.
- MUST review migration guides before every major upgrade.
- MUST run tests, type checking, linting, builds, and relevant migration checks after an upgrade.
- SHOULD pin runtime versions in `.nvmrc`, `.node-version`, `mise.toml`, Docker images, or the equivalent project mechanism.
- SHOULD schedule security patch reviews independently from feature delivery.

---

## 5. Non-Negotiable Engineering Principles

### 5.1 Correctness before cleverness

- Code MUST produce correct behavior for normal, boundary, invalid, concurrent, and failure cases.
- A shorter implementation is not better when it hides important behavior.
- A sophisticated algorithm is not better when a simple linear pass is sufficient.

### 5.2 Explicit boundaries

Separate concerns by responsibility, not by arbitrary file count:

- Presentation.
- State orchestration.
- Validation.
- Domain rules.
- Data access.
- External integrations.
- Infrastructure.

### 5.3 High cohesion, low coupling

- Code that changes for the same reason SHOULD live together.
- Modules SHOULD expose small, intentional public APIs.
- Internal implementation details SHOULD remain private to the feature.

### 5.4 Prefer composition

- Prefer composable functions and components over inheritance.
- Prefer dependency injection at module boundaries over hidden global dependencies.
- Prefer framework adapters around domain logic rather than framework types inside domain logic.

### 5.5 Pragmatic principles

- **YAGNI:** Do not build future flexibility without a current requirement.
- **DRY:** Remove duplicated knowledge, not every visually similar line.
- **AHA:** Avoid hasty abstraction. Wait until the shared concept is understood.
- **KISS:** Keep control flow and data flow obvious.
- **SOLID:** Apply where it improves changeability; do not create interfaces only to claim compliance.

### 5.6 Security is part of design

- Authentication is not authorization.
- Client validation is not trusted validation.
- Hidden UI is not access control.
- Type safety is not runtime validation.
- ORM use is not automatic protection from data leaks or authorization mistakes.

### 5.7 Measure before optimization

- Performance work MUST start with evidence or a known algorithmic problem.
- Memoization, caching, indexing, parallelism, and denormalization MUST have an explicit reason.
- Every cache MUST define ownership, key, TTL or invalidation, and stale-data behavior.

---

## 6. Required Agent Workflow

Every AI agent MUST follow this workflow for non-trivial tasks.

### 6.1 Before editing

1. Read this file and any closer `AGENTS.md` or project instruction files.
2. Read the task and acceptance criteria completely.
3. Inspect relevant manifests, lockfiles, runtime configuration, aliases, lint rules, and test setup.
4. Search the codebase for existing patterns before inventing a new one.
5. Identify the affected data flow from entry point to persistence or UI output.
6. Identify security, authorization, migration, compatibility, and error-handling implications.
7. For Next.js, read the version-matched documentation bundled with the installed package when available.
8. Write a short implementation plan for multi-file or architecture-sensitive changes.

### 6.2 During implementation

- Keep the diff focused.
- Preserve public behavior unless the task requests a change.
- Reuse project abstractions when they are valid.
- Add a new abstraction only when it has a clear responsibility and multiple meaningful callers or a strong boundary reason.
- Validate external input at the boundary.
- Keep business logic independent from UI and HTTP where practical.
- Add or update tests with the behavior change.
- Do not hide errors with empty catches, unsafe casts, disabled lint rules, or broad `try/catch` blocks.

### 6.3 Before completion

Run the repository-equivalent checks:

```bash
# JavaScript / TypeScript projects
pnpm lint
pnpm typecheck
pnpm test
pnpm build

# PHP / Laravel projects
composer validate
php artisan test
vendor/bin/pint --test
vendor/bin/phpstan analyse
```

Use the actual scripts in the repository. Do not invent commands that do not exist.

### 6.4 Final report

The agent MUST report:

- What changed.
- Why the design was chosen.
- Important assumptions.
- Tests and checks run.
- Any migration, environment, security, or deployment action required.
- Anything not verified.

---

## 7. Architecture Decision Rules

### 7.1 Default architecture

For most business systems, start with a **modular monolith**:

- One deployable backend unless independent scaling or ownership is proven.
- Feature or domain modules with clear boundaries.
- One database may serve multiple modules, but cross-module writes MUST be intentional.
- Background workers may be separate processes while sharing application code.

Do not start with microservices because a system may become large. Introduce a service boundary when there is evidence such as:

- Independent deployment requirements.
- Different scaling characteristics.
- Strong data or security isolation.
- Separate team ownership.
- A stable integration contract.
- Failure isolation that cannot be achieved inside the monolith.

### 7.2 Horizontal versus vertical organization

- Global infrastructure MAY be organized horizontally: `config`, `db`, `logging`, `auth`.
- Business code SHOULD be organized vertically by feature or domain.
- Avoid one enormous global `controllers`, `services`, or `utils` directory in large applications.

### 7.3 Dependency direction

A preferred dependency direction is:

```text
UI / HTTP / Jobs
        ↓
Application use cases
        ↓
Domain rules
        ↓
Ports / repository contracts
        ↓
Infrastructure implementations
```

Framework, database, and transport details SHOULD point inward through adapters. Domain code SHOULD NOT depend directly on Express requests, Fastify requests, Next.js cookies, Eloquent HTTP resources, or Prisma-generated types unless the project deliberately accepts that coupling.

### 7.4 Abstraction test

Before creating a new abstraction, answer:

1. What responsibility does it own?
2. What knowledge does it hide?
3. Which callers benefit?
4. What change becomes easier?
5. Is the concept stable enough to name?
6. Is duplication currently harmful, or merely similar?

If these answers are weak, keep the implementation local.

---

## 8. Clean Code Rules

### 8.1 Functions

- A function SHOULD do one coherent job.
- Prefer early returns to deeply nested conditionals.
- Keep parameters small and meaningful.
- Replace boolean argument ambiguity with an options object or separate functions.
- Avoid functions that both query and mutate unless the operation is explicitly transactional.
- Pure functions SHOULD be used for calculations and transformations where practical.
- Side effects SHOULD occur at clear orchestration boundaries.

Bad:

```ts
processOrder(order, true, false, true);
```

Better:

```ts
processOrder(order, {
  sendReceipt: true,
  reserveInventory: false,
  notifyWarehouse: true,
});
```

### 8.2 Control flow

- Use guard clauses for invalid or terminal states.
- Prefer exhaustive handling of finite states.
- Avoid hidden fallthrough.
- Avoid nested ternaries.
- Extract complex conditions into named predicates.

```ts
const canCancelOrder =
  order.status === "pending" &&
  order.paymentStatus !== "refunded" &&
  actor.permissions.includes("orders.cancel");
```

### 8.3 Comments

Comments SHOULD explain:

- Why a non-obvious decision exists.
- A business constraint.
- A workaround and its removal condition.
- A security or concurrency invariant.

Comments SHOULD NOT repeat obvious syntax.

### 8.4 Constants and magic values

- Domain values MUST have names.
- Environment-dependent values belong in validated configuration.
- User-facing text SHOULD use the project localization strategy.
- Time durations SHOULD include units in the name.

```ts
const PASSWORD_RESET_TTL_MINUTES = 30;
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
```

### 8.5 Error handling

- Do not catch an error unless you can add context, recover, translate, retry, compensate, or clean up.
- Preserve causes when wrapping errors.
- Do not return internal stack traces to clients.
- Do not convert every failure into `null` or `false`.

### 8.6 Duplication

Duplicate code may remain temporarily when the underlying concepts are not yet proven to be the same. Duplicate business rules MUST be consolidated because divergence creates correctness bugs.

### 8.7 File size

There is no universal line limit. Split a file when it contains multiple responsibilities, changes for unrelated reasons, or cannot be understood without excessive scrolling. Do not split a cohesive 200-line module into ten meaningless files.

---

## 9. Naming and File Rules

### 9.1 Naming

- Components, classes, and exported types: `PascalCase`.
- Functions, variables, hooks, and instances: `camelCase`.
- Constants: use `SCREAMING_SNAKE_CASE` for true global constants; otherwise use descriptive `camelCase`.
- Boolean names SHOULD start with `is`, `has`, `can`, `should`, or `was`.
- Collections SHOULD use plural nouns.
- Event handlers SHOULD describe the event or intention: `handleSubmit`, `handlePriceChange`.
- Avoid vague names: `data`, `info`, `item`, `helper`, `manager`, `common`, `misc`, `temp`.

### 9.2 File naming

Choose one project convention and keep it consistent. Preferred defaults:

```text
product-form.tsx
use-product-form.ts
product-form.schema.ts
products.api.ts
products.queries.ts
products.mutations.ts
order.service.ts
order.repository.ts
```

### 9.3 Barrel files

- Use `index.ts` only to define an intentional public API.
- Do not create barrels for every directory.
- Avoid circular dependencies caused by broad barrels.
- Internal modules SHOULD import directly from nearby files when clearer.

### 9.4 Imports

Preferred order:

1. Runtime/framework imports.
2. Third-party libraries.
3. Project aliases.
4. Relative parent imports.
5. Relative sibling imports.
6. Type-only imports where configured.
7. Styles/assets.

Do not reorganize imports manually when the repository has a formatter or lint plugin that owns the order.

---

## 10. JavaScript Rules

### 10.1 Language defaults

- Prefer `const`; use `let` only for reassignment.
- Never use `var` in new code.
- Prefer strict equality.
- Use optional chaining and nullish coalescing intentionally.
- Do not use `||` when valid falsy values such as `0`, `false`, or `""` must be preserved.
- Prefer template literals for interpolation.
- Prefer immutable transformations when they improve reasoning; do not clone large data structures without need.

### 10.2 Async code

- Prefer `async`/`await` for orchestration.
- Always handle rejected promises at a meaningful boundary.
- Do not use `forEach(async () => ...)`.
- Use sequential loops when ordering or rate limits matter.
- Use bounded concurrency for large independent workloads.
- Do not use unbounded `Promise.all` over user-controlled or large collections.

```ts
for (const job of jobs) {
  await processJob(job);
}
```

For safe bounded parallelism, use a project-approved limiter rather than implementing an ad hoc scheduler in every feature.

### 10.3 Equality and coercion

- Avoid implicit numeric coercion from external input.
- Parse and validate dates, booleans, and numbers at boundaries.
- Never trust `Number(value)` alone as validation.
- Handle `NaN`, `Infinity`, and empty strings deliberately.

### 10.4 Dates and time

- Store timestamps in UTC.
- Preserve the business timezone separately where it affects dates, cutoffs, or reporting.
- Avoid parsing ambiguous date strings.
- Use ISO 8601 at API boundaries unless a contract specifies otherwise.
- Use a date library only when native APIs are insufficient and the dependency is justified.

### 10.5 Collections

- Use `Map` for dynamic keyed collections where keys are not naturally JSON object properties or frequent updates/iteration matter.
- Use `Set` for membership and deduplication.
- Use arrays for ordered collections.
- Do not use an array with repeated `.find()` inside another loop when a `Map` can reduce O(n × m) work to O(n + m).

---

## 11. TypeScript Rules

### 11.1 Strictness

New projects SHOULD enable strict TypeScript settings. Recommended baseline:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true,
    "useUnknownInCatchVariables": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "noEmit": true
  }
}
```

Apply settings compatible with the selected runtime, bundler, and framework. Do not copy this block without checking project compatibility.

### 11.2 `any`, `unknown`, and assertions

- `any` MUST NOT be used as an escape hatch.
- External or uncertain values SHOULD start as `unknown` and be narrowed or validated.
- Type assertions SHOULD be rare and documented by an invariant.
- Double assertions such as `value as unknown as T` are prohibited unless bridging a proven third-party typing defect with a comment and test.
- `@ts-ignore` is prohibited in new code. Use `@ts-expect-error` only for an expected, tested type error with an explanation.

### 11.3 Runtime validation

Types disappear at runtime. Validate:

- HTTP bodies, params, query strings, and headers.
- Environment variables.
- Database JSON fields.
- Queue payloads.
- Webhook payloads.
- Local storage data.
- Third-party API responses when correctness matters.

### 11.4 Domain types

Prefer types that make invalid states difficult to represent.

```ts
type PaymentState =
  | { status: "pending" }
  | { status: "paid"; paidAt: string; transactionId: string }
  | { status: "failed"; reason: string };
```

Use branded or opaque identifiers only when they materially prevent identifier mixing.

### 11.5 Interfaces versus type aliases

- Use either consistently.
- Prefer `type` for unions, intersections, mapped types, and function signatures.
- Prefer `interface` for extensible object contracts where declaration merging is intentionally useful.
- Do not create both an interface and a type for the same concept.

### 11.6 Generics

- A generic MUST express a real relationship between inputs and outputs.
- Use descriptive generic names for complex APIs.
- Avoid generic abstractions with one caller.
- Constrain generics as narrowly as necessary.

### 11.7 Exhaustiveness

Use discriminated unions and exhaustive switches for finite states.

```ts
function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}
```

### 11.8 Generated types

- Generated ORM or API types SHOULD remain at infrastructure boundaries.
- Do not expose huge database row types directly to UI clients.
- Map data to purpose-specific DTOs or view models.

---

## 12. Data Structures and Algorithm Rules

### 12.1 Selection principle

Choose the data structure based on required operations, not habit.

| Need | Preferred starting point | Typical complexity |
|---|---|---|
| Ordered iteration | Array | O(n) scan |
| Fast key lookup | Map / object | Average O(1) |
| Membership / deduplication | Set | Average O(1) |
| FIFO processing | Queue / deque | O(1) enqueue/dequeue |
| LIFO processing | Stack / array | O(1) push/pop |
| Repeated min/max extraction | Heap / priority queue | O(log n) update |
| Prefix lookup | Trie, indexed search, or database search | Depends on implementation |
| Hierarchical data | Tree | Depends on traversal |
| General relationships | Graph | O(V + E) traversal |
| Recently used cache | LRU map | Average O(1) operations |

### 12.2 Complexity expectations

- The agent MUST identify obvious O(n²) behavior over potentially large data.
- The agent SHOULD include complexity notes for custom algorithms in critical paths.
- Do not optimize tiny bounded arrays without evidence.
- Database round trips, serialization, and network latency often matter more than CPU complexity.

### 12.3 Lookup and join pattern

Bad for large collections:

```ts
const result = orders.map((order) => ({
  ...order,
  customer: customers.find((customer) => customer.id === order.customerId),
}));
```

Better:

```ts
const customersById = new Map(
  customers.map((customer) => [customer.id, customer]),
);

const result = orders.map((order) => ({
  ...order,
  customer: customersById.get(order.customerId),
}));
```

### 12.4 Sorting

- Do not sort data repeatedly during every render.
- Copy an array before sorting if immutability is required.
- Use stable, deterministic tie breakers.
- Prefer database sorting for paginated server data.
- Do not load an entire dataset only to sort and return one page.

### 12.5 Search

- Use linear search for small or one-time unsorted collections.
- Use a `Map` or index for repeated exact lookup.
- Use binary search only on correctly sorted data.
- Use database full-text search or a search engine for linguistic, fuzzy, ranked, or large-scale search.
- Do not implement regex-based “search engines” over production-sized datasets.

### 12.6 Top-K and ranking

- Sorting all values is acceptable for small datasets.
- Use a bounded heap or database `ORDER BY ... LIMIT` when only the top K values are needed at scale.
- Ranking rules MUST define tie behavior.

### 12.7 Pagination

- Offset pagination is acceptable for small admin lists and stable datasets.
- Cursor/keyset pagination SHOULD be used for large or frequently changing datasets.
- Cursor order MUST be deterministic and include a unique tie breaker.
- Never trust a client-provided cursor without validation.

### 12.8 Graph traversal

- Use BFS for shortest path in an unweighted graph.
- Use DFS for traversal, cycle detection, and dependency exploration when recursion depth is safe.
- Use Dijkstra for non-negative weighted shortest paths.
- Do not use Dijkstra with negative weights.
- Detect cycles in dependency or hierarchy data when cycles are invalid.

### 12.9 Dynamic programming

Use dynamic programming only when the problem has overlapping subproblems and optimal substructure. Do not introduce DP for ordinary validation, mapping, or CRUD.

### 12.10 Debounce and throttle

- Debounce delayed search input or validation when only the final pause matters.
- Throttle high-frequency scroll, resize, or pointer events when periodic updates matter.
- Always clean up timers and pending requests.
- Prefer abortable requests to ignoring stale responses.

### 12.11 Retry algorithms

- Retry only transient failures.
- Use exponential backoff with jitter.
- Set a maximum attempt count and total deadline.
- Respect `Retry-After` where applicable.
- Do not retry validation, authorization, or deterministic business-rule failures.
- Retried write operations MUST be idempotent or protected by an idempotency mechanism.

### 12.12 Rate limiting algorithms

Choose based on the requirement:

- Fixed window: simplest, but boundary bursts are possible.
- Sliding window: more accurate over a moving interval.
- Token bucket: supports controlled bursts.
- Leaky bucket: smooths processing rate.

Rate-limit keys SHOULD consider authenticated user, tenant, API key, route, and trusted client IP strategy.

### 12.13 Frontend-specific algorithm rules

- Virtualize very large lists instead of rendering every row.
- Filter and sort large remote datasets on the server.
- Use normalized entity state only when repeated cross-list updates justify it.
- Use optimistic updates only with rollback or reconciliation behavior.
- Avoid expensive derived calculations in render; compute near the data source or memoize after measuring.
- Keep React keys stable and identity-based; never use array indexes for reorderable lists.

### 12.14 Backend-specific algorithm rules

- Prevent N+1 database access through joins, eager loading, batching, or data loaders.
- Use bulk inserts/updates where supported.
- Stream or paginate large exports rather than loading all rows into memory.
- Apply bounded concurrency to external API calls.
- Use queues for long-running or retryable work.
- Avoid application-side joins when the relational database can perform them efficiently.
- Avoid distributed locks unless simpler database constraints or atomic operations cannot solve the problem.

---

## 13. Frontend Architecture

### 13.1 Frontend layers

A practical frontend feature may contain:

1. Route/page composition.
2. Feature components.
3. Form or interaction orchestration hooks.
4. Runtime schemas.
5. Query and mutation definitions.
6. API client functions.
7. Pure utilities.
8. Shared UI primitives.

Not every feature needs every layer.

### 13.2 Locality rule

- Feature-specific code MUST remain inside the feature.
- Global `components`, `hooks`, `utils`, `constants`, and `lib` directories are for genuinely reused code.
- Do not move code to a global folder after the first use.
- Promote code to shared scope only when its contract is stable and multiple unrelated features need it.

### 13.3 Dependency rule

Preferred frontend dependency direction:

```text
Routes / pages
    ↓
Feature composition
    ↓
Feature hooks + feature UI
    ↓
Queries / mutations / schemas
    ↓
API clients + shared infrastructure
```

Presentational components MUST NOT know database entities or backend implementation details.

---

## 14. Preferred Frontend Folder Structure

This is the preferred default for a medium or large Next.js application:

```text
src/
├── app/
│   ├── (public)/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── api/
│   ├── layout.tsx
│   ├── loading.tsx
│   ├── error.tsx
│   └── not-found.tsx
├── components/
│   ├── ui/
│   ├── layout/
│   └── shared/
├── features/
│   ├── products/
│   │   ├── api/
│   │   ├── components/
│   │   ├── forms/
│   │   ├── hooks/
│   │   ├── queries/
│   │   ├── mutations/
│   │   ├── schemas/
│   │   ├── constants/
│   │   ├── types/
│   │   ├── utils/
│   │   └── index.ts
│   └── orders/
├── hooks/
├── lib/
│   ├── auth/
│   ├── api/
│   ├── query/
│   ├── validation/
│   └── observability/
├── constants/
├── utils/
├── providers/
├── styles/
├── types/
└── tests/
```

### 14.1 Meaning of preferred folders

- `app`: routing, layouts, route-level loading/error boundaries, metadata, and composition.
- `components/ui`: low-level reusable UI primitives.
- `components/layout`: navigation, shell, headers, sidebars, and structural UI.
- `components/shared`: reusable business-neutral compositions.
- `features`: business-capability code.
- `hooks`: only cross-feature hooks.
- `lib`: configured clients, framework integrations, adapters, and infrastructure.
- `utils`: small pure cross-feature functions.
- `constants`: stable cross-feature constants.
- `providers`: client provider composition.
- `types`: only truly global types; feature types remain local.

### 14.2 Folder anti-patterns

Do not create:

```text
components/   # containing hundreds of unrelated business components
utils/        # containing API calls, business rules, and random helpers
services/     # containing every kind of logic
types/        # containing all domain types in one file
common/       # unclear ownership
misc/         # prohibited
```

### 14.3 Small-project exception

A small project MAY begin with fewer folders. Do not create empty architecture. Introduce feature folders when the application has multiple business capabilities or files begin to lose ownership clarity.

---

## 15. Component Design Rules

### 15.1 Component responsibilities

A component SHOULD primarily do one of these:

- Render UI from props.
- Compose child components.
- Connect a feature hook to presentation.
- Own a small, local interaction.

A component SHOULD NOT simultaneously:

- Fetch remote data.
- Normalize multiple API shapes.
- contain a large validation schema.
- Orchestrate multiple mutations.
- Render a complex form.
- Implement permissions.
- Format every domain value.

### 15.2 Container and presentation split

Use this split when it improves clarity:

```text
product-list-container.tsx  # query, state, orchestration
product-list.tsx            # rendering
product-card.tsx            # reusable item UI
```

Do not force this split for tiny components.

### 15.3 Props

- Pass the minimum data and callbacks a child needs.
- Prefer explicit props over passing a huge feature object.
- Do not pass state setters across many layers when a domain callback communicates intent better.
- Avoid prop drilling only when it is actually harmful; do not introduce global state for two levels of props.

Better:

```tsx
<PriceField
  currency={currency}
  value={price}
  onChange={handlePriceChange}
  error={errors.price?.message}
/>
```

### 15.4 Complex children

When an input or UI section has complex behavior, extract it into a focused component and pass only what it needs. The parent form remains responsible for overall composition, while the child owns its UI-specific interaction.

### 15.5 Render purity

- Render MUST remain pure.
- Do not mutate props, state, query cache, or external values during render.
- Do not start network requests manually during render.
- Do not generate unstable identifiers during render when hydration consistency matters.

---

## 16. Forms Architecture

The preferred form pattern separates rendering, validation, orchestration, complex fields, and persistence while keeping the connection obvious.

### 16.1 Preferred form structure

```text
features/products/forms/product-form/
├── product-form.tsx
├── fields/
│   ├── product-price-field.tsx
│   ├── product-images-field.tsx
│   └── product-variants-field.tsx
├── hooks/
│   └── use-product-form.ts
├── schemas/
│   └── product-form.schema.ts
├── product-form.constants.ts
├── product-form.types.ts
└── index.ts
```

For a simpler feature, this may be flattened:

```text
forms/
├── product-form.tsx
├── use-product-form.ts
├── product-form.schema.ts
└── product-form.types.ts
```

### 16.2 Responsibility split

#### `product-form.tsx`

MUST:

- Render the form layout.
- Render simple inputs.
- Compose complex field components.
- Connect submit/loading/error state from the form hook.
- Keep business and transport logic minimal.

MUST NOT:

- Contain the full Zod schema.
- Directly call arbitrary API endpoints.
- Contain complex transformation and mutation logic.
- Reimplement validation messages already owned by the schema.

#### Complex field component

MUST:

- Own complex UI interaction for that field.
- Receive only the field value, callbacks, errors, disabled state, and required contextual data.
- Remain reusable within the feature when practical.

SHOULD NOT:

- Submit the entire form.
- Know unrelated form fields.
- Call unrelated mutations.

#### `use-product-form.ts`

MUST:

- Configure React Hook Form.
- Connect the resolver to the schema.
- Define defaults and reset behavior.
- Orchestrate submission.
- Transform form values to an application command when necessary.
- Expose a small API to the form component.

MAY:

- Integrate a feature mutation hook.
- Expose derived states such as `isSubmitting` or `canSubmit`.

MUST NOT:

- Render JSX.
- Own backend-only authorization rules.
- become a generic “everything hook” for the whole feature.

#### Schema file

MUST:

- Define runtime validation and normalization for form input.
- Produce the form input/output types where supported.
- Remain independent from React rendering.

MUST NOT:

- Call APIs.
- Access browser globals.
- contain mutation side effects.

### 16.3 Example

```ts
// product-form.schema.ts
import { z } from "zod";

export const productFormSchema = z.object({
  name: z.string().trim().min(2).max(120),
  price: z.coerce.number().positive(),
  currency: z.enum(["EGP", "USD", "EUR"]),
});

export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormValues = z.output<typeof productFormSchema>;
```

```ts
// use-product-form.ts
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  productFormSchema,
  type ProductFormInput,
  type ProductFormValues,
} from "../schemas/product-form.schema";

export function useProductForm(
  onSubmit: (values: ProductFormValues) => Promise<void>,
) {
  const form = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      price: 0,
      currency: "EGP",
    },
  });

  return {
    form,
    submit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
  };
}
```

```tsx
// product-form.tsx
export function ProductForm({ onSubmit }: ProductFormProps) {
  const { form, submit, isSubmitting } = useProductForm(onSubmit);

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate>
        <ProductNameField />
        <ProductPriceField currencyOptions={currencyOptions} />
        <SubmitButton disabled={isSubmitting} />
      </form>
    </FormProvider>
  );
}
```

### 16.4 Validation rules

- Client validation improves UX; server validation is authoritative.
- Reuse the same schema across client and server only when the trust boundary and runtime allow it.
- Never expose server-only refinements, secrets, or database access to the client bundle.
- Validate file type, size, and content server-side.
- Async uniqueness checks SHOULD be debounced and MUST be verified again during submission.

### 16.5 Form state rules

- Form state belongs to the form library, not a global store, unless the form is a deliberate multi-page persisted workflow.
- Do not mirror every field into component state.
- Use controlled fields only when the UI component requires them.
- Reset forms explicitly after successful create operations or when editing a new entity.
- Handle dirty-state navigation intentionally for important forms.

---

## 17. React Rules

### 17.1 Purity and immutability

- Components and hooks MUST be pure during render.
- Props and state MUST be treated as immutable snapshots.
- Side effects belong in event handlers, effects, server operations, or external-store integrations.

### 17.2 State placement

Use the narrowest correct state owner:

1. Derived value: compute it; do not store it.
2. Local interaction: component state.
3. Shared subtree state: lift state or use context.
4. URL-relevant state: search params or route state.
5. Server state: query/cache library or framework data layer.
6. Cross-feature client state: Zustand or Redux Toolkit only when justified.

### 17.3 Effects

Use an effect only to synchronize with an external system, such as:

- Browser APIs.
- Timers.
- Subscriptions.
- Third-party widgets.
- Imperative network behavior not handled by framework/query tools.

Do not use effects for:

- Deriving state from props.
- Responding to a click that can be handled in the event.
- Chaining state updates that can be computed together.
- Fetching data when Next.js server data or TanStack Query is the established pattern.

Every effect MUST have correct dependencies and cleanup where needed.

### 17.4 Hooks

- Hooks MUST follow the Rules of Hooks.
- Custom hooks SHOULD express reusable behavior, not merely move lines out of a component.
- A hook SHOULD expose a small semantic API.
- Avoid hooks that return dozens of unrelated fields.
- Never conditionally call a hook.

### 17.5 Memoization

- Do not add `useMemo`, `useCallback`, or `memo` automatically.
- Use them when profiling, stable identity contracts, or expensive calculations justify them.
- React Compiler support SHOULD be considered before widespread manual memoization.
- Correctness MUST never depend on memoization.

### 17.6 Context

- Keep context values focused.
- Split frequently changing and stable values when rerenders matter.
- Memoize provider values only when necessary.
- Do not use one global “app context” for unrelated state.

### 17.7 Error and loading UI

- Every asynchronous feature SHOULD define loading, empty, error, and success states.
- Do not treat “no data” as a generic error.
- Errors SHOULD offer a meaningful recovery action when possible.
- Suspense boundaries SHOULD be placed around coherent loading regions.

### 17.8 2026 React 19.2 addendum and source-of-truth rule

> **Added:** 2026-08-16. This subsection extends the existing React rules without deleting them.
>
> Current official React documentation identifies React **19.2** as the stable documentation baseline. The installed project version still takes precedence over this snapshot.

Before implementing or refactoring React behavior, an agent MUST:

1. Inspect the installed `react`, `react-dom`, TypeScript, ESLint, framework, and form/data-library versions.
2. Prefer version-matched official React/framework documentation over remembered APIs.
3. Distinguish stable APIs from experimental/canary APIs before using them.
4. Preserve existing project conventions unless there is a concrete correctness, security, maintainability, or migration reason to change them.
5. Never introduce a new hook, compiler directive, state library, or rendering pattern because it is merely newer.
6. Explain the architectural reason when replacing an established project pattern.

If an older rule in this file conflicts with version-matched official React documentation, the official documentation wins according to the instruction priority in Section 3.

### 17.9 Effect decision tree: `useEffect` is an escape hatch, not a default

The default question is **not** “what dependency array should this Effect have?” The default question is **“why does this logic need an Effect at all?”**

An agent MUST use this decision order before writing `useEffect`:

1. **Can the value be calculated from props/state during render?**
   - Calculate it during render.
   - Do not copy it into state.
   - Do not synchronize duplicated state with an Effect.
2. **Did a user interaction cause the work?**
   - Put the work in the corresponding event handler, form Action, mutation, or command.
   - Do not observe a state flag with an Effect merely to discover that the user clicked something.
3. **Is the work server data fetching?**
   - In Next.js Server Components, prefer server data access.
   - In client-heavy React applications, use the project's server-state library such as TanStack Query when that is the established architecture.
   - Do not build a home-grown request lifecycle with `useEffect + useState` unless the project has a justified reason.
4. **Is the work synchronization with something outside React?**
   - An Effect is appropriate for subscriptions, browser APIs, timers, sockets, imperative third-party widgets, media APIs, external stores without a dedicated integration, and similar external systems.
5. **Does the external system require layout measurement before paint?**
   - Consider `useLayoutEffect` only for that narrow case.
   - Prefer `useEffect` otherwise.
6. **Is the code library-level CSS injection logic?**
   - `useInsertionEffect` is a specialized library API, not an application default.

#### 17.9.1 Forbidden Effect patterns

Agents MUST NOT create Effects whose primary job is any of the following:

```tsx
// ❌ derived state
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);
```

Prefer:

```tsx
// ✅ derive during render
const fullName = `${firstName} ${lastName}`;
```

Do not use an Effect to:

- Filter, sort, map, aggregate, or format data for rendering.
- Copy props into state without a deliberate state-reset/independent-editing requirement.
- Chain multiple state setters that model one state transition.
- Perform submit/click/purchase/delete logic that belongs to the interaction that triggered it.
- Keep two pieces of React state synchronized when one can be derived from the other.
- Notify a parent of state that the parent could own directly.
- Reset an entire subtree when a stable `key` can intentionally reset component state.
- Silence an architecture problem by adding a dependency array.

#### 17.9.2 Synchronous `setState` inside Effects

Synchronous state updates inside an Effect SHOULD be treated as a code smell because they often cause an avoidable render -> commit -> Effect -> render cycle.

Before accepting `setState` inside an Effect, the agent MUST confirm that the state comes from an actual external synchronization event rather than a value already available during render.

Examples that can be valid include:

- State updated from an external subscription callback.
- Measurements obtained from an imperative browser API.
- Data emitted by a non-React widget.

### 17.10 Effect dependencies and `useEffectEvent`

Dependency arrays describe the reactive values used by an Effect. Agents MUST NOT manually omit dependencies merely to control when an Effect runs.

Required rules:

- `exhaustive-deps` MUST remain enabled unless a project has a documented exception.
- Never add an ESLint disable comment as the first fix for an Effect dependency warning.
- If dependencies are undesirable, restructure the Effect or surrounding code first.
- Move interaction-specific logic to event handlers.
- Move stable, non-reactive Effect event logic to `useEffectEvent` when that matches the semantics.

Use `useEffectEvent` when:

- The code is conceptually an event emitted from an Effect/external system.
- It must read the latest props/state.
- Those values should not cause the external subscription or connection itself to restart.

Example:

```tsx
function ChatRoom({ roomId, theme }: ChatRoomProps) {
  const onConnected = useEffectEvent(() => {
    showNotification("Connected", theme);
  });

  useEffect(() => {
    const connection = createConnection(roomId);

    connection.on("connected", onConnected);
    connection.connect();

    return () => connection.disconnect();
  }, [roomId]);
}
```

`useEffectEvent` MUST NOT be used:

- As a generic replacement for callbacks.
- To hide missing dependencies.
- During rendering.
- As a prop passed around the component tree.
- Outside Effects or other Effect Events.

### 17.11 State modeling before state management

Before introducing state, agents MUST classify the value:

| Value | Preferred owner |
|---|---|
| Purely derived display value | Render-time calculation |
| Temporary local interaction | `useState` / `useReducer` |
| Complex local state machine | Reducer or explicit state machine when justified |
| Form fields | Form library / native form contract |
| URL-shareable filters/sort/page | URL/search params |
| Remote server data | Framework data layer / server-state library |
| Focused subtree dependency | Context |
| Cross-feature client workflow | Zustand/Redux only when justified |
| Mutable value not used for rendering | `useRef` |

Agents MUST avoid “state inflation”: every additional state variable increases synchronization paths and possible invalid states.

When several fields always transition together, prefer one explicit state object/reducer or a domain transition instead of loosely coordinated setters.

### 17.12 Events, Actions, and form mutations in React 19

React 19 Actions provide a modern primitive for async mutations and pending/error/optimistic UI. They complement, rather than automatically replace, React Hook Form, Zod, TanStack Query, or framework Server Actions.

Agents MUST choose based on the project's architecture.

#### 17.12.1 Form Action rules

A function passed to `<form action={...}>` is executed using the React Action/Transition model.

Use this model when it makes the flow simpler and the framework supports it well.

Agents SHOULD use:

- `useActionState` when the UI needs state returned by an Action, especially validation or submission feedback.
- `useFormStatus` in a descendant of the form when a submit control needs the parent form's pending state.
- `useOptimistic` for reversible optimistic UI when immediate feedback materially improves UX.

Agents MUST NOT:

- Trust client-side validation as authorization or server validation.
- Put database/business logic directly into a visual form component.
- Duplicate the same mutation state across React Hook Form, local state, mutation libraries, and Action state without a reason.
- Add optimistic behavior when rollback/reconciliation is undefined.

#### 17.12.2 Existing React Hook Form + Zod architecture remains valid

For this engineering constitution, the preferred existing pattern remains:

```text
feature-form/
├── feature-form.tsx          # composition + presentation
├── fields/                   # complex inputs only
├── hooks/
│   └── use-feature-form.ts   # form orchestration
├── schemas/
│   └── feature-form.schema.ts
├── feature-form.types.ts
└── feature-form.constants.ts
```

Use React Actions/Next Server Actions behind this architecture when they improve the mutation boundary. Do not collapse schemas, API logic, mutation orchestration, and complex field behavior back into one component just because Actions exist.

### 17.13 `useOptimistic` rules

Optimistic UI is a UX optimization, not a correctness mechanism.

Use `useOptimistic` when:

- The expected successful result is highly predictable.
- The server remains authoritative.
- Failure can be clearly reconciled or rolled back.
- The operation is safe to represent optimistically.

Prefer reducer/updater forms for relative changes so concurrent server updates do not make optimistic state stale.

Do not optimistically represent:

- Payment completion before authoritative confirmation.
- Permission changes with security consequences unless the UI clearly remains provisional.
- Inventory/order guarantees that the server has not accepted.
- Irreversible destructive operations without a deliberate recovery model.

### 17.14 `use`, Promises, Suspense, and data reading

React's `use(resource)` API can read a Promise or context and integrates Promise reads with Suspense and Error Boundaries.

Rules:

- In React Server Components, prefer normal `async` / `await` for server data fetching unless a framework-specific pattern requires `use`.
- A Promise intended for a Client Component SHOULD preferably be created on the server/framework side and passed down when supported, rather than recreated on every client render.
- `use(Promise)` MUST be enclosed by an appropriate Suspense/Error Boundary strategy.
- `use(Context)` MAY be useful where conditional context reads improve clarity, but do not introduce it merely for novelty if `useContext` is already clear and consistent.
- Never assume Suspense catches data fetched from an arbitrary `useEffect`; it does not.

### 17.15 Suspense boundary design

Suspense is a UI coordination primitive, not a generic loading spinner wrapper.

Agents SHOULD place boundaries around coherent regions that can load independently.

Good boundaries:

- Product recommendations below a stable product shell.
- Account statistics separate from account navigation.
- Search results separate from the search input.
- Secondary dashboard panels that should stream independently.

Avoid:

- One giant boundary around an entire application when finer streaming is valuable.
- A boundary around every tiny component, producing visual flicker and complexity.
- Hiding expected validation errors behind generic Suspense/error fallback behavior.

When already-visible content suspends during an update, prefer Transitions or `useDeferredValue` when preserving stale content creates a better experience.

### 17.16 Transitions and deferred rendering

Use `startTransition` / `useTransition` for non-urgent state updates that may trigger expensive rendering or Suspense.

Rules:

- Keep direct controlled-input updates urgent.
- Transition expensive dependent UI, navigation-like state, or large result rendering where appropriate.
- Use `useTransition` when the component needs a pending indicator; `startTransition` is sufficient when it does not.
- Do not use transitions as artificial delays.
- Do not use transitions to hide slow algorithms that should be fixed, virtualized, paginated, cached, or moved to the server.

`useDeferredValue` rules:

- Use it to let expensive/stale display content lag behind urgent input.
- It defers rendering, **not network requests**.
- If request volume is the problem, use cancellation, request deduplication, caching, debounce where semantically correct, or server-state-library features.
- Do not pass a freshly created object every render when a stable primitive/object can be used.

### 17.17 React Compiler is the default optimization direction

React Compiler is stable and performs build-time automatic memoization of React components and values when code follows the Rules of React.

For projects where the toolchain supports it, agents SHOULD evaluate enabling React Compiler before adding broad manual memoization.

Rules:

1. Correctness and component purity come before compiler adoption.
2. Never add `useMemo`, `useCallback`, or `memo` mechanically to every component.
3. Keep existing manual memoization when it has a measured purpose or identity contract.
4. If manual memoization remains, dependencies MUST be complete.
5. Use profiling to justify optimization work.
6. A compiler diagnostic is a signal to inspect the code pattern; do not automatically silence it.
7. Do not use `"use no memo"` as a permanent workaround. It is a narrow debugging/escape hatch and requires a documented reason.
8. Do not add compiler configuration copied from another project without checking the installed compiler/framework version.

The compiler does not remove the need to:

- Choose good component boundaries.
- Avoid excessive client state.
- Prevent expensive network requests.
- Virtualize large lists.
- Use efficient data structures.
- Reduce bundle size.
- Prevent context-wide invalidation.
- Design caching correctly.

### 17.18 Mandatory React linting mindset

`eslint-plugin-react-hooks` now covers fundamental Hooks rules plus diagnostics related to React Compiler.

Agents MUST treat these categories as engineering feedback rather than cosmetic lint noise:

- `rules-of-hooks`.
- `exhaustive-deps`.
- Purity violations.
- Synchronous `setState` in Effects when avoidable.
- Unconditional `setState` during render.
- Components recreated inside component render (`static-components`).
- Mutation of values that should be immutable.
- Unsafe ref access patterns.
- Unsupported compiler syntax.
- Incompatible library patterns identified by the compiler/linter.
- Broken manual memoization contracts.

A lint suppression MUST include a local reason when suppression is genuinely necessary.

### 17.19 Do not define component types during render

Component definitions SHOULD be module-level or otherwise stable.

Avoid:

```tsx
function Parent() {
  function Child() {
    return <div />;
  }

  return <Child />;
}
```

Defining a component type during each render can cause React to treat it as a new type, reset state, and recreate DOM.

Use local render helper functions only when they are plain functions returning JSX and are not used as dynamically created component types with their own lifecycle/state.

### 17.20 React 19 refs

For new React 19 code, prefer receiving `ref` as a prop instead of introducing new `forwardRef` wrappers.

```tsx
interface InputProps extends React.ComponentProps<"input"> {
  ref?: React.Ref<HTMLInputElement>;
}

export function Input({ ref, ...props }: InputProps) {
  return <input ref={ref} {...props} />;
}
```

Rules:

- Existing `forwardRef` code does not need a risky mass rewrite during unrelated feature work.
- Use refs for imperative access, not as hidden state management.
- Prefer declarative props over imperative handles when possible.
- Callback refs MAY return cleanup functions in React 19; do not use ambiguous implicit return values from ref callbacks.

### 17.21 React 19 Context provider syntax

New React 19 code MAY use the context object directly as the provider:

```tsx
<ThemeContext value={theme}>
  {children}
</ThemeContext>
```

`<ThemeContext.Provider>` is a legacy-compatible form. Do not churn an existing codebase only to change syntax.

Context remains a dependency-distribution mechanism, not a default global-state solution.

### 17.22 `<Activity>` for hidden but restorable UI

React 19.2 `<Activity>` can hide UI while preserving its state/DOM for later restoration. Hidden Activity content has its Effects cleaned up and is processed at lower priority.

Consider it for:

- Tabs whose internal drafts/state should survive switching.
- Side panels likely to reappear.
- Pre-rendering likely next UI without keeping subscriptions active.

Do not use `<Activity>` when:

- The content should be fully destroyed for security/privacy reasons.
- Preserving DOM/state would consume unacceptable memory.
- The application expects unmount to erase sensitive local data.
- Normal conditional rendering is simpler and state preservation is unnecessary.

Hidden Activity content MUST still have correct Effect cleanup semantics.

### 17.23 React Server Component APIs

When operating inside a framework that implements React Server Components:

- Use the framework's documented RSC conventions rather than inventing a custom RSC bundling/runtime layer.
- Treat React `cache()` as request/render-oriented React caching semantics, not automatically as a durable application cache.
- `cacheSignal()` is an RSC-oriented API for aborting work when a cache/render lifetime ends; use it only where the framework/runtime supports the pattern.
- Do not expose server-only secrets or records through serialized props.

### 17.24 Hydration correctness

Hydration mismatches MUST be fixed at the source rather than hidden.

During SSR/hydration, avoid non-deterministic render output from:

- `Date.now()`.
- `new Date()` when server/client formatting differs.
- `Math.random()`.
- `crypto.randomUUID()` during render.
- Browser-only branches that produce different initial markup.
- Locale/timezone-dependent output without a deliberate server/client strategy.
- Invalid HTML nesting.

When browser-only state is necessary, design a stable server fallback and update after hydration, or keep the relevant UI behind a framework-supported client/dynamic boundary.

### 17.25 Performance measurement in React 19.2

Agents MUST measure before performing broad performance refactors.

Use appropriate tooling such as:

- React DevTools Profiler.
- Browser Performance panel.
- React 19.2 Performance Tracks where available.
- Bundle analysis.
- Web Vitals / application telemetry.

Performance work SHOULD identify whether the real bottleneck is:

1. Too much JavaScript shipped.
2. Expensive rendering.
3. Re-render fan-out.
4. Large DOM/list rendering.
5. Slow server/network requests.
6. Waterfalls.
7. Image/font/script cost.
8. Poor caching.
9. Inefficient algorithm/data structure.

Do not assume memoization is the answer before identifying the category.

### 17.26 React code review checklist for agents

Before finishing React work, verify:

- [ ] No unnecessary Effect was added.
- [ ] Every remaining Effect synchronizes with an external system or has a documented reason.
- [ ] Effect dependencies are complete; no linter suppression was added casually.
- [ ] Derived values are derived instead of duplicated in state.
- [ ] User-triggered logic lives in the triggering event/Action/mutation.
- [ ] Server state is not duplicated into unnecessary global client state.
- [ ] Components stay pure during render.
- [ ] No component type is accidentally recreated during render.
- [ ] `useMemo` / `useCallback` / `memo` have a reason if present.
- [ ] Optimistic UI has failure reconciliation.
- [ ] Suspense boundaries map to coherent UX regions.
- [ ] Controlled inputs remain responsive.
- [ ] Complex form fields, schema, and form orchestration remain separated according to Section 16.
- [ ] Client/server trust boundaries are preserved.
- [ ] Accessibility and keyboard behavior remain correct.
- [ ] Tests cover the behavior rather than implementation details alone.

### 17.27 Official React source map for agents

When internet access is allowed, prefer these official sources over blogs/tutorial memory:

- React documentation and API reference: `https://react.dev/`
- React 19.2 release notes: `https://react.dev/blog/2025/10/01/react-19-2`
- You Might Not Need an Effect: `https://react.dev/learn/you-might-not-need-an-effect`
- Synchronizing with Effects: `https://react.dev/learn/synchronizing-with-effects`
- Separating Events from Effects: `https://react.dev/learn/separating-events-from-effects`
- Removing Effect Dependencies: `https://react.dev/learn/removing-effect-dependencies`
- React Compiler: `https://react.dev/learn/react-compiler/introduction`
- React Hooks lint reference: `https://react.dev/reference/eslint-plugin-react-hooks`
- `useEffectEvent`: `https://react.dev/reference/react/useEffectEvent`
- `useActionState`: `https://react.dev/reference/react/useActionState`
- `useOptimistic`: `https://react.dev/reference/react/useOptimistic`
- `useFormStatus`: `https://react.dev/reference/react-dom/hooks/useFormStatus`
- React `<form>` Actions: `https://react.dev/reference/react-dom/components/form`
- `use`: `https://react.dev/reference/react/use`
- `<Activity>`: `https://react.dev/reference/react/Activity`

An agent MUST still verify that the project's installed React version supports an API before using it.

---

## 18. Next.js Rules

### 18.1 App Router default

New Next.js applications MUST use the App Router unless a project constraint requires the Pages Router.

### 18.2 Server-first rendering

- Pages and layouts are Server Components by default.
- Add `"use client"` only at the smallest boundary that needs state, effects, event handlers, browser APIs, or client-only libraries.
- Do not mark an entire page client-side because one button is interactive.

### 18.3 Recommended structure

```text
src/app/
├── (marketing)/
│   ├── page.tsx
│   └── layout.tsx
├── (dashboard)/
│   ├── layout.tsx
│   └── products/
│       ├── page.tsx
│       ├── loading.tsx
│       ├── error.tsx
│       └── [productId]/page.tsx
├── api/
├── layout.tsx
├── global-error.tsx
└── not-found.tsx
```

Route groups SHOULD express layout or access boundaries, not random categorization.

### 18.4 Data access

Preferred order:

1. Server Components may call the application/data layer directly when appropriate.
2. Client Components use an API, Server Action, or hydrated query pattern.
3. External clients use documented HTTP APIs.

Do not make a Server Component call the same application's Route Handler over HTTP when it can call the underlying service directly.

### 18.5 Data Access Layer

For applications with sensitive data or non-trivial authorization:

- Create a server-only data access or application layer.
- Mark server-only modules appropriately.
- Perform authentication and authorization close to data access.
- Return narrow DTOs rather than whole database records.
- Do not pass secrets, password hashes, internal flags, or unnecessary columns to Client Components.

### 18.6 Server Actions

Treat every Server Action as a public server endpoint:

- Validate input.
- Authenticate the user.
- Authorize the exact operation and resource.
- Perform the mutation through an application service.
- Revalidate or update the relevant cache.
- Return a serializable, safe result.
- Do not rely on a hidden button for security.

### 18.7 Route Handlers

Use Route Handlers for:

- Public or external APIs.
- Webhooks.
- Client-side requests requiring an HTTP boundary.
- File responses.
- BFF endpoints.

Route Handlers SHOULD remain thin and delegate domain behavior.

### 18.8 Caching

- Caching MUST be explicit.
- Define whether data is static, request-time, user-specific, tenant-specific, or revalidated.
- Never cache authorization-sensitive output under a shared key.
- Use tags or path revalidation narrowly.
- Do not add `use cache` without understanding data freshness and invalidation.
- Verify current version-matched caching behavior because Next.js caching semantics evolve.

### 18.9 Authentication

- Prefer a maintained authentication library when appropriate.
- Keep session verification and authorization in a server-only DAL or service.
- Middleware MAY perform optimistic routing checks, but authoritative authorization belongs near the protected operation.
- Cookies MUST use secure attributes appropriate to the environment.

### 18.10 Metadata and assets

- Use the Metadata API for route metadata.
- Use `next/image` when it provides value and remote sources are configured safely.
- Use `next/font` or the project font strategy to avoid layout shifts.
- Avoid shipping large client-side icon or utility bundles for a few symbols.

### 18.11 Error boundaries

- Use route-level `error.tsx` for recoverable segment failures.
- Use `notFound()` for missing resources.
- Do not leak internal errors into rendered messages.
- Log server errors with request context and correlation identifiers.

### 18.12 AI-agent documentation rule

Before changing Next.js behavior, the agent SHOULD read the installed, version-matched Next.js documentation from the package when available, because local documentation matches the exact framework version better than remembered behavior.

### 18.13 BFF boundary

Next.js MAY act as a Backend for Frontend when:

- It aggregates APIs for the web client.
- It owns web session behavior.
- It performs web-specific transformations.
- It proxies with security and observability controls.

It SHOULD NOT become the accidental owner of all enterprise domain logic when a dedicated backend already exists.

### 18.14 2026 Next.js 16.3 addendum and current-version rule

> **Added:** 2026-08-16. This subsection extends the existing Next.js rules without deleting them.
>
> The official Next.js documentation currently exposes the **16.3.x** line and identifies **16.3.1** in current reference pages. Earlier 16.2 guidance retained elsewhere in this file is a historical snapshot; the project's installed version and version-matched official docs remain authoritative.

For any Next.js task, the agent MUST inspect at minimum:

- `package.json`.
- The package-manager lockfile.
- `next.config.*`.
- `tsconfig.json`.
- `src/app` / `app` structure.
- Existing `proxy.ts` / `middleware.ts`.
- Existing caching directives and revalidation calls.
- Authentication/session architecture.
- Deployment/runtime constraints.

Do not copy Next.js behavior from an older project without confirming the installed version.

### 18.15 Mandatory docs-first protocol for AI agents

Next.js changes rapidly enough that remembered behavior is not a sufficient source of truth.

Before implementing non-trivial framework behavior, an agent MUST:

1. Determine the exact installed Next.js version.
2. Read the installed/version-matched documentation when available.
3. For Next.js installations that include local docs, inspect the relevant files under `node_modules/next/dist/docs` before guessing.
4. When network documentation is needed, use official `nextjs.org` documentation matching the installed major/minor behavior.
5. Read the version migration guide before changing APIs affected by a major/minor migration.
6. Identify whether an API is stable, experimental, deprecated, or removed.
7. Never infer caching behavior from old Next.js versions.
8. Never enable an experimental feature silently.

When a task mentions “best practice”, the agent MUST translate that into the best practice **for the installed version and this application's requirements**, not the newest possible syntax.

### 18.16 Server-first architecture and small client islands

The App Router remains server-first.

Rules:

- Pages and layouts are Server Components unless a Client Component boundary is explicitly introduced.
- Add `"use client"` at the narrowest practical interactive boundary.
- Do not mark a page/layout client-side only because one descendant needs an event handler or browser API.
- Props crossing into a Client Component MUST be serializable by React.
- Server Components MAY be passed as children/props through Client Components using supported composition patterns.
- Provider components that require client state SHOULD be placed as deep as practical instead of wrapping more of the tree than necessary.
- Keep server-only dependencies and secrets out of client-reachable import graphs.

A Client Component SHOULD exist because it needs one or more of:

- Local interactive state.
- Event handlers.
- Effects.
- Browser-only APIs.
- Client-only third-party libraries.
- Client-side context providers.

A Client Component SHOULD NOT exist merely because:

- It displays fetched data.
- It renders a list.
- It formats deterministic server-safe content.
- A child component is interactive.

### 18.17 Async Request APIs are mandatory in Next.js 16

In Next.js 16, request-time APIs that previously allowed synchronous access are asynchronous.

Agents MUST use the version-correct async forms for:

- `cookies()`.
- `headers()`.
- `draftMode()`.
- `params` in relevant pages/layouts/routes/metadata APIs.
- `searchParams` in pages.

Example:

```tsx
interface PageProps {
  params: Promise<{ productId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { productId } = await params;
  const filters = await searchParams;

  return <ProductPage productId={productId} filters={filters} />;
}
```

Do not restore synchronous access through casts, `any`, compatibility hacks, or copied Next 15 patterns.

### 18.18 Cache Components changes the mental model

Next.js 16 introduced Cache Components as the modern explicit caching model.

Agents MUST first determine whether `cacheComponents` is enabled in `next.config.*` before applying Cache Components-specific behavior.

Core mental model:

- **Cache deliberately reusable work.**
- **Stream request-time/fresh work behind Suspense when appropriate.**
- **Do not guess whether a route is static/dynamic from old Next.js caching rules.**

When Cache Components is enabled:

- Use `"use cache"` for data/output intended to be reused.
- Pair cached work with an intentional lifetime using `cacheLife` where appropriate.
- Add semantic tags with `cacheTag` when mutations need targeted invalidation.
- Place runtime/request-time work behind appropriate Suspense boundaries.
- Do not cache authorization-sensitive output in a shared scope without a correct user/tenant key and documented security analysis.

### 18.19 `use cache` decision rules

#### Standard `"use cache"`

Use for reusable cacheable work that does not need private request APIs inside the cached scope.

Typical candidates:

- Public catalog data.
- CMS content.
- Shared reference tables.
- Expensive deterministic computations.
- Public product/category pages with explicit freshness requirements.

Every use SHOULD answer:

1. What is the cache key?
2. Who is allowed to share this value?
3. How long may it be stale?
4. What event invalidates it?
5. What happens after a write?

#### `"use cache: private"`

Use only when the installed Next.js version supports it and cached work needs runtime request APIs such as cookies/headers/search params while remaining private to the relevant request/user caching semantics.

Do not treat `private` as an authorization feature. Authorization still belongs in the DAL/service and protected operation.

#### `"use cache: remote"`

Use only when the application deliberately configures/needs a durable remote cache shared across server instances.

Do not enable remote caching because it sounds more scalable. Confirm:

- Provider/runtime support.
- Serialization constraints.
- Tenant/user isolation.
- Invalidation behavior.
- Failure/fallback strategy.
- Cost and observability.

### 18.20 Cache lifetime and invalidation

Caching without an invalidation model is incomplete architecture.

Agents SHOULD pair cache directives with an explicit `cacheLife` profile/strategy rather than depending unknowingly on defaults.

Use tags for domain-level invalidation:

```ts
"use cache";

import { cacheLife, cacheTag } from "next/cache";

export async function getProduct(productId: string) {
  cacheLife("minutes");
  cacheTag(`product:${productId}`);

  return productRepository.findById(productId);
}
```

Use the narrowest invalidation scope that reflects the mutation.

#### `updateTag`

Prefer when a Server Action/Function needs immediate invalidation and **read-your-own-writes** behavior so subsequent reads reflect the just-written data.

#### `revalidateTag`

Prefer when stale-while-revalidate semantics are acceptable and the application can serve stale content until the next visit triggers fresh data.

#### `revalidatePath`

Use when path-level invalidation is truly the correct boundary. Do not invalidate broad route trees when a semantic tag can target the affected data.

Agents MUST NOT solve every mutation with `revalidatePath("/")` or broad cache clearing.

### 18.21 Request-time values, `connection()`, timestamps, and randomness

With Cache Components, Next.js requires intentional handling of request-time work.

If rendering must wait for an incoming request before evaluating synchronous request-time values such as a timestamp or random value, use the version-supported `connection()` pattern rather than accidentally capturing the value during prerendering.

`connection()` replaces older `unstable_noStore`-style intent in modern Next.js guidance.

Rules:

- Do not call `Date.now()`, `new Date()`, `Math.random()`, or similar non-deterministic APIs in code assumed to be prerendered without deciding whether the value is build-time, cache-time, or request-time.
- If the value is genuinely request-time, make that boundary explicit.
- If it is cacheable, cache it intentionally with a defined lifetime.
- Do not manufacture dynamic rendering merely to work around a misunderstanding of caching.

### 18.22 Fetching data without unnecessary internal HTTP hops

Server Components SHOULD call the data/application layer directly when they are in the same application/runtime.

Avoid:

```text
Server Component
   -> fetch('/api/products')
      -> Route Handler
         -> service
            -> database
```

Prefer:

```text
Server Component
   -> service / DAL
      -> repository
         -> database
```

Reasons:

- Avoid unnecessary HTTP overhead.
- Avoid build-time failures when no server is listening.
- Preserve type/data contracts directly.
- Keep domain logic out of transport layers.

Client Components MAY call Route Handlers or an external backend when an HTTP boundary is required.

### 18.23 Parallel data fetching and waterfall avoidance

Agents MUST inspect dependent server calls for waterfalls.

Prefer:

- Starting independent promises early.
- `Promise.all` for independent work.
- Component-level parallelism with Suspense when regions can stream independently.
- Preload/data-access patterns only when they improve a measured waterfall.

Do not parallelize requests that have a real dependency or transaction ordering requirement.

Do not move everything to the client merely to make requests appear parallel.

### 18.24 Server Actions / Server Functions are security boundaries

Every exported callable Server Action MUST be treated as reachable by an untrusted client.

Required sequence for mutations:

1. Parse/validate input.
2. Resolve the authenticated actor.
3. Authorize the exact action against the exact resource/tenant.
4. Execute domain/application logic.
5. Commit transactional changes where needed.
6. Invalidate/update cache narrowly.
7. Return a minimal serializable safe result.

Never rely on:

- A hidden UI button.
- A route layout check.
- Proxy alone.
- Client role state.
- A disabled input.
- A hidden form field.

for authoritative authorization.

Bind IDs to Server Actions only as a transport convenience; still authorize and validate them server-side.

### 18.25 Data Access Layer and DTO requirements

For applications with authentication, multiple roles, tenants, private records, payments, or administrative functionality, a server-only DAL/application service layer SHOULD be the default.

The DAL SHOULD:

- Verify session/user when appropriate.
- Enforce authorization close to the data operation.
- Accept explicit typed inputs.
- Return narrow DTOs.
- Avoid exposing complete ORM entities by default.
- Avoid returning password hashes, reset tokens, internal flags, secret keys, audit-only fields, or irrelevant columns.
- Be marked server-only where appropriate.

A DTO SHOULD be designed around what the caller is allowed to know, not around what the database row happens to contain.

### 18.26 Authentication with Cache Components

When Cache Components is enabled, request/session reads must respect the dynamic/Suspense model.

Current Next.js guidance requires session-reading UI using request APIs such as `cookies()` to be placed behind an appropriate Suspense boundary rather than accidentally forcing unsafe/unsupported prerender behavior.

Rules:

- Cache public/static shells separately from session-specific content when this improves performance and remains secure.
- Do not put raw session reads inside shared `"use cache"` output.
- Do not share a cached authenticated DTO across users/tenants.
- Keep authorization in the DAL/service even if the UI also performs optimistic route checks.

### 18.27 `proxy.ts` replaces `middleware.ts` for the modern Node.js boundary

Starting in Next.js 16, `proxy.ts` is the preferred name for the request interception boundary previously called Middleware.

Rules:

- New Node-runtime interception logic SHOULD use `proxy.ts`.
- The exported function SHOULD be named `proxy` for clarity.
- Proxy runs on the Node.js runtime in the modern Next.js 16 model.
- If an existing project deliberately requires the Edge runtime and uses legacy `middleware`, do not migrate it blindly; verify the supported path for the installed version.
- Use Proxy for redirects, rewrites, headers, request preprocessing, and optimistic access routing where appropriate.
- Do not move core data fetching, expensive business logic, or authoritative authorization into Proxy.

Think of Proxy as a network/request boundary, not the application's service layer.

### 18.28 Route Handler rules in Next.js 16

Route Handlers are **not cached by default**. GET handlers may opt into caching where supported and appropriate; non-GET mutation methods are not treated as cacheable application reads.

Use Route Handlers for:

- External/public API contracts.
- Webhooks.
- Client-to-server HTTP boundaries.
- File/stream responses.
- BFF aggregation/transformation.
- Integrations requiring raw Request/Response semantics.

Do not use a Route Handler merely to wrap every internal DAL function.

Route Handlers MUST:

- Validate untrusted input.
- Authenticate/authorize where required.
- Use application services for business rules.
- Set explicit cache/security headers when needed.
- Return stable documented error shapes for external clients.
- Avoid leaking stack traces/secrets.

### 18.29 Next.js as a Backend for Frontend

Next.js can be a BFF, but it is not automatically the entire backend architecture.

A Next.js BFF MAY:

- Aggregate several backend services for the web client.
- Adapt response shapes for the UI.
- Own web session/cookie orchestration.
- Hide backend credentials from the browser.
- Provide web-specific streaming/file endpoints.

It SHOULD NOT silently become the owner of:

- Cross-client enterprise domain rules.
- Shared mobile/web business logic that belongs in a dedicated backend.
- Heavy long-running jobs better handled by workers/queues.
- Data pipelines unrelated to the web request lifecycle.

### 18.30 Navigation and prefetching

Use `<Link>` for normal application navigation so Next.js can apply its navigation and prefetch optimizations.

Rules:

- Keep default prefetch behavior unless measurement/product behavior justifies changing it.
- Do not manually prefetch every route.
- Use `router.prefetch()` for intentional cases such as likely future navigation outside normal `<Link>` visibility behavior.
- Do not prefetch sensitive/private data into a shared cache incorrectly.
- Use `router.push` / `router.replace` only with trusted/sanitized URLs; never pass arbitrary untrusted strings because unsafe URLs can create XSS/navigation vulnerabilities.
- Use the URL as state for shareable filters/search/sort/pagination where that improves navigation and history semantics.

### 18.31 Error handling: expected errors versus exceptions

Agents MUST distinguish:

- Expected validation/business errors.
- Missing resources.
- Authentication failures.
- Authorization failures.
- Unexpected exceptions.

Rules:

- Use structured return state for expected form validation/business feedback when appropriate.
- Use `notFound()` for missing route resources when that matches the route contract.
- Use route `error.tsx` boundaries for unexpected recoverable segment exceptions.
- Use `global-error.tsx` only for appropriate root-level failures.
- Do not leak internal messages or stack traces.
- Log unexpected server exceptions with correlation/request context.

Next.js currently exposes `unauthorized()` / `forbidden()` behind the experimental `authInterrupts` option. Agents MUST NOT introduce them into production code as if they were universally stable unless the installed version/config explicitly supports and approves the experimental feature.

### 18.32 Metadata, images, fonts, and scripts

Agents SHOULD prefer framework primitives when they solve the problem correctly:

- Metadata API / `generateMetadata` for page metadata.
- `next/image` for image optimization where compatible with the asset/provider strategy.
- `next/font` / Font Module for predictable local/self-hosted font loading.
- `next/script` for controlled third-party script loading.

Rules:

- `generateMetadata` is part of rendering; do not add request-time behavior unnecessarily if metadata can be prerendered/cached.
- Configure remote image sources narrowly.
- Provide meaningful dimensions/aspect ratios to prevent layout shift.
- Avoid client-side JavaScript for metadata that can be generated on the server.
- Audit third-party scripts for performance, consent, and security impact.

### 18.33 React Compiler in Next.js 16

Next.js 16 has stable support for React Compiler.

Agents MAY enable the supported compiler configuration when:

- The project's Next/React versions support it.
- The codebase follows the Rules of React sufficiently.
- CI/build/test coverage can validate adoption.
- The change is in scope or explicitly approved.

Agents MUST NOT:

- Add manual memoization everywhere before trying/considering compiler support.
- Enable experimental compiler implementations silently.
- Assume the experimental Rust React Compiler path in Next.js 16.3 is production-default merely because it exists.
- Mix a compiler migration into unrelated feature work without approval.

### 18.34 Turbopack rules in Next.js 16.3

Turbopack is the standard modern bundler path in Next.js 16, and 16.3 includes major memory and persistent caching improvements.

Agents SHOULD use the project's default supported Turbopack setup unless a documented incompatibility requires otherwise.

Do not add webpack-specific configuration reflexively. Before doing so:

1. Confirm the feature is unsupported by the installed Turbopack version.
2. Search current official docs/migration guidance.
3. Prefer supported Next configuration over custom loader/plugin complexity.
4. Document the reason if a webpack fallback is required.

Experimental Turbopack features MUST remain opt-in.

### 18.35 Folder and feature architecture for Next.js

The `app/` directory is the routing/composition layer, not a dumping ground for all application logic.

Preferred high-level structure:

```text
src/
├── app/                       # routing + layouts + route composition
├── components/                # genuinely shared UI/design-system components
├── features/                  # domain/feature modules
│   └── products/
│       ├── components/
│       ├── hooks/
│       ├── schemas/
│       ├── queries/
│       ├── mutations/
│       ├── api/
│       ├── utils/
│       ├── constants/
│       ├── types/
│       └── server/            # server-only feature services/DAL when appropriate
├── hooks/                     # truly cross-feature hooks
├── utils/                     # pure cross-feature helpers
├── constants/                 # cross-feature constants only
├── lib/                       # configured infrastructure/library adapters
└── server/                    # app-wide server-only infrastructure/DAL
```

Rules matching this engineering style:

- Keep route `page.tsx` files focused on route composition and data orchestration.
- Complex UI belongs in feature components.
- Complex interactive logic belongs in focused hooks/components.
- Validation schemas belong in schema modules.
- TanStack Query configuration follows the pattern in Section 19.
- Library adapters belong under `lib/<library>` when they need reusable configuration/patterns.
- Do not create `utils`, `hooks`, `components`, `constants`, or `lib` duplicates at every directory level without a real responsibility boundary.
- Prefer feature-local code until it has genuine cross-feature reuse.

### 18.36 Example: clean Next.js form feature

```text
src/features/products/forms/product-form/
├── product-form.tsx
├── fields/
│   ├── product-name-field.tsx
│   ├── product-price-field.tsx
│   ├── product-images-field.tsx
│   └── product-variants-field.tsx
├── hooks/
│   └── use-product-form.ts
├── schemas/
│   └── product-form.schema.ts
├── actions/
│   └── save-product.action.ts
├── product-form.constants.ts
├── product-form.types.ts
└── index.ts
```

Responsibilities:

- `product-form.tsx`: composition/presentation only.
- Complex field component: owns only field-specific UI/interaction and receives explicit props/form context.
- `use-product-form.ts`: React Hook Form orchestration, defaults, resolver, submit mapping, reset/dirty behavior.
- Schema: Zod validation and inferred input/output contract.
- Action/service: server mutation boundary; it re-validates and authorizes.
- Repository/DAL: persistence/data access.

Do not place schema parsing, database calls, toast orchestration, image upload mechanics, and every complex field inside `product-form.tsx`.

### 18.37 TanStack Query with Next.js

When the application already uses TanStack Query:

- Keep query keys/options/hooks in the Section 19 pattern.
- Use Next.js Server Components for server-first route data when that is simpler.
- Use TanStack Query for client-side server-state behaviors such as background refetching, live interactive filtering, optimistic mutations, client-owned pagination/infinite queries, or shared client cache.
- Do not fetch the same resource independently through both a Server Component and an immediately firing client query unless hydration/freshness semantics intentionally require it.
- When hydrating/prefetching queries, centralize query options so server and client share the same key/function contract.
- Decide whether Next cache and TanStack cache are both necessary; avoid two uncontrolled cache layers for the same data.

### 18.38 Cache-layer ownership rule

A Next.js application may contain several caches:

- Browser HTTP cache.
- CDN/platform cache.
- Next Cache Components/cache handler.
- React render/cache semantics.
- TanStack Query client cache.
- Redis/application cache.
- Database buffer/query caches.

Agents MUST NOT add another cache layer without documenting:

1. What data it owns.
2. Key scope.
3. Freshness.
4. Invalidation.
5. Failure behavior.
6. Security/tenant isolation.
7. Whether another layer already solves the same problem.

### 18.39 Production security rules specific to Next.js

Before deployment, verify:

- Server-only code cannot be imported into client bundles.
- Server Actions validate and authorize.
- DAL returns minimal DTOs.
- Redirect/navigation destinations are trusted.
- CSP is considered for applications with meaningful XSS risk.
- Remote images are restricted to intended hosts/patterns.
- Sensitive environment variables are not exposed with public prefixes.
- Expensive public Route Handlers/Actions have abuse controls/rate limiting where needed.
- Webhooks authenticate signatures and handle replay/idempotency where applicable.
- Cache keys cannot cross user/tenant boundaries.
- Error pages do not leak secrets.

### 18.40 Production performance rules specific to Next.js

Agents SHOULD optimize in this order:

1. Keep unnecessary code out of Client Components.
2. Remove data waterfalls.
3. Stream independent dynamic regions with Suspense.
4. Cache reusable server work explicitly.
5. Use framework image/font/script primitives appropriately.
6. Avoid shipping large libraries for tiny functionality.
7. Dynamically load rare heavy client features where justified.
8. Measure bundle sizes and Web Vitals.
9. Optimize algorithms/data shape only after identifying the bottleneck.

Do not solve a server-fetch problem by moving data fetching to `useEffect` in the browser.

### 18.41 Migration behavior

During a Next.js upgrade, agents MUST separate:

- Mechanical codemod changes.
- Behavior changes.
- Caching changes.
- Runtime changes.
- Deprecated API removal.
- Experimental feature adoption.

For Next 16-style migrations, explicitly check:

- Async request APIs.
- `middleware.ts` -> `proxy.ts` implications.
- Cache Components adoption versus previous caching model.
- React/React DOM compatibility.
- Turbopack custom configuration compatibility.
- Deprecated route-segment options.
- Lint/build command changes for the installed release.

Run the application's full typecheck, lint, test, and production build after migrations.

### 18.42 Next.js anti-hallucination implementation checklist

Before writing code, the agent MUST be able to answer:

- [ ] What exact Next.js version is installed?
- [ ] Is App Router or Pages Router being used?
- [ ] Is `cacheComponents` enabled?
- [ ] Is the code running in a Server Component, Client Component, Route Handler, Server Action, Proxy, worker, or external backend?
- [ ] What runtime is used?
- [ ] Is the data public, user-specific, tenant-specific, or secret?
- [ ] Is the data supposed to be cached? For how long?
- [ ] What invalidates the cache?
- [ ] Is the operation a read or a mutation?
- [ ] Where is authoritative authentication/authorization enforced?
- [ ] Can this Server Component call the DAL directly instead of its own Route Handler?
- [ ] Are `params`, `searchParams`, `cookies`, and `headers` being used according to the installed version?
- [ ] Does an interactive requirement actually justify `"use client"`?
- [ ] Are props crossing the client boundary serializable and minimal?
- [ ] Is an API being used that is experimental/deprecated?
- [ ] Did official version-matched docs confirm the behavior?

If any material answer is unknown, the agent MUST inspect the project/docs before implementing instead of guessing.

### 18.43 Official Next.js source map for agents

When internet access is allowed, prefer official sources:

- Main documentation: `https://nextjs.org/docs`
- AI coding agents guide: `https://nextjs.org/docs/app/guides/ai-agents`
- Next.js 16 upgrade guide: `https://nextjs.org/docs/app/guides/upgrading/version-16`
- Next.js 16.3 release: `https://nextjs.org/blog/next-16-3`
- Server/Client Components: `https://nextjs.org/docs/app/getting-started/server-and-client-components`
- Fetching data: `https://nextjs.org/docs/app/getting-started/fetching-data`
- Caching: `https://nextjs.org/docs/app/getting-started/caching`
- Revalidating: `https://nextjs.org/docs/app/getting-started/revalidating`
- `use cache`: `https://nextjs.org/docs/app/api-reference/directives/use-cache`
- `use cache: private`: `https://nextjs.org/docs/app/api-reference/directives/use-cache-private`
- `use cache: remote`: `https://nextjs.org/docs/app/api-reference/directives/use-cache-remote`
- Cache Components migration: `https://nextjs.org/docs/app/guides/migrating-to-cache-components`
- Server Actions: `https://nextjs.org/docs/app/guides/server-actions`
- Data Security: `https://nextjs.org/docs/app/guides/data-security`
- Authentication: `https://nextjs.org/docs/app/guides/authentication`
- Authentication with Cache Components: `https://nextjs.org/docs/app/guides/authentication-with-cache-components`
- Route Handlers: `https://nextjs.org/docs/app/getting-started/route-handlers`
- Backend for Frontend: `https://nextjs.org/docs/app/guides/backend-for-frontend`
- Proxy: `https://nextjs.org/docs/app/getting-started/proxy`
- Production checklist: `https://nextjs.org/docs/app/guides/production-checklist`
- React Compiler config: `https://nextjs.org/docs/app/api-reference/config/next-config-js/reactCompiler`
- Cache Components config: `https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents`

Agents SHOULD read the relevant page instead of relying on this source list alone, because behavior may change in later releases.

### 18.44 React + Next.js final decision hierarchy

For React/Next implementation choices, use this hierarchy:

1. Security/correctness/business requirements.
2. Installed version and official version-matched docs.
3. Existing valid application architecture.
4. Server-first/simple platform primitives.
5. Feature-local modular code.
6. Framework-native capability.
7. Established project library/pattern.
8. New dependency or custom abstraction only when the above are insufficient.

The goal is not maximum novelty. The goal is **correct, simple, maintainable, secure, measurable code that fits the actual application and current framework behavior**.

---

## 19. TanStack Query Pattern

TanStack Query owns **server state**, not arbitrary local UI state.

### 19.1 Preferred feature structure

```text
features/products/
├── api/
│   └── products.api.ts
├── queries/
│   ├── products.keys.ts
│   ├── products.options.ts
│   └── use-products.ts
├── mutations/
│   ├── use-create-product.ts
│   └── use-update-product.ts
└── types/
    └── product.types.ts
```

A smaller feature MAY combine the query files while preserving responsibilities.

### 19.2 API functions

API functions SHOULD:

- Accept explicit typed parameters.
- Perform one transport operation.
- Validate or normalize responses where necessary.
- Throw structured application errors on failure.
- Remain independent from React hooks.

```ts
export async function getProducts(
  filters: ProductFilters,
  signal?: AbortSignal,
): Promise<ProductListResponse> {
  return apiClient.get("/products", { filters, signal });
}
```

### 19.3 Query keys

- Use a query-key factory.
- Include every variable used by the query function.
- Keep keys serializable and deterministic.
- Use hierarchical keys for targeted invalidation.

```ts
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters: ProductFilters) =>
    [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};
```

### 19.4 Query options

Use shared query options when server prefetching, client hooks, and invalidation need the same contract.

```ts
export function productsQueryOptions(filters: ProductFilters) {
  return queryOptions({
    queryKey: productKeys.list(filters),
    queryFn: ({ signal }) => getProducts(filters, signal),
    staleTime: 30_000,
  });
}
```

### 19.5 Defaults must be intentional

TanStack Query data is stale by default and may refetch on common lifecycle events. Every significant query SHOULD deliberately decide:

- `staleTime`.
- Garbage-collection behavior when relevant.
- Retry behavior.
- Refetch-on-focus/reconnect behavior.
- Placeholder or initial data behavior.

Do not copy one global `staleTime` to every domain.

### 19.6 Mutations

- Mutation hooks SHOULD own cache updates, invalidation, and optimistic rollback.
- Invalidate the narrowest correct key.
- Avoid invalidating the entire application cache.
- Optimistic updates MUST define rollback and server reconciliation.
- Disable duplicate submissions where appropriate, but backend idempotency remains required for critical writes.

### 19.7 Presentational components

Presentational components SHOULD NOT call arbitrary query hooks internally when that makes reuse or testing difficult. Prefer a feature container or hook that supplies explicit data and callbacks.

---

## 20. Frontend State Management

### 20.1 Decision order

Use this order before introducing a store:

1. Derived value.
2. Component state.
3. Form state library.
4. URL state.
5. Server-state library.
6. Context for a focused subtree.
7. Zustand or Redux Toolkit for genuinely shared client state.

### 20.2 Redux Toolkit

Use Redux Toolkit when the application needs:

- Complex shared client workflows.
- Event-like state transitions across many features.
- Strong debugging, middleware, or normalized entity tooling.
- Existing Redux architecture.

Do not write legacy Redux boilerplate manually.

### 20.3 Zustand

Use Zustand for focused shared client state with a small API. Rules:

- Keep stores domain-focused.
- Expose actions, not arbitrary setter access.
- Use selectors to reduce rerenders.
- Do not store server cache that TanStack Query already owns.
- Do not create one global store for all application state.

### 20.4 URL state

Filters, sorting, selected tabs, and pagination SHOULD use URL state when users must share, bookmark, reload, or navigate back to the same view.

---

## 21. Frontend Library Rules

### 21.1 Library selection order

1. Native platform or framework feature.
2. Existing project dependency.
3. Small maintained library with clear value.
4. Custom implementation only when requirements are simple and security risk is low.

### 21.2 Recommended roles

| Need | Preferred default |
|---|---|
| Forms | React Hook Form |
| Runtime schemas | Zod 4 or existing project schema library |
| Server state | TanStack Query when client caching is needed |
| Complex client state | Redux Toolkit or Zustand after justification |
| Data tables | TanStack Table for complex behavior; semantic HTML for simple tables |
| Unit/component tests | Vitest or project test runner + Testing Library |
| End-to-end tests | Playwright |
| Accessible primitives | Existing design system, Radix-based components, or another maintained accessible library |
| HTTP | Native `fetch` or configured project client; Axios only when its capabilities or existing usage justify it |

### 21.3 Dependency admission checklist

Before adding a library, verify:

- It solves a current problem.
- Existing dependencies cannot solve it adequately.
- It is actively maintained.
- It supports the project runtime and framework versions.
- Bundle/runtime cost is acceptable.
- License is acceptable.
- Security history is acceptable.
- API is stable.
- SSR/RSC compatibility is understood.
- Exit/migration cost is acceptable.

### 21.4 Dependency restrictions

- MUST NOT install multiple libraries for the same responsibility without a migration plan.
- MUST NOT add a package for a trivial helper that can be implemented safely in a few tested lines.
- MUST NOT introduce a beta/RC dependency in production without explicit approval.
- MUST NOT import an entire utility or icon library when tree-shakable imports exist.


### 21.5 Animation architecture: motion is part of product behavior

> **Added:** 2026-08-17. This subsection extends the existing frontend-library rules. It does not replace the React, Next.js, performance, accessibility, or design-system rules elsewhere in this document.

Animation MUST be treated as an intentional UI behavior, not decoration added after implementation.

Every non-trivial animation SHOULD have an answer to these questions:

1. What user or product purpose does the motion serve?
2. What event or state transition owns it?
3. Is the animation decorative, explanatory, navigational, feedback-oriented, or spatial?
4. What happens when animation is disabled or reduced?
5. Which runtime owns it: CSS, Motion, GSAP, a specialized library, or a design asset runtime?
6. Does it require JavaScript at all?
7. Does it run on mount, interaction, route change, scroll, layout change, or external data change?
8. Does it need cleanup when the React component unmounts or dependencies change?
9. What is its performance cost on a low-powered mobile device?
10. Is it safe with keyboard navigation, focus movement, screen readers, and reduced-motion settings?

Motion MUST NOT obscure application state. A UI remains understandable when its animation is removed.

Animation MUST NOT become the only way to communicate:

- Success or failure.
- Selection.
- Focus.
- Validation.
- Loading completion.
- Navigation destination.
- Permission or destructive consequences.

### 21.6 Animation-library decision order

Use this order before adding or reaching for a JavaScript animation library:

1. **No animation** when motion adds no user value.
2. **CSS transition / CSS keyframes** for simple, local visual transitions.
3. **Native browser capabilities** when they solve the requirement cleanly and meet the project's compatibility policy.
4. **Existing animation dependency** already established by the project.
5. **Motion for React** for React-native declarative UI animation, layout transitions, presence, gestures, and common scroll interactions.
6. **GSAP** for precise imperative sequencing, complex timelines, advanced scroll choreography, SVG/canvas/WebGL coordination, or specialized GSAP plugins.
7. **A narrow specialized library** such as AutoAnimate, React Spring, Anime.js, Rive, or Lenis only when its responsibility is materially better suited to the requirement.
8. **Custom animation engine** only when product requirements cannot be met safely and maintainably by the above options.

The agent MUST NOT install GSAP and Motion together merely because both are popular.

Using both MAY be justified when responsibilities are clearly split, for example:

- Motion owns ordinary component presence/layout/microinteractions.
- GSAP owns one highly choreographed marketing or storytelling scene.

When two animation systems coexist, their ownership MUST be documented so they do not fight over the same DOM properties or scroll lifecycle.

### 21.7 2026 animation-library selection matrix

| Requirement | Preferred starting point | Notes |
|---|---|---|
| Button hover/focus/active transition | CSS | Avoid a library for a local color/opacity/transform change. |
| Small disclosure/menu transition | CSS or existing component primitive | Use Motion only when presence/layout behavior needs it. |
| React state-driven enter/exit | Motion | `AnimatePresence` is designed for removal/exit coordination. |
| React layout/shared-element transition | Motion | Prefer `layout` / `layoutId` for state-driven layout changes. |
| React gestures/drag/tap/hover | Motion | Prefer declarative gesture props when they meet requirements. |
| Simple scroll reveal | CSS/native or Motion `whileInView` | Do not install ScrollTrigger for one fade-in. |
| Scroll progress bound to a React visual | Motion `useScroll` + MotionValue | Keep per-frame values outside React state. |
| Complex pinned storytelling scene | GSAP + ScrollTrigger | Use scoped lifecycle and responsive/reduced-motion rules. |
| Complex multi-step timeline | GSAP timeline | Prefer one owned timeline over many disconnected delays. |
| High-frequency pointer follower | GSAP `quickTo` / `quickSetter` or MotionValue | Do not call React `setState` per pointer frame. |
| DOM reordering with minimal configuration | AutoAnimate | Best for immediate-child add/remove/move, not general choreography. |
| Spring-physics-first existing app | React Spring | Do not add beside Motion without a concrete benefit. |
| Framework-agnostic JS/WAAPI animation engine | Anime.js | Use scoped cleanup in React. |
| Designer-authored interactive vector state machine | Rive | Treat as a media/runtime integration, not a normal DOM animation dependency. |
| Smooth-scroll interpolation | Lenis | Optional infrastructure, not a general animation library. |
| SVG morph/path-heavy scene | GSAP plugins or another established project tool | Verify exact plugin/runtime and bundle implications. |

The table is a starting point, not a license to install dependencies. The Section 21.3 admission checklist still applies.

### 21.8 CSS and native motion remain the baseline

Use CSS when all of the following are true:

- The animation is local to one element or a small related group.
- The start/end state is naturally represented by class/state changes.
- No complex timeline orchestration is required.
- No cross-component presence/layout measurement is required.
- No imperative playback control is required.

Preferred CSS candidates include:

- Hover/focus/active feedback.
- Opacity fades.
- Small transforms.
- Color transitions.
- Simple skeleton shimmer when accessible and performance-safe.
- Small open/close transitions where the component primitive already solves lifecycle concerns.

Do not replace a clear CSS transition with a library call simply to standardize syntax.

Native browser APIs MAY be used when the project's browser-support matrix permits them. They SHOULD be progressively enhanced when support is not universal enough for the product requirement.

An AI agent MUST inspect the existing browser-support policy before introducing a new native API that changes rendering or navigation behavior.

### 21.9 Shared motion language and design tokens

A product SHOULD define a small motion language instead of inventing timings and easings per component.

Shared motion tokens MAY include:

```ts
export const motionDuration = {
  instant: 0.08,
  fast: 0.16,
  normal: 0.24,
  slow: 0.4,
} as const;

export const motionEase = {
  standard: [0.2, 0, 0, 1],
  enter: [0, 0, 0.2, 1],
  exit: [0.4, 0, 1, 1],
} as const;
```

These values are examples, not universal defaults. A project MUST use its approved design system when one exists.

Rules:

- Shared duration/easing tokens SHOULD represent a real design language.
- Do not create a global token for a one-off cinematic timeline.
- Spring configurations SHOULD be named by semantic intent when reused.
- Avoid arbitrary combinations of duration, delay, and easing scattered across components.
- Stagger values MUST not create excessive waiting before important content becomes usable.
- A visual sequence MUST NOT delay the availability of critical controls merely for drama.

### 21.10 Motion for React: package and source-of-truth rules

Motion for React is the current continuation of the library historically known as Framer Motion.

For a **new React project**, prefer:

```bash
pnpm add motion
```

and:

```ts
import { motion } from "motion/react";
```

For an existing project using `framer-motion`:

- MUST inspect the installed version and lockfile first.
- MUST NOT migrate package/import names during unrelated feature work.
- MUST use the official Motion upgrade guide before migration.
- MUST run typecheck, tests, and the production build after migration.
- MUST verify any renamed/removed APIs rather than assuming old Framer Motion examples still apply.

As of the 2026-08-17 review, the official Motion docs identify v12.43.x documentation. This is a review snapshot, not a permanent project version requirement.

### 21.11 Motion for React: declarative-first rule

When React state/props already express the visual state, prefer declarative Motion props.

Example:

```tsx
import { motion } from "motion/react";

export function StatusPanel({ isOpen }: { isOpen: boolean }) {
  return (
    <motion.section
      animate={{
        opacity: isOpen ? 1 : 0,
        y: isOpen ? 0 : 8,
      }}
      transition={{ duration: 0.2 }}
    />
  );
}
```

Prefer declarative Motion for:

- State-driven appearance.
- Hover/tap/focus gestures.
- Layout changes.
- Shared-layout transitions.
- Presence/exit transitions.
- Simple viewport-entry behavior.

Do not introduce an imperative `useAnimate()` sequence when ordinary `animate`, `variants`, `layout`, `while*`, or `exit` props express the behavior more clearly.

Use imperative Motion controls when:

- A sequence spans multiple descendants.
- A timeline is triggered by an imperative external event.
- Manual playback/cancellation is required.
- Declarative props would create awkward duplicated state.

### 21.12 Motion variants and configuration ownership

Variants SHOULD be extracted when they:

- Are shared by multiple child elements.
- Encode a meaningful animation state machine.
- Make the component materially easier to read.
- Are reused across a feature.

Variants SHOULD remain local when they belong to one feature/component.

Avoid a giant global `animations.ts` containing unrelated variants from the entire product.

Preferred feature pattern:

```text
features/catalog/components/product-card/
├── product-card.tsx
├── product-card.motion.ts
├── product-card.types.ts
└── index.ts
```

`product-card.motion.ts` MAY contain variants and transition constants for that component, while rendering stays in `product-card.tsx`.

If the animation is tiny and readable inline, keep it inline. Separation is for clarity, not file-count targets.

### 21.13 Motion `AnimatePresence` rules

Use `AnimatePresence` when a React element must complete an exit animation before it is fully removed.

Rules:

- Direct children MUST have stable identity keys.
- Never use array indexes as keys for reorderable/removable animated lists.
- The `key` MUST represent the actual identity whose presence is changing.
- Do not wrap an entire application in `AnimatePresence` without a clear ownership reason.
- Choose presence `mode` deliberately when sequencing entering/exiting content matters.
- Exit animations MUST remain short enough that removal does not make the UI feel blocked.
- Accessibility state and focus movement MUST not wait on decorative exit animation when that would confuse users.

Before using exit animation for dialogs, menus, or focus-trapping overlays, verify that focus and `aria-hidden`/inert behavior remain correct throughout the exit lifecycle.

### 21.14 Motion layout animation rules

Use `layout` when a React render changes the size/position of a Motion component and Motion should animate between layouts.

Use `layoutId` for intentional shared-element transitions between related UI states.

Rules:

- Let React own the target layout state.
- When `layout` owns the layout transition, change layout through `style`, classes, or rendered structure rather than manually fighting it with competing animation props.
- Shared `layoutId` values MUST be intentional and unique within the relevant layout group/experience.
- Use `LayoutGroup` when separate components need coordinated layout measurements.
- Use `layoutScroll`/the current version-correct equivalent when layout measurement occurs inside scrolling containers and official docs require it.
- Use the current documented root/fixed-container handling when fixed-position elements participate in layout animation.
- Verify layout animation on responsive breakpoints because DOM geometry may change substantially.
- Do not use layout animation as a substitute for a correct responsive layout.

For a simple list reorder, prefer Motion's layout/reorder APIs or AutoAnimate before manually measuring rectangles.

### 21.15 Motion values: do not rerender React every frame

Use Motion values for continuously changing animation values that do not need to participate in React rendering.

Typical examples:

- Pointer position.
- Scroll progress.
- Drag position.
- Velocity.
- Derived transforms.
- Continuously interpolated opacity/scale.

Rules:

- Do not mirror every MotionValue into React state.
- Do not call `setState` on every animation frame merely to update style.
- Use `useTransform`, `useSpring`, or version-correct Motion-value composition when appropriate.
- Use `useMotionValueEvent`/the version-correct subscription API when application logic genuinely needs an event from a MotionValue.
- Keep domain state in React; keep high-frequency visual interpolation in the animation system.

A MotionValue MUST NOT become a hidden source of business truth.

### 21.16 Motion scroll animation rules

Distinguish two fundamentally different behaviors:

1. **Scroll-triggered**: an event occurs when a target enters/leaves a region.
2. **Scroll-linked**: visual progress continuously maps to scroll position.

Use:

- `whileInView` / `useInView` for common viewport-triggered behavior.
- `useScroll` for scroll-linked values.
- `useTransform` for mapping scroll progress into visual output.

Rules:

- Do not attach a custom `window` scroll listener if Motion's supported scroll primitives already solve the requirement.
- Do not store scroll position in React state every frame.
- Keep scroll-linked animation non-essential to reading/navigation.
- Avoid large parallax distances by default.
- Use stable target/container refs.
- Test nested scrolling containers separately.
- Verify sticky/fixed elements and route restoration behavior.
- Do not create dozens of independent observers/listeners when one higher-level pattern can own the experience.

For complex pin/scrub/choreography across multiple sections, GSAP ScrollTrigger may be a better fit than forcing a large imperative scene into Motion.

### 21.17 Motion `useAnimate` rules

`useAnimate` is appropriate for scoped manual animation sequences.

Rules:

- Use the returned scope ref so selector text stays local to the component.
- Prefer scoped selectors over `document.querySelectorAll()`.
- Let the hook's cleanup behavior own animations created through the scoped API.
- Use it for actual imperative sequencing; do not recreate declarative state transitions imperatively.
- Avoid one `useAnimate` hook that reaches into unrelated feature components.
- If a sequence becomes large, move sequence construction to a focused hook/module while keeping its DOM scope explicit.

Example organization:

```text
features/onboarding/components/welcome-sequence/
├── welcome-sequence.tsx
├── hooks/
│   └── use-welcome-sequence.ts
└── welcome-sequence.motion.ts
```

### 21.18 Motion in Next.js App Router

Motion is client-side animation functionality, but the App Router does not require converting an entire route to a Client Component.

Preferred options:

1. Keep the page/layout Server Component and render a small Client Component containing interactive Motion hooks.
2. Where supported by the installed Motion version, use the documented `motion/react-client` entry point for motion elements that can remain server-component-compatible.

Rules:

- Do not add `"use client"` to a page/layout only because one descendant animates.
- Hooks such as `useScroll`, `useAnimate`, `useReducedMotion`, gesture hooks, and browser-dependent animation logic still require a client boundary.
- Do not import browser-only animation setup from server-only modules.
- Heavy/rare animation scenes SHOULD be dynamically loaded when bundle analysis shows meaningful benefit.
- Route content MUST render meaningful HTML before animation enhancement where the product permits progressive enhancement.
- Hydration MUST NOT depend on reading viewport dimensions during the server render.
- Avoid initial states that create a visible flash or mismatch between server HTML and hydrated client state.

### 21.19 Motion bundle-size rules

Do not optimize bundle size by memory or folklore. Measure the built application.

Current Motion documentation provides several size strategies, including:

- Import only what is needed and rely on tree shaking.
- Use smaller animation APIs when the feature needs only those capabilities.
- Consider `m` + `LazyMotion` for an application where `motion` component feature loading is a measured bundle concern.
- Use the smaller feature package when advanced layout/drag features are not required.

Rules:

- Do not introduce `LazyMotion` merely because it exists.
- Do not mix regular `motion` components into a subtree whose bundle strategy intentionally uses strict `LazyMotion`/`m` without understanding the effect.
- Keep animation dependency imports out of broad shared barrels that accidentally pull them into unrelated client bundles.
- Dynamically load rare cinematic sections where appropriate.
- Re-run bundle analysis after a new animation package/plugin is introduced.

### 21.20 Motion reduced-motion rules

Every meaningful Motion implementation MUST define reduced-motion behavior.

Preferred application-wide approach:

- Use `MotionConfig` with the version-correct reduced-motion policy when the application uses Motion broadly.
- Use `useReducedMotion` when component behavior must change based on the user's preference.

Reduced motion SHOULD usually:

- Remove large `x`/`y` travel.
- Remove parallax.
- Remove spinning/zooming that can trigger vestibular discomfort.
- Keep state changes understandable through opacity, color, or immediate placement where suitable.
- Stop non-essential autoplay motion.

Do not simply slow a potentially problematic animation down; reduction often means removing spatial movement.

### 21.21 Motion experimental / premium API rule

Official Motion documentation may expose Motion+ APIs, early-access APIs, alpha APIs, or unstable-prefixed APIs.

An agent MUST NOT use them in production by default.

Before using one, verify:

- The exact installed package/version.
- Whether an additional Motion+ package/license/access token is required.
- Stability label.
- Migration risk.
- Whether a stable core API solves the same requirement.
- Explicit project approval.

Never copy an `unstable_*` example into production code because it appears in the latest documentation.

### 21.22 GSAP selection rule

Choose GSAP when the animation problem is primarily **timeline/choreography/imperative control**, not merely because the desired UI looks impressive.

Strong GSAP candidates:

- Multi-stage hero/storytelling sequences.
- Precise overlapping timelines.
- ScrollTrigger pin/scrub/snap scenes.
- Complex SVG animation.
- Motion paths.
- Morphing.
- Complex text splitting/stagger choreography.
- Canvas/WebGL/object animation coordination.
- High-frequency imperative animation where direct control is required.
- FLIP transitions where GSAP Flip matches the design better than React-native layout animation.

Weak GSAP candidates:

- A button hover.
- A basic modal fade.
- One list item entering.
- A simple accordion.
- A single viewport reveal.

Use CSS or Motion for those cases when already established.

### 21.23 GSAP package, plugin, and licensing rules

For modern package-manager projects:

```bash
pnpm add gsap
```

React projects that use GSAP SHOULD also evaluate:

```bash
pnpm add @gsap/react
```

Rules:

- Inspect installed `gsap` and `@gsap/react` versions before copying examples.
- Register used plugins explicitly with `gsap.registerPlugin(...)` in build-tool projects.
- Centralize plugin registration when that improves consistency and avoids repeated setup.
- Import only plugins the project actually needs.
- Do not assume that “free to use” means MIT. GSAP uses its own standard license; verify licensing requirements for the product.
- Modern GSAP plugins are available from the public package setup documented by GSAP; legacy private npm-repository configuration SHOULD be removed only as part of an intentional dependency migration.
- Do not install the deprecated unrelated `gsap-react` package when the intended official React integration is `@gsap/react`.

### 21.24 Preferred GSAP adapter pattern

A project that uses multiple GSAP plugins MAY centralize registration in a client-only library module.

Example:

```ts
// lib/animation/gsap.client.ts
"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export { gsap, ScrollTrigger, useGSAP };
```

The exact import paths MUST match the installed GSAP package and bundler. Do not change to `/dist/*` paths unless the framework/build tool actually requires it.

Do not create a global adapter if a project uses one simple core GSAP animation and no shared configuration.

### 21.25 GSAP in React: `useGSAP` is the preferred lifecycle integration

In React code, prefer the official `useGSAP()` hook when the installed project supports it.

Why:

- It integrates GSAP setup with React lifecycle.
- It scopes animations through GSAP context.
- It handles cleanup/revert behavior.
- It can scope selector strings to a component root.

Preferred pattern:

```tsx
"use client";

import { useRef } from "react";
import { gsap } from "@/lib/animation/gsap.client";
import { useGSAP } from "@gsap/react";

export function HeroScene() {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from("[data-hero-title]", {
        y: 24,
        opacity: 0,
        duration: 0.6,
      });
    },
    { scope },
  );

  return (
    <section ref={scope}>
      <h1 data-hero-title>...</h1>
    </section>
  );
}
```

Rules:

- Never create GSAP tweens/timelines during React render.
- Scope selectors to the component/scene where practical.
- Do not use global selectors for reusable components.
- Dependencies that should rebuild a timeline MUST be explicit.
- Cleanup MUST revert/kill animation artifacts created by the lifecycle.
- React state remains the source of product state; GSAP owns visual interpolation/timeline playback.

### 21.26 GSAP `contextSafe()` rule

Animations created later from callbacks can escape the context that created the initial `useGSAP` callback.

Use `contextSafe()` for delayed/event-driven functions when they create GSAP objects that must be tracked by the component's GSAP context.

Examples include:

- Click handlers that create a tween.
- `setTimeout` callbacks that create a timeline.
- External event callbacks.
- Subscription callbacks.

Do not wrap ordinary non-GSAP callbacks in `contextSafe()` without a reason.

All non-GSAP event listeners created manually MUST still be removed in cleanup.

### 21.27 GSAP timeline ownership

A timeline SHOULD represent one coherent animation sequence.

Good ownership:

```text
HeroScene
└── one hero entrance timeline

StorySection
└── one scroll-driven story timeline
```

Avoid:

- Independent tweens with arbitrary delays trying to imitate one timeline.
- One global timeline controlling unrelated routes/features.
- Timelines stored in Redux/Zustand.
- Rebuilding an expensive timeline on every React render.

If UI state must control a timeline, keep a ref to the timeline/controller and expose semantic commands such as:

```ts
playIntro();
reverseMenu();
seekToStep(step);
```

Do not expose raw GSAP internals across the entire component tree.

### 21.28 GSAP ScrollTrigger rules

Use ScrollTrigger when the product genuinely requires advanced scroll-triggered or scroll-linked choreography.

Rules:

- Register `ScrollTrigger` explicitly.
- Create it inside a scoped GSAP lifecycle in React.
- Let cleanup remove/revert triggers when components unmount or dependencies change.
- Use development `markers` only during debugging; do not ship them intentionally.
- Choose `start`/`end` based on the actual geometry, not copied magic numbers.
- Use `scrub` only when animation progress should be linked to scroll progress.
- Use `pin` only when the design genuinely needs a pinned storytelling region.
- Do not animate the pinned container itself in ways that invalidate ScrollTrigger measurements; animate an inner wrapper when needed.
- Test browser resize/orientation changes.
- Test route transitions/back-forward navigation.
- Test nested/custom scrollers explicitly.
- Do not use ScrollTrigger as an excuse for scroll-jacking.
- Do not block native keyboard/touch scrolling.
- Keep essential content readable without the scroll animation.

### 21.29 GSAP responsive and reduced-motion rules with `matchMedia`

Prefer `gsap.matchMedia()` for GSAP scenes whose construction differs across breakpoints or reduced-motion preferences.

Example concept:

```ts
const mm = gsap.matchMedia();

mm.add(
  {
    isDesktop: "(min-width: 1024px)",
    reduceMotion: "(prefers-reduced-motion: reduce)",
  },
  (context) => {
    const { isDesktop, reduceMotion } = context.conditions!;

    gsap.to("[data-scene]", {
      x: reduceMotion ? 0 : isDesktop ? 120 : 40,
      opacity: 1,
      duration: reduceMotion ? 0 : 0.6,
    });
  },
);
```

Rules:

- Prefer one responsive setup over duplicated desktop/mobile code where the scene is conceptually the same.
- Let matchMedia context revert animations when conditions change.
- Do not nest redundant `gsap.context()` solely around `gsap.matchMedia()` when the matchMedia context already owns the animations; follow version-matched docs.
- Test runtime changes to reduced-motion settings where practical.

### 21.30 GSAP high-frequency interaction rules

For mouse/pointer/scroll-driven values that update at very high frequency:

- Do not create a fresh tween for every event if an optimized reusable setter/tween solves it.
- Consider `gsap.quickSetter()` for immediate repeated writes to the same property.
- Consider `gsap.quickTo()` when repeatedly animating one numeric property toward a changing target.
- Use ordinary `gsap.set()` / `gsap.to()` unless profiling or the event rate actually justifies specialized APIs.
- Avoid React `setState` for per-frame purely visual values.
- Clamp/sanitize derived pointer values before applying them.

Performance-specific APIs are not a substitute for reducing the amount of work performed per frame.

### 21.31 GSAP Flip rules

Use the Flip plugin when the scene needs explicit FLIP-style transitions between DOM/layout states and GSAP's workflow is a better fit than Motion `layout`/`layoutId`.

Typical flow:

1. Capture state.
2. Let the application/framework change DOM/layout state.
3. Run `Flip.from(...)` after the new DOM is committed.

React-specific rules:

- Remember that React state updates may not commit the DOM synchronously at the exact line where the state setter runs.
- Coordinate the Flip animation after the relevant DOM update.
- Use stable `data-flip-id` identities where old/new elements must be matched.
- Explicitly provide the current targets when React has replaced element instances and the plugin requires it.
- Prefer Motion layout animation for ordinary React state-driven layout when it is simpler.

Do not bypass React and manually move application-owned DOM nodes only to make Flip easier, unless the component is deliberately imperative and isolated.

### 21.32 GSAP in Next.js

GSAP depends on browser/DOM behavior for normal UI animation and therefore belongs behind a client boundary.

Rules:

- Put `"use client"` at the smallest scene/component boundary that owns GSAP.
- Do not convert a complete marketing page into a Client Component solely because one hero section uses GSAP.
- Keep GSAP registration/configuration in client-only modules.
- Never access `window`, `document`, layout measurements, or GSAP DOM APIs during Server Component render.
- Dynamically import a large, below-the-fold, or rarely used GSAP scene when bundle/loading analysis justifies it.
- Do not make dynamic import mandatory for every GSAP component; choose it based on actual build and bundle behavior.
- Verify production builds because plugin import paths can differ across bundlers/versions.
- Preserve meaningful server-rendered content under the animated layer.

### 21.33 Lenis: optional smooth-scroll infrastructure

Lenis is not the default scrolling model and MUST NOT be added solely because “smooth scrolling feels premium.”

Native browser scrolling remains the baseline.

Use Lenis only when there is a product requirement such as:

- Smoothing a storytelling/portfolio experience.
- Synchronizing scroll with GSAP/WebGL/parallax.
- A design system explicitly calls for the interaction.

Rules:

- Use the maintained `lenis` package and the current framework adapter.
- Import the recommended Lenis CSS when required by the installed version.
- Keep one clear global/root scroll owner when the experience is global.
- Avoid creating multiple competing root Lenis instances.
- Preserve anchor navigation and route behavior.
- Verify nested scroll regions, dialogs, drawers, and focus navigation.
- Verify mobile/touch behavior on real devices.
- Do not override native scrolling in areas where it harms usability.
- Disable or substantially reduce smoothing where the accessibility/product policy requires it.

### 21.34 Lenis + GSAP integration

If Lenis and GSAP ScrollTrigger are intentionally combined:

- Synchronize ScrollTrigger updates with Lenis using the integration documented by the installed Lenis version.
- Drive Lenis from one RAF/ticker source.
- When GSAP ticker owns the loop, configure Lenis so it does not also run a competing automatic RAF loop.
- Remove ticker callbacks during teardown.
- Keep time units correct; GSAP ticker time and Lenis RAF time may use different units in documented integrations.
- Re-test ScrollTrigger measurements after changing scroll infrastructure.

Do not run:

```text
Lenis auto RAF
+ custom requestAnimationFrame loop
+ GSAP ticker loop
```

for the same Lenis instance.

One system MUST own the update loop.

### 21.35 Anime.js rules

Anime.js is a valid framework-agnostic option when a project needs a general JS/WAAPI animation engine and is not already standardized on Motion or GSAP for the same responsibility.

In React:

- Create component-local animation work inside a `createScope()` rooted to the component when using the current documented pattern.
- Revert the scope during cleanup.
- Use scoped methods when event handlers need to trigger animations after setup.
- Use scope media queries for responsive/reduced-motion variants when appropriate.
- Do not query the entire document from a reusable component.

Anime.js exposes both a JavaScript animation engine and a lighter WAAPI-oriented path. Choose based on the actual animation capabilities required; do not import a larger engine merely for a basic compositor-friendly transition.

Do not add Anime.js to an app already using Motion or GSAP unless there is a documented capability or migration reason.

### 21.36 React Spring rules

React Spring is appropriate when spring physics are a core interaction model or an existing codebase already uses it effectively.

For modern React:

- Use the current `@react-spring/web` package/version compatible with the installed React major.
- Treat its animated values as visual interpolation, not application/domain state.
- Prefer its documented hooks/controllers instead of rebuilding spring math manually.
- Use the library's reduced-motion support and application-level policy where appropriate.
- Keep imperative controllers scoped to the component/feature that owns them.

Do not add React Spring alongside Motion only to obtain spring animations; Motion already supports springs. A second library needs a stronger reason.

### 21.37 AutoAnimate rules

AutoAnimate is preferred for a narrow problem: smoothing immediate-child DOM add/remove/move transitions with minimal configuration.

Good uses:

- Reordering a simple list.
- Adding/removing tags.
- Small card collections changing order.
- Simple disclosure content where immediate-child behavior matches.

Rules:

- Attach it to the intended parent only.
- Children MUST have stable React keys.
- Remember that only immediate-child changes are automatically observed by the core behavior.
- Be aware that the library may change the parent's positioning behavior according to its documented implementation.
- Test flex/grid sizing behavior.
- Keep its built-in reduced-motion behavior enabled; never opt out casually.
- Use CSS for simple style-only hover/focus transitions rather than forcing AutoAnimate into that role.

When animation choreography, variants, layout identity, gestures, or manual controls become important, move to a more appropriate animation system rather than stretching AutoAnimate beyond its goal.

### 21.38 Rive rules

Rive is a specialized runtime for interactive designer-authored vector/canvas assets and state machines.

Use it for:

- Interactive illustrations.
- Rich branded loaders/mascots.
- State-machine-driven visual assets.
- Complex vector experiences authored in Rive.

Do not use Rive for ordinary DOM UI transitions.

React rules:

- Choose the renderer/runtime package based on the asset's required features and the official Rive guidance.
- Isolate `useRive` in a focused wrapper component when conditional mounting/unmounting could recreate its canvas/runtime context.
- Size the canvas/container explicitly.
- Clean up subscriptions/event listeners.
- Pause or stop non-essential animation when hidden/offscreen where supported and useful.
- Provide accessible semantics for a Rive canvas when it conveys content.
- Mark purely decorative Rive output appropriately so assistive technology is not burdened.
- Do not make core information readable only inside a canvas animation.

### 21.39 Animation component/folder architecture

The existing preferred folders `components`, `hooks`, `utils`, `constants`, and `lib` remain valid. Animation code follows the same locality rules as other feature code.

Recommended pattern for a project using multiple animation tools:

```text
src/
├── components/
│   └── ui/
├── hooks/
│   └── use-app-reduced-motion.ts       # only if genuinely cross-feature
├── constants/
│   └── motion.ts                       # only shared design-system motion tokens
├── lib/
│   └── animation/
│       ├── gsap.client.ts              # registration/config adapter
│       ├── motion.config.ts            # only if shared config is useful
│       └── lenis.client.ts             # only if app-wide smooth-scroll setup exists
└── features/
    └── home/
        └── components/
            └── hero-scene/
                ├── hero-scene.tsx
                ├── hero-scene.motion.ts
                ├── hooks/
                │   └── use-hero-scene.ts
                └── index.ts
```

Rules:

- Feature-specific animation stays feature-local.
- `lib/animation` owns configured library integration, not every animation in the product.
- Shared hooks exist only for genuinely shared behavior.
- Pure math/interpolation helpers MAY live in feature `utils` or global `utils` depending on reuse.
- Shared motion constants belong in `constants` only when they represent design-system values.
- Do not create `animations/` in every directory by habit.
- A component-specific `.motion.ts` file is optional; use it when inline variants/configuration make the component hard to read.
- Complex GSAP timeline construction SHOULD live in a focused hook/module rather than a 300-line JSX component.

### 21.40 Animation separation example

Preferred:

```text
hero-scene.tsx
  -> renders semantic markup and passes refs/state

use-hero-scene.ts
  -> owns imperative GSAP lifecycle and timeline orchestration

hero-scene.motion.ts
  -> shared numeric/timing configuration for the scene when useful

gsap.client.ts
  -> configured GSAP/plugin registration
```

The hook MUST expose a small semantic API when the component needs controls:

```ts
const {
  scopeRef,
  replay,
  skipToEnd,
} = useHeroScene();
```

Avoid exposing:

```ts
{
  timeline,
  tween1,
  tween2,
  scrollTriggerA,
  scrollTriggerB,
  internalTargets,
  internalProgress,
}
```

unless a parent truly owns those internals.

### 21.41 Animation state ownership

Keep three categories separate:

#### Product/application state

Examples:

- `isMenuOpen`.
- `selectedProductId`.
- `checkoutStep`.
- `isAuthenticated`.

Owned by React/application state.

#### Animation state

Examples:

- Timeline progress.
- MotionValue x position.
- Tween velocity.
- Internal stagger progress.

Owned by the animation library unless the application genuinely needs it.

#### DOM measurement

Examples:

- Bounding rectangles.
- Scroll positions.
- Container dimensions.

Owned by a focused measurement/animation lifecycle and kept out of global application state unless the product needs it.

Do not put timeline instances, MotionValues, DOM nodes, or GSAP triggers in Redux persistence or server-state caches.

### 21.42 Do not misuse React Effects for animation

The React Effect rules in Section 17 still apply.

Animation is one of the cases where synchronization with an imperative external library can legitimately require an Effect-like lifecycle.

However:

- Motion declarative props do not need an Effect just because they animate.
- GSAP SHOULD use the official React integration/lifecycle rather than a generic `useEffect` by default.
- Anime.js may use its documented scoped React Effect integration.
- Do not create an Effect whose only purpose is `if (isOpen) setAnimationState("open")`; derive animation target from `isOpen` directly when possible.
- Do not use an Effect to watch a button-click state flag merely to call a timeline if the click handler itself can issue the semantic command.

### 21.43 Animation timing and interaction rules

- Critical UI feedback SHOULD begin immediately after user input.
- Avoid long intro animations before users can interact.
- Exit animations SHOULD not make common navigation feel delayed.
- Repeated microinteractions SHOULD be subtle; an animation that feels delightful once can feel exhausting on the hundredth use.
- Loading animation MUST NOT fake progress unless it is explicitly an indeterminate indicator.
- Do not animate destructive confirmation away before the user can understand the result.
- Hover-only animation MUST have equivalent keyboard/focus behavior where the interaction is meaningful.
- Touch users MUST not depend on hover to reveal required functionality.

### 21.44 Scroll animation anti-patterns

Agents MUST NOT:

- Hijack wheel/touch behavior to force a slideshow unless the product explicitly requires and validates it.
- Make page content unreachable without animation completion.
- Pin nearly every section because it looks impressive in a demo.
- Create giant scroll distances that make mobile navigation tedious.
- Trigger network requests every scroll frame.
- Write `setState(window.scrollY)` on every scroll event for purely visual effects.
- Combine multiple smooth-scroll engines.
- Add Lenis + ScrollSmoother + custom RAF simultaneously without an explicit architecture.
- Leave ScrollTrigger markers or debug overlays in production.
- Assume desktop scroll choreography works on mobile.

### 21.45 Animation performance rules

For continuous animation, prefer properties that avoid unnecessary layout work when the visual result permits it.

Strong defaults:

- `transform`.
- `opacity`.

Properties that cause layout or expensive paint MAY still be animated when required, but MUST be tested rather than assumed safe.

Rules:

- Do not animate `top`/`left` every frame when transform can express the same movement.
- Do not animate large `width`/`height` changes at high frequency without profiling.
- Prefer transform-based layout-animation systems for layout transitions when available.
- Keep animated layer/element count reasonable.
- Avoid animating huge blurred/filter-heavy surfaces without mobile profiling.
- Use `will-change` sparingly; creating compositor layers has memory cost.
- Remove decorative continuous animation when the tab/section is not visible when practical.
- Avoid multiple independent RAF loops.
- Keep expensive React rendering out of the animation frame loop.
- Do not run synchronous layout reads and writes repeatedly in an interleaved per-frame loop when the library can batch/measure them.

### 21.46 Animation and server/client boundaries

An animation library does not change the application's trust model.

- Animation props/configuration are not authorization.
- Hidden/animated-out content may still exist in the DOM; do not rely on opacity/transform to protect sensitive information.
- Do not server-render secrets merely because an animation keeps them visually hidden.
- Client-only animation libraries MUST stay out of server-only import graphs.
- Animation must not cause hydration-dependent business state differences.

### 21.47 Animation testing rules for library choice

Before approving a new animation library or major scene, test:

- Desktop Chrome/Chromium-based browser.
- Firefox.
- Safari/WebKit when the product supports it.
- Representative mobile browser/device.
- Keyboard-only interaction.
- `prefers-reduced-motion: reduce`.
- Slow CPU/device profile where practical.
- Route navigation in/out of the scene.
- Component mount/unmount/remount.
- Responsive breakpoint changes.
- Back/forward browser navigation where relevant.
- Production build, not only development mode.

### 21.48 Animation anti-hallucination checklist for AI agents

Before implementing animation code, the agent MUST be able to answer:

- [ ] Which animation packages and exact versions are already installed?
- [ ] Does the requirement need JavaScript animation at all?
- [ ] Is Motion currently installed as `motion` or legacy `framer-motion`?
- [ ] Is GSAP installed, and which plugins are actually available/registered?
- [ ] Is `@gsap/react` installed if React lifecycle integration is expected?
- [ ] Is the component a Next.js Server Component or Client Component?
- [ ] What is the smallest client boundary required?
- [ ] Who owns the animation lifecycle and cleanup?
- [ ] Are selectors scoped to a component/scene?
- [ ] Is the animation declarative or imperative, and why?
- [ ] Is the animation triggered, scroll-linked, timeline-driven, or layout-driven?
- [ ] Does reduced motion have an explicit behavior?
- [ ] Are stable documented APIs being used?
- [ ] Is any copied API labeled alpha, early access, Motion+, premium, deprecated, or unstable?
- [ ] Could CSS or an existing library solve it with less JS?
- [ ] Does this introduce a second library for the same responsibility?
- [ ] Does it create another RAF/ticker/scroll owner?
- [ ] Are important content and controls usable without the animation?
- [ ] Has the production bundle/performance impact been considered?
- [ ] Have official version-matched docs been checked?

If a material answer is unknown, the agent MUST inspect the project and current official documentation instead of guessing.

### 21.49 Animation code-review checklist

- [ ] Animation has a user/product purpose.
- [ ] Existing design-system motion tokens are reused where appropriate.
- [ ] Simple effects remain CSS when possible.
- [ ] No unnecessary animation dependency was added.
- [ ] Motion/GSAP ownership does not overlap on the same property unexpectedly.
- [ ] React render remains pure.
- [ ] No per-frame React state update exists for purely visual interpolation.
- [ ] Client boundary is minimal in Next.js.
- [ ] Imperative animations are scoped and cleaned up.
- [ ] Scroll triggers/listeners are cleaned up.
- [ ] Stable identity keys are used for presence/reorder animations.
- [ ] Reduced-motion behavior is tested.
- [ ] Keyboard/focus behavior remains correct.
- [ ] Animation does not hide inaccessible/unavailable states.
- [ ] Transform/opacity are preferred for frequent motion where visually appropriate.
- [ ] Layout/paint-heavy animation was measured when necessary.
- [ ] Production build succeeds.
- [ ] No debug markers/logging remain.
- [ ] No experimental API was silently introduced.
- [ ] Exact library version was considered before using an API.

### 21.50 Official animation source map for agents

When internet access is available, prefer version-matched official documentation over tutorials and remembered snippets.

#### Motion for React

- Main React documentation: `https://motion.dev/docs/react`
- Installation / Next.js guidance: `https://motion.dev/docs/react-installation`
- Upgrade from Framer Motion/package changes: `https://motion.dev/docs/react-upgrade-guide`
- Motion component: `https://motion.dev/docs/react-motion-component`
- Layout animations: `https://motion.dev/docs/react-layout-animations`
- AnimatePresence: `https://motion.dev/docs/react-animate-presence`
- useAnimate: `https://motion.dev/docs/react-use-animate`
- Reduced motion: `https://motion.dev/docs/react-use-reduced-motion`
- Bundle-size guidance: `https://motion.dev/docs/react-reduce-bundle-size`
- Performance: `https://motion.dev/docs/performance`

#### GSAP

- Main docs: `https://gsap.com/docs/v3/`
- Installation/plugins: `https://gsap.com/docs/v3/Installation/`
- `gsap.context()`: `https://gsap.com/docs/v3/GSAP/gsap.context()/`
- `gsap.matchMedia()`: `https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/`
- ScrollTrigger: `https://gsap.com/docs/v3/Plugins/ScrollTrigger/`
- Flip: `https://gsap.com/docs/v3/Plugins/Flip/`
- `quickSetter`: `https://gsap.com/docs/v3/GSAP/gsap.quickSetter()/`
- `quickTo`: `https://gsap.com/docs/v3/GSAP/gsap.quickTo()/`
- React integration package: `https://www.npmjs.com/package/@gsap/react`

#### Other approved sources when those tools are selected

- Lenis repository/docs: `https://github.com/darkroomengineering/lenis`
- Anime.js React integration: `https://animejs.com/documentation/getting-started/using-with-react/`
- Anime.js Scope: `https://animejs.com/documentation/scope/`
- React Spring: `https://react-spring.dev/docs`
- React Spring reduced motion: `https://react-spring.dev/docs/utilities/use-reduced-motion`
- AutoAnimate: `https://auto-animate.formkit.com/`
- Rive React runtime: `https://rive.app/docs/runtimes/react/react`

Official examples still MUST be adapted to the installed version, project architecture, accessibility requirements, and product behavior. Do not paste examples without understanding their lifecycle.

---

## 22. Styling and Design-System Rules

- Follow the existing styling strategy.
- Use design tokens for colors, spacing, typography, radii, shadows, and breakpoints.
- Do not hardcode repeated brand values across components.
- Build reusable primitives before copying markup across features.
- Keep business logic out of style files.
- Ensure interactive states: hover, focus, active, disabled, loading, error.
- Use semantic variants rather than one-off color props.
- Avoid deeply nested CSS selectors and fragile DOM coupling.
- Responsive behavior MUST be tested at representative widths.
- Dark mode MUST use tokens rather than duplicated component styles.

---

## 23. Frontend Performance

### 23.1 Priorities

1. Reduce unnecessary client JavaScript.
2. Keep server/client boundaries small.
3. Avoid waterfalls.
4. Optimize images, fonts, and third-party scripts.
5. Virtualize large lists.
6. Cache only with a clear freshness model.
7. Profile rerenders before manual memoization.

### 23.2 Network behavior

- Cancel obsolete requests where supported.
- Debounce remote search.
- Prefetch only high-probability navigation.
- Avoid duplicate fetching across route and query layers.
- Paginate or stream large datasets.
- Compress and shape payloads for the consumer.

### 23.3 Bundle behavior

- Keep heavy browser-only libraries behind client boundaries.
- Dynamically import large optional experiences.
- Review bundle analysis before adding a large dependency.
- Avoid exporting server-only code from mixed barrels imported by clients.

### 23.4 Rendering behavior

- Use stable keys.
- Avoid generating new large objects in hot render paths when it causes measurable rerenders.
- Do not store derived collections in state.
- Prefer CSS for simple visual effects over JavaScript event loops.


### 23.5 Animation performance

Animation performance is part of frontend performance, not a separate aesthetic concern.

#### 23.5.1 Rendering-cost priority

For high-frequency animation, prefer values that can be handled without expensive layout recalculation when the visual design allows it.

Safe starting points:

- `transform`.
- `opacity`.

Use layout-affecting properties deliberately and measure them.

Rules:

- Do not animate `top`/`left` for movement when `transform` can produce the same result.
- Avoid continuously animating `height`, `width`, `padding`, or border geometry on large layout trees without profiling.
- Layout-animation libraries that use transforms MAY be preferable to hand-animating dimensions.
- Paint-heavy values such as large shadows/filters MUST be tested on low-powered devices.
- Do not create GPU layers indiscriminately with `will-change`.
- Do not assume hardware acceleration; verify browser behavior where it matters.

#### 23.5.2 JavaScript-frame budget

- Never use React state as a 60/120fps style transport when an animation value/tween can update outside React rendering.
- Keep per-frame callbacks tiny.
- Avoid network, JSON parsing, large array processing, or synchronous storage access in animation-frame callbacks.
- Avoid forced layout thrashing from repeated read/write/read/write cycles.
- Use library-provided optimized scroll/ticker/value systems before writing a custom RAF scheduler.
- One visual system SHOULD own a given high-frequency loop.

#### 23.5.3 Bundle budget

Before adding Motion, GSAP plugins, Rive runtimes, or another animation dependency:

1. Inspect whether the package is already present.
2. Measure the production bundle impact.
3. Keep heavy scenes below narrow client boundaries.
4. Dynamically load rare/non-critical scenes when justified.
5. Avoid importing animation libraries through broad shared barrels used by non-animated UI.
6. Re-run bundle analysis after adding plugins/runtime packages.

#### 23.5.4 Scroll budget

- Prefer observer/animation-library primitives over many raw scroll listeners.
- Never execute large React state updates on each scroll event.
- Keep pinned/scrubbed scenes limited to intentional areas.
- Test smooth-scroll + scroll-trigger integrations with one update loop.
- Test mobile Safari/WebKit and real touch behavior for important scroll experiences.

#### 23.5.5 Performance evidence

A performance fix SHOULD cite evidence such as:

- Browser Performance profile.
- React Profiler where React rendering is involved.
- Bundle analyzer output.
- Web Vitals/INP regression.
- Dropped frames/jank on a representative low-powered device.
- A clear algorithmic/rendering reason.

Do not rewrite a working animation to another library based solely on marketing benchmarks.

---

## 24. Frontend Accessibility

Accessibility is mandatory.

- Use semantic HTML before ARIA.
- Every input MUST have an accessible label.
- Errors MUST be associated with their fields.
- Keyboard users MUST reach and operate every interactive control.
- Focus MUST be visible.
- Dialogs, menus, and popovers MUST manage focus correctly.
- Do not use color alone to communicate status.
- Images MUST have appropriate alternative text or be marked decorative.
- Dynamic updates SHOULD use appropriate live regions when needed.
- Respect reduced-motion preferences.
- Touch targets SHOULD be usable on mobile.
- Test with keyboard navigation and automated accessibility checks; automation does not replace manual testing.


### 24.1 Motion and animation accessibility

`prefers-reduced-motion` is a mandatory input to motion design where animation is non-trivial.

Rules:

- Respect the user's operating-system reduced-motion preference.
- Reduce/remove large spatial movement, parallax, zoom, rotation, and continuous decorative motion.
- Prefer an immediate state change or a subtle opacity/color transition when that communicates the same result.
- Do not assume “reduced” means “slower.” Slower large movement may remain uncomfortable.
- Autoplay decorative animation SHOULD stop or simplify for reduced-motion users.
- Essential status changes MUST remain perceivable without movement.
- Do not require a user to watch an intro animation before reaching content.
- Do not move keyboard focus merely because an animation begins/ends.
- Focus traps, inert regions, and `aria-*` state MUST reflect interaction state, not decorative animation progress.
- Hover motion with semantic meaning MUST have keyboard/focus-equivalent behavior.
- Flashing/flickering effects MUST follow applicable accessibility safety constraints and SHOULD generally be avoided.

#### 24.1.1 Library-specific reduced-motion defaults

- Motion: use `MotionConfig` and/or `useReducedMotion` according to installed-version docs.
- GSAP: use `gsap.matchMedia()` or the project's media-query abstraction to build a reduced-motion path.
- React Spring: use its documented reduced-motion/global skip behavior where applicable.
- AutoAnimate: preserve its default reduced-motion respect; do not enable the option that overrides user preference without an exceptional documented reason.
- Lenis: evaluate whether smoothing should be disabled/reduced under the product's accessibility policy.
- Rive: pause/simplify non-essential autoplay scenes where possible and provide accessible semantic alternatives.

#### 24.1.2 Focus and presence animation

When an animated modal/menu/popover exits:

- Interaction state changes MUST remain deterministic.
- Focus return MUST not be lost because an element remains temporarily mounted for exit animation.
- Elements visually leaving the UI MUST not remain accidentally tabbable if they should no longer be interactive.
- Screen-reader-visible state MUST match the intended interaction state.

Test these behaviors manually; visual review alone is insufficient.

---

## 25. Frontend Testing

### 25.1 Testing priorities

- Test observable behavior, not implementation details.
- Prefer role, label, and visible-text queries.
- Avoid selecting elements by class names or internal structure.
- Mock network boundaries, not every internal function.
- Keep tests deterministic and independent.

### 25.2 Test layers

- Pure utilities: unit tests.
- Hooks with important behavior: focused hook/component tests.
- Components: user-focused Testing Library tests.
- Query and mutation flows: integration tests with a realistic request mock or test server.
- Critical journeys: Playwright end-to-end tests.

### 25.3 Form tests

Test:

- Required and invalid values.
- Complex field behavior.
- Submission payload transformation.
- Server validation errors.
- Loading and duplicate-submit behavior.
- Reset/edit mode.
- Keyboard interaction.

### 25.4 Playwright rules

- Test user-visible behavior.
- Use isolated test data.
- Prefer role-based locators.
- Use web-first assertions.
- Avoid fixed sleeps.
- Capture traces for failures in CI.


### 25.5 Animation testing

Animation tests SHOULD validate behavior and lifecycle rather than exact intermediate frames.

Test important animation features for:

- Final visible state.
- Exit/removal behavior.
- Stable list identity/reordering.
- Interaction availability during/after animation.
- Cleanup after unmount/remount.
- Route changes.
- Reduced-motion mode.
- Keyboard/focus behavior.
- Scroll-trigger activation when it is product-critical.

Avoid:

- Fixed sleeps that assume an exact animation duration.
- Pixel-perfect assertions on every frame.
- Tests coupled to internal GSAP tween object shapes or Motion internals.
- Disabling every animation globally in tests if the behavior being tested depends on presence/removal lifecycle.

For E2E tests:

- Use user-visible assertions and web-first waits.
- Prefer waiting for semantic end state over `waitForTimeout`.
- Test reduced-motion emulation for at least critical animated flows.
- Ensure route/dialog interactions work even when animations are skipped or drastically reduced.

For GSAP/imperative libraries, a focused test MAY mock timing while still verifying that teardown removes listeners/tickers/triggers when cleanup is part of correctness.

---

## 26. Backend Architecture

### 26.1 Responsibilities

A backend feature typically contains:

- Transport adapter: HTTP, queue, CLI, or scheduled job.
- Runtime validation.
- Authorization policy.
- Application use case.
- Domain rules.
- Repository or gateway boundary.
- Infrastructure implementation.
- Serializer or resource mapper.

Not every CRUD endpoint needs a formal class for every layer. Preserve the boundary without ceremonial boilerplate.

### 26.2 Thin controllers

Controllers or route handlers SHOULD:

1. Read validated request input.
2. Read authenticated actor/context.
3. Call one application use case or focused service.
4. Map the result to an HTTP response.

They SHOULD NOT contain long transactions, direct multi-table orchestration, or duplicated business rules.

### 26.3 Application services/use cases

Application code SHOULD:

- Coordinate domain behavior.
- Enforce operation-level authorization when appropriate.
- Open transactions through an abstraction.
- Call repositories and external gateways.
- Emit events after durable state changes.
- Remain testable without HTTP.

### 26.4 Repositories

Repositories SHOULD:

- Encapsulate persistence operations meaningful to the domain.
- Avoid leaking transport concerns.
- Return purpose-specific data.
- Expose transactional variants when required.

Do not create a generic repository abstraction that reduces every database to `findAll`, `findOne`, and `save` if the domain needs richer queries.

### 26.5 2026 backend core architecture rule

> **Added:** 2026-08-26. This subsection extends the existing backend rules without removing or replacing the earlier rules.

The backend MUST be organized around **responsibilities and dependency direction**, not around arbitrary folders or fashionable architecture names.

For a typical HTTP request, the preferred flow is:

```text
HTTP / queue / CLI entrypoint
        ↓
transport parsing
        ↓
runtime validation + normalization
        ↓
authentication context
        ↓
authorization / policy check
        ↓
controller / route adapter
        ↓
application use case / focused service
        ↓
domain rules
        ↓
repository / gateway ports
        ↓
database / cache / external integrations
        ↓
mapper / DTO / resource serializer
        ↓
transport response
```

The agent MUST keep this flow understandable even when the project uses fewer physical files.

The presence of a layer does **not** require a class. A plain function or module is preferred when it expresses the responsibility clearly.

### 26.6 Backend responsibility matrix

Use this matrix when deciding where code belongs:

| Responsibility | Preferred owner |
|---|---|
| Parse HTTP params/query/body | Router/controller boundary |
| Structural runtime validation | Validation/schema module |
| Authentication | Auth middleware / auth adapter |
| Resource authorization | Policy / application use case |
| Business invariant | Domain/application layer |
| Transaction orchestration | Application service/use case |
| Database query | Repository/data-access module |
| Mongoose/Prisma/Drizzle model details | Persistence/infrastructure layer |
| External HTTP SDK | Gateway/integration adapter |
| Queue publication | Application boundary + queue adapter |
| Response shape | Mapper/resource/DTO serializer |
| Logging/tracing | Shared infrastructure with request context |
| Configuration | Validated config module |

A controller MUST NOT become the location where all of these responsibilities accumulate.

### 26.7 Backend boundary model

Agents SHOULD distinguish the following concepts when the project complexity requires them:

- **Transport input**: raw HTTP/queue/event payload.
- **Validated input DTO**: structurally valid application input.
- **Command/query object**: application operation input.
- **Domain model/value object**: business concepts and invariants.
- **Persistence model**: Mongoose document, ORM record, SQL row, Mongo document representation.
- **Output DTO/resource**: intentionally exposed response shape.

These types MAY be the same in a very small CRUD service when there is no meaningful boundary difference. They MUST be separated when sharing one type would leak persistence details, secrets, authorization-sensitive fields, framework APIs, or unstable storage representation.

### 26.8 Service, use-case, repository, and model rules

#### Controller / route adapter

Owns transport concerns only:

- Reads validated values.
- Reads authenticated request context.
- Calls one focused application operation.
- Maps known application errors to the established HTTP contract.
- Sends the result.

It MUST NOT:

- Build complex MongoDB filters.
- Start multi-step domain workflows directly.
- Contain password hashing, payment logic, inventory logic, or role policies.
- Know Mongoose session mechanics unless it is explicitly an infrastructure endpoint.

#### Application service / use case

Owns operation orchestration:

- Enforces operation-level policy.
- Coordinates repositories.
- Opens transactions when atomicity requires them.
- Calls external gateways.
- Emits durable events after the correct persistence point.
- Returns a domain result or purpose-specific DTO.

Prefer operation names such as:

```text
CreateOrder
CancelOrder
ChangeUserEmail
RecordPayment
ApproveSupplier
ResetPassword
```

Avoid one giant `UserService`, `OrderService`, or `AppService` containing dozens of unrelated workflows.

#### Repository

Owns persistence queries meaningful to a feature or domain.

Good repository operations communicate intent:

```ts
findAccessibleOrderById(...)
findUserByNormalizedEmail(...)
reserveAvailableInventory(...)
listOrdersForCustomer(...)
existsByEmail(...)
```

Avoid generic repository abstractions that erase database strengths:

```ts
findAll()
findOne()
create()
update()
delete()
```

unless the project is genuinely simple CRUD and the abstraction improves rather than hides behavior.

#### Persistence model

Mongoose schemas/models, Prisma-generated types, Drizzle schema definitions, and raw SQL row shapes are persistence concerns.

They SHOULD NOT automatically become:

- Public API contracts.
- Frontend types.
- Domain authorization objects.
- Queue/event schemas.

### 26.9 Validation has multiple layers

Do not confuse these validation responsibilities:

1. **Transport validation**
   - Types, formats, required fields, length limits, allowed enum values.
   - Example: Zod schema for `req.body`.
2. **Persistence validation**
   - Storage-shape rules and database-supported constraints.
   - Example: Mongoose schema validation, SQL `NOT NULL`, unique index.
3. **Business validation / invariants**
   - Rules that depend on current system state or domain behavior.
   - Example: an order cannot ship after cancellation.
4. **Authorization**
   - Whether this actor may perform the operation on this resource.

Passing Zod validation does not imply database validity, business validity, or authorization.

Passing Mongoose validation does not imply the HTTP request was safe or authorized.

### 26.10 Error taxonomy

The backend SHOULD classify errors into stable categories rather than inspecting message strings throughout the application.

Typical categories:

```text
ValidationError
AuthenticationError
AuthorizationError
NotFoundError
ConflictError
RateLimitError
ExternalServiceError
PersistenceError
ConfigurationError
UnexpectedError
```

Rules:

- Domain/application code SHOULD throw or return application-level errors, not Express responses.
- Infrastructure adapters MAY translate driver/ORM errors into application errors.
- HTTP mapping belongs at the transport boundary.
- Unexpected internal errors MUST be logged with context and returned as a safe generic response.
- Stable machine-readable error codes SHOULD be separate from human-readable messages.
- Do not make clients parse database or ODM error text.

### 26.11 Request context and correlation

For production APIs, the backend SHOULD have one explicit request context containing only cross-cutting request data such as:

```ts
interface RequestContext {
  requestId: string;
  actorId?: string;
  tenantId?: string;
  traceId?: string;
}
```

Rules:

- Create or validate a request/correlation ID at the entrypoint.
- Include it in structured logs and error reports.
- Do not use request context as a hidden bag for arbitrary business state.
- Tenant identity MUST come from authenticated/verified context, not blindly from a request body.
- Async context mechanisms such as `AsyncLocalStorage` MAY be used for logging/tracing context when the project understands their lifecycle; explicit parameters remain preferable for domain-critical dependencies.

### 26.12 Side-effect ownership

Side effects include:

- Email/SMS.
- Webhooks.
- Queue messages.
- Search-index updates.
- File storage.
- Third-party API writes.
- Notifications.

Rules:

- Critical database invariants MUST commit before non-transactional side effects are considered successful.
- Do not hold a database transaction open while waiting on slow external network calls unless the consistency model explicitly requires and tolerates it.
- Use an outbox or equivalent durable handoff when a database write and message/event publication must not diverge.
- Retryable side effects MUST be idempotent.
- Side-effect failures MUST have an explicit retry, compensation, or manual-recovery strategy.

### 26.13 Backend dependency direction

Preferred direction for a modular application:

```text
transport/http/jobs
        ↓
application
        ↓
domain
        ↓
ports/interfaces
        ↑
infrastructure implementations
```

The application/domain layer SHOULD NOT import:

- Express `Request`/`Response`.
- Mongoose models, documents, or connection globals when persistence belongs behind an application/repository boundary.
- Prisma client singleton directly when a repository boundary is required.
- Redis clients directly when cache behavior is an infrastructure concern.
- Vendor SDK objects as domain models.

For small applications, a lighter structure is allowed, but business logic MUST still be callable without fabricating an HTTP request.

### 26.14 Backend anti-overengineering rules

Agents MUST NOT introduce:

- Clean Architecture folder depth for trivial CRUD with no meaningful domain rules.
- Interfaces for every class merely to imitate another language/framework.
- A repository that adds no meaning over a single ORM call unless it creates a useful boundary.
- CQRS, event sourcing, DDD aggregates, mediator buses, or microservices without a concrete requirement.
- Dependency-injection containers when simple constructor/function injection is sufficient.
- A `BaseController`, `BaseService`, and `BaseRepository` hierarchy that hides behavior behind inheritance.

Prefer the least architecture that preserves clear responsibilities and expected change.

### 26.15 Backend agent pre-implementation checklist

Before changing backend code, the agent MUST answer:

- [ ] Which runtime/framework and exact versions are installed?
- [ ] Which of the three approved backend structures in Section 27 is this repository using?
- [ ] Where does transport validation occur?
- [ ] Where is authoritative authorization enforced?
- [ ] Where does business logic currently live?
- [ ] Which module owns the data being changed?
- [ ] Which database and persistence library are used?
- [ ] Is the operation read-only or mutating?
- [ ] Does it require one write or multiple atomic writes?
- [ ] What concurrency conflict is possible?
- [ ] What indexes support the new query?
- [ ] Could the query become unbounded?
- [ ] What fields may be returned to the caller?
- [ ] What side effects occur and when?
- [ ] What errors are expected versus unexpected?
- [ ] What unit/integration/E2E coverage is required?

If a material answer is unknown, inspect the repository and version-matched documentation before implementing instead of guessing.


---

## 27. Preferred Backend Folder Structure

### 27.1 Node.js / TypeScript modular structure

```text
src/
├── app/
│   ├── create-app.ts
│   ├── routes.ts
│   └── server.ts
├── modules/
│   ├── orders/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   ├── http/
│   │   ├── schemas/
│   │   ├── mappers/
│   │   └── index.ts
│   └── users/
├── shared/
│   ├── errors/
│   ├── auth/
│   ├── validation/
│   └── types/
├── config/
├── db/
│   ├── client.ts
│   ├── schema/
│   └── migrations/
├── jobs/
├── integrations/
├── observability/
└── tests/
```

### 27.2 Simpler feature structure

```text
src/modules/orders/
├── order.routes.ts
├── order.controller.ts
├── order.service.ts
├── order.repository.ts
├── order.schema.ts
├── order.mapper.ts
└── order.types.ts
```

Use the simpler structure until domain complexity justifies deeper layers.

### 27.3 Laravel structure

Use Laravel conventions first, then organize domain complexity without fighting the framework:

```text
app/
├── Actions/
│   └── Orders/
├── Data/
├── Domain/
│   └── Orders/
├── Events/
├── Exceptions/
├── Http/
│   ├── Controllers/
│   ├── Requests/
│   └── Resources/
├── Jobs/
├── Models/
├── Policies/
├── Services/
└── Support/
```

Do not create directories only because they appear here. Use them when they represent real responsibilities.

### 27.4 Three approved Node.js / Express backend structures

There are **three approved default structures** for Node.js/Express projects. The agent MUST choose based on real complexity and MUST follow the existing repository when it already has a coherent structure.

Do not mix all three structures inside one codebase without an explicit migration plan.

#### 27.4.1 Structure A — Simple Layered / MVC-style API

Use for:

- Small APIs.
- MVPs.
- Internal tools.
- Straightforward CRUD.
- Teams that need the simplest obvious organization.

Suggested structure:

```text
src/
├── app.ts
├── server.ts
├── config/
│   ├── env.ts
│   └── index.ts
├── routes/
│   ├── index.ts
│   ├── user.routes.ts
│   └── product.routes.ts
├── controllers/
│   ├── user.controller.ts
│   └── product.controller.ts
├── services/
│   ├── user.service.ts
│   └── product.service.ts
├── repositories/
│   ├── user.repository.ts
│   └── product.repository.ts
├── models/
│   ├── user.model.ts
│   └── product.model.ts
├── schemas/
│   ├── user.schema.ts
│   └── product.schema.ts
├── middlewares/
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   └── validate.middleware.ts
├── mappers/
├── utils/
├── constants/
├── types/
└── tests/
```

Rules:

- Routes register endpoints and middleware only.
- Controllers translate HTTP to application calls.
- Services own business workflows.
- Repositories own persistence queries.
- Models own Mongoose/ORM persistence definitions.
- Runtime request schemas remain separate from database schemas when they represent different trust boundaries.

Do **not** use Structure A once global `controllers/`, `services/`, and `repositories/` folders contain dozens of unrelated domains and navigating one feature requires jumping across the entire repository.

#### 27.4.2 Structure B — Feature-First Modular API — **preferred default**

This is the preferred default for most medium and growing Express APIs, especially **Express + TypeScript + MongoDB + Mongoose** projects.

Use for:

- Multiple business features.
- Teams expected to grow the application.
- APIs where each feature has controllers, validation, persistence, and tests.
- Projects where feature ownership and local reasoning matter.

Suggested root:

```text
src/
├── app/
│   ├── create-app.ts
│   ├── register-routes.ts
│   └── server.ts
├── config/
│   ├── env.ts
│   ├── logger.ts
│   └── index.ts
├── modules/
│   ├── auth/
│   ├── users/
│   ├── products/
│   └── orders/
├── infrastructure/
│   ├── database/
│   ├── cache/
│   ├── queue/
│   └── external/
├── shared/
│   ├── errors/
│   ├── auth/
│   ├── http/
│   ├── validation/
│   └── types/
├── jobs/
├── observability/
└── tests/
```

A typical feature:

```text
src/modules/users/
├── user.routes.ts
├── user.controller.ts
├── user.service.ts
├── user.repository.ts
├── user.model.ts
├── user.validation.ts
├── user.mapper.ts
├── user.types.ts
├── user.constants.ts
├── user.errors.ts
├── user.policy.ts
├── user.test.ts
└── index.ts
```

As the feature grows, expand **inside the feature** instead of creating more global dumping grounds:

```text
src/modules/users/
├── http/
│   ├── user.routes.ts
│   └── user.controller.ts
├── application/
│   ├── create-user.ts
│   ├── update-user.ts
│   └── list-users.ts
├── persistence/
│   ├── user.repository.ts
│   └── mongoose/
│       ├── user.schema.ts
│       └── user.model.ts
├── validation/
│   ├── create-user.schema.ts
│   └── update-user.schema.ts
├── policies/
│   └── user.policy.ts
├── mappers/
│   └── user.mapper.ts
├── types/
│   └── user.types.ts
└── index.ts
```

This structure matches the same engineering philosophy used on the frontend: **feature-local code stays local, complex responsibilities are separated, and the connections between them remain obvious.**

#### 27.4.3 Structure C — Clean / Hexagonal Modular Architecture

Use only when justified by meaningful domain complexity, multiple transports/persistence adapters, long-lived business rules, or high testing/isolation requirements.

Use for:

- Complex financial/order/inventory workflows.
- Multiple HTTP, queue, CLI, or event entrypoints sharing use cases.
- Multiple database/external provider adapters.
- Strong domain modeling.
- Systems expected to outlive infrastructure choices.

Suggested feature:

```text
src/modules/orders/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── services/
│   ├── events/
│   └── errors/
├── application/
│   ├── commands/
│   ├── queries/
│   ├── use-cases/
│   ├── dto/
│   └── ports/
├── adapters/
│   ├── http/
│   │   ├── order.routes.ts
│   │   ├── order.controller.ts
│   │   └── order.validation.ts
│   ├── persistence/
│   │   ├── mongoose-order.repository.ts
│   │   └── order.mapper.ts
│   └── integrations/
├── infrastructure/
│   └── mongoose/
│       ├── order.schema.ts
│       └── order.model.ts
└── index.ts
```

Dependency direction:

```text
adapters/infrastructure → application → domain
```

The domain MUST NOT import Express, Mongoose, Prisma, Redis, or vendor SDK types.

Structure C is **not** automatically more professional. It is professional only when its boundaries solve real complexity.

### 27.5 Structure selection matrix

| Situation | Preferred structure |
|---|---|
| Tiny API / prototype / very simple CRUD | A — Layered |
| Most production Express APIs | B — Feature-First Modular |
| Express + MongoDB + Mongoose growing product | B — Feature-First Modular |
| Complex business workflows with multiple adapters | C — Clean/Hexagonal Modular |
| Existing coherent repository | Existing structure first |
| Unsure | Start with B, keep it shallow, deepen only complex modules |

The agent MUST NOT migrate A → B or B → C during unrelated feature work.

### 27.6 Preferred Express + MongoDB + Mongoose module structure

For the stack currently emphasized by this constitution, the preferred medium/large feature layout is:

```text
src/modules/products/
├── http/
│   ├── product.routes.ts
│   └── product.controller.ts
├── application/
│   ├── create-product.ts
│   ├── update-product.ts
│   ├── get-product.ts
│   └── list-products.ts
├── persistence/
│   ├── product.repository.ts
│   └── mongoose/
│       ├── product.schema.ts
│       └── product.model.ts
├── validation/
│   ├── create-product.schema.ts
│   ├── update-product.schema.ts
│   ├── product-query.schema.ts
│   └── product-param.schema.ts
├── policies/
│   └── product.policy.ts
├── mappers/
│   └── product.mapper.ts
├── types/
│   └── product.types.ts
├── constants/
│   └── product.constants.ts
├── product.errors.ts
├── product.test.ts
└── index.ts
```

A simpler module MAY remain flat until the number of files or responsibilities justifies subdirectories.

### 27.7 Root folder meanings for Node APIs

#### `app/`

Owns application bootstrap and composition:

- Create Express/Fastify app.
- Register middleware/plugins.
- Register top-level routes.
- Error/not-found boundary.
- Does not own business features.

#### `config/`

Owns validated configuration:

- Environment parsing.
- Feature flags/config constants.
- Runtime-specific configuration.

Do not read raw `process.env` from feature code.

#### `modules/`

Owns business capabilities. Feature-specific files SHOULD remain here.

#### `infrastructure/`

Owns reusable technical adapters:

- Database connection.
- Redis.
- Queue client.
- Object storage.
- Email provider.
- External SDK configuration.

#### `shared/`

Contains truly cross-feature code with stable semantics only.

Good examples:

- Base application errors.
- Auth context types.
- Request ID helpers.
- Pagination contract.
- Generic validated config utilities.

Bad examples:

- Random business helpers.
- `common.service.ts`.
- Feature DTOs.
- Product/order/user constants.

#### `jobs/`

Owns process-level scheduled/worker entrypoints. Business behavior called by jobs SHOULD still live in feature application modules.

#### `observability/`

Owns logger/tracing/metrics configuration, not domain analytics rules.

### 27.8 Cross-module dependency rules

Modules SHOULD communicate through intentional public APIs.

Preferred:

```ts
import { getUserById } from '@/modules/users';
```

when `users/index.ts` exposes a stable application contract.

Avoid deep cross-feature imports such as:

```ts
import { UserModel } from '@/modules/users/persistence/mongoose/user.model';
```

from another business module unless that persistence coupling is explicitly part of the architecture.

If Orders needs Users data frequently, prefer one of:

- A users application query.
- A narrow repository/query port.
- A purpose-specific read model.
- Deliberate shared database query at an infrastructure boundary when performance requires it and ownership is documented.

Do not create HTTP calls between modules inside the same monolith.

### 27.9 Shared-code promotion rule

Code SHOULD be promoted from a feature into `shared/` only when:

1. At least two unrelated modules need the same concept.
2. The semantics are truly the same.
3. The public contract is stable enough to name.
4. Moving it reduces duplicated knowledge rather than merely duplicated syntax.

Do not build a shared abstraction after the first occurrence.

### 27.10 Backend folder anti-patterns

Avoid:

```text
src/helpers/
src/common/
src/misc/
src/managers/
src/services/everything.service.ts
src/controllers/50-unrelated-files
src/models/all-models.ts
src/utils/database.ts  # database access disguised as a utility
```

Also avoid:

- `index.ts` barrels that export every internal model and create circular dependencies.
- Repository files that contain HTTP response logic.
- Controller files that import ten models directly.
- Mongoose models imported across unrelated modules without an ownership decision.
- Schema files combining Zod HTTP schemas and Mongoose persistence schemas just because both use the word “schema”.

### 27.11 Test placement rules

Use one consistent strategy:

**Co-located feature tests**

```text
modules/users/
├── user.service.ts
├── user.service.test.ts
└── ...
```

or **mirrored test tree**

```text
tests/
├── integration/users/
├── integration/orders/
└── e2e/
```

The project MAY combine:

- Unit tests co-located with pure modules.
- Integration/E2E tests in a top-level test tree.

Do not separate tests so far from feature ownership that behavior becomes difficult to discover.

### 27.12 Backend structure migration rule

Architecture growth SHOULD be incremental:

```text
simple route
  → controller + service
  → feature module
  → repository boundary
  → split application use cases
  → domain/ports/adapters only where justified
```

Do not create the final enterprise structure before the application has the complexity that needs it.

### 27.13 Backend structure agent checklist

Before creating a backend folder or moving code, the agent MUST answer:

- [ ] Which of Structure A/B/C is already used?
- [ ] Is the new file feature-specific or cross-feature?
- [ ] What responsibility does the new folder own?
- [ ] Is the structure becoming easier to navigate?
- [ ] Could this remain a local file instead of a new abstraction?
- [ ] Does the proposed import direction preserve module ownership?
- [ ] Are persistence details leaking across modules?
- [ ] Is a migration outside the requested task being introduced?


---

## 28. Node.js Runtime Rules

### 28.1 Runtime

- Use a supported LTS runtime in production.
- Prefer ESM for new projects when framework/tooling support is complete.
- Do not mix ESM and CommonJS casually.
- Keep CPU-intensive work off the request event loop.
- Use worker threads or a separate service for genuinely CPU-bound tasks.
- Stream large files and exports.

### 28.2 Process lifecycle

- Handle `SIGTERM` and `SIGINT`.
- Stop accepting new traffic.
- Finish or cancel in-flight work within a deadline.
- Close database, queue, and telemetry connections.
- Exit non-zero on unrecoverable startup failure.
- Let a process manager or orchestrator restart crashed processes.

### 28.3 Configuration

- Validate environment variables at startup.
- Fail fast on missing or invalid required configuration.
- Do not read raw `process.env` throughout business modules.
- Separate public configuration from secrets.

### 28.4 Async safety

- Handle unhandled promise rejections as defects.
- Add timeouts to outbound calls.
- Use abort signals when supported.
- Bound concurrency.
- Do not block the event loop with synchronous filesystem or crypto operations in request paths.

---

## 29. Express Rules

### 29.1 Express 5 baseline

- Use Express 5 semantics.
- Async route errors SHOULD flow to centralized error middleware.
- Error middleware MUST use the four-argument signature.
- Validate route params, query, body, and headers before controllers use them.

### 29.2 Application setup

Recommended sequence:

1. Trust-proxy configuration when required by deployment.
2. Request/correlation identifier.
3. Security headers.
4. CORS policy.
5. Body size limits and parsers.
6. Structured request logging.
7. Authentication context.
8. Routes.
9. Not-found handler.
10. Central error handler.

### 29.3 Express controller example

```ts
export async function createOrderController(
  req: Request,
  res: Response,
): Promise<void> {
  const actor = requireActor(req);
  const input = req.validated.body;

  const order = await createOrder({ actor, input });

  res.status(201).json({ data: toOrderResource(order) });
}
```

### 29.4 Express restrictions

- Do not attach untyped arbitrary properties to `req` without module augmentation or a typed request context.
- Do not expose static dotfiles accidentally.
- Do not use default error output in production.
- Do not place database queries directly in route registration files.
- Do not depend on middleware order that is undocumented or untested.

### 29.5 2026 Express 5 source-of-truth rule

> **Review snapshot:** 2026-08-26. Express 5.2.1 is the current npm `latest` release at review time. The repository's installed and security-patched version remains authoritative.

Express is intentionally unopinionated about folder structure. Therefore:

- Follow Section 27 for this constitution's architecture defaults.
- Follow installed Express 5 documentation for framework behavior.
- Do not copy Express 4 workarounds into Express 5 without verifying they are still necessary.
- Do not upgrade Express during unrelated feature work unless required by security/correctness.

### 29.6 Express 5 async error handling

Express 5 automatically forwards rejected Promises from async route handlers and middleware to the error pipeline.

Preferred:

```ts
router.get('/:userId', async (req, res) => {
  const user = await getUser(req.params.userId);
  res.json({ data: user });
});
```

If `getUser()` rejects or the handler throws, Express 5 routes the error to error-handling middleware.

Rules:

- Do not add an `asyncHandler()` wrapper to every Express 5 route merely because an older Express 4 template used one.
- A wrapper MAY remain when it adds real behavior such as tracing, typed context, or a project-standard contract.
- Errors thrown inside detached callbacks/timers or unreturned asynchronous work are not magically owned by the route; handle them at the correct async boundary.
- The final error middleware MUST use `(err, req, res, next)`.
- Do not send a response and then continue executing a code path that can call `next(err)` unexpectedly.

### 29.7 Separate app creation from server startup

Preferred:

```text
src/app/create-app.ts
src/app/server.ts
```

`create-app.ts` SHOULD:

- Instantiate Express.
- Register middleware.
- Register routes.
- Register not-found/error handlers.
- Return the app without opening a port.

`server.ts` SHOULD:

- Validate startup configuration.
- Connect required infrastructure.
- Create the app.
- Call `listen()`.
- Install graceful shutdown handling.

This separation allows route integration tests to use the application without binding a network port.

### 29.8 Router-per-module pattern

Feature routing SHOULD stay close to the feature:

```ts
export function createProductRouter(deps: ProductHttpDeps): Router {
  const router = Router();

  router.get(
    '/',
    validate(productListSchema),
    deps.controller.list,
  );

  router.post(
    '/',
    requireAuth,
    validate(createProductSchema),
    deps.controller.create,
  );

  return router;
}
```

Rules:

- Route files describe HTTP composition, not business workflows.
- Route-specific middleware order MUST be obvious from registration.
- Avoid one enormous `routes.ts` containing every endpoint in the application.
- Mount routers under explicit version/resource paths according to the API contract.

### 29.9 Express request validation boundary

Validate each source independently:

- `params`.
- `query`.
- `body`.
- Important headers.
- Uploaded file metadata/content according to Section 36.

Preferred flow:

```text
raw request
   ↓
validation middleware
   ↓
typed validated data
   ↓
controller
```

Do not let controllers repeatedly parse `Number(req.query.page)`, validate ObjectIds, or normalize email addresses ad hoc across routes.

Validation middleware SHOULD expose a typed validated result through the project's established request/context mechanism rather than mutating many arbitrary request fields.

### 29.10 Express security baseline

Production Express applications SHOULD explicitly address:

- Supported, non-vulnerable Express version.
- TLS termination.
- Security headers such as Helmet or equivalent policy.
- Strict body/upload size limits.
- Safe cookie/session settings when used.
- Brute-force/rate limiting for authentication and expensive endpoints.
- Dependency security review.
- Open-redirect prevention.
- CORS allowlists where browser cross-origin access is required.
- Reduced framework fingerprinting where appropriate.

Do not treat `helmet()` or CORS middleware as a replacement for authorization, validation, CSRF controls, or secure deployment configuration.

### 29.11 `trust proxy` rule

`app.set('trust proxy', ...)` affects client IP, protocol, secure-cookie behavior, and proxy-derived request properties.

Rules:

- Configure it from the actual deployment topology.
- Do not blindly set `trust proxy = true` from a tutorial.
- Verify which upstream proxies overwrite forwarding headers.
- Rate limiting and IP-based security controls MUST use the same trusted-proxy model.

### 29.12 Body parser and payload rules

- Set explicit JSON/urlencoded limits according to endpoint requirements.
- Use route-specific larger limits only where required.
- Preserve raw request bodies for webhook signature verification when the provider requires exact bytes.
- Do not parse enormous payloads into memory when streaming is the appropriate design.
- Reject unsupported content types deliberately.

### 29.13 Authentication context rule

Authentication middleware SHOULD establish a verified actor context once.

Example concept:

```ts
interface AuthContext {
  actorId: string;
  tenantId?: string;
  sessionId?: string;
  permissions: readonly string[];
}
```

Controllers/application services SHOULD use verified context instead of re-decoding tokens independently.

Resource authorization still belongs in policy/application logic.

### 29.14 Express response rules

- Return narrow DTOs/resources.
- Do not call `res.json(mongooseDocument)` or `res.json(prismaRecord)` automatically.
- Avoid leaking stack traces and persistence error details.
- Define consistent JSON error shape.
- Set status explicitly for create/accepted/no-content operations.
- Never return secrets, password hashes, refresh-token digests, internal provider metadata, or hidden tenant fields.

### 29.15 Express performance rules

Optimize architecture before micro-benchmarks:

1. Remove N+1 database access.
2. Add correct indexes.
3. Bound request sizes and pagination.
4. Avoid CPU-heavy synchronous work on the event loop.
5. Stream large responses/files.
6. Cache only where freshness/ownership is defined.
7. Apply compression at the correct proxy/application layer.
8. Measure latency percentiles and database time separately.

Do not migrate from Express to another framework solely to solve a database/query-design bottleneck.

### 29.16 Express integration testing

Use Supertest or the project-equivalent integration harness against the app factory.

Test at least:

- Route validation.
- Authentication/authorization.
- Error mapping.
- Not-found behavior.
- Database effects.
- Response DTO field allowlists.
- Pagination limits.
- Rate-limit behavior where critical.

Avoid mocking controllers/services so aggressively that the route wiring itself is never tested.

### 29.17 Express anti-hallucination checklist

Before writing Express code, the agent MUST confirm:

- [ ] Exact Express version.
- [ ] Express 5 or legacy Express 4 behavior?
- [ ] Current middleware order.
- [ ] Existing validation library/pattern.
- [ ] Existing error contract.
- [ ] Existing auth/request-context mechanism.
- [ ] Actual proxy deployment before changing `trust proxy`.
- [ ] Whether the repository already uses an async wrapper and why.
- [ ] Whether the endpoint needs streaming/raw body/special limits.
- [ ] Which module owns the route and persistence operations.


---

## 30. Fastify Rules

### 30.1 When to choose Fastify

Fastify is a strong choice when the project benefits from:

- Schema-driven validation and serialization.
- Plugin encapsulation.
- High-throughput JSON APIs.
- A typed route ecosystem.
- Fast injection-based testing.

Do not migrate from Express solely for benchmark claims without a real operational need.

### 30.2 Plugin architecture

- Register capabilities as focused plugins.
- Use encapsulation deliberately.
- Decorate the Fastify instance/request only with typed, documented values.
- Avoid one giant plugin that registers the entire application.

### 30.3 Schemas

- Define request and response schemas.
- Response schemas SHOULD limit accidental data exposure and improve serialization.
- Treat schemas as application code; never accept user-provided schemas.
- Do not perform database access during initial schema validation.
- Complex async business validation belongs in hooks or the application layer after structural validation.

### 30.4 Lifecycle hooks

Choose hooks based on responsibility:

- `onRequest`: earliest request context.
- `preParsing`: raw payload handling.
- `preValidation`: contextual preparation.
- `preHandler`: authentication/authorization orchestration.
- `onSend`: safe response transformation.
- `onResponse`: metrics/cleanup after response.

Do not place the same business rule in multiple hooks.

### 30.5 Testing

Use `app.inject()` for fast route integration tests without opening a network port. Test plugin encapsulation and route schemas where relevant.

---

## 31. PHP Rules

### 31.1 Language baseline

- Use a supported PHP release compatible with the framework and dependencies.
- New PHP files SHOULD use `declare(strict_types=1);` where project conventions permit.
- Follow PSR-12 coding style and PSR-4 autoloading.
- Use typed properties, parameters, and return types.
- Prefer enums for finite domain values where appropriate.
- Prefer immutable value objects for money, identifiers, and other invariant-rich values when justified.

### 31.2 PHP code rules

- Do not use dynamic properties.
- Avoid loose comparisons for domain logic.
- Avoid arrays as unstructured bags for complex domain data; use DTOs or value objects.
- Do not suppress errors with `@`.
- Do not catch `Throwable` broadly unless at an application boundary.
- Use constructor property promotion when it improves clarity.
- Keep framework facades out of domain logic when testability matters.

### 31.3 Static analysis and formatting

New projects SHOULD use:

- Laravel Pint or an equivalent formatter.
- PHPStan/Larastan at a meaningful strictness level.
- PHPUnit or Pest according to project conventions.

Do not reduce static-analysis level to silence new defects.

---

## 32. Laravel Rules

### 32.1 Framework conventions first

Use Laravel's routing, container, middleware, validation, policies, resources, queues, events, and testing facilities before inventing custom infrastructure.

### 32.2 Controllers

Controllers SHOULD be thin:

```php
public function store(StoreOrderRequest $request, CreateOrder $action): OrderResource
{
    $order = $action->handle(
        actor: $request->user(),
        data: CreateOrderData::from($request->validated()),
    );

    return new OrderResource($order);
}
```

### 32.3 Form Requests

Use Form Requests for non-trivial request validation and request-level authorization.

- `rules()` owns structural validation.
- `authorize()` may perform request-level permission checks.
- Domain invariants still belong in the application/domain layer.
- Never trust `$request->all()` for mass assignment.

### 32.4 Actions/services

Use focused action classes or services for business operations that exceed trivial CRUD.

- Prefer names such as `CreateOrder`, `CancelOrder`, `RecordPayment`.
- One action SHOULD represent one use case.
- Do not create a giant `OrderService` with every operation.

### 32.5 Models and Eloquent

- Protect mass assignment using `$fillable` or carefully controlled `$guarded` strategy.
- Prevent N+1 queries with eager loading.
- Consider preventing lazy loading outside production to catch accidental N+1 behavior.
- Keep expensive accessors out of large list queries.
- Use casts for clear data conversion.
- Do not place all business logic in Eloquent models; keep models cohesive.

### 32.6 Policies and authorization

- Use policies or gates for resource authorization.
- Authorize the specific resource, not only the route role.
- Apply tenant scopes consistently.
- Do not rely on frontend visibility.

### 32.7 API Resources

- Use API Resources to control response shape.
- Do not return entire models blindly.
- Load required relationships deliberately.
- Avoid accidental lazy loading during serialization.

### 32.8 Queues

Use queued jobs for slow or retryable tasks:

- Email.
- Imports/exports.
- Image or document processing.
- External synchronization.
- Notifications.

Jobs SHOULD define timeout, retry/backoff, failure behavior, and idempotency. Use unique jobs only when the uniqueness contract matches the business need.

### 32.9 Database transactions

Use `DB::transaction()` for atomic multi-write operations. External API calls SHOULD generally occur outside the database transaction. Use after-commit dispatch where an event/job must not run before persistence commits.

### 32.10 Testing

- Feature tests provide the highest confidence for most Laravel behavior.
- Unit-test pure domain logic.
- Use factories intentionally.
- Avoid making every test depend on enormous seeders.
- Test policies, validation, API resources, queue dispatch, and database effects.

### 32.11 Deployment

- Cache configuration, routes, and views where appropriate.
- Run migrations as a controlled deployment step.
- Restart long-running queue workers after deployment.
- Expose health checks.
- Ensure writable storage and correct trusted-proxy configuration.

---

## 33. Backend Library Rules

### 33.1 Node.js preferred options

| Need | Preferred choices |
|---|---|
| HTTP framework | Express 5 or Fastify 5 based on project requirements |
| Validation | Zod, TypeBox/JSON Schema, or existing validated project library |
| Logging | Pino or established structured logger |
| ORM/query builder | Prisma or Drizzle based on control and workflow needs |
| PostgreSQL driver | Project-compatible maintained driver |
| Queue | BullMQ or platform-native queue when Redis/managed queue is appropriate |
| Metrics/tracing | OpenTelemetry-compatible tooling |
| Tests | Vitest, Node test runner, Supertest, or Fastify inject |

### 33.2 PHP/Laravel preferred options

Prefer Laravel core capabilities first. Common additions MAY include:

- Pest or PHPUnit.
- Pint.
- PHPStan/Larastan.
- A maintained permission package when policy/role complexity justifies it.
- Horizon for Redis queue operations when appropriate.

### 33.3 Library ownership

Every library MUST have:

- A defined responsibility.
- A configured adapter in `lib`, `infrastructure`, or framework configuration.
- A version policy.
- Tests around critical behavior.
- No direct use scattered across the entire codebase when an adapter is useful.

---

## 34. API Design Rules

### 34.1 Contract design

- APIs MUST be consistent, predictable, and versioned when compatibility requires it.
- Use nouns for resources and HTTP methods for operations where REST fits.
- Use command endpoints for domain actions that do not map cleanly to CRUD.
- Validate path, query, header, and body independently.
- Return stable error codes separate from human-readable messages.

### 34.2 Status codes

Typical defaults:

- `200` successful read/update.
- `201` resource created.
- `202` accepted for asynchronous processing.
- `204` successful operation with no body.
- `400` malformed input.
- `401` unauthenticated.
- `403` authenticated but forbidden.
- `404` missing or intentionally hidden resource.
- `409` state conflict.
- `422` semantically invalid input where the API convention uses it.
- `429` rate limited.
- `500` unexpected server failure.

Use the project's established error contract consistently.

### 34.3 Response shape

A common shape MAY be:

```json
{
  "data": {},
  "meta": {},
  "error": null
}
```

Do not wrap responses mechanically if the existing API has another clear contract.

### 34.4 Pagination

- Set maximum page sizes.
- Use deterministic ordering.
- Include pagination metadata or cursors.
- Never allow clients to request unbounded records.

### 34.5 Filtering and sorting

- Allowlist filter and sort fields.
- Parameterize all values.
- Avoid exposing raw SQL-like expressions.
- Define case sensitivity and timezone behavior.

### 34.6 Idempotency

Critical create/payment/booking operations SHOULD accept an idempotency key or equivalent business identifier.

- Scope the key to actor/tenant and operation.
- Store the request fingerprint and result.
- Reject conflicting reuse.
- Expire keys according to business requirements.

### 34.7 Webhooks

- Verify signatures using the raw body where required.
- Protect against replay with timestamps/event IDs.
- Persist receipt before asynchronous processing where reliability matters.
- Make handlers idempotent.
- Return quickly and process long work asynchronously.

---

## 35. Authentication and Authorization

### 35.1 Authentication

- Use a maintained solution unless custom authentication is a documented requirement.
- Passwords MUST use a current password hashing algorithm with appropriate parameters.
- Tokens and sessions MUST have rotation, expiration, revocation, and secure storage behavior.
- Never log passwords, secrets, full tokens, or sensitive recovery data.

### 35.2 Authorization

Every protected operation MUST verify:

1. The actor is authenticated.
2. The actor has permission for the operation.
3. The actor can access the specific resource.
4. The resource belongs to the correct tenant/account where relevant.
5. Sensitive fields are authorized individually.

### 35.3 BOLA prevention

Never fetch a resource by client-supplied ID and assume access is allowed.

Bad:

```ts
const order = await db.order.findUnique({ where: { id } });
```

Better conceptually:

```ts
const order = await orderRepository.findAccessibleById({
  orderId: id,
  actorId: actor.id,
  tenantId: actor.tenantId,
});
```

Or fetch and run an explicit policy before returning or mutating it.

### 35.4 Roles and permissions

- Roles group permissions; code SHOULD authorize capabilities rather than scattered role-name comparisons.
- Super-admin bypasses MUST be explicit, auditable, and rare.
- Permission changes SHOULD invalidate relevant sessions or authorization caches when required.

---

## 36. Application Security

### 36.1 Input handling

- Validate all untrusted input.
- Enforce body, file, field, and collection size limits.
- Reject unknown fields for sensitive operations when practical.
- Prevent mass assignment.
- Normalize only after validation rules are clear.

### 36.2 Output handling

- Return allowlisted fields through DTOs/resources.
- Encode output in the appropriate context.
- Do not expose stack traces, SQL, secrets, internal IDs, or infrastructure details unnecessarily.

### 36.3 SQL and NoSQL injection

- Use parameterized queries or ORM APIs.
- Do not concatenate untrusted values into SQL.
- Do not pass arbitrary MongoDB operators from request objects.
- Allowlist dynamic column names and sort directions.

### 36.4 CSRF

Cookie-authenticated state-changing requests MUST have appropriate CSRF protection. SameSite cookies alone may not cover every architecture.

### 36.5 CORS

- Define explicit allowed origins.
- Do not combine wildcard origins with credentials.
- Limit methods and headers.
- Treat CORS as a browser policy, not authentication.

### 36.6 SSRF

For server-side URL fetching:

- Allowlist protocols and destinations when possible.
- Block private/link-local metadata ranges unless explicitly required.
- Resolve and re-check redirects.
- Apply timeouts and response-size limits.
- Do not expose arbitrary internal fetch capability.

### 36.7 File uploads

- Validate size, extension, MIME, and actual content where appropriate.
- Generate server-side storage names.
- Store outside executable/public paths unless intentionally public.
- Scan high-risk files when required.
- Serve with safe content headers.
- Apply authorization to download access.

### 36.8 Rate limits and abuse

- Rate-limit authentication, recovery, search, expensive reports, uploads, and public APIs.
- Add business-level limits in addition to IP limits.
- Use queues and quotas for expensive operations.

### 36.9 Dependencies

- Commit lockfiles.
- Review supply-chain changes.
- Remove unused packages.
- Apply security patches promptly.
- Do not run unknown install scripts blindly.
- Pin CI actions and container images according to project policy.

---

## 37. Database Selection

Choose by data model and access patterns.

| Requirement | Default consideration |
|---|---|
| Transactions, joins, constraints, reporting | PostgreSQL or MySQL |
| Flexible aggregate documents with bounded relationships | MongoDB |
| Cache, session, counters, ephemeral coordination | Redis |
| Full-text/fuzzy ranked search | Database full-text first, dedicated search engine when needed |
| Time-series analytics | PostgreSQL extension or dedicated time-series store when justified |
| Complex graph traversal | Relational model first for modest needs; graph DB for proven graph-heavy workloads |
| Large analytical scans | OLAP/columnar platform when operational DB is insufficient |

### 37.1 Selection rules

- Use one primary database unless a second data store solves a proven distinct need.
- Do not choose NoSQL merely to avoid schema design.
- Do not choose SQL merely because every relation must be normalized.
- Data consistency and query patterns matter more than trend popularity.

---

## 38. Relational Database Rules

### 38.1 Schema correctness

- Use primary keys.
- Use foreign keys where the database owns referential integrity.
- Use `NOT NULL` when absence is invalid.
- Use unique constraints for business uniqueness.
- Use check constraints for stable row-level invariants.
- Use appropriate numeric precision for money.
- Avoid storing comma-separated lists in text columns.

### 38.2 Money

- Use integer minor units or an exact decimal type.
- Never use binary floating point for financial amounts.
- Store currency explicitly when multiple currencies are possible.
- Define rounding at the business boundary.

### 38.3 Indexing

Create indexes from real access patterns:

- Filter predicates.
- Join columns.
- Sort order.
- Uniqueness.
- Foreign-key access where needed.

Every index increases storage and write cost. Review query plans for critical queries.

### 38.4 Query rules

- Select only required columns.
- Avoid N+1 queries.
- Use joins for relational queries rather than repeated application round trips.
- Use `EXPLAIN`/query plans for slow queries.
- Set statement timeouts where appropriate.
- Paginate large results.

### 38.5 Connection pooling

- Configure pool size for runtime concurrency and database limits.
- Serverless environments MUST use an appropriate pooler or serverless driver.
- Do not create a new connection per request.
- Monitor pool wait time and saturation.

### 38.6 Relational modeling process

For a new relational feature, model in this order:

1. Identify business entities and ownership.
2. Identify stable identifiers.
3. Identify required versus optional values.
4. Map one-to-one, one-to-many, and many-to-many relationships.
5. Define database constraints.
6. Define common read/write query shapes.
7. Design indexes from those queries.
8. Define transaction/concurrency boundaries.
9. Define archival/deletion lifecycle.
10. Define migration and rollback/roll-forward strategy.

The ORM schema is not a substitute for this process.

### 38.7 Database constraints are part of correctness

Use the database to enforce invariants it can reliably own:

- Primary keys.
- `NOT NULL`.
- Unique constraints.
- Foreign keys.
- Stable `CHECK` constraints.
- Exclusion constraints where the chosen database supports and the domain requires them.

Rules:

- Do not rely only on `SELECT`-then-insert application checks for uniqueness; concurrent requests can race.
- Map unique/foreign-key conflicts to stable application errors.
- Choose `ON DELETE`/`ON UPDATE` actions deliberately; do not accept ORM defaults without reviewing domain behavior.
- Avoid application-level relation emulation when native foreign keys are available and appropriate, unless the architecture has a documented reason.

### 38.8 Normalization and denormalization

Default to a normalized relational model for authoritative transactional data.

Denormalize only when a concrete read/performance requirement justifies it and document:

- Source of truth.
- Update mechanism.
- Transaction consistency behavior.
- Repair/rebuild process.
- Staleness tolerance.

Do not duplicate customer/product/order facts across tables merely to avoid writing joins.

### 38.9 Transaction design

Transactions SHOULD protect business invariants, not wrap every service method automatically.

Rules:

- Keep transaction scopes short.
- Do not perform slow remote HTTP calls while holding row locks unless unavoidable and designed for.
- Read rows with the locking semantics required by the workflow.
- Use consistent lock ordering to reduce deadlock risk.
- Handle deadlock/serialization retry only where the operation is safe to retry.
- Choose isolation level from anomaly requirements, not by always selecting the strongest level.

### 38.10 PostgreSQL isolation awareness

For PostgreSQL, `READ COMMITTED` is the normal default, while `REPEATABLE READ` and `SERIALIZABLE` provide stronger guarantees with different retry/concurrency implications.

The agent MUST understand the anomaly being prevented before changing isolation level.

Do not claim that a transaction automatically prevents lost updates, overselling, double booking, or stale reads; the actual query/lock/constraint design determines correctness.

### 38.11 Relational index design

An index proposal MUST name the query it supports.

Review:

- Equality predicates.
- Join predicates.
- Sort order.
- Range conditions.
- Cardinality/selectivity.
- Pagination cursor.
- Covering needs.
- Write frequency.

Rules:

- Composite column order matters.
- PostgreSQL multicolumn B-tree indexes are generally most efficient when leading columns match the most useful equality conditions before later range/sort needs.
- Use partial indexes only when the predicate matches a meaningful stable workload subset.
- Avoid speculative indexes for every column.
- Review query plans with production-representative data for critical paths.
- An index that never supports a real query is operational debt.

### 38.12 Foreign-key index nuance

Primary key and unique constraints generally create supporting uniqueness indexes in relational databases such as PostgreSQL.

Do not assume every foreign-key column automatically receives the ideal lookup index for your workload. Add indexes based on child lookup/delete/update query patterns and measured plans.

### 38.13 Relational pagination rules

For high-volume or frequently changing tables, prefer keyset/cursor pagination.

Example ordering contract:

```text
ORDER BY created_at DESC, id DESC
cursor = (created_at, id)
```

Rules:

- Ordering MUST be deterministic.
- Cursor columns SHOULD be indexed according to the query.
- Offset pagination remains acceptable for small admin screens and bounded data.
- Do not expose unbounded `limit`.

### 38.14 Relational read-model rules

Not every read path needs hydrated domain entities.

For list/report/search endpoints:

- Select only required columns.
- Use joins/aggregates in the database when efficient.
- Return read DTOs directly from a query/repository where appropriate.
- Do not load a large entity graph merely to serialize five fields.

### 38.15 Relational migration rules

Production schema changes MUST consider live data and concurrent old/new application versions.

Prefer expand/contract for risky changes:

1. Add backward-compatible schema.
2. Deploy code that can handle old/new representation.
3. Backfill in bounded batches if needed.
4. Switch reads/writes.
5. Verify.
6. Remove old schema in a later deployment.

Do not combine a large blocking migration with unrelated feature deployment without review.

### 38.16 Relational ORM boundary rule

ORM convenience MUST NOT hide database behavior from the agent.

Before changing a critical query, inspect:

- Generated SQL when available.
- Number of queries.
- Selected columns.
- Join strategy.
- Transaction boundary.
- Index support.
- Lock behavior for concurrent mutations.

### 38.17 Relational database agent checklist

- [ ] What database/version is installed?
- [ ] What constraint owns uniqueness/integrity?
- [ ] What query shapes will be added?
- [ ] Which indexes support them?
- [ ] Does the write need a transaction?
- [ ] What race can occur under concurrency?
- [ ] What isolation/locking behavior is required?
- [ ] Is pagination bounded and deterministic?
- [ ] Is the migration safe for existing data?
- [ ] Does the ORM generate efficient SQL?


---

## 39. PostgreSQL Rules

- Use native constraints and transaction semantics.
- Use `jsonb` only for data that is genuinely semi-structured; do not hide a relational model inside JSON.
- Use partial indexes for selective predicates where useful.
- Use expression indexes only when query patterns justify them.
- Use `timestamptz` for absolute timestamps.
- Use row-level locking carefully and in consistent order.
- Consider `SKIP LOCKED` for queue-like worker claiming where appropriate.
- Use database-generated UUIDs/identifiers according to project policy.
- Review vacuum, analyze, and table growth behavior for high-write systems.
- Use row-level security only with a fully understood session/tenant model and tests; application authorization is still required.

---

## 40. MySQL Rules

- Use InnoDB for transactional workloads.
- Use `utf8mb4` and an appropriate collation.
- Understand composite-index leftmost-prefix behavior.
- Match index column order to equality filters, ranges, and sorting.
- Use strict SQL modes.
- Avoid silent truncation and implicit conversion.
- Review transaction isolation and locking behavior for concurrent writes.
- Use generated columns/indexes only when they improve a measured query pattern.
- Treat zero dates and timezone conversion explicitly.

---

## 41. Non-Relational Database Rules

- Model around access patterns and aggregate boundaries.
- Define ownership of duplicated data.
- Define update and repair strategy for denormalized values.
- Enforce validation in the database and application where supported.
- Do not allow unbounded document, array, key, or cache growth.
- Define consistency expectations for every cross-document operation.

### 41.1 NoSQL does not mean no schema

A flexible-schema database still requires an intentional data model.

For every collection/document/key design, define:

- Expected document shape.
- Required fields.
- Ownership/aggregate boundary.
- Read patterns.
- Write patterns.
- Growth bounds.
- Indexes.
- Consistency expectations.
- Retention/deletion behavior.

Agents MUST NOT use `Mixed`, arbitrary JSON blobs, or schemaless writes merely to avoid modeling decisions.

### 41.2 Access-pattern-first modeling

For document databases, design around the operations the application performs most often.

Before choosing embed/reference/duplication, list:

```text
reads:
- fetch product + variants
- list orders for customer
- show last 20 events

writes:
- change product price
- append order event
- update inventory reservation
```

A model that looks aesthetically normalized but causes multiple network round trips for every core read may be inferior to a bounded aggregate document.

### 41.3 Denormalized-data ownership

When data is duplicated, the module MUST document:

- Canonical source.
- Which fields are copied.
- When copies update.
- Whether stale values are acceptable.
- How failed propagation is retried.
- How inconsistencies are repaired.

Do not duplicate mutable data casually.

### 41.4 Unbounded growth rule

Never design unbounded:

- Embedded arrays.
- Redis lists/sets/streams.
- MongoDB event histories inside one forever-growing document.
- Arbitrary metadata maps controlled by users.

Use separate collections, buckets, pagination, TTL, archival, or capped designs as appropriate.

### 41.5 NoSQL query-safety rule

- Allowlist queryable fields.
- Allowlist sort fields/directions.
- Bound regex/search behavior.
- Prevent user-controlled operators.
- Bound aggregation stages and result sizes.
- Define timeouts/max execution where the driver/platform supports them for expensive public queries.

### 41.6 NoSQL consistency rule

For each multi-document workflow, explicitly choose:

- Eventual consistency.
- Compensating updates.
- Transactional consistency.
- Single-document aggregate redesign.

Do not discover the consistency model accidentally after production bugs.


---

## 42. MongoDB Rules

### 42.1 Document design

Embed when:

- Data is owned by one aggregate.
- It is read together.
- Child count is bounded.
- Atomic document updates are valuable.

Reference when:

- Data is shared across aggregates.
- Relationship size is unbounded.
- Entities change independently.
- Many-to-many access is common.

### 42.2 Indexes

- Build indexes from common query shapes.
- Compound index order MUST match filter and sort behavior.
- Use unique indexes for true uniqueness.
- Remove unused indexes after evidence and safe review.
- Avoid excessive indexes on write-heavy collections.

### 42.3 Query safety

- Never pass raw request objects into filters or updates.
- Allowlist fields and operators.
- Use projections to limit returned data.
- Avoid unbounded regex queries.
- Paginate large collections with stable keys.

### 42.4 Transactions

MongoDB transactions are available but have cost. They SHOULD NOT compensate for a poor document model. Prefer single-document atomicity when the aggregate can be modeled safely that way.

### 42.5 Mongoose or ODMs

- Keep schemas and model registration centralized.
- Avoid middleware hooks that hide critical cross-system side effects.
- Use lean queries for read-only data when appropriate and understood.
- Do not expose ODM documents directly to API clients.

### 42.6 2026 MongoDB schema-design process

MongoDB's official guidance starts schema design from workload and relationships rather than from copying an SQL model.

For a new collection, the agent MUST walk through:

1. Identify frequent operations and latency-sensitive paths.
2. Map relationships and ownership.
3. Decide embed versus reference.
4. Define document validation/application schema.
5. Create indexes for frequent query shapes.
6. Verify write amplification and document growth.
7. Decide whether any cross-document invariant needs a transaction.
8. Test with representative document counts and distributions.

### 42.7 Embed versus reference decision matrix

Prefer **embed** when:

- Child data belongs exclusively to the parent aggregate.
- Parent and child are read together most of the time.
- Child count has a known practical bound.
- Single-document atomicity is valuable.
- The embedded data does not need an independent lifecycle/query identity.

Prefer **reference** when:

- The entity is shared by many aggregates.
- The child collection can grow without a safe bound.
- Independent updates are frequent.
- Independent querying/indexing is important.
- Many-to-many relationships dominate.
- Duplicating the entity would create difficult synchronization.

A hybrid model MAY duplicate selected immutable/read-optimized fields while retaining a canonical reference, but the synchronization contract MUST be documented.

### 42.8 MongoDB atomicity and transaction rules

A single-document MongoDB write is atomic at the document level. Use that property when an aggregate can be modeled safely inside one document.

Use multi-document transactions when a business invariant genuinely spans documents/collections and eventual consistency is not acceptable.

Rules:

- Transactions require a replica set or supported sharded deployment.
- Transactions add cost and SHOULD NOT replace good document modeling.
- Keep transaction work small and bounded.
- Do not perform remote HTTP calls inside a database transaction.
- Do not parallelize operations inside the same Mongoose transaction/session with `Promise.all`, `Promise.race`, or similar patterns; Mongoose documents this as unsupported/undefined behavior.
- Design idempotent retry behavior where transaction retry can occur.

### 42.9 MongoDB index design

Indexes MUST come from query shapes.

For every new index, document at least one query such as:

```js
{ tenantId, status, createdAt: { $lt: cursorDate } }
.sort({ createdAt: -1, _id: -1 })
```

Then design the compound index around actual equality/sort/range needs.

Rules:

- Use MongoDB's ESR (Equality, Sort, Range) guidance as a starting framework for compound indexes.
- Equality fields generally come before fields used for sort/range according to the real query shape.
- Compound indexes support prefixes; do not create redundant single-field indexes automatically when a compound prefix already serves the query.
- Indexes improve reads but add storage and write cost.
- Review `$indexStats`, query plans, profiler/query statistics, or Atlas tooling where available.
- Remove unused indexes only after measured evidence and safe operational review.

### 42.10 MongoDB uniqueness and integrity

Use unique indexes for true business uniqueness.

Examples:

- User email within a tenant.
- External provider event ID.
- Idempotency key scoped to actor/operation.

Do not implement uniqueness solely with:

```text
findOne() → if absent → insert()
```

because concurrent requests can race.

Map duplicate-key errors to a stable application `ConflictError` or equivalent.

Database schema validation MAY complement Mongoose/application validation for high-integrity collections.

### 42.11 MongoDB pagination

For large collections, prefer stable cursor pagination over deep `skip()`/offset pagination.

Typical cursor:

```text
(createdAt, _id)
```

Rules:

- Sort order MUST be deterministic.
- Cursor fields SHOULD have a matching compound index.
- Validate and decode cursors at the boundary.
- Never expose unbounded limits.
- Offset pagination remains acceptable for small bounded admin datasets.

### 42.12 MongoDB aggregation rules

Use aggregation pipelines when the database can efficiently perform filtering/grouping/join-like work that would otherwise require transferring excessive data into Node.js.

Rules:

- Put selective `$match` stages as early as semantics allow.
- Project only needed fields.
- Ensure filter/sort stages can use appropriate indexes.
- Bound `$lookup`, `$unwind`, grouping, and result sizes for public endpoints.
- Do not build arbitrary aggregation stages directly from user JSON.
- For complex pipelines, keep pipeline construction in a repository/query module with tests.

### 42.13 Mongoose is an ODM, not a relational ORM

Mongoose maps JavaScript/TypeScript application models to MongoDB documents and provides schemas, casting, validation, middleware, query helpers, and model APIs.

Agents MUST NOT apply relational ORM assumptions blindly to Mongoose:

- There are no database foreign keys like PostgreSQL.
- `populate()` is application/ODM population, not a relational foreign-key guarantee.
- MongoDB document design remains primary.
- Mongoose schema validation is not a replacement for HTTP runtime validation or database-level uniqueness.

> **Review snapshot:** Mongoose 9 is the current major line at review time. Always inspect the installed version and compatibility table before using version-specific APIs.

### 42.14 Preferred Mongoose persistence structure

For Structure B projects:

```text
modules/users/
├── persistence/
│   ├── user.repository.ts
│   └── mongoose/
│       ├── user.schema.ts
│       └── user.model.ts
├── validation/
│   ├── create-user.schema.ts   # Zod/API validation
│   └── update-user.schema.ts
└── ...
```

Rules:

- `*.schema.ts` under `persistence/mongoose` means Mongoose persistence schema.
- `validation/*.schema.ts` means transport/application runtime schema.
- Keep names/location explicit so agents do not confuse the two.
- A small project MAY combine the Mongoose schema and model in `user.model.ts` when separation adds no value.

### 42.15 Mongoose schema rules

A Mongoose schema SHOULD define storage-level behavior intentionally:

- Required fields.
- Field types.
- Defaults.
- Enumerated storage values where stable.
- Timestamps when needed.
- Index declarations.
- Strict behavior.
- Serialization transforms only when persistence-level transformation is truly appropriate.

Avoid:

- Huge `Mixed` fields for core business data.
- Hidden remote side effects inside getters/setters.
- Hundreds of lines of business workflow inside schema methods/hooks.
- Secrets selected by default if most queries do not need them.

### 42.16 Mongoose validation boundary

Mongoose validation runs as part of document validation/save behavior, but **update validators are not automatically enabled for update operations**.

Rules:

- HTTP input MUST still be validated before reaching persistence.
- Business invariants MUST still be enforced in application/domain code and/or database constraints where applicable.
- When using `updateOne`, `updateMany`, or `findOneAndUpdate`, explicitly decide whether `runValidators: true` is required.
- Understand that update validators have different semantics/caveats from full document validation and only apply to supported updated paths/operators.
- Do not assume Mongoose validation protects against every malformed query/update operator.

For complex updates where document middleware/full validation semantics matter, loading the document and using `save()` MAY be clearer.

For atomic concurrent updates, a query-level atomic update MAY be more correct; validate and test accordingly.

### 42.17 Mongoose query-filter safety

Mongoose documentation specifically warns against passing user-defined objects directly as query filters.

Forbidden:

```ts
await User.find(req.query);
await User.updateMany(req.body.filter, req.body.update);
```

Prefer explicit filters:

```ts
const filter = {
  tenantId: ctx.tenantId,
  email: input.email,
};

await User.find(filter).setOptions({ sanitizeFilter: true });
```

Rules:

- Allowlist filter fields and operators.
- Validate ObjectIds/IDs before query construction according to API semantics.
- Use `sanitizeFilter` where appropriate as defense-in-depth, not as a replacement for allowlisting.
- Consider `requireFilter: true` or equivalent guards for dangerous destructive/update operations so an accidentally empty filter cannot affect the entire collection.
- Never let a client override authoritative tenant/owner filters.

### 42.18 Mongoose `lean()` rules

`lean()` skips Mongoose document hydration and returns plain objects. It can reduce memory/CPU for read-only paths.

Good candidates:

- API list endpoints.
- Read-only detail endpoints.
- Reporting queries.
- Cache-fill reads.

Use only when the code does **not** require Mongoose document behavior such as:

- Change tracking.
- `save()`.
- Document middleware.
- Getters/setters that are relied upon.
- Defaults applied through hydration.
- Virtuals unless explicitly supported/applied.

Rules:

- Do not mechanically append `.lean()` to every query.
- Do not accidentally change response semantics if existing getters/virtuals are required.
- Prefer explicit projections with `lean()` for hot read paths.

### 42.19 Mongoose update semantics

For each update, choose deliberately among:

- Load document → modify → `save()`.
- `updateOne()`.
- `findOneAndUpdate()`.
- Atomic operators such as `$inc`, `$set`, `$addToSet`.
- Transaction across multiple operations.

Prefer document `save()` when:

- Full document validation is useful.
- Save middleware is required.
- Domain code naturally modifies a loaded document.

Prefer atomic query update when:

- Concurrency makes read-modify-save unsafe or wasteful.
- The operation is naturally represented by MongoDB operators.
- You need conditional update semantics.

Rules:

- Make the returned-document semantics explicit for `findOneAndUpdate()` (`returnDocument`/project-version equivalent) rather than relying on memory/default assumptions.
- Add `runValidators: true` when update validation is required.
- Include authorization/tenant constraints inside the update filter where possible.
- Use `$inc` for atomic counters rather than read + increment + save when appropriate.

### 42.20 Mongoose middleware / hooks

Mongoose supports document, query, model, and aggregate middleware with different `this` semantics.

Rules:

- Know whether the hook is document or query middleware.
- Register middleware before compiling the model where required.
- Do not assume `save()` hooks run for `findOneAndUpdate()`/`updateOne()`.
- Do not hide critical cross-system side effects such as payment capture or email sending in persistence hooks.
- Good hook candidates include tightly persistence-related behavior such as normalization, derived persistence fields, or auditing when ordering/transaction semantics are understood.
- Complex business workflows belong in application services/use cases.

### 42.21 Mongoose `populate()` rules

Use `populate()` deliberately.

Rules:

- Select only fields needed from populated documents.
- Avoid deep/nested population chains on hot list endpoints.
- Inspect query count and latency.
- Do not use populate to compensate for a poor MongoDB data model.
- For complex reporting, an aggregation `$lookup`, denormalized read model, or separate query strategy may be more efficient.
- Be cautious with per-document limits because they can require separate queries for parent documents.

### 42.22 Mongoose index management

Mongoose can create schema-declared indexes automatically, but automatic index creation can impose significant production load.

Rules:

- For production systems, index creation SHOULD be a controlled deployment/operations step.
- Consider `autoIndex: false` in production according to the project's deployment workflow.
- Keep index definitions near the Mongoose schema as source-of-truth metadata when useful, but verify deployed database indexes separately.
- Review index changes like schema migrations.
- Avoid running broad `syncIndexes()` automatically on every production startup without operational review because it may drop/create indexes.

### 42.23 Mongoose connection rules

- Create a reusable connection/pool; do not connect per request.
- Size `maxPoolSize` from application concurrency and database/provider connection limits rather than copying a random number.
- Understand `serverSelectionTimeoutMS` and failure behavior.
- Fail startup when required database connectivity cannot be established according to deployment policy.
- Log connection-state changes without leaking credentials.
- Gracefully close connections during shutdown.
- For serverless runtimes, reuse cached connections according to platform lifecycle and library guidance.

### 42.24 Mongoose transaction rules

Prefer `Connection#transaction()` or driver `withTransaction()` patterns supported by the installed version.

Rules:

- Use a replica set/sharded deployment that supports transactions.
- Pass/use the session consistently for all operations in the transaction unless the installed Mongoose version provides and the project deliberately uses automatic session propagation.
- Do not use parallel Promise combinators for operations inside one transaction/session.
- Keep transaction callbacks focused and free of slow external API calls.
- Understand retry implications; external side effects must not be duplicated by transaction retries.

### 42.25 Mongoose DTO and mapper rule

Do not expose Mongoose documents directly across trust boundaries.

Prefer:

```ts
const user = await UserModel.findById(id)
  .select('_id name email createdAt')
  .lean();

return toUserDto(user);
```

A mapper SHOULD handle intentional representation differences such as:

- `_id` → `id`.
- Internal enum/storage names → public contract.
- Date serialization.
- Field omission.

Do not put authorization-sensitive field removal solely in a global `toJSON` transform when different endpoints expose different fields.

### 42.26 Mongoose repository pattern

A repository is recommended when:

- Queries contain tenant/authorization scoping.
- Persistence representation differs from application representation.
- Query/index behavior is non-trivial.
- Transactions need a consistent session-aware API.
- Multiple use cases reuse meaningful persistence operations.

Example shape:

```ts
export interface UserRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  existsByEmail(email: string): Promise<boolean>;
  create(input: CreateUserPersistenceInput): Promise<UserRecord>;
}
```

Do not create an interface only because this example has one. A concrete repository module is sufficient when no alternate adapter/testing boundary requires an interface.

### 42.27 MongoDB soft-delete rule

Do not add `isDeleted`/`deletedAt` by default.

If soft deletion is a real requirement, define:

- Which queries exclude deleted documents.
- Unique-index behavior for deleted values.
- Restore behavior.
- Retention/permanent-delete behavior.
- References from other collections.
- Audit/legal requirements.

A hidden global Mongoose query hook for soft delete MAY reduce mistakes, but it can also make behavior surprising; use only with clear escape hatches and tests.

### 42.28 MongoDB multi-tenancy

Tenant isolation MAY use:

- Shared collections with mandatory `tenantId`.
- Database-per-tenant.
- Cluster-per-tenant for stronger isolation.

For shared collections:

- Include verified `tenantId` in every tenant-owned read/write filter.
- Include `tenantId` in uniqueness indexes when uniqueness is tenant-scoped.
- Consider `tenantId` in compound index prefixes based on query shapes.
- Never trust a client-submitted tenant ID over authenticated context.

For database-per-tenant:

- Bound/manage connection pools carefully.
- Do not create an unbounded new Mongoose connection for every request.
- Document tenant provisioning and connection lifecycle.

### 42.29 MongoDB/Mongoose schema evolution

MongoDB flexibility does not remove migration work.

For schema evolution:

- New application versions SHOULD tolerate old document shapes during staged migrations when necessary.
- Backfill in bounded batches.
- Make backfills idempotent/restartable.
- Add new indexes with an operational plan.
- Do not rewrite an entire collection synchronously from an HTTP request.
- Track schema/data migration scripts in source control.

### 42.30 MongoDB/Mongoose testing rules

Test against a real MongoDB-compatible test deployment for persistence behavior that depends on:

- Index uniqueness.
- Transactions.
- Aggregation.
- Query operators.
- Mongoose middleware.
- Update validators.
- Session behavior.

Mock repositories for pure application unit tests, but do not claim MongoDB behavior is verified using only mocked model methods.

### 42.31 MongoDB/Mongoose anti-hallucination checklist

Before implementing persistence code, the agent MUST answer:

- [ ] Exact MongoDB server/provider version?
- [ ] Exact Mongoose version?
- [ ] Replica set/sharded/standalone deployment?
- [ ] Current collection schema and real document shape?
- [ ] Core query/read/write patterns?
- [ ] Embed or reference, and why?
- [ ] Can an array/document grow without bound?
- [ ] Which index supports this query?
- [ ] Is uniqueness enforced by an index?
- [ ] Is the operation single-document atomic or multi-document?
- [ ] Does a transaction actually need to exist?
- [ ] Are update validators required?
- [ ] Does this query need hydrated documents or can it use `lean()`?
- [ ] Does `populate()` create avoidable query cost?
- [ ] Are raw request objects prevented from becoming Mongo filters/updates?
- [ ] Is tenant scope authoritative and inside the query?
- [ ] Are API response fields mapped/allowlisted?
- [ ] Is index creation controlled for production?


---

## 43. Redis and Cache Rules

Redis MAY be used for:

- Cache entries.
- Sessions.
- Rate limits.
- Distributed counters.
- Short-lived coordination.
- Queue infrastructure.

Rules:

- Redis is not automatically a durable primary database.
- Every key MUST have a naming convention and tenant scope where relevant.
- Ephemeral keys SHOULD have TTLs.
- Avoid unbounded sets, lists, and streams.
- Use atomic commands or Lua/server-side functions for multi-step invariants when appropriate.
- Distributed locks MUST have expiration, ownership tokens, and safe release semantics.
- Cache failures SHOULD degrade according to an explicit strategy.

---

## 44. ORM and Query Builder Rules

### 44.1 General rules

- The database schema and constraints remain authoritative.
- Understand generated SQL.
- Avoid loading entire relation graphs.
- Select required fields.
- Detect N+1 behavior.
- Use transactions for atomic operations.
- Keep migration history committed.
- Do not expose ORM records directly across trust boundaries.
- Use raw SQL when the ORM cannot express a correct or efficient query, but parameterize and test it.

### 44.2 ORM choice

Choose Prisma when the team values:

- Generated client workflow.
- Strong schema-driven developer experience.
- Broad query abstraction.
- Prisma migration and tooling conventions.

Choose Drizzle when the team values:

- SQL-like control.
- Lightweight typed query building.
- Schema definitions close to SQL semantics.
- Flexible migration workflows.

Use Eloquent in Laravel unless a strong project requirement justifies another approach.

Do not use two primary ORMs for the same database without a migration boundary and explicit ownership.

### 44.3 ORM versus ODM terminology

Use precise terminology:

- **ORM**: maps application models to relational tables/rows. Examples: Prisma with SQL, Drizzle, Eloquent.
- **ODM**: maps application models to document data. Mongoose is an ODM for MongoDB.

Prisma can also support MongoDB in version-dependent ways, but the underlying database remains a document database and Mongo-specific limitations/semantics still apply.

The agent MUST NOT infer capabilities from the word “ORM”. Always verify the selected database connector.

### 44.4 Persistence-tool selection rule

Choose the persistence library from the database and project needs:

| Database / need | Preferred consideration |
|---|---|
| MongoDB, rich document hooks/schema/query ecosystem | Mongoose |
| MongoDB, type-safe Prisma workflow | Prisma only when the installed/current Mongo connector supports required features |
| PostgreSQL/MySQL with schema-generated client and Prisma workflow | Prisma |
| PostgreSQL/MySQL/SQLite with SQL-like typed control | Drizzle |
| Laravel relational application | Eloquent |
| Advanced database-specific query beyond ORM capability | Native driver / parameterized SQL/query API behind repository |

Do not add both Mongoose and Prisma for the same MongoDB collections without a deliberate migration/ownership boundary.

### 44.5 Repository versus direct ORM usage

Direct ORM/ODM use inside a small application service is acceptable when:

- The query is trivial.
- It does not leak persistence types across boundaries.
- Reuse is minimal.
- Testing remains clear.

Create a repository/query module when:

- Query logic is repeated.
- Tenant/resource scoping must be centralized.
- Persistence mappings are non-trivial.
- Transactions need a clean boundary.
- Queries require indexes/performance expertise.
- You need to isolate infrastructure from domain/application logic.

Do not create repositories automatically for every table/document.

### 44.6 Raw query escape hatch

Use native MongoDB operations/raw SQL when the higher-level library cannot express the operation correctly or efficiently.

Rules:

- Keep raw persistence code behind a repository/infrastructure boundary.
- Parameterize SQL values.
- Validate/allowlist identifiers that cannot be parameterized.
- Never construct MongoDB operators from untrusted input.
- Add integration tests.
- Document why the higher-level API was insufficient.

### 44.7 Persistence migration ownership

Every persistence tool needs a schema/data change strategy:

- Relational ORM: reviewed migrations.
- Mongoose/MongoDB: migration/backfill scripts + index deployment process.
- Prisma MongoDB: use the workflow supported by the installed Prisma version; do not assume relational Prisma Migrate semantics automatically apply.

The deployment process MUST know which step applies schema/index/data changes.

### 44.8 ORM/ODM agent checklist

- [ ] Is this library an ORM, ODM, driver, or query builder?
- [ ] Which database connector is active?
- [ ] What exact library version is installed?
- [ ] Which migration/index workflow does this connector support?
- [ ] Are database constraints actually enforced by the database or emulated by the client?
- [ ] What SQL/Mongo queries will this code generate?
- [ ] Is there N+1/populate overuse?
- [ ] Are returned fields explicitly selected?
- [ ] Does the operation need a transaction/session?
- [ ] Does the repository add a meaningful boundary?


---

## 45. Prisma Rules

- Treat `schema.prisma` and migration history as reviewed source code.
- Commit the migrations directory.
- Review generated SQL before production deployment.
- Never use development migration commands directly against production.
- Use `select` to return only needed fields.
- Use relation loading deliberately to avoid N+1 or oversized payloads.
- Use nested writes, batch transactions, or interactive transactions according to atomicity needs.
- Keep interactive transactions short; avoid network calls inside them.
- Map Prisma errors to application errors at the infrastructure boundary.
- Do not leak Prisma model types into frontend contracts by default.
- Configure one reusable client per process/runtime pattern; avoid connection storms.

### 45.1 Prisma + MongoDB version rule

Prisma's MongoDB connector behavior changes materially across major releases. Therefore agents MUST verify the installed Prisma major and its MongoDB documentation before implementation.

Rules:

- Do not assume MongoDB supports the same migration, relation, transaction, or scalar-type semantics as PostgreSQL/MySQL in Prisma.
- MongoDB relations do not become database foreign keys merely because they are represented in Prisma schema.
- Verify replica-set requirements for any transaction/nested-write behavior used by the installed Prisma version.
- Verify whether the installed Prisma version supports MongoDB transactions through Prisma itself; do not invent `$transaction`/`db.transaction()` support based on SQL examples.
- Review MongoDB `null` versus missing-field semantics.
- Verify migration/schema-push workflow from the installed-version docs.
- Do not migrate a working Mongoose project to Prisma merely for stylistic preference.


---

## 46. Drizzle Rules

- Keep schema files organized by domain or bounded context.
- Use database foreign keys for integrity where appropriate.
- Understand that Drizzle relation metadata and database foreign-key constraints solve different problems.
- Commit generated or custom migrations according to the selected workflow.
- Review migration SQL.
- Use typed transactions for atomic workflows.
- Select explicit columns for sensitive or large tables.
- Keep query helpers close to the feature or repository that owns them.
- Avoid adopting beta/RC query APIs automatically; stable project compatibility wins.
- Do not turn the Drizzle schema directory into a single enormous file.

Suggested structure:

```text
src/db/
├── client.ts
├── schema/
│   ├── users.ts
│   ├── products.ts
│   ├── orders.ts
│   └── relations.ts
└── migrations/
```

### 46.1 Drizzle database-support rule

At the 2026-08-26 review snapshot, Drizzle's official get-started documentation lists SQL-family connectors such as PostgreSQL, MySQL, SQLite, MSSQL, CockroachDB, and related providers; MongoDB is not listed as a supported Drizzle database.

Therefore:

- Do not choose Drizzle for a MongoDB/Mongoose project based on hallucinated MongoDB support.
- Re-check official Drizzle documentation in the future because supported databases may change.
- For MongoDB, use a supported MongoDB driver/ODM/connector such as Mongoose or a version-compatible Prisma MongoDB connector when requirements fit.


---

## 47. Eloquent Rules

- Use `$fillable` or a safe explicit assignment strategy.
- Use casts for dates, enums, encrypted values, and structured fields as appropriate.
- Eager-load known relationships.
- Use `withCount`, aggregates, or subqueries instead of loading collections only to count them.
- Use query scopes for stable reusable query semantics, not arbitrary presentation filters.
- Keep observers small; avoid hidden critical side effects.
- Use model events only when their ordering and transaction behavior are understood.
- Prefer API Resources or DTOs over returning models directly.
- Use chunking/cursors for large processing, understanding ordering and mutation behavior.
- Use database transactions for multi-model invariants.

---

## 48. Transactions and Concurrency

### 48.1 Transaction rules

Use a transaction when multiple writes must succeed or fail together.

- Keep transactions short.
- Do not wait for user input or slow external services inside a transaction.
- Read and write in a consistent order to reduce deadlocks.
- Retry deadlock/serialization failures only with a bounded policy.
- Emit external side effects after commit, or use an outbox pattern.

### 48.2 Concurrency controls

Choose the simplest correct method:

- Unique constraint for duplicate prevention.
- Atomic conditional update for state transitions.
- Optimistic concurrency/version column for concurrent edits.
- Row lock for short critical sections.
- Idempotency key for repeated commands.
- Distributed lock only when the resource spans systems and alternatives are insufficient.

### 48.3 Inventory/payment example

A stock decrement SHOULD be atomic:

```sql
UPDATE products
SET stock = stock - :quantity
WHERE id = :id
  AND stock >= :quantity;
```

The application MUST verify that a row was updated. A prior “check stock” query alone is race-prone.

### 48.4 Outbox pattern

Use an outbox when a database write and message/event publication must be reliable together:

1. Write domain state and outbox row in one transaction.
2. A worker publishes the outbox event.
3. Mark it delivered with retry-safe behavior.
4. Consumers remain idempotent.

---

## 49. Migrations and Seed Data

- Every schema change MUST have a migration.
- Migrations MUST be reviewed like application code.
- Production migrations SHOULD be backward compatible for rolling deployments.
- Large table changes MUST consider locks, rewrite cost, and deployment timing.
- Data backfills SHOULD be resumable and observable.
- Destructive changes SHOULD use expand-and-contract deployment.
- Seed data MUST be deterministic.
- Development seeds MUST NOT contain real personal or secret data.
- Tests SHOULD use factories/builders for scenario-specific data.

### 49.1 Expand-and-contract example

1. Add the new nullable column/table.
2. Deploy code that writes old and new formats when necessary.
3. Backfill.
4. Switch reads.
5. Enforce constraints.
6. Remove old schema in a later deployment.

---

## 50. Background Jobs and Queues

Use a queue when work is:

- Slow.
- Retryable.
- Burst-prone.
- Independently scalable.
- Not required to complete the HTTP response.

Every job MUST define:

- Payload schema and version.
- Idempotency behavior.
- Timeout.
- Retry policy.
- Backoff and jitter.
- Failure/dead-letter behavior.
- Observability fields.
- Tenant/user context when necessary.

Do not place huge binary payloads in queue messages. Store the object and pass an identifier.

Workers MUST handle graceful shutdown and avoid claiming more work than they can finish safely.

---

## 51. Caching Strategy

### 51.1 Cache decision

Before adding a cache, define:

- The expensive source operation.
- Cache key.
- Scope: global, tenant, user, locale, permissions.
- TTL.
- Invalidation trigger.
- Stale tolerance.
- Failure fallback.
- Stampede protection.

### 51.2 Patterns

- Cache-aside: common default for reads.
- Write-through: useful when cache consistency must follow writes.
- Stale-while-revalidate: useful when slightly stale reads are acceptable.
- Request memoization: prevents duplicate work inside one request.

### 51.3 Restrictions

- Never cache sensitive user-specific data under a shared key.
- Do not cache authorization decisions longer than permission-change requirements allow.
- Do not treat cache as the source of truth unless designed as one.
- Avoid caching cheap operations without evidence.
- Prevent cache stampedes with locks, single-flight, or probabilistic early refresh where needed.

---

## 52. Logging, Monitoring, and Observability

### 52.1 Structured logs

Logs SHOULD be structured and include:

- Timestamp.
- Severity.
- Service and environment.
- Request/trace/correlation ID.
- Route or operation.
- Actor and tenant identifiers where safe.
- Error code and stack for internal logs.
- Duration and outcome.

Never log passwords, raw tokens, payment secrets, or unnecessary personal data.

### 52.2 Metrics

Track at least:

- Request rate.
- Error rate.
- Latency percentiles.
- Database query latency and pool saturation.
- Queue depth, age, retries, and failures.
- Cache hit ratio where relevant.
- External dependency latency/errors.
- Business-critical counters.

### 52.3 Tracing

Distributed tracing SHOULD be used when requests cross multiple services or external dependencies and debugging cannot be performed reliably from logs alone.

### 52.4 Health checks

- Liveness: process is running.
- Readiness: process can serve traffic.
- Dependency checks SHOULD be bounded and not overload dependencies.
- Health endpoints MUST not expose sensitive configuration.

---

## 53. Error Handling

### 53.1 Error categories

Use intentional categories such as:

- Validation error.
- Authentication error.
- Authorization error.
- Not found.
- Conflict.
- Rate limit.
- External dependency error.
- Unexpected internal error.

### 53.2 Error contract

A safe API error may include:

```json
{
  "error": {
    "code": "ORDER_STATE_CONFLICT",
    "message": "The order cannot be cancelled in its current state.",
    "details": null,
    "requestId": "req_..."
  }
}
```

- Machine codes SHOULD be stable.
- Messages SHOULD be safe and useful.
- Field errors SHOULD identify valid field paths.
- Internal causes belong in logs, not client responses.

### 53.3 External errors

Translate third-party errors at the integration boundary. Preserve original context internally while exposing stable application-level behavior.

---

## 54. Configuration and Secrets

- Validate configuration once at startup.
- Use a typed configuration module.
- Keep secrets out of source control, frontend bundles, logs, and error messages.
- Separate configuration by environment without copying business logic.
- Rotate secrets and support dual-key periods where required.
- Do not make production behavior depend on an undocumented environment variable.
- Public Next.js variables MUST be treated as publicly visible.
- Test defaults MUST be safe and explicit.

---

## 55. Testing Strategy

### 55.1 Test pyramid with risk focus

Use a balanced portfolio:

- Many fast tests for pure rules.
- Integration tests for database and application boundaries.
- API/component tests for contracts.
- Fewer high-value end-to-end tests for critical journeys.

The exact ratio depends on risk. Do not maximize unit-test count while leaving real integrations untested.

### 55.2 What must be tested

- Business invariants.
- Authorization and tenant isolation.
- Validation boundaries.
- Transactions and concurrency-sensitive operations.
- Error mapping.
- Serialization/DTO field exposure.
- Critical UI behavior.
- Migrations where practical.
- Queue retry/idempotency behavior.

### 55.3 Test quality

- One test SHOULD describe one behavior.
- Use Arrange–Act–Assert or another consistent structure.
- Avoid testing private implementation details.
- Keep fixtures minimal and readable.
- Tests MUST be deterministic.
- Do not use arbitrary sleeps.
- Reset or isolate state between tests.

### 55.4 Contract tests

Use contract tests when multiple clients or services depend on a stable API. Schema generation alone is not enough; behavior and authorization still require tests.

### 55.5 Test database

- Use a real compatible database for important integration tests.
- Do not assume an in-memory substitute matches production semantics.
- Apply migrations to test databases.
- Isolate parallel tests safely.

---

## 56. CI/CD and Quality Gates

A pull request SHOULD pass:

1. Dependency installation from the committed lockfile.
2. Formatting check.
3. Linting.
4. Type checking/static analysis.
5. Unit and integration tests.
6. Production build.
7. Migration validation.
8. Security/dependency checks according to project policy.
9. End-to-end tests for critical changes.

### 56.1 CI rules

- CI MUST use the same runtime family as production.
- Cache dependencies safely using lockfile keys.
- Do not hide failures with `continue-on-error` unless explicitly informational.
- Upload useful failure artifacts such as Playwright traces.
- Protect deployment environments.
- Separate build artifacts from deployment when reproducibility matters.

### 56.2 Deployment rules

- Deploy immutable artifacts.
- Run migrations in a controlled sequence.
- Support rollback or forward-fix strategy.
- Verify health after deployment.
- Use feature flags for high-risk incremental rollout when justified.
- Monitor key metrics during and after release.

---

## 57. Performance Engineering

### 57.1 Process

1. Define the user or system symptom.
2. Capture a baseline.
3. Identify the bottleneck.
4. Change one relevant factor.
5. Measure again.
6. Add regression protection where valuable.

### 57.2 Backend priorities

- Eliminate N+1 queries.
- Add correct indexes.
- Reduce payload size.
- Batch work.
- Bound concurrency.
- Move long tasks to queues.
- Use caching after query/application optimization.
- Stream large responses.

### 57.3 Frontend priorities

- Reduce client JavaScript.
- Remove waterfalls.
- Optimize critical images/fonts.
- Avoid unnecessary client rendering.
- Virtualize large lists.
- Defer non-critical third-party scripts.
- Measure Core Web Vitals and route-specific user experience.

### 57.4 Performance budgets

Projects SHOULD define budgets appropriate to their users and infrastructure, such as:

- Maximum API p95 latency for critical operations.
- Maximum bundle size per route.
- Maximum database query count for common endpoints.
- Maximum export memory footprint.
- Queue processing time and age targets.

---

## 58. Git and Change Management

- Make focused commits with meaningful messages.
- Do not mix formatting the entire repository with a small feature change.
- Preserve unrelated local changes.
- Never force-push or rewrite shared history without explicit authorization.
- Database migrations and code changes MUST be ordered for safe deployment.
- Breaking API changes require migration and communication.
- Generated files SHOULD be committed only when project policy requires them.
- Lockfile changes MUST correspond to intentional dependency changes.

---

## 59. Documentation Rules

Document:

- Architecture boundaries.
- Environment setup.
- Commands.
- Required services.
- API contracts.
- Migration/deployment steps.
- Non-obvious business invariants.
- Security assumptions.
- Operational runbooks.

Code comments and documentation MUST remain synchronized with behavior. Remove stale comments rather than preserving misleading history.

Every major architectural decision SHOULD have a concise ADR containing:

- Context.
- Decision.
- Alternatives.
- Consequences.
- Review trigger.

---

## 60. Definition of Done

A task is done only when applicable items are satisfied:

### Behavior

- Acceptance criteria pass.
- Boundary and failure cases are handled.
- Existing behavior is preserved where required.

### Architecture

- Code is in the correct feature/module.
- Responsibilities are separated without unnecessary layers.
- Public APIs are minimal.

### Frontend

- Loading, empty, error, and success states exist.
- Accessibility is verified.
- Responsive behavior is verified.
- Forms separate schema, orchestration, and complex fields where needed.

### Backend

- Input is validated.
- Authentication and resource-level authorization are enforced.
- Transactions and idempotency are correct.
- Errors use the standard contract.

### Data

- Constraints and indexes are appropriate.
- Migration is safe.
- Sensitive fields are not over-fetched or exposed.

### Quality

- Tests added/updated.
- Lint, type/static analysis, tests, and build pass.
- No unexplained warnings.
- Documentation updated.

### Operations

- Logs and metrics are sufficient.
- Environment changes are documented.
- Deployment/rollback considerations are stated.

---

## 61. Forbidden Agent Behavior

An AI agent MUST NOT:

- Change architecture without explaining and justifying it.
- Install dependencies before checking existing capabilities.
- Upgrade major versions during unrelated feature work.
- Replace the package manager or lockfile format.
- Add `any`, unsafe casts, ignored errors, or disabled lint rules to make checks pass.
- Remove tests because they fail after a change.
- weaken authorization or validation.
- Trust client-provided tenant/user identifiers without server verification.
- Return full database records when a narrow DTO is required.
- Put secrets in client code or source control.
- Execute destructive database or Git commands without explicit authorization.
- Create speculative abstractions, microservices, event buses, or repositories without a current need.
- Use unbounded loops, pagination, memory loading, request sizes, or concurrency.
- Claim verification when checks were not run.
- Rewrite unrelated code for style preference.
- Introduce preview/canary software into production by default.

---

## 62. Technology Evaluation Checklist

When adding or replacing a framework, database, ORM, library, or pattern, record:

### Problem

- What concrete problem exists?
- How often does it occur?
- What is the cost of leaving it unchanged?

### Fit

- Does the tool solve the actual requirement?
- Is it compatible with current runtime/framework versions?
- Does it work with SSR, RSC, serverless, workers, or edge runtime as required?

### Quality

- Maintenance activity.
- Documentation quality.
- Stable release policy.
- Security posture.
- License.
- Type support.
- Testing strategy.

### Cost

- Bundle/runtime cost.
- Operational complexity.
- Learning curve.
- Migration and exit cost.
- Hosting/vendor lock-in.

### Decision

- Chosen option.
- Rejected alternatives.
- Constraints.
- Review date or trigger.

No technology is approved merely because it is popular or appears in this file.

---

## 63. Maintenance and Update Policy

This is a living document.

Review it when:

- React, Next.js, Node.js, TypeScript, PHP, Laravel, Express, or Fastify ships a major release.
- Motion, GSAP, or another project-standard animation runtime ships a major/breaking release or changes its React/Next integration.
- A security release changes required behavior.
- An ORM or database introduces a major migration.
- The team repeatedly encounters the same code-review issue.
- A pattern proves too complex or insufficient.
- Deployment architecture changes.
- Express/Mongoose/MongoDB architecture rules receive a major behavioral update.

### 63.1 Update process

1. Read official release notes and migration guides.
2. Verify stable/LTS status.
3. Test the change in a representative project.
4. Update the baseline and affected rules.
5. Add a changelog entry.
6. Communicate breaking rule changes.

### 63.2 Changelog

| Date | Change |
|---|---|
| 2026-08-03 | Rebuilt as a full engineering constitution covering frontend, backend, algorithms, React, Next.js, Node.js, Express, Fastify, PHP, Laravel, SQL/NoSQL databases, Prisma, Drizzle, Eloquent, testing, security, and agent workflow. |
| 2026-08-26 | Added the Backend 2026 addendum: three approved Node/Express structures, feature-first Express + MongoDB/Mongoose architecture, Express 5 rules, relational/NoSQL modeling rules, deep MongoDB/Mongoose guidance, ORM/ODM boundaries, and backend anti-hallucination checklists. |
| 2026-08-17 | Added the frontend animation engineering addendum: CSS/native motion selection, Motion for React (Framer Motion successor), GSAP/@gsap/react, ScrollTrigger, Flip, Lenis, Anime.js, React Spring, AutoAnimate, Rive, lifecycle/folder patterns, performance, accessibility, testing, and anti-hallucination rules. |

---

## 64. Official Source Register

Agents SHOULD prefer version-matched official documentation and primary standards. Core sources for this document include:

### Frontend

- React documentation and React version/release pages.
- Next.js App Router, Server/Client Components, data security, authentication, caching, production, BFF, and AI-agent documentation.
- TypeScript Handbook and current release notes.
- TanStack Query documentation for query keys, defaults, and query options.
- React Hook Form documentation.
- Zod documentation.
- Redux Toolkit documentation.
- Zustand documentation.
- Testing Library principles.
- Playwright best practices.
- Vitest documentation.
- Motion for React official docs, installation, upgrade, layout, presence, reduced-motion, bundle-size, and performance guides.
- GSAP official core, installation, plugin, Context, matchMedia, ScrollTrigger, Flip, and React integration documentation.
- Lenis official repository and React integration documentation.
- Anime.js official React integration, Scope, and WAAPI documentation.
- React Spring official documentation and reduced-motion guidance.
- AutoAnimate official documentation.
- Rive official React/web runtime documentation.

### Backend

- Node.js release and security documentation.
- Express 5 documentation and migration guide.
- Express production security guidance: `https://expressjs.com/en/advanced/best-practice-security/`.
- Express production performance/reliability guidance: `https://expressjs.com/en/advanced/best-practice-performance/`.
- Express 5 error handling: `https://expressjs.com/en/5x/guide/error-handling/`.
- Express 5 migration guide: `https://expressjs.com/en/guide/migrating-5/`.
- Mongoose current guides/API/version support: `https://mongoosejs.com/docs/`.
- Mongoose validation: `https://mongoosejs.com/docs/validation.html`.
- Mongoose schemas/index behavior: `https://mongoosejs.com/docs/guide.html`.
- Mongoose connections/pooling: `https://mongoosejs.com/docs/connections.html`.
- Mongoose middleware: `https://mongoosejs.com/docs/middleware.html`.
- Mongoose transactions: `https://mongoosejs.com/docs/transactions.html`.
- Fastify validation, serialization, plugins, lifecycle, and testing documentation.
- PHP supported versions and PHP language documentation.
- PSR-4 and PSR-12 standards.
- Laravel 13 validation, authorization, Eloquent, queues, testing, and deployment documentation.

### Data and security

- PostgreSQL current documentation.
- PostgreSQL constraints: `https://www.postgresql.org/docs/current/ddl-constraints.html`.
- PostgreSQL indexes: `https://www.postgresql.org/docs/current/indexes.html`.
- PostgreSQL transaction isolation: `https://www.postgresql.org/docs/current/transaction-iso.html`.
- MySQL 8.4 documentation.
- MongoDB schema, indexing, and transaction documentation.
- MongoDB schema-design process: `https://www.mongodb.com/docs/manual/data-modeling/schema-design-process/`.
- MongoDB data-modeling best practices: `https://www.mongodb.com/docs/manual/data-modeling/best-practices/`.
- MongoDB indexing strategies: `https://www.mongodb.com/docs/manual/applications/indexes/`.
- MongoDB transactions: `https://www.mongodb.com/docs/manual/core/transactions/`.
- Redis documentation.
- Prisma migration and transaction documentation.
- Drizzle schema, migration, relation, and transaction documentation.
- OWASP API Security Top 10.

### Source rule

Blog posts, tutorials, and AI-generated summaries MAY provide examples, but they MUST NOT override official documentation, standards, security advisories, or measured project behavior.

---

## 65. Project-Specific Overrides

Complete this section for each repository.

### 65.1 Project identity

```text
Project name:
Business domain:
Primary users:
Critical workflows:
```

### 65.2 Selected stack

```text
Frontend:
Backend:
Database:
ORM/query builder:
Authentication:
Queue:
Cache:
Hosting:
Package manager:
Runtime versions:
```

### 65.3 Architecture decisions

```text
Repository strategy:
Module boundaries:
API style:
Tenant model:
Authorization model:
Error contract:
Observability platform:
```

### 65.4 Folder overrides

Document only deliberate differences from this file.

### 65.5 Commands

```bash
# Install

# Development

# Lint

# Type/static analysis

# Unit/integration tests

# End-to-end tests

# Build

# Database migration
```

### 65.6 Additional project rules

Add business-specific invariants, naming, compliance, deployment, and testing rules here.

---

# Final Agent Instruction

Before implementing any task:

1. Understand the requested behavior.
2. Inspect the existing project and version-matched documentation.
3. Choose the smallest correct pattern.
4. Keep UI, orchestration, validation, domain behavior, and persistence clearly separated.
5. Follow feature locality and the preferred form/query structures in this file.
6. Protect every trust boundary.
7. Select data structures and algorithms based on actual operations and scale.
8. Test the behavior and report what was verified.

> Clean architecture is not the number of folders. It is how clearly a change can be understood, implemented, tested, secured, and operated without unexpected effects elsewhere.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
