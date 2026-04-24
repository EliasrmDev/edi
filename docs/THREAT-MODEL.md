# Threat Model

## Assets

| Asset | Sensitivity | Location |
|---|---|---|
| User AI API keys | Critical | `provider_credentials.encryptedKey` (AES at rest) |
| Session tokens | High | `sessions.tokenHash` only — raw token in HTTP-only cookie |
| User email + password hash | High | `users` table |
| Transformation content | None | Never persisted — not in DB, not in logs |
| Audit logs | Medium | IP hashed, user-agent truncated |

## Threat areas

### SSRF

**Risk**: attacker-controlled URL causes the server to call internal services.

**Controls**:
- All provider adapter base URLs are hardcoded constants in code. No user-supplied URLs are accepted anywhere in the request body.
- `ssrfProtection.ts` provides `validateOutboundUrl()`: checks protocol (`https:` only), hostname allowlist (`api.openai.com`, `api.anthropic.com`, `generativelanguage.googleapis.com`), and DNS resolution against private IP ranges (RFC 1918, loopback, link-local, carrier-grade NAT, broadcast).
- DNS rebinding: resolved IP is re-checked after allowlist passes.
- OpenRouter uses a hardcoded `https://openrouter.ai/api/v1` constant (not in the DNS-check allowlist; inherits the hardcoded-URL protection only).

### Credential theft (AI keys)

**Risk**: attacker reads a user's plaintext AI key from the database or API response.

**Controls**:
- Keys encrypted at rest with AES using `ENCRYPTION_MASTER_KEY` (32-byte, server-side only).
- `encryptedKey` column never returned in API responses. Only `maskedKey` (e.g. `sk-...xxxx`) is exposed.
- `credentialId` and `rawKey` are never accepted from the client body in `POST /transform` — server selects the credential server-side (OWASP A01: Broken Access Control).
- Raw key is decrypted in-memory only for the duration of the AI call; not logged.

### Session hijacking

**Controls**:
- Only `tokenHash` stored in DB; raw token never persisted.
- Sessions have a configurable TTL (`SESSION_DURATION_HOURS`, default 24h) and can be revoked (`revokedAt`).
- `cleanup.expired-sessions` worker purges stale rows.

### Brute-force / credential stuffing

**Controls**:
- `authLimiter`: 10 attempts per 15 min per IP on login/register/verify.
- `strictLimiter`: 3 attempts per hour per IP on forgot-password.
- `credentialLimiter`: 10 credential operations per hour per user.

### Text content privacy

**Risk**: transformation inputs logged or persisted, exposing user content.

**Controls**:
- `usage_records` stores only `provider`, `transformationType`, `source`, `tokensUsed`, `processingMs` — no raw text.
- No logging of request body in production logger.
- `correct-orthography` runs locally by default; AI validation is opt-in (`requestAIValidation: true` must be explicit).

### XSS via modal injection

**Controls**:
- Modal renders inside a **ShadowDOM**; injected content uses `setModalTextSafe()` (DOM text nodes, not `innerHTML`).
- Diff renderer escapes HTML before inserting; `unescapeHtml` only applied to append to Text nodes (not `innerHTML`).

### Supply chain / extension permissions

- Extension uses minimal MV3 permissions.
- Content script does not eval or execute remote code.
- Background service worker acts as a dumb proxy; no secrets stored in extension storage.

## Out of scope

- Physical access to the database server.
- Compromise of `ENCRYPTION_MASTER_KEY` at the infrastructure level (key rotation via `ENCRYPTION_KEY_VERSION` is supported but key management is infrastructure responsibility).
- Provider-side breaches (keys stored by OpenAI/Anthropic/etc.).
