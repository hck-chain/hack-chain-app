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
## Auth Endpoints

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
