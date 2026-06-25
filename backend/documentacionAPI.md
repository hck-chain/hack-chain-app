# HackChain
## Resumen.
HackChain es un ecosistema educativo-laboral que vincula Talento, Educadores y Reclutadores con el fin de promover el aprendizaje constante y la transparencia en los procesos de reclutamiento.
## URL base
https://hack-chain-app.onrender.com
## Stack tecnologico.
* Lenguaje de programación: Java Script
* Entorno de ejecución: node.js
* Framework: Express
* ORM: Sequelize
* Sistema de gestión de base de datos: PostgreSQL
* Base de datos: Neon DB
* Plataforma donde está desplegado el backend: Render

## Autenticación

Para acceder a las rutas protegidas de la API es obligatorio incluir un JSON Web Token (JWT) en cada petición. El sistema extrae la wallet del token para identificar automáticamente el rol del usuario (`issuer`, `student` o `recruiter`) y aplicar los permisos correspondientes.

---

### Headers requeridos

| Header | Valor | Descripción |
|---|---|---|
| `Authorization` | `Bearer <token>` | Obligatorio en rutas protegidas. El prefijo `Bearer` seguido de un espacio es indispensable; enviar solo el token resultará en error. |
| `Content-Type` | `application/json` | Obligatorio en peticiones `POST` y `PUT`. Indica que el cuerpo de la petición está en formato JSON. |

---

### Especificaciones del token

| Propiedad | Valor |
|---|---|
| Tipo | JWT (JSON Web Token) |
| Payload | `{ "wallet": "0x..." }` |
| Expiración | `1h` (configurable mediante la variable de entorno `JWT_EXPIRES_IN`) |
| Algoritmo de firma | Clave secreta definida en `JWT_SECRET` |

---

### Resolución de roles

Al recibir una petición autenticada, el middleware extrae la `wallet` del payload y la busca secuencialmente en las siguientes tablas, en orden de prioridad:

1. **Issuers** — si se encuentra, el usuario es tratado como emisor de certificados.
2. **Students** — si se encuentra, el usuario es tratado como estudiante.
3. **Recruiters** — si se encuentra, el usuario es tratado como reclutador.

Si la wallet no existe en ninguna de las tres tablas, la función `getUserFromToken` retorna `null`.

---

### Datos retornados por rol

Dependiendo del rol resuelto, el objeto de usuario disponible en la respuesta varía:

**Issuer**
```json
{
  "modelName": "issuer",
  "user": {
    "wallet_address": "0x...",
    "name": "Ana López",
    "organization_name": "Universidad HackChain",
    "email": "ana@hackchain.io"
  }
}
```

**Student**
```json
{
  "modelName": "student",
  "user": {
    "wallet_address": "0x...",
    "name": "Laura Gómez",
    "email": "laura@ejemplo.com"
  }
}
```

**Recruiter**
```json
{
  "modelName": "recruiter",
  "user": {
    "wallet_address": "0x...",
    "name": "TechCorp S.A.",
    "company_name": "TechCorp S.A.",
    "email": "carlos@techcorp.com"
  }
}
```

---

### Manejo de errores

| Código | Causa |
|---|---|
| `401 Unauthorized` | El header `Authorization` está ausente, tiene formato incorrecto, o el token es inválido o ha expirado. |
| `500 Internal Server Error` | Ocurrió un fallo inesperado durante la verificación del token o al consultar la base de datos. |

---

### Notas generales

- La wallet del payload es normalizada a minúsculas (`.toLowerCase()`) antes de realizar cualquier consulta a la base de datos.
- El middleware `authenticate` adjunta el payload decodificado a `req.auth`, disponible para los controladores como `{ wallet: "0x..." }`.
- Para los roles `issuer` y `recruiter`, el campo `email` se resuelve con prioridad al `User` asociado; si no existe, se intenta usar el email propio del modelo.
- El campo `name` del `recruiter` usa `company_name` como valor de respaldo si el `User` no tiene nombre registrado.

## Auth Endpoints (auth.js)

Base path: `/api/auth`

---

### POST `/api/auth/login`

Autentica a un usuario mediante su dirección de wallet. Retorna un JWT y los datos básicos del usuario.

**Rate limit:** 8 solicitudes por IP por minuto.

**Headers**

| Header | Valor |
|---|---|
| `Content-Type` | `application/json` |

**Body**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `wallet_address` | `string` | ✅ | Dirección de wallet (exactamente 42 caracteres) |
| `cfToken` | `string` | ⚠️ Condicional | Token de Cloudflare Turnstile. Requerido si `TURNSTILE_SECRET` está configurado en el entorno |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Autenticación exitosa. Retorna `token`, `user` |
| `404` | No existe usuario asociado a la wallet |
| `422` | Error de validación en los campos |
| `403` | Captcha inválido o ausente (si Turnstile está habilitado) |
| `429` | Demasiados intentos de login |
| `500` | Error interno del servidor |

**Ejemplo de respuesta exitosa**

```json
{
  "message": "Authenticated",
  "token": "<jwt>",
  "user": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "role": "Admin",
    "wallet_address": "0x..."
  }
}
```

---

### POST `/api/auth/change-password`

Permite a un usuario autenticado cambiar su contraseña. Requiere la contraseña actual para confirmar la identidad.

**Autenticación:** Bearer token (JWT) requerido.

**Headers**

