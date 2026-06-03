# `harjoot/` — Integración con Harjoot Partner API

Módulo aislado para toda la comunicación con Harjoot (proveedor de
verificación de certificados). Si mañana se cambia de proveedor, todo lo
relevante vive acá.

## Estructura

```
harjoot/
├── config.js              Carga + valida env vars al module load (throw rápido si falta algo crítico)
├── client/
│   ├── errors.js          Jerarquía HarjootError + map de axios error → tipado
│   ├── httpClient.js      Cliente real con axios + interceptors + retry inline
│   ├── mockClient.js      Stub in-process con respuestas alineadas al PDF
│   ├── factory.js         createHarjootClient(config) — elige http vs mock por env
│   ├── index.js           Barrel público (importar siempre desde acá)
│   └── __tests__/         Unit tests con axios mockeado
└── README.md              (este archivo)
```

## Uso desde el resto del backend

```js
const { createHarjootClient } = require("./harjoot/client");
const harjoot = createHarjootClient();

await harjoot.getPartnerInfo();
await harjoot.activateAccess("issuer", userRow, { organization_name: "Acme U" });
await harjoot.checkAccess(walletAddress, "student");
await harjoot.uploadCertificate({ /* ver docs/client-integration-guide.pdf */ });
```

## Cliente real vs mock

Controlado por la env var `HARJOOT_USE_MOCK`:

| Valor | Resultado |
|-------|-----------|
| `false` (o sin setear) | `createHarjootClient()` devuelve el cliente HTTP real que pega a `HARJOOT_API_BASE_URL`. |
| `true` | Devuelve un mock in-process con respuestas hardcodeadas alineadas al PDF. Útil para correr el backend sin credenciales y para tests E2E rápidos. |

## Manejo de errores

Cada error del cliente HTTP se mapea a una subclase de `HarjootError`:

| Subclase | Cuándo | `status` que retorna HackChain |
|----------|--------|--------------------------------|
| `HarjootAuthError` | Harjoot rechazó la API key (401/403) | 500 (es problema de config nuestro) |
| `HarjootRateLimitError` | 429 de Harjoot | 503 |
| `HarjootValidationError` | 400 / 422 de Harjoot | 502 |
| `HarjootNotFoundError` | 404 de Harjoot | 502 (los routes pueden re-throw como 404) |
| `HarjootServerError` | 5xx de Harjoot (tras retries) | 502 |
| `HarjootUnavailableError` | Error de red / timeout | 503 |

El global error handler de `backend/index.js:143-147` **respeta `err.status`**
automáticamente — los routes no necesitan mapear códigos.

## Retry

El interceptor de response reintenta hasta `HARJOOT_MAX_RETRIES` veces sobre:
- Errores de red (no `response`).
- 5xx de Harjoot.

Backoff lineal: `HARJOOT_RETRY_BASE_DELAY_MS * attempt`. Los 4xx **NO** se
reintentan (son determinísticos).

## Logging

Convención del proyecto: `console.*` con prefijo `[harjoot]`. El interceptor
de request sanitiza headers — **nunca** se loggea `x-api-key` ni
`Authorization`.

## Tests

```bash
# Todos los tests del módulo
npx jest --testPathPatterns='harjoot'

# Solo httpClient
npx jest --testPathPatterns='harjoot/client/__tests__/httpClient'
```

Los tests mockean `axios` con `jest.mock("axios")`. No tocan red.

## Referencias

- `documents/client-integration-guide.pdf` — contrato oficial de Harjoot.
- `documents/hackchain-harjoot-integration-gaps.pdf` — namespace HackChain.
- `documents/hackchain-harjoot-sequence.txt` — DS v5 con los flujos completos.
- `documents/harjoot-implementation-plan.md` — plan general de implementación.
- `documents/harjoot-integration-handoff.md` — handoff del scaffold inicial.

## Mapping de roles

HackChain usa internamente `student / issuer / recruiter`. Harjoot espera el
segmento `talent / educator / recruiter`. El mapping vive en
`client/httpClient.js` como `ROLE_TO_SEGMENT` y se aplica automáticamente
dentro del cliente — los callers pasan el rol HackChain.
