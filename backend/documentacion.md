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

- ## Certificates Endpoints (certificates.js)

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