| Header | Valor |
|---|---|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <token>` |

**Body**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `currentPassword` | `string` | ✅ | Contraseña actual (mínimo 6 caracteres) |
| `newPassword` | `string` | ✅ | Nueva contraseña (mínimo 8 caracteres) |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Contraseña actualizada correctamente |
| `401` | No autenticado, o contraseña actual incorrecta |
| `404` | Usuario no encontrado |
| `422` | Error de validación en los campos |
| `500` | Error interno del servidor |

**Ejemplo de respuesta exitosa**

```json
{
  "message": "Password updated"
}
```

---

### GET `/api/auth/me`

Retorna la información del usuario autenticado, obtenida a partir del token JWT.

**Autenticación:** Bearer token (JWT) requerido.

**Headers**

| Header | Valor |
|---|---|
| `Authorization` | `Bearer <token>` |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Datos del usuario autenticado (incluye `email`) |
| `401` | Token ausente o inválido |
| `404` | Usuario no encontrado |
| `500` | Error interno del servidor |

**Ejemplo de respuesta exitosa**

```json
{
  "id": 1,
  "email": "usuario@ejemplo.com",
  "role": "Admin",
  "wallet_address": "0x..."
}
```

---

### Notas generales

- Los campos `passwordHash` y `privateKey` son eliminados de todas las respuestas antes de ser enviadas al cliente.
- El campo `cfToken` (Cloudflare Turnstile) en `/login` solo se valida si la variable de entorno `TURNSTILE_SECRET` está definida. Si no lo está, el captcha es ignorado.
- Los tokens JWT tienen una expiración configurable mediante la variable de entorno `JWT_EXPIRES_IN` (por defecto `1h`).

## Certificates Endpoints (certificates.js)

Base path: `/api/certificates`

---

### POST `/api/certificates`

Sube los metadatos de un certificado a IPFS mediante Pinata y retorna el CID generado.

**Headers**

| Header | Valor |
|---|---|
| `Content-Type` | `application/json` |

**Body**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `name` | `string` | ✅ | Nombre del estudiante |
| `course` | `string` | ✅ | Nombre del curso |
| `professor` | `string` | ✅ | Nombre del profesor |
| `date` | `string` | ✅ | Fecha de emisión |
| `imageCID` | `string` | ✅ | CID de la imagen del certificado ya subida a IPFS |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Metadatos subidos correctamente. Retorna `cid` y `uri` |
| `400` | Faltan campos requeridos |
| `500` | Error al subir los metadatos |

**Ejemplo de respuesta exitosa**

```json
{
  "cid": "Qm...",
  "uri": "ipfs://Qm..."
}
```

---

### POST `/api/certificates/link`

Genera y valida el enlace de OpenSea para un certificado dado su `token_id`.

**Headers**

| Header | Valor |
|---|---|
| `Content-Type` | `application/json` |

**Body**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `token_id` | `string` \| `number` | ✅ | ID del token NFT en la blockchain |

**Respuestas**

| Código | Descripción |
|---|---|
| `201` | Enlace generado y verificado correctamente |
| `400` | `token_id` no proporcionado |
| `404` | Certificado no encontrado en OpenSea |
| `500` | Error interno del servidor |

**Ejemplo de respuesta exitosa**

```json
{
  "message": "Link created",
  "link": "https://opensea.io/item/polygon/0x61d2e94543DD498b7FD86450f1fC8135cB60021C/42"
}
```

---

### POST `/api/certificates/verify`

Verifica la autenticidad de un certificado a partir de un enlace de OpenSea.

**Headers**

| Header | Valor |
|---|---|
| `Content-Type` | `application/json` |

**Body**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `link` | `string` | ✅ | URL del certificado a verificar (generada por `/link`) |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Certificado auténtico |
| `4xx` | Certificado no encontrado o no auténtico |
| `500` | Error interno del servidor |

**Ejemplo de respuesta exitosa**

```json
{
  "message": "This certificate is authentic",
  "authenticity": true
}
```

**Ejemplo de respuesta fallida**

```json
{
  "error": "This certificate is not authentic",
  "authenticity": false
}
```

---

### GET `/api/certificates/:cid`

Obtiene los metadatos de un certificado almacenado en IPFS mediante su CID.

**Parámetros de ruta**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `cid` | `string` | Content Identifier (CID) del archivo en IPFS |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Metadatos del certificado |
| `400` | CID no proporcionado |
| `404` | Metadatos no encontrados |

**Ejemplo de respuesta exitosa**

```json
{
  "name": "Certificate for Juan Pérez",
  "description": "HackChain Tokenized Certificate",
  "image": "ipfs://Qm...",
  "attributes": [
    { "trait_type": "Student", "value": "Juan Pérez" },
    { "trait_type": "Course", "value": "Blockchain Basics" },
    { "trait_type": "Professor", "value": "Dr. García" },
    { "trait_type": "Date", "value": "2025-01-15" }
  ]
}
```

---

### POST `/api/certificates/database`

Registra un certificado ya emitido en blockchain dentro de la base de datos. Valida que el emisor esté registrado como autorizado.

**Headers**

| Header | Valor |
|---|---|
| `Content-Type` | `application/json` |

**Body**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `student_wallet_address` | `string` | ✅ | Wallet del estudiante (`0x...`) |
| `issuer_wallet_address` | `string` | ✅ | Wallet del emisor autorizado (`0x...`) |
| `title` | `string` | ✅ | Título del certificado |
| `description` | `string` | ❌ | Descripción (por defecto: `"Certificado Tokenizado HackChain"`) |
| `certificate_hash` | `string` | ❌ | Hash del contenido del certificado |
| `blockchain_tx_hash` | `string` | ❌ | Hash de la transacción en blockchain |
| `token_id` | `string` \| `number` | ❌ | ID del token NFT |
| `issue_date` | `string` | ❌ | Fecha de emisión |

**Respuestas**

| Código | Descripción |
|---|---|
| `201` | Certificado registrado correctamente |
| `400` | Campos obligatorios faltantes o wallet inválida |
| `404` | Emisor no registrado como autorizado |
| `500` | Error interno del servidor |

**Ejemplo de respuesta exitosa**

```json
{
  "message": "Certificado sincronizado con éxito",
  "id": 7
}
```

---

### GET `/api/certificates/database`

Retorna todos los certificados registrados en la base de datos, ordenados del más reciente al más antiguo. Incluye información del emisor.

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Lista de certificados |
| `500` | Error interno del servidor |

**Ejemplo de respuesta exitosa**

```json
{
  "certificates": [
    {
      "id": 7,
      "issuer_wallet_address": "0x...",
      "title": "Blockchain Basics",
      "description": "Certificado Tokenizado HackChain",
      "certificate_hash": "0xabc...",
      "blockchain_tx_hash": "0xdef...",
      "issue_date": "2025-01-15",
      "is_revoked": false,
      "created_at": "2025-01-15T10:00:00.000Z",
      "issuer": { ... }
    }
  ]
}
```

---

### GET `/api/certificates/database/:id`

Obtiene el detalle completo de un certificado por su ID en la base de datos.

**Parámetros de ruta**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `id` | `number` | ID del certificado en la base de datos |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Detalle del certificado |
| `404` | Certificado no encontrado |
| `500` | Error interno del servidor |

**Ejemplo de respuesta exitosa**

```json
{
  "certificate": {
    "id": 7,
    "issuer_wallet_address": "0x...",
    "title": "Blockchain Basics",
    "description": "Certificado Tokenizado HackChain",
    "certificate_hash": "0xabc...",
    "blockchain_tx_hash": "0xdef...",
    "token_id": "42",
    "issue_date": "2025-01-15",
    "is_revoked": false,
    "created_at": "2025-01-15T10:00:00.000Z",
    "issuer": { ... }
  }
}
```

---

### PUT `/api/certificates/database/:id/revoke`

Revoca un certificado existente marcándolo como `is_revoked: true`.

**Parámetros de ruta**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `id` | `number` | ID del certificado a revocar |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Certificado revocado correctamente |
| `404` | Certificado no encontrado |
| `500` | Error interno del servidor |

**Ejemplo de respuesta exitosa**

```json
{
  "message": "Certificate revoked successfully",
  "certificate": {
    "id": 7,
    "is_revoked": true
  }
}
```

---

### Notas generales

- Las wallets (`student_wallet_address`, `issuer_wallet_address`) son normalizadas a minúsculas antes de cualquier operación en base de datos.
- El endpoint `POST /database` valida que la `issuer_wallet_address` comience con `0x` y que exista en la tabla de emisores autorizados antes de registrar el certificado.
- Los endpoints de base de datos incluyen la relación con el modelo `Issuer`, que a su vez incluye los campos `name`, `lastname` y `email` del `User` asociado.

## Issuers Endpoints (issuers.js)

Base path: `/api/issuers`

---

### GET `/api/issuers`

Retorna la lista de todos los emisores registrados, incluyendo los datos del usuario asociado.

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Lista de emisores |
| `500` | Error al obtener los emisores |

**Ejemplo de respuesta exitosa**

```json
{
  "issuers": [
    {
      "id": 1,
      "wallet_address": "0x...",
      "organization_name": "Universidad HackChain",
      "user": {
        "id": 3,
        "wallet_address": "0x...",
        "name": "Ana",
        "lastname": "López",
        "email": "ana@hackchain.io",
        "is_active": true,
        "created_at": "2025-01-10T08:00:00.000Z"
      },
      "created_at": "2025-01-10T08:00:00.000Z"
    }
  ]
}
```

---

### POST `/api/issuers/authorize`

Envía una transacción a la blockchain para autorizar a una wallet como emisor de certificados.

**Headers**

| Header | Valor |
|---|---|
| `Content-Type` | `application/json` |

**Body**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `issuer` | `string` | ✅ | Wallet address del emisor a autorizar (`0x...`) |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Emisor autorizado. Retorna el hash de la transacción |
| `400` | Wallet del emisor no proporcionada |
| `500` | Error en la transacción o en el servicio |

**Ejemplo de respuesta exitosa**

```json
{
  "succes": true,
  "txHash": "0xabc123..."
}
```

---

### POST `/api/issuers/mint`

Valida que el estudiante y el emisor (profesor) existen en la base de datos antes de proceder con el minteo de un certificado NFT.

**Headers**

| Header | Valor |
|---|---|
| `Content-Type` | `application/json` |

**Body**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `studentWalletAddress` | `string` | ✅ | Wallet del estudiante |
| `professor` | `string` | ✅ | Wallet del emisor (profesor) |
| `tokenUri` | `string` | ✅ | URI del metadata del certificado en IPFS (`ipfs://...`) |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Validación correcta. Retorna `ok: true` y el `tokenUri` |
| `400` | Campos requeridos faltantes |
| `404` | Estudiante o emisor no encontrado |
| `500` | Error en la validación |

