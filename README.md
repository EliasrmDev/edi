# EDI Enhanced Design Interface

Edición inteligente de texto en español con localización para Costa Rica. Transformá, corregí y adaptá texto con inteligencia artificial directamente desde el navegador.

## ¿Qué hace?

EDI es una extensión de Chrome que detecta texto seleccionado en cualquier página y permite aplicar transformaciones:

| Transformación | Motor | Notas |
|---|---|---|
| Mayúsculas / minúsculas / oración | Local | |
| Eliminar formato | Local | |
| Unicode bold / italic / monospace / … | Local | |
| Voseo CR / Tuteo / Ustedeo | Local | Indicativo y imperativo presente. Cobertura parcial |
| Corrección ortográfica | Local básica | Abreviaturas y puntuación comunes; IA para mayor precisión |
| Copy Writing CR | IA requerida | Sin implementación local |

Las transformaciones locales son instantáneas y no consumen cuota. Las transformaciones con IA usan credenciales propias del usuario (modelo BYOK — Bring Your Own Key).

## Estructura del monorepo

```rb
apps/
  api/        Hono API REST  (puerto 3001)
  web/        Next.js 15 — landing / dashboard  (puerto 3000)
  extension/  Chrome Extension MV3
  workers/    Consumidores de jobs pg-boss
packages/
  shared/     Tipos, esquemas Zod y contratos de API compartidos
infrastructure/
  docker-compose.yml
  Dockerfile.api / Dockerfile.workers
  migrations/
```

## Requisitos

- Node ≥ 20
- pnpm 9
- Docker (para PostgreSQL local)

## Configuración inicial

```bash
# 1. Instalar dependencias
pnpm install

# 2. Crear archivo de entorno
cp .env.example .env

# 3. Generar secretos
openssl rand -hex 32   # → ENCRYPTION_MASTER_KEY
openssl rand -hex 64   # → SESSION_SECRET

# 4. Levantar base de datos
pnpm docker:up

# 5. Ejecutar migraciones
pnpm db:migrate

# 6. Iniciar todos los servicios
pnpm dev
```

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Conexión PostgreSQL |
| `ENCRYPTION_MASTER_KEY` | 32 bytes hex — cifrado de credenciales de IA |
| `ENCRYPTION_KEY_VERSION` | Versión de la clave (default: `1`) |
| `SESSION_SECRET` | 64 bytes hex — firma de sesiones |
| `SESSION_DURATION_HOURS` | Duración de sesión (default: `24`) |
| `REFRESH_TOKEN_DURATION_DAYS` | Duración refresh token (default: `30`) |
| `API_PORT` | Puerto de la API (default: `3001`) |
| `API_CORS_ORIGINS` | Orígenes permitidos separados por coma |
| `EXTENSION_ID` | ID de la extensión Chrome (para CORS) |
| `SMTP_*` | Configuración de correo saliente |
| `WEB_URL` / `API_URL` | URLs de la app |
| `ENABLE_MANAGED_MODE` | Modo gestionado de claves IA (default: `false`) |
| `ENABLE_AI_VALIDATION` | Habilitar validación con IA (default: `true`) |
| `DEFAULT_DAILY_AI_QUOTA` | Cuota diaria de requests IA por usuario (default: `100`) |
| `LOG_LEVEL` | Nivel de log (`info`, `debug`, etc.) |

## Comandos

```bash
# Desarrollo
pnpm dev                              # todos los apps en paralelo
pnpm --filter @edi/api dev            # solo la API
pnpm --filter @edi/web dev            # solo el dashboard
pnpm --filter @edi/extension dev      # extensión en modo watch
pnpm --filter @edi/workers dev        # workers

# Calidad
pnpm typecheck
pnpm lint
pnpm build

# Base de datos
pnpm db:generate                      # genera migraciones desde el schema
pnpm db:migrate                       # aplica migraciones
pnpm --filter @edi/api run db:studio  # Drizzle Studio en el navegador

# Docker
pnpm docker:up
pnpm docker:down
# Adminer (UI de DB) en :8080 — solo perfil dev
docker compose -f infrastructure/docker-compose.yml --profile dev up -d
```

## Cargar la extensión en Chrome

1. `pnpm --filter @edi/extension build` (o `dev` para watch)
2. Abrir `chrome://extensions`
3. Activar **Modo desarrollador**
4. **Cargar descomprimida** → seleccionar `apps/extension/dist/`
5. Copiar el ID generado a `EXTENSION_ID` en `.env` y a `API_CORS_ORIGINS`

## Arquitectura de la extensión

```ini
Selección de texto
  └─ content script (mouseup)
       └─ botón flotante "EDI ✏️"
            └─ chrome.runtime.sendMessage(OPEN_MODAL)
                 └─ background service worker
                      └─ inyecta ModalController (contexto content script)
                           ├─ ToneEngine (local, sin red)
                           └─ sendMessage → background → POST /api/transform
```

## Modelo de seguridad

- Las claves de proveedores de IA se almacenan cifradas (AES) usando `ENCRYPTION_MASTER_KEY`. Solo se persiste la versión enmascarada en texto plano.
- Las sesiones se almacenan en base de datos; solo se guarda el hash del token.
- Las eliminaciones de cuenta son diferidas (workflow asíncrono vía pg-boss).
- Cada usuario tiene cuota diaria y mensual de requests IA rastreable en `quota_limits`.
