# Chrome Web Store Publication Checklist

## Build

- [ ] `pnpm --filter @edi/extension build` completes without errors
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] Extension version in `apps/extension/manifest.json` bumped (semver)
- [ ] `apps/extension/dist/` is the correct build artifact (not `dev` output)

## Manifest review

- [ ] Permissions list is minimal — remove any unused permissions
- [ ] `host_permissions` covers only required origins
- [ ] `content_security_policy` does not use `unsafe-eval` or `unsafe-inline`
- [ ] `web_accessible_resources` exposes only what is necessary
- [ ] `EXTENSION_ID` in `.env` matches the ID issued by the Store

## CORS / API wiring

- [ ] `API_CORS_ORIGINS` includes the production extension origin (`chrome-extension://<store-id>`)
- [ ] `EXTENSION_ID` env var is set in the API deployment

## Store listing

- [ ] Screenshots (1280×800 or 640×400) — at least 1, up to 5
- [ ] Promotional tile (440×280) optional but recommended
- [ ] Short description (≤ 132 chars) — Spanish primary, English optional
- [ ] Detailed description covers: what EDI does, BYOK model, supported providers, privacy summary
- [ ] Category: **Productivity** or **Tools**
- [ ] Language set to `es` (Spanish); secondary `en` listing optional

## Privacy

- [ ] Privacy policy URL live and accessible (required for extensions that handle credentials)
- [ ] Privacy policy states: no transformation text is stored, AI keys encrypted at rest, usage records contain only metadata
- [ ] Single-purpose description matches the listed permissions (Chrome policy requirement)
- [ ] Justification text written for any sensitive permission (`storage`, `tabs`, `activeTab`, etc.)

## Security

- [ ] No hardcoded API URLs, secrets, or keys in the extension bundle
- [ ] `dist/` does not include source maps in production build (or source maps are intentionally included)
- [ ] Content scripts do not call `eval()` or `new Function()`

## Testing before submission

- [ ] Load unpacked from `dist/` in a clean Chrome profile (not dev profile)
- [ ] Text selection → modal opens on a plain page (e.g. google.com)
- [ ] Text selection → modal opens inside an iframe (if supported)
- [ ] Local transformation (uppercase) works without credentials
- [ ] AI transformation with valid key works end-to-end
- [ ] AI transformation with no credential shows correct error
- [ ] Popup opens, quota loads, credential list renders
- [ ] Image converter opens and converts correctly
- [ ] Extension uninstall leaves no residual DOM elements on the page

## Post-publish

- [ ] Update `EXTENSION_ID` in all environments if the ID changed
- [ ] Update `API_CORS_ORIGINS` in all API deployments
- [ ] Tag the release commit: `git tag extension-v<version>`
