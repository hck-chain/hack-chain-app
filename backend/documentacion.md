# HackChain
## Resumen.
HackChain es un ecosistema educativo-laboral que vincula Talento, Educadores y Reclutadores con el fin de promover el aprendizaje constante y la transparencia en los procesos de reclutamiento.
## URL base
https://www.hackchain.app
## Stack tecnologico.
* Lenguaje de programación: Java Script
* Entorno de ejecución: node.js
* Framework: Express
* ORM: Sequelize
* Sistema de gestión de base de datos: PostgreSQL
* Base de datos: Neon DB
* Plataforma donde está desplegado el backend: Render
## Autenticacion.
Para acceder a las rutas protegidas de la API, es obligatorio incluir un JSON Web Token (JWT). El sistema utiliza la wallet contenida en el token para identificar automáticamente tu rol (Issuer, Student o Recruiter) y tus permisos.
### Headers de la petición.
#### Header: Authorization.
* Value: Bearer <TU_TOKEN_JWT>
* Descripción: Obligatorio para rutas protegidas. Es indispensable que el token incluya el prefijo Bearer seguido de un espacio. Si se envía el token solo, el middleware devolverá un error.
#### Header: Content-Type.
* Value: application/json
* Descripción: Necesario en todas las peticiones POST o PUT. Indica al servidor que los datos enviados en el cuerpo tienen formato JSON.
### Especificaciones del token.
* Type: JWT (JSON Web Token).
* Payload esperado: { "wallet": "0x..." }
* Expiración: 1 hora (tiempo configurado por defecto).
* Lógica de Roles: El servidor busca la dirección de la wallet en orden de prioridad: primero en la tabla de Issuers, luego Students y finalmente Recruiters.
### Manejo de errores.
* 401 Unauthorized: * El header de Authorization no existe o no tiene el formato correcto. El token ha expirado o la firma de seguridad no coincide.
* 500 Internal Server Error: * Ocurrió un fallo inesperado al verificar el token o al consultar la base de datos de usuarios.

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

## OpenSea Endpoints

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