**Ejemplo de respuesta exitosa**

```json
{
  "ok": true,
  "tokenUri": "ipfs://Qm..."
}
```

---

### GET `/api/issuers/:wallet_address`

Obtiene el detalle completo de un emisor por su wallet address, incluyendo su usuario y los certificados emitidos.

**Parámetros de ruta**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `wallet_address` | `string` | Wallet address del emisor |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Detalle del emisor con usuario y certificados |
| `404` | Emisor no encontrado |
| `500` | Error al obtener el emisor |

**Ejemplo de respuesta exitosa**

```json
{
  "issuer": {
    "id": 1,
    "wallet_address": "0x...",
    "organization_name": "Universidad HackChain",
    "user": {
      "id": 3,
      "name": "Ana",
      "lastname": "López",
      "email": "ana@hackchain.io",
      "is_active": true,
      "created_at": "2025-01-10T08:00:00.000Z"
    },
    "certificates": [
      {
        "id": 7,
        "title": "Blockchain Basics",
        "description": "Certificado Tokenizado HackChain",
        "issue_date": "2025-01-15",
        "is_revoked": false,
        "created_at": "2025-01-15T10:00:00.000Z"
      }
    ],
    "created_at": "2025-01-10T08:00:00.000Z"
  }
}
```

---

### PUT `/api/issuers/:wallet_address`

