# HackChain

## Summary

HackChain is an educational and professional ecosystem that connects Talent, Educators, and Recruiters with the goal of promoting continuous learning and transparency in recruitment processes.

## Base URL

https://hack-chain-app.onrender.com

## Tech Stack

* Programming language: JavaScript
* Runtime environment: Node.js
* Framework: Express
* ORM: Sequelize
* Database management system: PostgreSQL
* Database: Neon DB
* Backend deployment platform: Render

## Authentication

To access protected API routes, a JSON Web Token (JWT) must be included in every request. The system extracts the wallet from the token to automatically identify the user's role (`issuer`, `student` or `recruiter`) and apply the corresponding permissions.

---

### Required Headers

| Header | Value | Description |
|---|---|---|
| `Authorization` | `Bearer <token>` | Required for protected routes. The `Bearer` prefix followed by a space is mandatory; sending only the token will result in an error. |
| `Content-Type` | `application/json` | Required for `POST` and `PUT` requests. Tells the server that the request body is in JSON format. |

---

### Token Specifications

| Property | Value |
|---|---|
| Type | JWT (JSON Web Token) |
| Payload | `{ "wallet": "0x..." }` |
| Expiration | `1h` (configurable via the `JWT_EXPIRES_IN` environment variable) |
| Signing algorithm | Secret key defined in `JWT_SECRET` |

---

### Role Resolution

When an authenticated request is received, the middleware extracts the `wallet` from the payload and searches for it sequentially in the following tables, in order of priority:

1. **Issuers** — if found, the user is treated as a certificate issuer.
2. **Students** — if found, the user is treated as a student.
3. **Recruiters** — if found, the user is treated as a recruiter.

If the wallet is not found in any of the three tables, `getUserFromToken` returns `null`.

---

### Data Returned by Role

Depending on the resolved role, the user object available in the response varies:

