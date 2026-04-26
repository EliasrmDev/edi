# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start all apps in parallel
pnpm dev

# Per-app dev
pnpm --filter @edi/api dev           # Hono API on :3001 (node-server mode)
pnpm --filter @edi/web dev           # Next.js on :3000
pnpm --filter @edi/extension dev     # Chrome extension (watch build)
pnpm --filter @edi/workers-cf dev    # CF scheduled workers (wrangler dev)

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

# Docker (local Postgres)
pnpm docker:up     # starts postgres
pnpm docker:down
docker compose -f infrastructure/docker-compose.yml --profile dev up -d  # also starts Adminer on :8080

# Cloudflare Workers deploy
pnpm --filter @edi/api run deploy          # wrangler deploy (API)
pnpm --filter @edi/workers-cf run deploy   # wrangler deploy (cron workers)
```

`packages/shared` must be built (`pnpm --filter @edi/shared build`) before other apps can import from it in a clean environment. In dev, path aliases point directly to `packages/shared/src`.

## Architecture

**pnpm monorepo** (`apps/*`, `packages/*`). Package manager: pnpm 9, Node ≥ 20. TypeScript strict throughout (`noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`).

### Apps

| App | Stack | Port / Deploy |
|-----|-------|--------------|
| `apps/api` | Hono + `@hono/node-server`, Drizzle ORM | :3001 / CF Worker (`wrangler.toml`) |
| `apps/web` | Next.js 15 (App Router), React 19, NextAuth v5 beta | :3000 |
| `apps/extension` | Chrome MV3, Vite + `@crxjs/vite-plugin` | — |
| `apps/workers-cf` | Cloudflare Workers scheduled jobs (cron) | CF Worker (`wrangler.toml`) |

### Cloudflare Workers deployment

Both `apps/api` and `apps/workers-cf` export the CF Workers format and have `wrangler.toml`. Secrets are set via `wrangler secret put` (not `.env`). CF Worker secrets are NOT auto-injected into `process.env` — `apps/api/src/index.ts` copies `env` bindings into `process.env` in the `fetch` handler so the rest of the codebase can use `process.env` uniformly.

### packages/shared

Single source of truth for types, Zod schemas, and API contracts shared across all apps. Exports from `src/types/` (tone, user, credentials, audit, jobs), `src/schemas/`, and `src/contracts/`.

### Data flow (Chrome extension)

Content script (`mouseup` → selection) → injects transform button → click sends `OPEN_MODAL` message to background service worker → background calls `POST /api/transform` on the Hono API → result returned to modal (`ModalController`).

All API calls from the extension go through the background service worker proxy (`PROXY_API_CALL` message type). The background maintains a strict endpoint allowlist: `/api/transform`, `/api/transform/quota`, `/api/auth/me`, `/api/credentials`.

### Extension auth handoff

The extension authenticates via the web app:
1. Extension opens `https://<web>/extension-auth?extId=<extension-id>`
2. The page (`_ExtensionAuthHandoff.tsx`) calls `chrome.runtime.sendMessage(extId, { type: 'STORE_AUTH_TOKEN', payload })` 
3. Background service worker stores `authToken` + `tokenExpiresAt` in `chrome.storage.local`
4. Subsequent API calls use `Authorization: Bearer <authToken>`

External messages are only accepted from `ALLOWED_WEB_ORIGINS` in the service worker.

### Tone engine

`apps/extension/src/tone-engine/ToneEngine.ts` handles all transformations. `ModalController` runs ToneEngine directly in the content-script context (no network call for local transforms).

- **Local** (source: `'local'`): `uppercase`, `lowercase`, `sentence-case`, `remove-formatting`, `tone-voseo-cr`, `tone-tuteo`, `tone-ustedeo`, `format-unicode-{bold,italic,bold-italic,bold-script,monospace,fullwidth}`, `correct-orthography` (common abbreviations/punctuation only — returns `ORTHOGRAPHY_COVERAGE_LIMITED` warning).
- **Always AI** (source: `'ai-fallback'` from ToneEngine): `copy-writing-cr` — ToneEngine returns the original text with `REQUIRES_AI` warning; the modal must call the API.
- `verbalMode` (`indicativo` | `imperativo`) controls verb conjugation for each transformer. Passed to both ToneEngine and `AIPromptService.buildSystemPrompt`.
- Transformers: `VoseoTransformer`, `TuteoTransformer`, `UstedeoTransformer` — each accepts a `verbalMode` via factory (`createXxxTransformer(verbalMode)`).

Default locale/tone is `es-CR` / `voseo-cr`.

Extension modal renders inside a **ShadowDOM** (`ModalController` attaches a shadow root to an injected host element) — styles must be scoped to the shadow root, not the page. Extension also includes an **image converter** (`apps/extension/src/image-converter/`) with a dedicated Web Worker and context menu items for right-click image conversion.

### API + Database

Schema defined in `apps/api/src/db/schema.ts` (Drizzle). Tables: `users`, `user_profiles`, `sessions`, `email_verifications`, `password_reset_tokens`, `provider_credentials`, `usage_records`, `quota_limits`, `audit_logs`, `deletion_requests`, `oauth_accounts`.

- **Credentials**: AES-encrypted at rest using `ENCRYPTION_MASTER_KEY`. Only `maskedKey` stored in plaintext. BYOK model; `ENABLE_MANAGED_MODE` flag controls managed mode.
- **Sessions**: stored in DB, `tokenHash` only (never raw token). `requireAuth` middleware SHA-256 hashes the `Bearer` token and does a JOIN against `sessions + users`.
- **Soft deletes**: `users.deletedAt` + `deletionRequests` table with scheduled workflows (processed by `apps/workers-cf`).
- **Quota**: `quota_limits` tracks daily/monthly AI usage per user; `DEFAULT_DAILY_AI_QUOTA=100`. Counters reset atomically via SQL `CASE` expressions, no cron needed.
- **Schema compatibility**: API startup calls `assertRequiredSchemaCompatibility()` and aborts if required columns are missing. Skip with `API_SKIP_SCHEMA_CHECK=true`.

### API patterns

**Error handling**: throw `AppError(code, message, httpStatus, details?)` for business errors. The global `errorHandler` maps `AppError` → `{ error: { code, message, details } }`, `ZodError` → 422 with field paths, unknowns → 500 (no stack leakage).

**Response shape**: `{ data: ... }` for success, `{ error: { code, message, details? } }` for failures.

**Routes**:
- `POST/GET /api/auth/*` — register, login, logout, verify-email, forgot/reset-password, oauth/signin, me
- `GET/PATCH/DELETE /api/users/*` — profile, account management
- `GET/POST/PATCH/DELETE /api/credentials/*` — provider API key CRUD
- `POST /api/transform` — AI text transformation (requires `requestAIValidation: true`)
- `GET /api/transform/quota` — current quota usage
- `POST /api/transform/record-local` — record a local (no-AI) transformation
- `GET /api/transform/usage-stats` — aggregated usage statistics

**Supported providers**: `openai`, `anthropic`, `google-ai`, `openrouter`. All provider adapters use hardcoded URLs — user-supplied URLs are never accepted (SSRF protection). New providers require updating the exhaustive switch in `ProviderAdapter.ts` and `ModelFetcherService.ts`.

**AI pipeline** (`AIOrchestrationService`): quota check → `CredentialService.getForAIUse` (decrypt in memory) → `AIPromptService.buildSystemPrompt` → `ProviderAdapter.validateText` → record usage (tokens only, never raw text) → increment quota. Provider failures fall back gracefully (`source: 'ai-fallback'`); `AppError` is re-thrown.

`POST /transform` requires `requestAIValidation: true` explicitly — the server rejects requests that omit it. `credentialId`/`rawKey` are never accepted from the client body; the server selects the credential server-side (OWASP A01).

### Web app

Auth via NextAuth v5 beta. The web app supports **OAuth-only** sign-in (Google + optional Microsoft Entra ID). Email/password auth exists on the API but is not surfaced in the web UI. Auth config: `apps/web/src/lib/auth.ts`; route handler: `app/api/auth/[...nextauth]/route.ts`.

**OAuth → API session bridge**: On OAuth sign-in, NextAuth calls `POST /api/auth/oauth/signin` with `x-internal-secret` header. The API creates an EDI session and returns `sessionToken`. The middleware (`apps/web/src/middleware.ts`) copies the JWT's `apiSession` into a `session` cookie so the Hono API can authenticate via `Authorization: Bearer`.

**CSP**: The web middleware generates a per-request **nonce-based CSP** (not static). The nonce is set via the `x-nonce` header for server components to read. Static CSP with `'strict-dynamic'` but no nonce would block Next.js hydration.

Web → API calls go through Next.js Server Actions (`apps/web/src/lib/actions/`). `API_URL` env var (default `http://localhost:3001`) controls the target.

### Workers — Cloudflare scheduled jobs (`apps/workers-cf`)

Cloudflare Workers with cron triggers (defined in `wrangler.toml`). Handles scheduled maintenance using `@neondatabase/serverless` directly (no ORM). Jobs:

| Cron | Job |
|------|-----|
| `0 8 * * *` | Credential expiration scan + hard-delete soft-deleted credentials (>7d) |
| `0 4 * * *` | Process pending user deletions |
| `0 2 * * *` | Clean up expired sessions |
| `0 3 1 * *` | Clean up old audit logs (default 90-day retention) |

Secrets set via `.dev.vars` (local) or `wrangler secret put` (production): `DATABASE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`.

### Environment

Copy `.env.example` to `.env`. Key variables:

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | yes | Postgres connection string |
| `ENCRYPTION_MASTER_KEY` | yes | 32-byte hex (`openssl rand -hex 32`) |
| `SESSION_SECRET` | yes | 64-byte hex (`openssl rand -hex 64`) |
| `AUTH_SECRET` | yes | NextAuth secret |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | yes (web OAuth) | Google OAuth app |
| `AUTH_MICROSOFT_ENTRA_ID_ID` / `_SECRET` / `_ISSUER` | no | MS Entra ID (optional provider) |
| `OAUTH_INTERNAL_SECRET` | yes | Shared secret for web→API OAuth handoff |
| `API_CORS_ORIGINS` | yes | Comma-separated; must include `http://localhost:3000` and `chrome-extension://<id>` |
| `AUTH_COOKIE_DOMAIN` | prod only | Domain for `__Secure-next-auth.session-token` |
| `NEXT_PUBLIC_API_URL` | no | Public API URL for client-side CSP `connect-src` |
| `VITE_API_URL` | no (extension) | API base URL injected at build time |
| `RESEND_API_KEY` / `EMAIL_FROM` | no | Email sending (workers-cf) |
| `ENABLE_MANAGED_MODE` | no | `"true"` enables managed credentials mode |
| `API_SKIP_SCHEMA_CHECK` | no | Skip schema compatibility check on startup |