Actualiza el nombre de organización de un emisor.

**Parámetros de ruta**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `wallet_address` | `string` | Wallet address del emisor a actualizar |

**Headers**

| Header | Valor |
|---|---|
| `Content-Type` | `application/json` |

**Body**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `organization_name` | `string` | ✅ | Nuevo nombre de la organización |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Emisor actualizado correctamente |
| `404` | Emisor no encontrado |
| `500` | Error al actualizar |

**Ejemplo de respuesta exitosa**

```json
{
  "message": "Issuer updated successfully"
}
```

---

### POST `/api/issuers/increment-certificates`

Incrementa en 1 el contador de certificados emitidos por un emisor. Debe llamarse cada vez que se emite un certificado nuevo.

**Headers**

| Header | Valor |
|---|---|
| `Content-Type` | `application/json` |

**Body**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `issuerWallet` | `string` | ✅ | Wallet address del emisor |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Contador incrementado correctamente |
| `400` | Wallet del emisor no proporcionada |
| `500` | Error en el servidor |

**Ejemplo de respuesta exitosa**

```json
{
  "success": true
}
```

---

### GET `/api/issuers/:wallet/busy-slots`

Retorna los slots de tiempo ocupados de un educador (solicitudes pendientes o confirmadas). Endpoint público — usado por el talento para deshabilitar horarios ya reservados al agendar una clase.

**Parámetros de ruta**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `wallet` | `string` | Wallet address del educador (0x…, 42 caracteres) |

**Autenticación**: No requerida.

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Lista de slots ocupados |
| `400` | Wallet address inválida |
| `500` | Error interno |

**Ejemplo de respuesta exitosa**

```json
{
  "slots": [
    { "date": "2026-07-10", "startTime": "10:00", "durationMinutes": 60 },
    { "date": "2026-07-12", "startTime": "15:00", "durationMinutes": 90 }
  ]
}
```

---

### GET `/api/issuers/:wallet/certificates-count`

Retorna el total de certificados emitidos por un emisor.

**Parámetros de ruta**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `wallet` | `string` | Wallet address del emisor |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Total de certificados emitidos |
| `500` | Error al obtener el conteo (retorna `total: 0`) |

**Ejemplo de respuesta exitosa**

```json
{
  "total": 12
}
```

---

### Notas generales

- Las wallets son normalizadas a minúsculas (`.toLowerCase()`) en los endpoints `POST /mint`, `POST /increment-certificates` y `GET /:wallet/certificates-count` antes de consultar la base de datos.
- El endpoint `GET /:wallet_address` incluye tanto el `User` asociado al emisor como todos sus `Certificates`.
- `POST /authorize` delega la lógica de blockchain al servicio `authorizeIssuer`.
- `POST /mint` solo realiza validaciones previas al minteo; el minteo real ocurre en el frontend o en un servicio externo.
- Si un emisor no tiene certificados registrados, `GET /:wallet/certificates-count` retorna `{ "total": 0 }` sin error.

## OpenSea Endpoints (opensea.js)

Base path: `/api/opensea`

> Todos los endpoints consumen la API de OpenSea v2 autenticada mediante `OPENSEA_API_KEY`. El contrato NFT utilizado es el definido en la variable de entorno `VITE_CONTRACT_ADDRESS`.

---

### GET `/api/opensea/collection/:slug`

Obtiene la información de una colección de OpenSea a partir de su slug.

**Parámetros de ruta**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `slug` | `string` | Identificador único de la colección en OpenSea |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Datos de la colección retornados por OpenSea |
| `500` | Error al consultar la API de OpenSea |

**Ejemplo de respuesta exitosa**

```json
{
  "name": "HackChain First Version",
  "slug": "hackchainfirstversion",
  "description": "...",
  "owner": "0x...",
  ...
}
```

---

### POST `/api/opensea/certificates`

Obtiene los certificados NFT asociados a una wallet, filtrando únicamente los pertenecientes a la colección `hackchainfirstversion` y ordenándolos del más reciente al más antiguo.

**Headers**

| Header | Valor |
|---|---|
| `Content-Type` | `application/json` |

**Body**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `address` | `string` | ✅ | Wallet address del titular de los NFTs |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Lista de certificados NFT filtrados y ordenados |
| `500` | Error al consultar la API de OpenSea |

**Ejemplo de respuesta exitosa**

```json
[
  {
    "identifier": "42",
    "collection": "hackchainfirstversion",
    "contract": "0x...",
    "token_standard": "erc721",
    "name": "Certificate for Juan Pérez",
    "mint_date": "2025-01-15T10:00:00.000Z",
    ...
  }
]
```

> Los NFTs se filtran por `nft.collection === "hackchainfirstversion"` y se ordenan por `created_at` o `mint_date` de forma descendente.

---

### GET `/api/opensea/certificate/:tokenId`

