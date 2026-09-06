# Engineering Documentation & AI Agent Playbook

A public, evolving knowledge base for software engineering standards, development workflows, code-quality tooling, and AI-assisted development.

This repository collects the conventions and reusable guidance I use across projects so that developers and coding agents can start from the same engineering baseline instead of rediscovering decisions in every codebase.

> **Primary entry point:** [`AGENTS.md`](./AGENTS.md) is the current engineering constitution and the main source of repository-wide development guidance.

---

## What This Repository Covers

The documentation currently spans:

- Full-stack engineering principles and architecture decisions
- AI coding-agent behavior and implementation workflow
- JavaScript and TypeScript conventions
- React and Next.js application architecture
- Forms, state management, data fetching, and component design
- Node.js, Express, Fastify, PHP, and Laravel guidance
- PostgreSQL, MySQL, MongoDB, Redis, Prisma, Drizzle, and Eloquent
- Authentication, authorization, application security, and secrets
- Testing, performance, observability, CI/CD, and quality gates
- GitHub collaboration and pull-request workflow
- ESLint, Prettier, Husky, Commitlint, and lint-staged setup
- Frontend motion and animation guidance
- Graphify setup for repository knowledge graphs and AI-agent navigation

The goal is not to force one architecture onto every project. These documents provide strong defaults that should be adapted to the actual product, existing codebase, runtime, security requirements, and team constraints.

---

## Repository Structure

```text
documentations/
├── AGENTS.md
├── GRAPHIFY_AGENT_SETUP.md
├── README.md
│
├── clean-code/
│   ├── README.md
│   ├── ESLINT_PRETTIER.md
│   ├── GLOBAL.md
│   ├── NEXTRULES.md
│   ├── eslint.config.mjs
│   ├── .prettierrc
│   ├── .vscode/
│   ├── src/
│   │   ├── index.ts
│   │   └── test.js
│   ├── package.json
│   ├── package-lock.json
│   └── steps.txt
│
├── gitHub-workflow/
│   └── WORKFLOW.md
│
└── husky/
    ├── README.md
    └── Mind Map.png
```

---

## Documentation Map

### [`AGENTS.md`](./AGENTS.md)

The main engineering constitution for both humans and AI coding agents.

It defines opinionated defaults for:

- instruction priority and agent workflow
- the current production baseline
- clean code and naming
- JavaScript and TypeScript
- frontend architecture
- React and Next.js
- forms and validation
- TanStack Query and state management
- styling and design systems
- accessibility and performance
- backend architecture
- Node.js, Express, Fastify, PHP, and Laravel
- API design
- authentication and authorization
- security
- relational and non-relational databases
- Prisma, Drizzle, and Eloquent
- transactions, migrations, queues, and caching
- logging and observability
- error handling and configuration
- testing and CI/CD
- Git and change management
- documentation standards
- definition of done
- forbidden AI-agent behavior
- technology evaluation and maintenance rules

If you are using this repository to guide a new project or coding agent, **start here**.

---

### [`GRAPHIFY_AGENT_SETUP.md`](./GRAPHIFY_AGENT_SETUP.md)