**Issuer**
```json
{
  "modelName": "issuer",
  "user": {
    "wallet_address": "0x...",
    "name": "Ana Lopez",
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
    "name": "Laura Gomez",
    "email": "laura@example.com"
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

### Error Handling

| Code | Cause |
|---|---|
| `401 Unauthorized` | The `Authorization` header is missing, incorrectly formatted, or the token is invalid or expired. |
| `500 Internal Server Error` | An unexpected failure occurred while verifying the token or querying the database. |

---

### General Notes

- The wallet in the payload is normalized to lowercase (`.toLowerCase()`) before any database query.
- The `authenticate` middleware attaches the decoded payload to `req.auth`, available to controllers as `{ wallet: "0x..." }`.
- For `issuer` and `recruiter` roles, the `email` field is resolved with priority given to the associated `User`; if not present, the model's own email is used as fallback.
- The `name` field for `recruiter` uses `company_name` as a fallback if the associated `User` has no name registered.

## Auth Endpoints (auth.js)

Base path: `/api/auth`

---

### POST `/api/auth/login`

Authenticates a user by their wallet address. Returns a JWT and basic user data.

**Rate limit:** 8 requests per IP per minute.

**Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `wallet_address` | `string` | YES | Wallet address (exactly 42 characters) |
| `cfToken` | `string` | Conditional | Cloudflare Turnstile token. Required if `TURNSTILE_SECRET` is set in the environment |

**Responses**

| Code | Description |
|---|---|
| `200` | Authentication successful. Returns `token` and `user` |
| `404` | No user associated with this wallet |
| `422` | Field validation error |
| `403` | Invalid or missing captcha (if Turnstile is enabled) |
| `429` | Too many login attempts |
| `500` | Internal server error |

**Successful response example**

```json
{
  "message": "Authenticated",
  "token": "<jwt>",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "Admin",
    "wallet_address": "0x..."
  }
}
```

---

### POST `/api/auth/change-password`

Allows an authenticated user to change their password. Requires the current password to confirm identity.

**Authentication:** Bearer token (JWT) required.

**Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `currentPassword` | `string` | YES | Current password (minimum 6 characters) |
| `newPassword` | `string` | YES | New password (minimum 8 characters) |

**Responses**

| Code | Description |
|---|---|
| `200` | Password updated successfully |
| `401` | Not authenticated, or current password is incorrect |
| `404` | User not found |
| `422` | Field validation error |
| `500` | Internal server error |

---

### GET `/api/auth/me`

Returns the authenticated user's information based on the JWT.

**Authentication:** Bearer token (JWT) required.

**Responses**

| Code | Description |
|---|---|
| `200` | Authenticated user data (includes `email`) |
| `401` | Token missing or invalid |
| `404` | User not found |
| `500` | Internal server error |

**Successful response example**

```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "Admin",
  "wallet_address": "0x..."
}
```

---

### General Notes

- The `passwordHash` and `privateKey` fields are stripped from all responses before being sent to the client.
- The `cfToken` field in `/login` is only validated if `TURNSTILE_SECRET` is defined. If not, the captcha is ignored.
- JWT expiration is configurable via `JWT_EXPIRES_IN` (default `1h`).

## Certificates Endpoints (certificates.js)

Base path: `/api/certificates`

---

### POST `/api/certificates`

Uploads certificate metadata to IPFS via Pinata and returns the generated CID.

**Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | YES | Student name |
| `course` | `string` | YES | Course name |
| `professor` | `string` | YES | Professor name |
| `date` | `string` | YES | Issue date |
| `imageCID` | `string` | YES | CID of the certificate image already uploaded to IPFS |

**Responses**

| Code | Description |
|---|---|
| `200` | Metadata uploaded successfully. Returns `cid` and `uri` |
| `400` | Missing required fields |
| `500` | Error uploading metadata |

**Successful response example**

```json
{
  "cid": "Qm...",
  "uri": "ipfs://Qm..."
}
```

---

### POST `/api/certificates/link`

Generates and validates the OpenSea link for a certificate given its `token_id`.

**Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `token_id` | `string or number` | YES | NFT token ID on the blockchain |

**Responses**

| Code | Description |
|---|---|
| `201` | Link generated and verified successfully |
| `400` | `token_id` not provided |
| `404` | Certificate not found on OpenSea |
| `500` | Internal server error |

**Successful response example**

```json
{
  "message": "Link created",
  "link": "https://opensea.io/item/polygon/0x61d2e94543DD498b7FD86450f1fC8135cB60021C/42"
}
```

---

### POST `/api/certificates/verify`

Verifies the authenticity of a certificate from an OpenSea link.

**Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `link` | `string` | YES | Certificate URL to verify (generated by `/link`) |

**Responses**

| Code | Description |
|---|---|
| `200` | Certificate is authentic |
| `4xx` | Certificate not found or not authentic |
| `500` | Internal server error |

---

### GET `/api/certificates/:cid`

Retrieves certificate metadata stored on IPFS by its CID.

**Route Parameters**

| Parameter | Type | Description |
|---|---|---|
| `cid` | `string` | Content Identifier (CID) of the file on IPFS |

**Responses**

| Code | Description |
|---|---|
| `200` | Certificate metadata |
| `400` | CID not provided |
| `404` | Metadata not found |

---

### POST `/api/certificates/database`

Registers an already-minted certificate in the database. Validates that the issuer is registered as authorized.

**Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `student_wallet_address` | `string` | YES | Student wallet (`0x...`) |
| `issuer_wallet_address` | `string` | YES | Authorized issuer wallet (`0x...`) |
| `title` | `string` | YES | Certificate title |
| `description` | `string` | NO | Description (default: "Certificado Tokenizado HackChain") |
| `certificate_hash` | `string` | NO | Certificate content hash |
| `blockchain_tx_hash` | `string` | NO | Blockchain transaction hash |
| `token_id` | `string or number` | NO | NFT token ID |
| `issue_date` | `string` | NO | Issue date |

**Responses**

| Code | Description |
|---|---|
| `201` | Certificate registered successfully |
| `400` | Missing required fields or invalid wallet |
| `404` | Issuer not registered as authorized |
| `500` | Internal server error |

---

### GET `/api/certificates/database`

Returns all certificates registered in the database, ordered from most recent to oldest. Includes issuer information.

**Responses**

| Code | Description |
|---|---|
| `200` | List of certificates |
| `500` | Internal server error |

---

### GET `/api/certificates/database/:id`

Returns the full detail of a certificate by its database ID.

**Route Parameters**

| Parameter | Type | Description |
|---|---|---|
| `id` | `number` | Certificate ID in the database |

**Responses**

| Code | Description |
|---|---|
| `200` | Certificate detail |
| `404` | Certificate not found |
| `500` | Internal server error |

---

### PUT `/api/certificates/database/:id/revoke`

Revokes an existing certificate by marking it as `is_revoked: true`.

**Route Parameters**

| Parameter | Type | Description |
|---|---|---|
| `id` | `number` | ID of the certificate to revoke |

**Responses**

| Code | Description |
|---|---|
| `200` | Certificate revoked successfully |
| `404` | Certificate not found |
| `500` | Internal server error |

**Successful response example**

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

### General Notes

- Wallets are normalized to lowercase before any database operation.
- `POST /database` validates that `issuer_wallet_address` starts with `0x` and exists in the authorized issuers table.
- Database endpoints include the `Issuer` relationship, which includes `name`, `lastname` and `email` from the associated `User`.

## Issuers Endpoints (issuers.js)

Base path: `/api/issuers`

---

### GET `/api/issuers`

Returns the list of all registered issuers, including the associated user data.

**Responses**

| Code | Description |
|---|---|
| `200` | List of issuers |
| `500` | Error fetching issuers |

---

### POST `/api/issuers/authorize`

Sends a blockchain transaction to authorize a wallet as a certificate issuer.

**Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `issuer` | `string` | YES | Wallet address of the issuer to authorize |

**Responses**

| Code | Description |
|---|---|
| `200` | Issuer authorized. Returns the transaction hash |
| `400` | Issuer wallet not provided |
| `500` | Transaction or service error |

**Successful response example**

```json
{
  "succes": true,
  "txHash": "0xabc123..."
}
```

---

### POST `/api/issuers/mint`

Validates that both the student and the issuer exist in the database before proceeding with the NFT mint.

**Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `studentWalletAddress` | `string` | YES | Student wallet address |
| `professor` | `string` | YES | Issuer (professor) wallet address |
| `tokenUri` | `string` | YES | Certificate metadata URI on IPFS |

**Responses**

| Code | Description |
|---|---|
| `200` | Validation passed. Returns `ok: true` and the `tokenUri` |
| `400` | Missing required fields |
| `404` | Student or issuer not found |
| `500` | Validation error |

---

### GET `/api/issuers/:wallet_address`

Returns the full detail of an issuer by their wallet address, including their user and issued certificates.

**Route Parameters**

| Parameter | Type | Description |
|---|---|---|
| `wallet_address` | `string` | Issuer wallet address |

**Responses**

| Code | Description |
|---|---|
| `200` | Issuer detail with user and certificates |
| `404` | Issuer not found |
| `500` | Error fetching issuer |

---

### PUT `/api/issuers/:wallet_address`

Updates the organization name of an issuer.

**Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `organization_name` | `string` | YES | New organization name |

**Responses**

| Code | Description |
|---|---|
| `200` | Issuer updated successfully |
| `404` | Issuer not found |
| `500` | Error updating issuer |

---

### POST `/api/issuers/increment-certificates`

Increments the issued certificates counter for an issuer by 1. Should be called every time a new certificate is minted.

**Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `issuerWallet` | `string` | YES | Issuer wallet address |

**Responses**

| Code | Description |
|---|---|
| `200` | Counter incremented successfully |
| `400` | Issuer wallet not provided |
| `500` | Server error |

---

### GET `/api/issuers/:wallet/certificates-count`

Returns the total number of certificates issued by an issuer.

**Route Parameters**

| Parameter | Type | Description |
|---|---|---|
| `wallet` | `string` | Issuer wallet address |

**Responses**

| Code | Description |
|---|---|
| `200` | Total certificates issued |
| `500` | Error fetching count (returns `total: 0`) |

**Successful response example**

```json
{
  "total": 12
}
```

---

### General Notes

- Wallets are normalized to lowercase in `POST /mint`, `POST /increment-certificates` and `GET /:wallet/certificates-count`.
- `GET /:wallet_address` includes both the associated `User` and all `Certificates` for the issuer.
- `POST /authorize` delegates blockchain logic to the `authorizeIssuer` service.
- `POST /mint` only performs pre-mint validations; the actual minting happens on the frontend.
- If an issuer has no registered certificates, `GET /:wallet/certificates-count` returns `{ "total": 0 }` without error.

## OpenSea Endpoints (opensea.js)

Base path: `/api/opensea`

> All endpoints consume the OpenSea v2 API authenticated via `OPENSEA_API_KEY`. The NFT contract is defined in `VITE_CONTRACT_ADDRESS`.

---

### GET `/api/opensea/collection/:slug`

Retrieves the information of an OpenSea collection by its slug.

**Route Parameters**

| Parameter | Type | Description |
|---|---|---|
| `slug` | `string` | Unique collection identifier on OpenSea |

**Responses**

| Code | Description |
|---|---|
| `200` | Collection data returned by OpenSea |
| `500` | Error querying the OpenSea API |

---

### POST `/api/opensea/certificates`

Returns the NFT certificates associated with a wallet, filtering only those belonging to the `hackchainfirstversion` collection and ordering them from most recent to oldest.

**Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `address` | `string` | YES | Wallet address of the NFT holder |

**Responses**

| Code | Description |
|---|---|
| `200` | Filtered and sorted list of NFT certificates |
| `500` | Error querying the OpenSea API |

> NFTs are filtered by `nft.collection === "hackchainfirstversion"` and sorted by `created_at` or `mint_date` descending.

---

### GET `/api/opensea/certificate/:tokenId`

Generates and returns the OpenSea URL for an NFT certificate given its `tokenId`. Makes no external calls.

**Route Parameters**

| Parameter | Type | Description |
|---|---|---|
| `tokenId` | `string or number` | NFT token ID |

**Responses**

| Code | Description |
|---|---|
| `200` | Generated OpenSea URL along with contract data |
| `500` | Error generating the URL |

**Successful response example**

```json
{
  "contract_address": "0x61d2e94543dd498b7fd86450f1fc8135cb60021c",
  "token_id": "42",
  "opensea_url": "https://opensea.io/assets/matic/0x61d2e94543dd498b7fd86450f1fc8135cb60021c/42"
}
```

---

### GET `/api/opensea/certificates/:educator`

Counts the total NFT certificates issued by a specific educator by iterating through all contract NFTs and filtering by the `Professor` metadata attribute.

**Route Parameters**

| Parameter | Type | Description |
|---|---|---|
| `educator` | `string` | Educator name as it appears in the `Professor` metadata attribute |

**Responses**

| Code | Description |
|---|---|
| `200` | Total certificates issued by the educator |
| `500` | Query error (returns `total: 0`) |

> This endpoint can be slow since it downloads and parses IPFS metadata for every NFT in the contract. NFTs without a `metadata_url` or with non-JSON responses are silently ignored.

---

### General Notes

- The fixed collection for filtering is `hackchainfirstversion`.
- `CONTRACT_ADDRESS` is normalized to lowercase at server startup.
- OpenSea URLs point to the `matic` (Polygon) network.
- `GET /certificates/:educator` compares names case-insensitively with whitespace trimming.
- `GET /certificates/:educator` fetches up to 200 NFTs per call.

## Profile Endpoints (profile.js)

Base path: `/api/profile`

> All endpoints require Bearer token (JWT) authentication.

---

### GET `/api/profile/me`

Returns the authenticated user profile.

**Responses**

| Code | Description |
|---|---|
| `200` | Authenticated user profile data |
| `401` | Token missing or invalid |
| `500` | Internal server error |

---

### PUT `/api/profile/me`

Updates the authenticated user profile. All fields are optional.

**Body**

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `name` | `string` | NO | Min 1 character | First name |
| `lastName` | `string` | NO | Min 1 character | Last name |
| `age` | `integer` | NO | Integer >= 0 | Age |
| `bio` | `string` | NO | Max 500 characters | User bio |
| `email` | `string` | NO | Valid email format | Email address |

**Responses**

| Code | Description |
|---|---|
| `200` | Profile updated successfully |
| `401` | Token missing or invalid |
| `422` | Field validation error |
| `500` | Internal server error |

---

### GET `/api/profile/settings`

Alias for `GET /api/profile/me`.

---

### PUT `/api/profile/settings`

Alias for `PUT /api/profile/me`. Accepts a subset of fields (excludes `age` and `email`).

**Body**

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `name` | `string` | NO | Min 1 character | First name |
| `lastName` | `string` | NO | Min 1 character | Last name |
| `bio` | `string` | NO | Max 500 characters | User bio |

---

### General Notes

- `/me` and `/settings` are functionally equivalent; `/settings` exists as a semantic alias for the account settings context.
- Read and update logic is delegated to `profileController` (`getMe` and `updateMe`).
- `PUT /settings` does not include `age` or `email`.

## Recruiters Endpoints (recruiters.js)

Base path: `/api/recruiters`

---

### GET `/api/recruiters`

Returns the list of all registered recruiters, including associated user data.

**Responses**

| Code | Description |
|---|---|
| `200` | List of recruiters |
| `500` | Error fetching recruiters |

---

### POST `/api/recruiters/dashboard`

Verifies that the wallet belongs to a registered recruiter and returns the full list of students.

**Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `wallet_address` | `string` | YES | Recruiter wallet address |

**Responses**

| Code | Description |
|---|---|
| `200` | List of students |
| `404` | Recruiter not found |
| `500` | Error fetching the list |

---

### GET `/api/recruiters/:wallet_address`

Returns the detail of a specific recruiter by their wallet address.

**Route Parameters**

| Parameter | Type | Description |
|---|---|---|
| `wallet_address` | `string` | Recruiter wallet address |

**Responses**

| Code | Description |
|---|---|
| `200` | Recruiter detail with associated user |
| `404` | Recruiter not found |
| `500` | Error fetching recruiter |

---

### PUT `/api/recruiters/:wallet_address`

Updates the company name of a recruiter.

**Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `company_name` | `string` | YES | New company name |

**Responses**

| Code | Description |
|---|---|
| `200` | Recruiter updated successfully |
| `404` | Recruiter not found |
| `500` | Error updating recruiter |

---

### General Notes

- Wallets are normalized to lowercase across all endpoints.
- `POST /dashboard` validates by wallet without requiring a JWT.
- The student list from `/dashboard` includes all students in the system with no additional filters.

## Sessions Endpoints (sessions.js)

Base path: `/api/sessions`

---

### POST `/api/sessions`

Creates a new session for a user based on their wallet address.

**Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `wallet_address` | `string` | YES | User wallet address |
| `expires_in_hours` | `number` | NO | Session duration in hours (default: 24) |

**Responses**

| Code | Description |
|---|---|
| `201` | Session created successfully |
| `400` | Wallet address not provided |
| `403` | User account is inactive |
| `404` | User not found |
| `500` | Error creating the session |

---

### GET `/api/sessions/:session_id`

Retrieves an active session. If expired, deletes it automatically and returns `401`.

**Route Parameters**

| Parameter | Type | Description |
|---|---|---|
| `session_id` | `string (UUID)` | Unique session ID |

**Responses**

| Code | Description |
|---|---|
| `200` | Valid session with associated user data |
| `401` | Session expired (automatically deleted) |
| `404` | Session not found |
| `500` | Error fetching the session |

---

### DELETE `/api/sessions/:session_id`

Deletes a specific session (logout).

**Responses**

| Code | Description |
|---|---|
| `200` | Session deleted successfully |
| `404` | Session not found |
| `500` | Error deleting the session |

---

### DELETE `/api/sessions/user/:wallet_address`

Deletes all active sessions for a user. Useful for forcing logout across all devices.

**Route Parameters**

| Parameter | Type | Description |
|---|---|---|
| `wallet_address` | `string` | User wallet address |

**Responses**

| Code | Description |
|---|---|
| `200` | Sessions deleted. Includes count of deleted records |
| `500` | Error deleting sessions |

---

### DELETE `/api/sessions/cleanup/expired`

Deletes all expired sessions from the database. Maintenance endpoint.

**Responses**

| Code | Description |
|---|---|
| `200` | Expired sessions deleted. Includes count of deleted records |
| `500` | Error during cleanup |

---

### General Notes

- Session IDs are UUIDs generated with `crypto.randomUUID()`.
- `GET /:session_id` checks expiration on every call and destroys the session if expired.
- `DELETE /user/:wallet_address` returns `200` even if the user had no active sessions.
- `DELETE /cleanup/expired` has no authentication in its current implementation.
- None of these endpoints validate JWTs; authentication relies on the `session_id`.

## Students Endpoints (students.js)

Base path: `/api/students`

---

### GET `/api/students`

Returns all registered students, including their associated user and total certificate count.

**Responses**

| Code | Description |
|---|---|
| `200` | List of students |
| `500` | Error fetching students |

> If a student has no field of study, `field_of_study` returns `"N/A"`.

---

### GET `/api/students/:wallet_address`

Returns the detail of a specific student by their wallet address.

**Route Parameters**

| Parameter | Type | Description |
|---|---|---|
| `wallet_address` | `string` | Student wallet address |

**Responses**

| Code | Description |
|---|---|
| `200` | Student detail |
| `404` | Student not found |
| `500` | Error fetching student |

---

### PUT `/api/students/:wallet_address`

Updates the field of study for a student.

**Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `field_of_study` | `string` | YES | New field of study |

**Responses**

| Code | Description |
|---|---|
| `200` | Student updated successfully |
| `404` | Student not found |
| `500` | Error updating student |

---

### General Notes

- `GET /` calculates `total_certificates` from the length of the certificates array loaded via the relationship alias.
- `GET /:wallet_address` calculates `total_certificates` using `Certificate.count()` directly in the database.
- Wallet normalization is not applied in queries; always send the wallet in the same format used at registration.

## Upload Endpoints (upload.js)

Base path: `/api/upload`

---

### POST `/api/upload/image`

Uploads an image to IPFS via Pinata and returns the resulting CID and URI. The file is processed in memory without being written to disk.

**Headers**

| Header | Value |
|---|---|
| `Content-Type` | `multipart/form-data` |

**Body (form-data)**

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | `File` | YES | Image to upload. The original filename is preserved as Pinata metadata |

**Responses**

| Code | Description |
|---|---|
| `200` | Image uploaded successfully. Returns `cid` and `uri` |
| `400` | No file provided |
| `500` | Error uploading the image to Pinata |

**Successful response example**

```json
{
  "cid": "Qm...",
  "uri": "ipfs://Qm..."
}
```

---

### General Notes

- Storage is in memory (`multer.memoryStorage()`), so the file is never written to disk.
- The `cid` returned can be used as `imageCID` in `POST /api/certificates`.
- The original filename is used as Pinata metadata for easier identification in the admin panel.

## Users Endpoints (users.js)

Base path: `/api/users`

---

### POST `/api/users/register`

Registers a new user in the system along with their role-specific entry. Verifies that the wallet is not already registered.

**Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `wallet_address` | `string` | YES | User wallet address (`0x...`) |
| `role` | `string` | YES | User role: `student`, `issuer` or `recruiter` |
| `name` | `string` | By role | First name (required for `student` and `recruiter`) |
| `lastname` | `string` | By role | Last name (required for `student` and `recruiter`) |
| `email` | `string` | YES | Email address (required for all roles) |
| `organization_name` | `string` | By role | Organization name (required for `issuer`) |
| `field_of_study` | `string` | NO | Field of study (optional for `student`; defaults to "Test participant") |
| `company_name` | `string` | By role | Company name (required for `recruiter`) |

**Required fields by role**

| Role | Required fields |
|---|---|
| `student` | `wallet_address`, `name`, `lastname`, `email` |
| `issuer` | `wallet_address`, `organization_name`, `email` |
| `recruiter` | `wallet_address`, `name`, `lastname`, `email`, `company_name` |

**Responses**

| Code | Description |
|---|---|
| `201` | User registered successfully |
| `400` | Missing required fields or invalid role |
| `409` | Wallet is already registered |
| `500` | Error registering the user |

---

### GET `/api/users/:wallet_address`

Returns the full profile of a user by their wallet address, including role-specific data.

**Route Parameters**

| Parameter | Type | Description |
|---|---|---|
| `wallet_address` | `string` | User wallet address |

**Responses**

| Code | Description |
|---|---|
| `200` | User data and role information |
| `404` | User not found |
| `500` | Error fetching user |

> `roleData` contains the object corresponding to the `Student`, `Issuer` or `Recruiter` model. Returns `null` if no role entry exists.

---

### PUT `/api/users/:wallet_address`

Updates general user data and, if applicable, role-specific data.

**Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | NO | New first name (keeps current if not sent) |
| `lastname` | `string` | NO | New last name (keeps current if not sent) |
| `email` | `string` | NO | New email address (keeps current if not sent) |
| `field_of_study` | `string` | NO | New field of study (`student` only) |
| `organization_name` | `string` | NO | New organization name (`issuer` only) |
| `company_name` | `string` | NO | New company name (`recruiter` only) |

**Responses**

| Code | Description |
|---|---|
| `200` | User updated successfully |
| `404` | User not found |
| `500` | Error updating user |

---

### POST `/api/users/:wallet_address/nonce`

Generates and stores a new cryptographic nonce for the user's wallet. Used in Web3 signature verification flows.

**Route Parameters**

| Parameter | Type | Description |
|---|---|---|
| `wallet_address` | `string` | User wallet address |

**Responses**

| Code | Description |
|---|---|
| `200` | New nonce generated |
| `404` | User not found |
| `500` | Error generating nonce |

**Successful response example**

```json
{
  "nonce": "a3f1c2d4e5b6..."
}
```

---

### General Notes

- `wallet_address` is normalized to lowercase at registration, but subsequent queries do not apply this normalization. Always send the wallet in lowercase.
- When registering a `student`, `field_of_study` defaults to `"Test participant"` if not specified.
- The nonce uses `crypto.randomBytes(16)` in hexadecimal format (32 characters). Used for message signing in Web3 authentication.
- `PUT /:wallet_address` only updates role data if the corresponding field is present in the body; omitted fields remain unchanged.