Genera y retorna la URL de OpenSea para un certificado NFT dado su `tokenId`. No realiza llamadas externas.

**Parámetros de ruta**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `tokenId` | `string` \| `number` | ID del token NFT |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | URL de OpenSea generada junto con los datos del contrato |
| `500` | Error al generar la URL |

**Ejemplo de respuesta exitosa**

```json
{
  "contract_address": "0x61d2e94543dd498b7fd86450f1fc8135cb60021c",
  "token_id": "42",
  "opensea_url": "https://opensea.io/assets/matic/0x61d2e94543dd498b7fd86450f1fc8135cb60021c/42"
}
```

---

### GET `/api/opensea/certificates/:educator`

Cuenta el total de certificados NFT emitidos por un educador específico. Recorre todos los NFTs del contrato, descarga sus metadatos desde IPFS y filtra por el atributo `Professor`.

**Parámetros de ruta**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `educator` | `string` | Nombre del educador tal como aparece en el atributo `Professor` de los metadatos |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Total de certificados emitidos por el educador |
| `500` | Error en la consulta (retorna `total: 0`) |

**Ejemplo de respuesta exitosa**

```json
{
  "total": 7
}
```

> Este endpoint puede ser lento ya que descarga y parsea los metadatos IPFS de cada NFT del contrato. Los NFTs sin `metadata_url` o con respuestas no JSON son ignorados silenciosamente.

---

### Notas generales

- La colección fija utilizada para filtrar certificados en `POST /certificates` es `hackchainfirstversion`.
- El `CONTRACT_ADDRESS` se toma de `VITE_CONTRACT_ADDRESS` y se normaliza a minúsculas al iniciar el servidor.
- Las URLs de OpenSea generadas apuntan a la red `matic` (Polygon).
- `GET /certificates/:educator` realiza la comparación de nombres de forma insensible a mayúsculas y espacios (`trim().toLowerCase()`).
- `GET /certificates/:educator` consulta hasta 200 NFTs del contrato en una sola llamada a la API de OpenSea.

## Profile Endpoints (profile.js)

Base path: `/api/profile`

> Todos los endpoints requieren autenticación mediante Bearer token (JWT).

---

### GET `/api/profile/me`

Retorna el perfil del usuario autenticado.

**Autenticación:** Bearer token requerido.

**Headers**

| Header | Valor |
|---|---|
| `Authorization` | `Bearer <token>` |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Datos del perfil del usuario autenticado |
| `401` | Token ausente o inválido |
| `500` | Error interno del servidor |

---

### PUT `/api/profile/me`

Actualiza los datos del perfil del usuario autenticado. Todos los campos son opcionales.

**Autenticación:** Bearer token requerido.

**Headers**

| Header | Valor |
|---|---|
| `Authorization` | `Bearer <token>` |
| `Content-Type` | `application/json` |

**Body**

| Campo | Tipo | Requerido | Validación | Descripción |
|---|---|---|---|---|
| `name` | `string` | ❌ | Mínimo 1 caracter | Nombre del usuario |
| `lastName` | `string` | ❌ | Mínimo 1 caracter | Apellido del usuario |
| `age` | `integer` | ❌ | Entero ≥ 0 | Edad del usuario |
| `bio` | `string` | ❌ | Máximo 500 caracteres | Biografía del usuario |
| `email` | `string` | ❌ | Formato email válido | Correo electrónico |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Perfil actualizado correctamente |
| `401` | Token ausente o inválido |
| `422` | Error de validación en algún campo |
| `500` | Error interno del servidor |

---

### GET `/api/profile/settings`

Alias de `GET /api/profile/me`. Retorna el perfil del usuario autenticado.

**Autenticación:** Bearer token requerido.

**Headers**

| Header | Valor |
|---|---|
| `Authorization` | `Bearer <token>` |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Datos del perfil del usuario autenticado |
| `401` | Token ausente o inválido |
| `500` | Error interno del servidor |

---

### PUT `/api/profile/settings`

Alias de `PUT /api/profile/me`. Actualiza los datos del perfil del usuario autenticado. Todos los campos son opcionales.

**Autenticación:** Bearer token requerido.

**Headers**

| Header | Valor |
|---|---|
| `Authorization` | `Bearer <token>` |
| `Content-Type` | `application/json` |

**Body**

| Campo | Tipo | Requerido | Validación | Descripción |
|---|---|---|---|---|
| `name` | `string` | ❌ | Mínimo 1 caracter | Nombre del usuario |
| `lastName` | `string` | ❌ | Mínimo 1 caracter | Apellido del usuario |
| `bio` | `string` | ❌ | Máximo 500 caracteres | Biografía del usuario |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Perfil actualizado correctamente |
| `401` | Token ausente o inválido |
| `422` | Error de validación en algún campo |
| `500` | Error interno del servidor |

---

### Notas generales

- Los endpoints `/me` y `/settings` son funcionalmente equivalentes; `/settings` existe como alias para mayor claridad semántica en el contexto de configuración de cuenta.
- La lógica de lectura y actualización está delegada al controlador `profileController` (`getMe` y `updateMe`).
- `PUT /settings` acepta un subconjunto de los campos de `PUT /me` (no incluye `age` ni `email`).


## Recruiters Endpoints (recruiters.js)

Base path: `/api/recruiters`

---

### GET `/api/recruiters`

Retorna la lista de todos los reclutadores registrados, incluyendo los datos del usuario asociado.

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Lista de reclutadores |
| `500` | Error al obtener los reclutadores |

**Ejemplo de respuesta exitosa**