Setup and usage guide for [Graphify](https://github.com/safishamsi/graphify), which creates a persistent project knowledge graph that coding agents can query before scanning large parts of a repository.

The guide covers:

- global Graphify installation
- per-project setup
- Codex configuration
- local/offline code-only extraction
- graph updates after code changes
- query, explain, path, and affected workflows
- optional semantic extraction with an LLM provider
- a real workspace example

This is especially useful for large codebases where repeated repository exploration wastes time and context.

---

### [`clean-code/`](./clean-code)

A supporting clean-code and tooling workspace containing both documentation and small reference configuration/source files.

Key files include:

- [`clean-code/README.md`](./clean-code/README.md) — ESLint, Prettier, and broader coding-guideline notes
- [`clean-code/ESLINT_PRETTIER.md`](./clean-code/ESLINT_PRETTIER.md) — focused ESLint/Prettier reference
- [`clean-code/GLOBAL.md`](./clean-code/GLOBAL.md) — general coding standards and naming guidance
- [`clean-code/NEXTRULES.md`](./clean-code/NEXTRULES.md) — React/Next-oriented component and code-organization rules
- [`clean-code/eslint.config.mjs`](./clean-code/eslint.config.mjs) — example ESLint configuration
- [`clean-code/.prettierrc`](./clean-code/.prettierrc) — example Prettier configuration
- [`clean-code/src/`](./clean-code/src) — small JavaScript/TypeScript examples used with the tooling setup

Some material in this folder predates the newer `AGENTS.md`. When guidance conflicts, treat `AGENTS.md` as the newer repository-level default unless a project-specific rule has higher priority.

---

### [`gitHub-workflow/WORKFLOW.md`](./gitHub-workflow/WORKFLOW.md)

A team collaboration guide covering the development lifecycle on GitHub:

- issue structure
- branch naming
- commit conventions
- pull requests
- code review
- merge requirements
- post-merge maintenance
- common change types and scopes

Use it when establishing a consistent contribution workflow for a team repository.

---

### [`husky/README.md`](./husky/README.md)

A practical setup guide for local Git quality gates using:

- Husky
- lint-staged
- ESLint
- Prettier
- Commitlint
- `pre-commit` hooks
- `commit-msg` hooks

The folder also contains a visual [`Mind Map.png`](./husky/Mind%20Map.png) for the workflow.

---

## Recommended Usage

### For a developer

1. Read [`AGENTS.md`](./AGENTS.md) for the current engineering baseline.
2. Use the focused guides only when you need their specific workflow or tooling.
3. Copy or adapt rules into a project only when they fit that project's architecture and constraints.
4. Prefer the versions, conventions, and runtime already declared by an existing project unless an upgrade is intentional.

### For an AI coding agent

Use this repository as a **default engineering policy**, not as permission to rewrite an existing project.

A coding agent should:

1. inspect the target repository and its local instructions first
2. preserve valid project conventions and business behavior
3. apply security, data-integrity, and compatibility requirements before stylistic preferences
4. use `AGENTS.md` as the default when the target project does not already define a stronger rule
5. make the smallest change that correctly satisfies the task
6. validate the result with the relevant lint, type, test, build, and runtime checks

---

## Rule Precedence

A general documentation repository cannot know every project's business rules or operational constraints.

When instructions conflict, use this practical order:

1. explicit task requirements and acceptance criteria
2. security, privacy, legal, and data-integrity requirements
3. existing business behavior and public compatibility guarantees
4. project-specific documentation and architecture
5. version-matched official documentation
6. this repository's engineering defaults
7. general community conventions

This prevents reusable guidelines from accidentally overriding the reality of a production codebase.

---

## Philosophy

The common theme across these documents is simple:

> Prefer the smallest architecture that preserves clear boundaries and can safely support the expected change.

Good engineering is not measured by the number of abstractions, files, libraries, or patterns used. The result should be easier to understand, test, secure, operate, and change.

---

## Keeping the Repository Current

This is a living documentation repository. Framework, runtime, library, security, and deployment guidance should be reviewed as the ecosystem changes.

When updating the repository:

- prefer official, version-matched documentation
- keep project-specific examples clearly identified as examples
- avoid silently replacing working conventions with trends
- distinguish stable production guidance from preview/canary features
- update the root README whenever the repository structure or primary documentation changes
- consolidate duplicated guidance over time rather than allowing contradictory rules to accumulate

---

## Clone the Repository

```bash
git clone https://github.com/Mohamed-Leo/documentations.git
cd documentations
```

Then begin with:

```text
AGENTS.md
```

---

## Author

Maintained by [Mohamed-Leo](https://github.com/Mohamed-Leo).

This repository is primarily a personal engineering playbook published publicly for reuse, learning, and continuous improvement.
