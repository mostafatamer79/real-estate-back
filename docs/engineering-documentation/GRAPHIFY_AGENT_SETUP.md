# Graphify Agent Setup

Graphify builds a persistent knowledge graph for a project so coding agents can query structure, files, symbols, and relationships before reading large parts of the repository. This reduces repeated exploration and token usage across sessions.

Official repo: https://github.com/safishamsi/graphify

## What Is Installed Once vs Per Project

Install once on the PC:

```powershell
uv tool install graphifyy --upgrade
graphify install --platform codex
```

This installs the official PyPI package `graphifyy` and registers the Graphify skill globally for Codex.

Do per project:

```powershell
cd path\to\your-project
graphify install --project --platform codex
graphify extract . --no-cluster
graphify hook install
```

Each project needs its own `graphify-out/graph.json` because the graph is built from that project's files. You do not reinstall the CLI every time, but you do build or update a graph in each repo you want agents to understand.

## Codex Config

Codex should have `multi_agent = true` under `[features]` in:

```text
%USERPROFILE%\.codex\config.toml
```

Example:

```toml
[features]
multi_agent = true
```

If `[features]` already exists, add `multi_agent = true` inside the existing section.

## Code-Only Offline Graph

Code extraction runs locally. Docs, PDFs, and images require an LLM provider key for semantic extraction. If you want a private/offline code-only graph, add a `.graphifyignore` like:

```gitignore
*.md
*.html
public/*.png
public/*.jpg
public/*.jpeg
public/*.webp
public/*.gif
```

Then run:

```powershell
graphify extract . --no-cluster
```

The output should include:

```text
graphify-out/
  graph.json
  manifest.json
  cache/
```

## Updating The Graph

After code changes:

```powershell
graphify update .
```

After large refactors or deleted files:

```powershell
graphify update . --force
```

Git hooks can be installed once per repo:

```powershell
graphify hook install
graphify hook status
```

## Querying Instead Of Re-Reading Files

Agents and developers can ask the graph first:

```powershell
graphify query "Where is dashboard authentication handled?"
graphify query "Which files are involved in one-time order operations?"
graphify explain "src/lib/apis.ts"
graphify affected "src/utils/fetchMenuProducts.ts"
```

In Codex, the project `AGENTS.md` created by:

```powershell
graphify install --project --platform codex
```

tells agents to prefer `graphify query`, `graphify explain`, `graphify path`, and `graphify affected` before scanning the whole codebase.

## Optional Full Semantic Graph

To include docs, PDFs, images, or richer concept extraction, configure one provider key, then remove or relax the doc/image ignores:

```powershell
$env:GEMINI_API_KEY="..."
# or OPENAI_API_KEY, ANTHROPIC_API_KEY, DEEPSEEK_API_KEY, etc.
graphify extract .
```

Use this only when project data is allowed to go to that provider. Code AST extraction stays local, but semantic extraction for docs and media uses the configured model provider.

## Current Basic Diet Dashboard Setup

For this workspace, Graphify was installed in:

```text
client_dashbourd/
```

Installed project files:

```text
client_dashbourd/AGENTS.md
client_dashbourd/.codex/
client_dashbourd/.graphifyignore
client_dashbourd/graphify-out/graph.json
```

Current graph mode: code-only, offline, no clustering.

Use this from the dashboard repo root:

```powershell
cd C:\Users\shadowing\OneDrive\Desktop\programing\basic_diet\client_dashbourd
graphify query "Where is the dashboard API client configured?"
```

## Notes For Agents

Before broad file reading, query the graph. Read source files only after the graph identifies the relevant module, route, hook, component, or utility.

For this project, also respect any local guard or safety skills the repo owner has installed before making risky backend, auth, payment, production, or data-model changes.