```json
{
  "recruiters": [
    {
      "id": 1,
      "wallet_address": "0x...",
      "company_name": "TechCorp S.A.",
      "user": {
        "id": 5,
        "wallet_address": "0x...",
        "name": "Carlos",
        "lastname": "Méndez",
        "email": "carlos@techcorp.com",
        "is_active": true,
        "created_at": "2025-01-10T08:00:00.000Z"
      },
      "created_at": "2025-01-10T08:00:00.000Z"
    }
  ]
}
```

---

### POST `/api/recruiters/dashboard`

Verifica que la wallet pertenece a un reclutador registrado y retorna la lista completa de estudiantes con su campo de estudio y nombre.

**Headers**

| Header | Valor |
|---|---|
| `Content-Type` | `application/json` |

**Body**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `wallet_address` | `string` | ✅ | Wallet address del reclutador |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Lista de estudiantes |
| `404` | Reclutador no encontrado |
| `500` | Error al obtener la lista |

**Ejemplo de respuesta exitosa**

```json
[
  {
    "field_of_study": "Ingeniería en Software",
    "wallet_address": "0x...",
    "created_at": "2025-02-01T09:00:00.000Z",
    "User": {
      "name": "Laura",
      "lastname": "Gómez"
    }
  }
]
```

---

### GET `/api/recruiters/:wallet_address`

Obtiene el detalle de un reclutador específico por su wallet address.

**Parámetros de ruta**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `wallet_address` | `string` | Wallet address del reclutador |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Detalle del reclutador con su usuario asociado |
| `404` | Reclutador no encontrado |
| `500` | Error al obtener el reclutador |

**Ejemplo de respuesta exitosa**

```json
{
  "recruiter": {
    "id": 1,
    "wallet_address": "0x...",
    "company_name": "TechCorp S.A.",
    "user": {
      "id": 5,
      "wallet_address": "0x...",
      "name": "Carlos",
      "lastname": "Méndez",
      "email": "carlos@techcorp.com",
      "is_active": true,
      "created_at": "2025-01-10T08:00:00.000Z"
    },
    "created_at": "2025-01-10T08:00:00.000Z"
  }
}
```

---

### PUT `/api/recruiters/:wallet_address`

Actualiza el nombre de empresa de un reclutador.

**Parámetros de ruta**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `wallet_address` | `string` | Wallet address del reclutador a actualizar |

**Headers**

| Header | Valor |
|---|---|
| `Content-Type` | `application/json` |

**Body**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `company_name` | `string` | ✅ | Nuevo nombre de la empresa |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Reclutador actualizado correctamente |
| `404` | Reclutador no encontrado |
| `500` | Error al actualizar |

**Ejemplo de respuesta exitosa**

```json
{
  "message": "Recruiter updated successfully"
}
```

---

### Notas generales

- Las wallets son normalizadas a minúsculas (`.toLowerCase()`) en todos los endpoints antes de realizar consultas a la base de datos.
- `POST /dashboard` actúa como un endpoint protegido por validación de wallet: solo retorna datos si la wallet pertenece a un reclutador registrado, pero no requiere JWT.
- La lista de estudiantes retornada por `/dashboard` incluye todos los estudiantes del sistema, sin filtros adicionales.

## Sessions Endpoints (sessions.js)

Base path: `/api/sessions`

---

### POST `/api/sessions`

Crea una nueva sesión para un usuario a partir de su wallet address. Verifica que el usuario exista y esté activo antes de generar la sesión.

**Headers**

| Header | Valor |
|---|---|
| `Content-Type` | `application/json` |

**Body**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `wallet_address` | `string` | ✅ | Wallet address del usuario |
| `expires_in_hours` | `number` | ❌ | Duración de la sesión en horas (por defecto: `24`) |

**Respuestas**

| Código | Descripción |
|---|---|
| `201` | Sesión creada correctamente |
| `400` | Wallet address no proporcionada |
| `403` | Cuenta de usuario inactiva |
| `404` | Usuario no encontrado |
| `500` | Error al crear la sesión |

**Ejemplo de respuesta exitosa**

```json
{
  "message": "Session created successfully",
  "session": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "wallet_address": "0x...",
    "expires_at": "2025-01-16T10:00:00.000Z",
    "created_at": "2025-01-15T10:00:00.000Z"
  }
}
```

---

### GET `/api/sessions/:session_id`

Obtiene la información de una sesión activa. Si la sesión está expirada, la elimina automáticamente y retorna error.

**Parámetros de ruta**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `session_id` | `string` (UUID) | ID único de la sesión |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Sesión válida. Retorna datos de sesión y usuario asociado |
| `401` | Sesión expirada (es eliminada automáticamente) |
| `404` | Sesión no encontrada |
| `500` | Error al obtener la sesión |

**Ejemplo de respuesta exitosa**

```json
{
  "session": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "wallet_address": "0x...",
    "expires_at": "2025-01-16T10:00:00.000Z",
    "created_at": "2025-01-15T10:00:00.000Z",
    "user": {
      "wallet_address": "0x...",
      "role": "Student",
      "name": "Juan",
      "lastname": "Pérez",
      "email": "juan@ejemplo.com",
      "is_active": true
    }
  }
}
```

---

### DELETE `/api/sessions/:session_id`

Elimina una sesión específica (logout). 

**Parámetros de ruta**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `session_id` | `string` (UUID) | ID único de la sesión a eliminar |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Sesión eliminada correctamente |
| `404` | Sesión no encontrada |
| `500` | Error al eliminar la sesión |

**Ejemplo de respuesta exitosa**

```json
{
  "message": "Session deleted successfully"
}
```

---

### DELETE `/api/sessions/user/:wallet_address`

