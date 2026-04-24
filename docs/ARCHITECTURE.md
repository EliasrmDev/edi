# Architecture

## Overview

EDI is a pnpm monorepo. All apps share types through `packages/shared`. The extension is the primary user-facing surface; the API and web dashboard are backend infrastructure.

```
apps/
  api/        Hono REST API (port 3001) — AI proxy, auth, credentials, quota
  web/        Next.js 15 — landing page + user dashboard (port 3000)
  extension/  Chrome MV3 — content script + modal + popup
  workers/    pg-boss job consumers — async workflows
packages/
  shared/     Types, Zod schemas, API contracts — source of truth for all apps
infrastructure/
  docker-compose.yml
  Dockerfile.api / Dockerfile.workers
  migrations/
```

## Extension internals

### Transform flow

```
Page text selected (mouseup)
  └─ content script
       └─ injects floating button
            └─ user clicks → chrome.runtime.sendMessage(OPEN_MODAL)
                 └─ background service worker
                      └─ injects ModalController into page (content script context)
                           ├─ local transform: ToneEngine.transform() — zero network
                           └─ AI transform: sendMessage → background → POST /api/transform
```

The `ModalController` owns the transform lifecycle. Local transforms run synchronously via `ToneEngine`; AI transforms go through the background service worker which proxies to the Hono API.

### ShadowDOM isolation

The modal injects a host element into the page and attaches a ShadowRoot. All styles live inside the shadow root. This prevents page CSS from leaking in and the modal's styles from leaking out.

### ToneEngine dispatch

`ToneEngine.transform()` switches on `TransformationType`. All cases produce `{ result, source, warnings }`:

| Transformation | Source | Notes |
|---|---|---|
| uppercase / lowercase / sentence-case | local | Strips unicode styles first |
| remove-formatting | local | |
| tone-voseo-cr / tone-tuteo / tone-ustedeo | local | Present indicative + imperative only. Always emits `TONE_COVERAGE_LIMITED` warning |
| format-unicode-{bold,italic,…} | local | Strips formatting before applying |
| correct-orthography | local | Common abbreviations/punctuation only. Emits `ORTHOGRAPHY_COVERAGE_LIMITED` |
| copy-writing-cr | ai-fallback | Returns original text; caller must use API |

`verbalMode` (`indicativo` | `imperativo`) selects the transformer variant. Transformers are singletons for the default mode; `createXxxTransformer(verbalMode)` builds a custom instance.

### Popup

Separate HTML/JS entrypoint (`apps/extension/src/popup/`). Displays quota status, credential list, and default settings. Communicates with the API via background message passing.

## API internals

### Request lifecycle

```
HTTP request
  → requestId middleware (attaches X-Request-ID)
  → logger middleware (structured JSON)
  → inputSanitization middleware
  → route handler
      → requireAuth() (validates tokenHash from DB)
      → apiLimiter() (100 req/min per user, in-memory)
      → Zod parse (422 on failure)
      → business logic
      → AppError / ZodError → errorHandler → JSON response
```

### AI pipeline (`AIOrchestrationService.orchestrate`)

1. `checkQuota` — reads `quota_limits`, applies virtual reset, throws 429 if exceeded
2. `CredentialService.getForAIUse` — decrypts AES key in memory, never persisted
3. `AIPromptService.buildSystemPrompt` — builds Spanish-language system prompt for the transformation
4. `ProviderAdapter.validateText` — calls external AI API with hardcoded URL (SSRF protection)
5. `recordUsage` — inserts into `usage_records` (tokens + ms, no raw text)
6. `incrementQuota` — atomic SQL CASE update, resets window if expired

Provider errors produce `source: 'ai-fallback'`; `AppError` (quota, auth) is re-thrown.

### Rate limiters

| Limiter | Limit | Window | Applied to |
|---|---|---|---|
| `authLimiter` | 10 req | 15 min per IP | login, register, verify-email |
| `strictLimiter` | 3 req | 1 hour per IP | forgot-password |
| `apiLimiter` | 100 req | 1 min per user | all authenticated routes |
| `credentialLimiter` | 10 req | 1 hour per user | credential create/update |

All limiters are in-memory sliding window. Multi-instance deployments need Redis.

### Provider adapters

Each adapter (`OpenAIAdapter`, `AnthropicAdapter`, `GoogleAIAdapter`, `OpenRouterAdapter`) implements `ProviderAdapter`:
- `verifyKey(rawKey)` — minimal test call to validate the key
- `validateText(params)` — run the transformation, return `{ result, tokensUsed }`

Adapters hardcode their base URLs. Adding a provider requires:
1. New adapter in `apps/api/src/services/providers/adapters/`
2. Add case to `getAdapter()` in `ProviderAdapter.ts`
3. Add case to `ModelFetcherService.ts`
4. Add `ProviderId` to `packages/shared/src/types/`

## Database schema

Key relationships:

```
users
  ├─ user_profiles (1:1)
  ├─ sessions (1:N) — tokenHash only
  ├─ provider_credentials (1:N) — encryptedKey, maskedKey
  ├─ usage_records (1:N) — tokens + ms, no text
  ├─ quota_limits (1:1) — daily + monthly counters
  ├─ deletion_requests (1:N) — async deletion workflow
  ├─ oauth_accounts (1:N)
  ├─ email_verifications (1:N) — tokenHash only
  └─ password_reset_tokens (1:N) — tokenHash only
```

Soft deletes: `users.deletedAt` set on deletion request; the pg-boss `user.deletion-workflow` job hard-deletes after the grace period.

## Workers (pg-boss)

Job consumers in `apps/workers/src/index.ts`:

| Job | Purpose |
|---|---|
| `credential.expiration-reminder` | Warn user before key expires |
| `credential.rotation-reminder` | Prompt key rotation |
| `user.deletion-workflow` | Execute deferred account deletion |
| `user.data-export` | Generate GDPR data export |
| `credential.deletion-workflow` | Remove credential after grace period |
| `cleanup.expired-sessions` | Purge expired session rows |
| `cleanup.old-logs` | Prune old audit log entries |
| `notification.send-email` | SMTP dispatch |

Job names are the `JobName` union type from `@edi/shared`.

## Web app

Next.js 15 App Router. All API calls go through Server Actions in `apps/web/src/lib/actions/` — never directly from client components. `getAuthHeader()` forwards the session cookie to the Hono API.

Auth: NextAuth v5 beta. Config at `apps/web/src/lib/auth.ts`.
