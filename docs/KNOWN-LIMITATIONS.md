# Known Limitations

## Tone engine (local transformations)

### Verb coverage

`tone-voseo-cr`, `tone-tuteo`, `tone-ustedeo` only handle:
- Present indicative (e.g. *tenés / tienes / tiene*)
- Present imperative (e.g. *tomá / toma / tome*)

Not handled: past tenses, subjunctive, future, conditional, compound tenses, reflexive verb edge cases, irregular stems. Every tone transformation emits a `TONE_COVERAGE_LIMITED` warning for this reason.

### Mixed-tone input

If the input text uses inconsistent person/tone (e.g. a mix of vos and usted), `ToneDetector` reports low confidence and the transformation may produce inconsistent output. A `MIXED_TONE_DETECTED` warning is emitted.

### Orthography correction (local)

`correct-orthography` in local mode only fixes:
- Common chat abbreviations (`xq → porque`, `tb → también`, `xfa → por favor`, etc.)
- Repeated punctuation (`!!!!` → `!`)

It does not handle: tilde placement, b/v confusion, h insertion/omission, homophone disambiguation, or accentuation rules. For production-quality correction, AI validation is required.

### copy-writing-cr

`copy-writing-cr` has no local implementation. `ToneEngine` returns the original text with `source: 'ai-fallback'` and a `REQUIRES_AI` warning. The modal must call the API.

## API

### Text length

`POST /transform` accepts text up to **50,000 characters**. Requests with longer text are rejected with a 422 validation error.

### Rate limiting (in-memory)

All rate limiters (`authLimiter`, `apiLimiter`, `strictLimiter`, `credentialLimiter`) use an in-memory Map. Limits **do not share state across API instances**. Horizontal scaling requires a Redis-backed limiter.

### Quota counters (in-memory reset)

Quota resets are handled via SQL `CASE` expressions on increment — no background job or cron. If a user's usage window expires between requests, the counter is atomically reset on the next AI call. The window boundaries are exact but the reset only triggers on usage, not at the stroke of midnight.

### OpenRouter SSRF allowlist

`openrouter.ai` is not in the DNS-check allowlist in `ssrfProtection.ts`. OpenRouter calls rely solely on the hardcoded URL constant in `OpenRouterAdapter`. The DNS rebinding check does not apply to OpenRouter.

## Extension

### Chrome MV3 only

The extension targets Chrome MV3. Firefox / Safari are not supported.

### Unicode formatting

`format-unicode-*` transformations produce Unicode mathematical characters (e.g. 𝗯𝗼𝗹𝗱). These render correctly in most chat/social platforms but may appear as boxes in environments that lack the Mathematical Alphanumeric Symbols Unicode block. There is no reverse operation (bold → plain) beyond `remove-formatting`.

### Popup quota display

Quota data shown in the popup is fetched on open and is not live. It may be stale if another tab or device consumed quota concurrently.
