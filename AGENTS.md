# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
# Start all apps in parallel
pnpm dev

# Per-app dev
pnpm --filter @edi/api dev        # Hono API on :3001
pnpm --filter @edi/web dev        # Next.js on :3000
pnpm --filter @edi/extension dev  # Chrome extension (watch build)
pnpm --filter @edi/workers dev    # pg-boss workers

# Build / typecheck / lint
pnpm build
pnpm typecheck
pnpm lint

# Tests
pnpm --filter @edi/api test            # vitest (API + DB schema tests)
pnpm --filter @edi/extension test      # vitest (ToneEngine + TextFieldHandler)
pnpm --filter @edi/api test -- --run   # single run, no watch

# Database
pnpm db:generate   # runs drizzle-kit generate in @edi/api
pnpm db:migrate    # runs drizzle-kit migrate in @edi/api
pnpm --filter @edi/api run db:studio  # Drizzle Studio

# Docker (local Postgres + services)
pnpm docker:up     # starts postgres, api, workers
pnpm docker:down
docker compose -f infrastructure/docker-compose.yml --profile dev up -d  # also starts Adminer on :8080
```

`packages/shared` must be built (`pnpm --filter @edi/shared build`) before other apps can import from it in a clean environment. In dev, path aliases point directly to `packages/shared/src`.

## Architecture

**pnpm monorepo** (`apps/*`, `packages/*`). Package manager: pnpm 9, Node ≥ 20. TypeScript strict throughout (`noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`).

### Apps

| App | Stack | Port |
|-----|-------|------|
| `apps/api` | Hono + `@hono/node-server`, Drizzle ORM, pg-boss | 3001 |
| `apps/web` | Next.js 15 (App Router), React 19, NextAuth v5 beta | 3000 |
| `apps/extension` | Chrome MV3, Vite + `@crxjs/vite-plugin` | — |
| `apps/workers` | pg-boss job consumers | — |

### packages/shared

Single source of truth for types, Zod schemas, and API contracts shared across all apps. Exports from `src/types/` (tone, user, credentials, audit, jobs), `src/schemas/`, and `src/contracts/`.

### Data flow (Chrome extension)

Content script (`mouseup` → selection) → injects transform button → click sends `OPEN_MODAL` message to background service worker → background calls `POST /api/transform` on the Hono API → result returned to modal (`ModalController`).

### Tone engine

`apps/extension/src/tone-engine/ToneEngine.ts` handles all transformations. `ModalController` runs ToneEngine directly in the content-script context (no network call for local transforms).

- **Local** (source: `'local'`): `uppercase`, `lowercase`, `sentence-case`, `remove-formatting`, `tone-voseo-cr`, `tone-tuteo`, `tone-ustedeo`, `format-unicode-{bold,italic,bold-italic,bold-script,monospace,fullwidth}`, `correct-orthography` (common abbreviations/punctuation only — returns `ORTHOGRAPHY_COVERAGE_LIMITED` warning).
- **Always AI** (source: `'ai-fallback'` from ToneEngine): `copy-writing-cr` — ToneEngine returns the original text with `REQUIRES_AI` warning; the modal must call the API.
- `verbalMode` (`indicativo` | `imperativo`) controls which verb conjugation each transformer applies. Passed to both ToneEngine and `AIPromptService.buildSystemPrompt`.
- Transformers: `VoseoTransformer`, `TuteoTransformer`, `UstedeoTransformer` — each accepts a `verbalMode` via factory (`createXxxTransformer(verbalMode)`).

Default locale/tone is `es-CR` / `voseo-cr`.

Extension modal renders inside a **ShadowDOM** (`ModalController` attaches a shadow root to an injected host element) — styles must be scoped to the shadow root, not the page. Extension also includes an **image converter** (`apps/extension/src/image-converter/`) with a dedicated Web Worker.

### API + Database

Schema defined in `apps/api/src/db/schema.ts` (Drizzle). Key tables: `users`, `user_profiles`, `sessions`, `provider_credentials`, `usage_records`, `quota_limits`, `audit_logs`, `deletion_requests`.

- **Credentials**: AES-encrypted at rest using `ENCRYPTION_MASTER_KEY`. Only `maskedKey` stored in plaintext. BYOK (bring your own key) model; `ENABLE_MANAGED_MODE` flag controls managed mode.
- **Sessions**: stored in DB, `tokenHash` only (never raw token).
- **Soft deletes**: `users.deletedAt` + `deletionRequests` table with scheduled workflows.
- **Quota**: `quota_limits` tracks daily/monthly AI usage per user; `DEFAULT_DAILY_AI_QUOTA=100`. Counters reset atomically via SQL `CASE` expressions, no cron needed.
- **Schema compatibility**: API startup calls `assertRequiredSchemaCompatibility()` and aborts if required columns are missing. Skip with `API_SKIP_SCHEMA_CHECK=true`.

### API patterns

**Error handling**: throw `AppError(code, message, httpStatus, details?)` for business errors. The global `errorHandler` maps `AppError` → `{ error: { code, message, details } }`, `ZodError` → 422 with field paths, unknowns → 500 (no stack leakage).

**Response shape**: `{ data: ... }` for success, `{ error: { code, message, details? } }` for failures.

**Supported providers**: `openai`, `anthropic`, `google-ai`, `openrouter`. All provider adapters use hardcoded URLs — user-supplied URLs are never accepted (SSRF protection). New providers require updating the exhaustive switch in `ProviderAdapter.ts` and `ModelFetcherService.ts`.

**AI pipeline** (`AIOrchestrationService`): quota check → `CredentialService.getForAIUse` (decrypt in memory) → `AIPromptService.buildSystemPrompt` → `ProviderAdapter.validateText` → record usage (tokens only, never raw text) → increment quota. Provider failures fall back gracefully (`source: 'ai-fallback'`); `AppError` is re-thrown.

`POST /transform` requires `requestAIValidation: true` explicitly — the server rejects requests that omit it. `credentialId`/`rawKey` are never accepted from the client body; the server selects the credential server-side (OWASP A01).

### Web app

Auth via NextAuth v5 beta (`next-auth@^5.0.0-beta`). Auth config at `apps/web/src/lib/auth.ts`; route handler at `app/api/auth/[...nextauth]/route.ts`. Server actions use `getAuthHeader()` to forward session cookies to the Hono API.

Web → API calls go through Next.js Server Actions (`apps/web/src/lib/actions/`). `API_URL` env var (default `http://localhost:3001`) controls the target.

### Workers (pg-boss)

`apps/workers/src/index.ts` registers handlers for: `credential.expiration-reminder`, `credential.rotation-reminder`, `user.deletion-workflow`, `user.data-export`, `credential.deletion-workflow`, `cleanup.expired-sessions`, `cleanup.old-logs`, `notification.send-email`.

Job names are typed via `JobName` from `@edi/shared`.

### Environment

Copy `.env.example` to `.env`. Required for local dev: `DATABASE_URL`, `ENCRYPTION_MASTER_KEY` (32-byte hex), `SESSION_SECRET` (64-byte hex). Generate with `openssl rand -hex 32/64`.

API CORS accepts `API_CORS_ORIGINS` (comma-separated). Must include both `http://localhost:3000` and the Chrome extension origin (`chrome-extension://<id>`).
