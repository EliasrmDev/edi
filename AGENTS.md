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
| `apps/web` | Next.js 15 (App Router), React 19 | 3000 |
| `apps/extension` | Chrome MV3, Vite + `@crxjs/vite-plugin` | — |
| `apps/workers` | pg-boss job consumers | — |

### packages/shared

Single source of truth for types, Zod schemas, and API contracts shared across all apps. Exports from `src/types/` (tone, user, credentials, audit, jobs), `src/schemas/`, and `src/contracts/`.

### Data flow (Chrome extension)

Content script (`mouseup` → selection) → injects transform button → click sends `OPEN_MODAL` message to background → background service worker calls `POST /api/transform` on the Hono API → result returned to modal.

### Tone engine

`apps/extension/src/tone-engine/` handles transformations locally when possible:
- **Local**: `uppercase`, `lowercase`, `sentence-case`, `remove-formatting`, `tone-voseo-cr` (basic present indicative only)
- **Requires AI**: `tone-tuteo`, `tone-ustedeo`, `correct-orthography` (returns `ai-fallback` source with warning)

Default locale/tone is `es-CR` / `voseo-cr`.

### API + Database

Schema defined in `apps/api/src/db/schema.ts` (Drizzle). Key tables: `users`, `user_profiles`, `sessions`, `provider_credentials`, `usage_records`, `quota_limits`, `audit_logs`, `deletion_requests`.

- **Credentials**: AES-encrypted at rest using `ENCRYPTION_MASTER_KEY`. Only `maskedKey` stored in plaintext. BYOK (bring your own key) model; `ENABLE_MANAGED_MODE` flag controls managed mode.
- **Sessions**: stored in DB, `tokenHash` only (never raw token).
- **Soft deletes**: `users.deletedAt` + `deletionRequests` table with scheduled workflows.
- **Quota**: `quota_limits` tracks daily/monthly AI usage per user; `DEFAULT_DAILY_AI_QUOTA=100`.

### Workers (pg-boss)

`apps/workers/src/index.ts` registers handlers for: `credential.expiration-reminder`, `credential.rotation-reminder`, `user.deletion-workflow`, `user.data-export`, `credential.deletion-workflow`, `cleanup.expired-sessions`, `cleanup.old-logs`, `notification.send-email`.

Job names are typed via `JobName` from `@edi/shared`.

### Environment

Copy `.env.example` to `.env`. Required for local dev: `DATABASE_URL`, `ENCRYPTION_MASTER_KEY` (32-byte hex), `SESSION_SECRET` (64-byte hex). Generate with `openssl rand -hex 32/64`.

API CORS accepts `API_CORS_ORIGINS` (comma-separated). Must include both `http://localhost:3000` and the Chrome extension origin (`chrome-extension://<id>`).