Elimina todas las sesiones activas de un usuario. Útil para forzar cierre de sesión en todos los dispositivos.

**Parámetros de ruta**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `wallet_address` | `string` | Wallet address del usuario |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Sesiones eliminadas. Incluye el conteo de sesiones borradas |
| `500` | Error al eliminar las sesiones |

**Ejemplo de respuesta exitosa**

```json
{
  "message": "3 sessions deleted successfully"
}
```

---

### DELETE `/api/sessions/cleanup/expired`

Elimina todas las sesiones expiradas de la base de datos. Endpoint de mantenimiento.

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Sesiones expiradas eliminadas. Incluye el conteo de registros borrados |
| `500` | Error al realizar la limpieza |

**Ejemplo de respuesta exitosa**

```json
{
  "message": "12 expired sessions cleaned up"
}
```

---

### Notas generales

- Los IDs de sesión son UUIDs generados con `crypto.randomUUID()`.
- `GET /:session_id` verifica la expiración en cada consulta y destruye la sesión si ya venció, retornando `401`.
- `DELETE /user/:wallet_address` retorna `200` incluso si el usuario no tenía sesiones activas (el conteo será `0`).
- `DELETE /cleanup/expired` está pensado para ejecutarse periódicamente (cron job o tarea programada) y no requiere autenticación en su implementación actual.
- Ninguno de estos endpoints valida JWT; la autenticación se basa en la existencia y vigencia del `session_id`.

## Students Endpoints (students.js)

Base path: `/api/students`

---

### GET `/api/students`

Retorna la lista de todos los estudiantes registrados, incluyendo su usuario asociado y el total de certificados emitidos.

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Lista de estudiantes |
| `500` | Error al obtener los estudiantes |

**Ejemplo de respuesta exitosa**

```json
{
  "students": [
    {
      "id": 1,
      "wallet_address": "0x...",
      "field_of_study": "Ingeniería en Software",
      "user": {
        "id": 4,
        "wallet_address": "0x...",
        "name": "Laura",
        "lastname": "Gómez",
        "email": "laura@ejemplo.com",
        "is_active": true,
        "created_at": "2025-01-10T08:00:00.000Z"
      },
      "total_certificates": 3,
      "created_at": "2025-01-10T08:00:00.000Z"
    }
  ]
}
```

> Si el estudiante no tiene campo de estudio registrado, `field_of_study` retorna `"N/A"`.

---

### GET `/api/students/:wallet_address`

Obtiene el detalle de un estudiante específico por su wallet address, incluyendo su usuario y el conteo exacto de certificados.

**Parámetros de ruta**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `wallet_address` | `string` | Wallet address del estudiante |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Detalle del estudiante |
| `404` | Estudiante no encontrado |
| `500` | Error al obtener el estudiante |

**Ejemplo de respuesta exitosa**

```json
{
  "student": {
    "id": 1,
    "wallet_address": "0x...",
    "field_of_study": "Ingeniería en Software",
    "user": {
      "id": 4,
      "wallet_address": "0x...",
      "name": "Laura",
      "lastname": "Gómez",
      "email": "laura@ejemplo.com",
      "is_active": true,
      "created_at": "2025-01-10T08:00:00.000Z"
    },
    "total_certificates": 3,
    "created_at": "2025-01-10T08:00:00.000Z"
  }
}
```

---

### PUT `/api/students/:wallet_address`

Actualiza el campo de estudio de un estudiante.

**Parámetros de ruta**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `wallet_address` | `string` | Wallet address del estudiante a actualizar |

**Headers**

| Header | Valor |
|---|---|
| `Content-Type` | `application/json` |

**Body**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `field_of_study` | `string` | ✅ | Nuevo campo de estudio del estudiante |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Estudiante actualizado correctamente |
| `404` | Estudiante no encontrado |
| `500` | Error al actualizar |

**Ejemplo de respuesta exitosa**

```json
{
  "message": "Student updated successfully"
}
```

---

### Notas generales

- `GET /` calcula `total_certificates` a partir de la longitud del array de certificados cargados por la relación (alias `certificates`).
- `GET /:wallet_address` calcula `total_certificates` con `Certificate.count()` directamente en base de datos, lo que garantiza un conteo preciso independiente del eager loading.
- Ninguno de los endpoints normaliza la wallet a minúsculas en las consultas; se recomienda enviar la wallet en el mismo formato en que fue registrada.

## Upload Endpoints (upload.js)

Base path: `/api/upload`

---

### POST `/api/upload/image`

Sube una imagen a IPFS mediante Pinata y retorna el CID y la URI resultantes. El archivo se procesa en memoria sin escribirse en disco.

**Headers**

| Header | Valor |
|---|---|
| `Content-Type` | `multipart/form-data` |

**Body (form-data)**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `file` | `File` | ✅ | Imagen a subir. Se conserva el nombre original como metadato en Pinata |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Imagen subida correctamente. Retorna `cid` y `uri` |
| `400` | No se proporcionó ningún archivo |
| `500` | Error al subir la imagen a Pinata |

**Ejemplo de respuesta exitosa**

```json
{
  "cid": "Qm...",
  "uri": "ipfs://Qm..."
}
```

---

### Notas generales

- El almacenamiento es en memoria (`multer.memoryStorage()`), por lo que el archivo nunca se escribe en disco.
- El `cid` retornado puede usarse como `imageCID` en el endpoint `POST /api/certificates` para construir los metadatos del certificado.
- El nombre original del archivo (`originalname`) se usa como metadato de Pinata para facilitar su identificación en el panel de administración.

## Users Endpoints (users.js)

Base path: `/api/users`

---

