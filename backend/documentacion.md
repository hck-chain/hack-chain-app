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


# 🔐 Authentication Module (Auth.js)

Este módulo gestiona el flujo de identidad del sistema, utilizando **JWT (JSON Web Tokens)** y autenticación basada en **Web3 (Wallets)**. Incluye protecciones contra ataques de fuerza bruta y validación estricta de datos.

---

## 🛠 Configuración Técnica

* **Middleware de Seguridad:** `express-rate-limit` (8 peticiones por minuto para login).
* **Hash de Contraseñas:** `bcrypt` (Salt rounds configurables).
* **Validación:** `express-validator`.
* **Identidad:** Basada en la dirección única de la Wallet del usuario.

---

## 📡 Referencia de Endpoints

### 1. Login con Wallet
Autentica a un usuario registrado a través de su dirección pública.

* **URL:** `/api/auth/login`
* **Método:** `POST`
* **Protección:** Rate Limiter activo.
* **Cuerpo (JSON):**
    | Campo | Tipo | Requerido | Descripción |
    | :--- | :--- | :--- | :--- |
    | `wallet_address` | String | Sí | Dirección exacta de 42 caracteres. |
    | `cfToken` | String | Opcional | Token de verificación Cloudflare Turnstile (si está activo). |

* **Respuesta Exitosa (200 OK):**
    ```json
    {
      "message": "Authenticated",
      "token": "eyJhbGciOiJIUzI1...",
      "user": {
        "id": 1,
        "email": "ejemplo@correo.com",
        "role": "issuer",
        "wallet_address": "0x123..."
      }
    }
    ```

---

### 2. Obtener Perfil Actual (Me)
Recupera los datos del usuario logueado extrayendo la wallet desde el token JWT.

* **URL:** `/api/auth/me`
* **Método:** `GET`
* **Autenticación:** Requerida (`Bearer Token`).

* **Respuesta Exitosa (200 OK):**
    ```json
    {
      "modelName": "student",
      "user": {
        "wallet_address": "0xabc...",
        "name": "Nombre Usuario",
        "email": "usuario@mail.com"
      }
    }
    ```

---

### 3. Cambio de Contraseña
Actualiza la contraseña interna asociada al perfil.

* **URL:** `/api/auth/change-password`
* **Método:** `POST`
* **Autenticación:** Requerida (`Bearer Token`).
* **Cuerpo (JSON):**
    ```json
    {
      "currentPassword": "password_actual",
      "newPassword": "nueva_password_min_8"
    }
    ```

* **Respuesta Exitosa (200 OK):**
    ```json
    { "message": "Password updated" }
    ```

---

## 🛡️ Lógica de Seguridad Interna

### **Verificación de Captcha (Turnstile)**
El sistema está preparado para integrar **Cloudflare Turnstile**. Si la variable de entorno `TURNSTILE_SECRET` está configurada, el backend validará el `cfToken` enviado desde el frontend antes de procesar el login.

### **Sanitización de Datos**
Por seguridad, el sistema elimina automáticamente los siguientes campos de cualquier respuesta JSON:
* `passwordHash`
* `privateKey`

### **Gestión de Roles**
El middleware resuelve la identidad buscando en las tablas en este orden:
1.  **Issuers** (Emisores)
2.  **Students** (Estudiantes)
3.  **Recruiters** (Reclutadores)

---

## ⚠️ Códigos de Error

| Código | Error | Causa |
| :--- | :--- | :--- |
| **401** | `Unauthorized` | Token expirado, inexistente o contraseña actual incorrecta. |
| **403** | `Forbidden` | Fallo en la verificación del Captcha. |
| **404** | `Not Found` | La wallet no está asociada a ningún usuario registrado. |
| **422** | `Unprocessable Entity` | Error de validación (ej. wallet no tiene 42 caracteres). |
| **429** | `Too Many Requests` | Superado el límite de 8 intentos de login por minuto. |
| **500** | `Internal Error` | Error crítico en el servidor o base de datos. |