### POST `/api/users/register`

Registra un nuevo usuario en el sistema junto con su entrada específica según el rol (`student`, `issuer` o `recruiter`). Verifica que la wallet no esté previamente registrada.

**Headers**

| Header | Valor |
|---|---|
| `Content-Type` | `application/json` |

**Body**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `wallet_address` | `string` | ✅ | Wallet address del usuario (`0x...`) |
| `role` | `string` | ✅ | Rol del usuario: `student`, `issuer` o `recruiter` |
| `name` | `string` | Según rol | Nombre del usuario (requerido para `student` y `recruiter`) |
| `lastname` | `string` | Según rol | Apellido del usuario (requerido para `student` y `recruiter`) |
| `email` | `string` | ✅ | Correo electrónico (requerido para todos los roles) |
| `organization_name` | `string` | Según rol | Nombre de la organización (requerido para `issuer`) |
| `field_of_study` | `string` | ❌ | Campo de estudio (opcional para `student`; se asigna `"Test participant"` por defecto) |
| `company_name` | `string` | Según rol | Nombre de la empresa (requerido para `recruiter`) |

**Campos requeridos por rol**

| Rol | Campos obligatorios |
|---|---|
| `student` | `wallet_address`, `name`, `lastname`, `email` |
| `issuer` | `wallet_address`, `organization_name`, `email` |
| `recruiter` | `wallet_address`, `name`, `lastname`, `email`, `company_name` |

**Respuestas**

| Código | Descripción |
|---|---|
| `201` | Usuario registrado correctamente |
| `400` | Campos obligatorios faltantes o rol inválido |
| `409` | La wallet ya está registrada |
| `500` | Error al registrar el usuario |

**Ejemplo de respuesta exitosa**

```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "wallet_address": "0x...",
    "role": "student",
    "name": "Laura",
    "lastname": "Gómez",
    "email": "laura@ejemplo.com",
    "nonce": "a3f1c2...",
    "is_active": true
  },
  "roleData": {
    "wallet_address": "0x...",
    "field_of_study": "Test participant"
  }
}
```

---

### GET `/api/users/:wallet_address`

Obtiene el perfil completo de un usuario por su wallet address, incluyendo los datos específicos de su rol.

**Parámetros de ruta**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `wallet_address` | `string` | Wallet address del usuario |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Datos del usuario y su información de rol |
| `404` | Usuario no encontrado |
| `500` | Error al obtener el usuario |

**Ejemplo de respuesta exitosa**

```json
{
  "user": {
    "id": 1,
    "wallet_address": "0x...",
    "role": "student",
    "name": "Laura",
    "lastname": "Gómez",
    "email": "laura@ejemplo.com",
    "is_active": true,
    "created_at": "2025-01-10T08:00:00.000Z"
  },
  "roleData": {
    "wallet_address": "0x...",
    "field_of_study": "Ingeniería en Software"
  }
}
```

> `roleData` contiene el objeto correspondiente al modelo `Student`, `Issuer` o `Recruiter` según el rol del usuario. Retorna `null` si no existe entrada de rol asociada.

---

### PUT `/api/users/:wallet_address`

Actualiza los datos generales del usuario y, si corresponde, los datos específicos de su rol.

**Parámetros de ruta**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `wallet_address` | `string` | Wallet address del usuario a actualizar |

**Headers**

| Header | Valor |
|---|---|
| `Content-Type` | `application/json` |

**Body**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `name` | `string` | ❌ | Nuevo nombre (conserva el actual si no se envía) |
| `lastname` | `string` | ❌ | Nuevo apellido (conserva el actual si no se envía) |
| `email` | `string` | ❌ | Nuevo correo electrónico (conserva el actual si no se envía) |
| `field_of_study` | `string` | ❌ | Nuevo campo de estudio (solo aplica para `student`) |
| `organization_name` | `string` | ❌ | Nuevo nombre de organización (solo aplica para `issuer`) |
| `company_name` | `string` | ❌ | Nuevo nombre de empresa (solo aplica para `recruiter`) |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Usuario actualizado correctamente |
| `404` | Usuario no encontrado |
| `500` | Error al actualizar el usuario |

**Ejemplo de respuesta exitosa**

```json
{
  "message": "User updated successfully"
}
```

---

### POST `/api/users/:wallet_address/nonce`

Genera y almacena un nuevo nonce criptográfico para la wallet del usuario. Utilizado en flujos de verificación de firma (autenticación Web3).

**Parámetros de ruta**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `wallet_address` | `string` | Wallet address del usuario |

**Respuestas**

| Código | Descripción |
|---|---|
| `200` | Nuevo nonce generado |
| `404` | Usuario no encontrado |
| `500` | Error al generar el nonce |

**Ejemplo de respuesta exitosa**

```json
{
  "nonce": "a3f1c2d4e5b6..."
}
```

---

### Notas generales

- La `wallet_address` es normalizada a minúsculas al momento del registro (`wallet_address.toLowerCase()`), pero las consultas posteriores (`GET`, `PUT`, `nonce`) no aplican esta normalización, por lo que se recomienda enviar siempre la wallet en minúsculas.
- Al registrar un `student`, el campo `field_of_study` se inicializa con el valor `"Test participant"` si no se especifica otro.
- El `nonce` generado en el registro y en `POST /nonce` usa `crypto.randomBytes(16)` en formato hexadecimal (32 caracteres). Es empleado típicamente para firmas de mensaje en autenticación Web3.
- `PUT /:wallet_address` solo actualiza los datos de rol si el campo correspondiente está presente en el body (`!== undefined`); si se omite, el dato de rol permanece sin cambios.
