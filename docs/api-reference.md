# HackChain API Reference

Base URL (production): `https://api.hackchain.app`

All authenticated endpoints read the `access_token` httpOnly cookie set at login. Alternatively, pass `Authorization: Bearer <token>` in the request header.

All responses use `Content-Type: application/json`.

---

## Authentication

### POST /api/auth/login

Authenticate using a wallet signature. Returns access and refresh token cookies.

**Auth required:** No

**Rate limit:** 8 requests per 60 seconds per IP (Redis-backed)

**Request body:**
```json
{
  "wallet_address": "0x...",   // 42-character Ethereum address
  "signature": "0x...",        // Signature of the HackChain nonce challenge message (min 132 chars)
  "cfToken": "..."             // Optional Cloudflare Turnstile token (required if TURNSTILE_SECRET is set)
}
```

**Success 200:**
```json
{
  "message": "Authenticated",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "student",
    "wallet_address": "0x..."
  }
}
```
Sets cookies: `access_token` (15 min), `refresh_token` (7 days, path `/api/auth/refresh`).

**Errors:** 401 Invalid signature, 404 Wallet not registered, 422 Validation errors

---

### POST /api/auth/logout

Destroys the active session in DB and Redis, clears auth cookies.

**Auth required:** Yes (any role)

**Request body:** None

**Success 200:**
```json
{ "message": "Logged out" }
```

---

### POST /api/auth/refresh

Issues a new access token using the refresh token cookie. The refresh token is validated and the UserSession is confirmed in DB before issuing.

**Auth required:** No (reads `refresh_token` cookie)

**Request body:** None

**Success 200:**
```json
{ "message": "Token refreshed" }
```
Sets a new `access_token` cookie.

**Errors:** 401 No refresh token / Invalid or expired / Session expired / User no longer exists

---

### GET /api/auth/me

Returns the authenticated user's profile.

**Auth required:** Yes (any role)

**Success 200:**
```json
{
  "modelName": "student",
  "user": {
    "wallet_address": "0x...",
    "name": "Jane",
    "email": "jane@example.com",
    "email_verified": true
  }
}
```

---

### GET /api/auth/verify-email

Verifies an email address using the token from the verification email.

**Auth required:** No

**Query params:**
- `token` (string, required) — raw token from the email link

**Success 200:**
```json
{ "message": "Email verificado correctamente" }
```

**Errors:** 400 Token required / Token invalid or used / Token expired

---

### POST /api/auth/resend-verification

Resends the verification email to the authenticated user.

**Auth required:** Yes (any role)

**Rate limit:** 3 requests per hour per wallet

**Request body:** None

**Success 200:**
```json
{ "message": "Email de verificación reenviado" }
```

**Errors:** 400 Already verified / No email registered, 502 Email provider error

---

### POST /api/auth/change-password

Changes the authenticated user's password.

**Auth required:** Yes (any role)

**Request body:**
```json
{
  "currentPassword": "...",   // min 6 chars
  "newPassword": "..."        // min 8 chars
}
```

**Success 200:**
```json
{ "message": "Password updated" }
```

**Errors:** 401 Current password incorrect, 422 Validation errors

---

## Sessions

### POST /api/sessions

Creates a new session for the authenticated wallet.

**Auth required:** Yes (any role)

**Request body:**
```json
{
  "wallet_address": "0x...",     // must match authenticated wallet
  "expires_in_hours": 24         // optional, clamped to 1-24
}
```

**Success 201:**
```json
{
  "message": "Session created successfully",
  "session": {
    "id": "uuid",
    "wallet_address": "0x...",
    "expires_at": "2025-01-01T00:00:00Z",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

---

### GET /api/sessions/:session_id

Returns session info. Only the session owner can access it.

**Auth required:** Yes (owner only)

**Success 200:**
```json
{
  "session": {
    "id": "uuid",
    "wallet_address": "0x...",
    "expires_at": "...",
    "created_at": "...",
    "user": { "wallet_address": "0x...", "role": "student", "name": "...", "lastname": "...", "email": "...", "is_active": true }
  }
}
```

**Errors:** 401 Expired, 403 Not owner, 404 Not found

---

### DELETE /api/sessions/:session_id

Deletes a specific session (logout). Only the session owner can delete it.

**Auth required:** Yes (owner only)

**Success 200:**
```json
{ "message": "Session deleted successfully" }
```

---

### DELETE /api/sessions/user/:wallet_address

Deletes all sessions for the given wallet.

**Auth required:** Yes (owner only — wallet must match authenticated wallet)

**Success 200:**
```json
{ "message": "3 sessions deleted successfully" }
```

---

### DELETE /api/sessions/cleanup/expired

Removes all expired sessions from the database.

**Auth required:** Yes (admin only)

**Success 200:**
```json
{ "message": "12 expired sessions cleaned up" }
```

---

## Certificates

### POST /api/certificates/precheck

Pre-issuance check. Verifies the educator is approved and the talent is registered. Returns the HACK token price and treasury address.

**Auth required:** Yes (issuer role)

**Request body:**
```json
{ "studentWallet": "0x..." }
```

**Success 200:**
```json
{
  "ok": true,
  "price": {
    "amountHack": "100",
    "userPriceUsdCents": 2000,
    "treasuryAddress": "0x...",
    "hackTokenAddress": "0x..."
  },
  "talent": { "wallet_address": "0x...", "name": "..." }
}
```

**Errors:** 403 EDUCATOR_NOT_APPROVED, 404 TALENT_NOT_FOUND, 422 Validation errors

---

### POST /api/certificates/issue

Full certificate issuance. Multipart/form-data.

**Auth required:** Yes (issuer role)

**Rate limit:** 10 per hour per educator wallet

**Request (multipart/form-data):**
- `studentWallet` — 0x-prefixed 40-hex address
- `title` — string, 1-255 chars
- `description` — string, optional, max 2000 chars
- `issue_date` — YYYY-MM-DD
- `paymentTxHash` — 0x-prefixed 32-byte hex transaction hash
- `pdfFile` — binary PDF file, max 10 MB

**Success 200:**
```json
{
  "ok": true,
  "certificate": { "id": 1, "token_id": "123", "title": "...", "issue_date": "..." }
}
```

**Errors:**
- 403 EDUCATOR_NOT_APPROVED / Not an issuer
- 400 pdfFile required
- 409 REPLAY (this payment hash was already used)
- 413 PDF exceeds 10 MB
- 422 WRONG_RECIPIENT / WRONG_SENDER / INSUFFICIENT_AMOUNT / TX_NOT_FOUND / TX_REVERTED / NO_HACK_TRANSFER / validation errors
- 502 IPFS_FAILED / HARJOOT_UPLOAD_FAILED / MINT_FAILED
- 503 RPC_ERROR

---

### POST /api/certificates/invite-talent

Invites an unregistered wallet owner by email to join HackChain. Deduplicates per (educator, wallet) pair.

**Auth required:** Yes (issuer role)

**Rate limit:** 20 per day per educator wallet

**Request body:**
```json
{
  "studentWallet": "0x...",
  "email": "talent@example.com",
  "message": "..."              // optional, max 2000 chars
}
```

**Success 200:**
```json
{
  "message": "Talent invited",
  "invitation": {
    "id": 1,
    "student_wallet_address": "0x...",
    "email": "talent@example.com",
    "status": "pending"
  }
}
```

**Errors:** 403 EDUCATOR_NOT_APPROVED / Not an issuer, 409 INVITE_ALREADY_PENDING, 422 Validation errors

---

### POST /api/certificates

Uploads certificate metadata JSON to Pinata and returns the IPFS CID. Used by the legacy frontend mint flow.

**Auth required:** Yes (issuer role)

**Request body:**
```json
{
  "name": "Jane Doe",
  "course": "Blockchain 101",
  "professor": "Prof. Smith",
  "date": "2025-01-15",
  "imageCID": "Qm..."
}
```

**Success 200:**
```json
{
  "cid": "Qm...",
  "uri": "ipfs://Qm..."
}
```

---

### POST /api/certificates/database

Persists a certificate record in the database after a successful on-chain mint.

**Auth required:** Yes (issuer role)

**Request body:**
```json
{
  "student_wallet_address": "0x...",
  "issuer_wallet_address": "0x...",
  "title": "Blockchain 101",
  "description": "...",
  "certificate_hash": "0x...",
  "blockchain_tx_hash": "0x...",
  "token_id": "123",
  "issue_date": "2025-01-15"
}
```

**Success 201:**
```json
{ "message": "Certificado sincronizado con éxito", "id": 42 }
```

---

### GET /api/certificates/database

Lists all certificates with issuer info.

**Auth required:** Yes (any role)

**Success 200:**
```json
{
  "certificates": [
    {
      "id": 1,
      "issuer_wallet_address": "0x...",
      "title": "...",
      "description": "...",
      "certificate_hash": "...",
      "blockchain_tx_hash": "...",
      "issue_date": "2025-01-15",
      "is_revoked": false,
      "created_at": "...",
      "issuer": { ... }
    }
  ]
}
```

---

### GET /api/certificates/database/:id

Returns a single certificate by database ID.

**Auth required:** No

**Success 200:**
```json
{
  "certificate": {
    "id": 1,
    "token_id": "123",
    "is_revoked": false,
    "issuer": { ... }
  }
}
```

**Errors:** 404 Certificate not found

---

### PUT /api/certificates/database/:id/revoke

Marks a certificate as revoked in the database. Does not call the contract — call `revokeCertificate()` on-chain separately.

**Auth required:** Yes (issuer role, must be the certificate's issuer)

**Request body:** None

**Success 200:**
```json
{
  "message": "Certificate revoked successfully",
  "certificate": { "id": 1, "is_revoked": true }
}
```

**Errors:** 403 Not owner issuer, 404 Not found

---

### GET /api/certificates/:cid

Fetches certificate metadata JSON from IPFS via Pinata gateway.

**Auth required:** No

**Success 200:** Raw metadata JSON object stored at the CID.

**Errors:** 404 Metadata not found

---

### POST /api/certificates/link

Constructs and validates the OpenSea URL for a given token ID.

**Auth required:** No

**Request body:**
```json
{ "token_id": "123" }
```

**Success 201:**
```json
{
  "message": "Link created",
  "link": "https://opensea.io/item/polygon/0x.../123"
}
```

---

### POST /api/certificates/verify

Verifies certificate authenticity by checking if the OpenSea URL resolves.

**Auth required:** No

**Request body:**
```json
{ "link": "https://opensea.io/item/polygon/0x.../123" }
```

**Success 200:**
```json
{ "message": "This certificate is authentic", "authenticity": true }
```

---

## Upload

### POST /api/upload/image

Uploads a profile image to IPFS via Pinata. The image is resized to 400x400 JPEG before upload.

**Auth required:** Yes (any role)

**Rate limit:** 10 per hour per wallet

**Request:** `multipart/form-data`, field name `file`, max 2 MB

**Success 200:**
```json
{
  "cid": "Qm...",
  "uri": "ipfs://Qm..."
}
```

**Errors:** 400 No file, 413 Exceeds 2 MB, 415 Not a valid image

---

## Issuers

### GET /api/issuers

Public paginated educator discovery. Only returns approved educators.

**Auth required:** No

**Query params:**
- `page` — default 1
- `limit` — default 20, max 50
- `area` — free-text filter on knowledge_areas, organization_name, name, lastname

**Success 200:**
```json
{
  "educators": [
    {
      "wallet_address": "0x...",
      "organization_name": "...",
      "name": "...",
      "lastname": "...",
      "photo_url": "ipfs://...",
      "bio": "...",
      "knowledge_areas": ["Blockchain"],
      "certificates_issued": 42,
      "has_classes": true,
      "joined_at": "..."
    }
  ],
  "pagination": { "total": 100, "page": 1, "limit": 20, "pages": 5 }
}
```

---

### GET /api/issuers/featured

Returns a random selection of approved educators for the discovery widget.

**Auth required:** No

**Rate limit:** 60 per minute per IP

**Query params:**
- `count` — number of educators, 1-6, default 3

**Success 200:**
```json
{ "educators": [ { ... } ] }
```

---

### GET /api/issuers/me

Returns the authenticated educator's full profile including email.

**Auth required:** Yes (issuer role)

**Success 200:**
```json
{
  "organization_name": "...",
  "bio": "...",
  "photo_url": "ipfs://...",
  "knowledge_areas": ["..."],
  "wallet_address": "0x...",
  "email": "...",
  "name": "...",
  "lastname": "...",
  "email_verified": true
}
```

---

### PATCH /api/issuers/me

Updates the authenticated educator's profile fields.

**Auth required:** Yes (issuer role)

**Request body (all optional):**
```json
{
  "bio": "...",                      // max 500 chars
  "knowledge_areas": ["Blockchain"], // max 5 items, each max 100 chars
  "organization_name": "..."
}
```

**Success 200:**
```json
{
  "message": "Profile updated",
  "issuer": { "organization_name": "...", "bio": "...", "knowledge_areas": [...], "photo_url": "..." }
}
```

---

### PATCH /api/issuers/me/photo

Updates the educator's profile photo. Accepts only IPFS URIs (upload to `/api/upload/image` first).

**Auth required:** Yes (issuer role)

**Request body:**
```json
{ "photo_url": "ipfs://Qm..." }
```

**Success 200:**
```json
{ "photo_url": "ipfs://Qm..." }
```

**Errors:** 400 Invalid or missing photo_url (must be `ipfs://` URI), 404 Issuer not found

---

### GET /api/issuers/me/status

Returns the educator's current approval status.

**Auth required:** Yes (issuer role)

**Success 200:**
```json
{
  "status": "pending_approval",
  "reason": "...",          // only present when status is "rejected"
  "approved_at": "..."      // only present when status is "approved"
}
```

Status values: `pending_approval`, `approved`, `rejected`

---

### POST /api/issuers/me/reapply

Re-submits an educator for approval after rejection. Resets status to `pending_approval` and notifies admins.

**Auth required:** Yes (issuer role, must be in "rejected" status)

**Rate limit:** 2 per 7 days per educator

**Request body:** None

**Success 200:**
```json
{ "status": "pending_approval" }
```

**Errors:** 409 Not in rejected status

---

### GET /api/issuers/me/classes

Returns the authenticated educator's class settings (JSONB).

**Auth required:** Yes (issuer role)

**Success 200:**
```json
{
  "class_settings": {
    "hourly_rate_usd": 50,
    "accept_usdc": true,
    "durations": [30, 60],
    "availability": {
      "mon": { "enabled": true, "start": "09:00", "end": "17:00" },
      "tue": { "enabled": false }
    },
    "google_calendar_url": "https://calendar.google.com/..."
  }
}
```

---

### PATCH /api/issuers/me/classes

Updates the educator's class settings.

**Auth required:** Yes (issuer role)

**Request body (all optional):**
```json
{
  "hourly_rate_usd": 50,
  "accept_usdc": true,
  "durations": [30, 45, 60],
  "availability": {
    "mon": { "enabled": true, "start": "09:00", "end": "17:00" }
  },
  "google_calendar_url": "https://calendar.google.com/..."
}
```

Validation rules:
- `hourly_rate_usd`: 0-9999
- `durations`: array of unique values from [30, 45, 60]
- `availability`: keys must be `mon`-`sun`; `start` and `end` must be `HH:MM` format; `start` must be before `end`
- `google_calendar_url`: must start with `https://calendar.google.com/` if provided

**Success 200:**
```json
{ "class_settings": { ... } }
```

---

### GET /api/issuers/:wallet_address

Public educator profile. Does not expose email.

**Auth required:** No

**Success 200:**
```json
{
  "issuer": {
    "wallet_address": "0x...",
    "organization_name": "...",
    "name": "...",
    "lastname": "...",
    "photo_url": "...",
    "bio": "...",
    "knowledge_areas": [...],
    "certificates_issued": 42,
    "talents_formed": 18,
    "joined_at": "...",
    "is_approved": true,
    "class_settings": { ... }
  }
}
```

**Errors:** 400 Invalid wallet address, 404 Not found

---

### PUT /api/issuers/:wallet_address

Updates an educator profile. The authenticated wallet must match the path parameter.

**Auth required:** Yes (issuer role, own wallet only)

**Request body:**
```json
{
  "organization_name": "...",
  "bio": "...",
  "knowledge_areas": ["..."]
}
```

**Success 200:**
```json
{ "message": "Issuer updated successfully" }
```

---

### GET /api/issuers/:wallet/certificates-count

Returns the total number of certificates issued by the educator.

**Auth required:** No

**Success 200:**
```json
{ "total": 42 }
```

---

### POST /api/issuers/authorize

Authorizes an issuer on the HackCertificate contract (calls `authorizeIssuer()`). Admin only (legacy ADMIN_WALLET env var).

**Auth required:** Yes (admin wallet only)

**Request body:**
```json
{ "issuer": "0x..." }
```

**Success 200:**
```json
{ "success": true, "txHash": "0x..." }
```

---

### POST /api/issuers/mint

Validates mint parameters before the frontend triggers the contract call. Does not mint — the frontend calls the contract directly.

**Auth required:** Yes (issuer role)

**Request body:**
```json
{
  "studentWalletAddress": "0x...",
  "professor": "0x...",
  "tokenUri": "ipfs://..."
}
```

**Success 200:**
```json
{ "ok": true, "tokenUri": "ipfs://..." }
```

---

### POST /api/issuers/increment-certificates

Increments the `certificates_issued` counter for the educator after a successful mint. The authenticated wallet must match the `issuerWallet` in the body.

**Auth required:** Yes (issuer role, own wallet only)

**Request body:**
```json
{ "issuerWallet": "0x..." }
```

**Success 200:**
```json
{ "success": true }
```

---

### DELETE /api/issuers/me

Hard-deletes the educator account. Requires a wallet signature to confirm intent.

**Auth required:** Yes (issuer role)

**Request body:**
```json
{
  "signature": "0x...",
  "message": "..."
}
```

**Success 204:** No content

**Errors:** 400 Missing fields, 401 Invalid signature

---

## Students

### GET /api/students

Lists all students with user info and certificate count.

**Auth required:** Yes (any role)

**Success 200:**
```json
{
  "students": [
    {
      "id": 1,
      "wallet_address": "0x...",
      "field_of_study": "Computer Science",
      "user": { "id": 1, "wallet_address": "0x...", "name": "...", "email": "..." },
      "total_certificates": 3,
      "created_at": "..."
    }
  ]
}
```

---

### GET /api/students/:wallet_address

Returns a single student's profile and certificate count.

**Auth required:** Yes (any role)

**Success 200:**
```json
{
  "student": {
    "id": 1,
    "wallet_address": "0x...",
    "field_of_study": "...",
    "user": { ... },
    "total_certificates": 3,
    "created_at": "..."
  }
}
```

**Errors:** 404 Not found

---

### GET /api/students/:wallet_address/educators

Returns educators who have issued certificates to this student. Only accessible by the student themselves.

**Auth required:** Yes (own wallet only)

**Success 200:**
```json
{
  "educators": [
    {
      "wallet_address": "0x...",
      "organization_name": "...",
      "name": "...",
      "lastname": "...",
      "photo_url": "...",
      "bio": "...",
      "knowledge_areas": [...],
      "certificates_issued": 42,
      "joined_at": "...",
      "certs_to_me": 2
    }
  ]
}
```

**Errors:** 400 Invalid address, 403 Not own wallet

---

### PUT /api/students/:wallet_address

Updates the student's `field_of_study`.

**Auth required:** Yes (own wallet only)

**Request body:**
```json
{ "field_of_study": "Cybersecurity" }
```

**Success 200:**
```json
{ "message": "Student updated successfully" }
```

---

### DELETE /api/students/me

Hard-deletes the student account. Requires a wallet signature.

**Auth required:** Yes (student role)

**Request body:**
```json
{
  "signature": "0x...",
  "message": "..."
}
```

**Success 200:**
```json
{ "message": "Account deleted successfully" }
```

---

## Recruiters

### GET /api/recruiters

Lists all recruiters. Public endpoint.

**Auth required:** No

**Success 200:**
```json
{
  "recruiters": [
    {
      "id": 1,
      "wallet_address": "0x...",
      "company_name": "Acme Corp",
      "user": { ... },
      "created_at": "..."
    }
  ]
}
```

---

### GET /api/recruiters/:wallet_address

Returns a single recruiter's profile.

**Auth required:** No

**Success 200:**
```json
{
  "recruiter": {
    "id": 1,
    "wallet_address": "0x...",
    "company_name": "...",
    "user": { ... },
    "created_at": "..."
  }
}
```

**Errors:** 404 Not found

---

### POST /api/recruiters/dashboard

Returns the list of all students (for the recruiter talent discovery dashboard).

**Auth required:** Yes (recruiter role)

**Request body:** None (authentication context identifies the recruiter)

**Success 200:** Array of student objects with name and field_of_study.

---

### PUT /api/recruiters/:wallet_address

Updates the recruiter's `company_name`.

**Auth required:** Yes (own wallet only)

**Request body:**
```json
{ "company_name": "Acme Corp" }
```

**Success 200:**
```json
{ "message": "Recruiter updated successfully" }
```

---

## Issuer Classes

### GET /api/issuer-classes/by-wallet/:wallet

Lists active classes for a given educator. Public endpoint.

**Auth required:** No

**Rate limit:** 60 per minute per IP

**Success 200:**
```json
{
  "classes": [
    {
      "id": 1,
      "name": "Intro to Solidity",
      "description": "...",
      "topics": ["ERC721", "Foundry"]
    }
  ]
}
```

---

### GET /api/issuer-classes/mine

Lists all classes (including inactive) for the authenticated educator.

**Auth required:** Yes (issuer role)

**Success 200:**
```json
{
  "classes": [
    {
      "id": 1,
      "name": "...",
      "description": "...",
      "topics": [...],
      "is_active": true,
      "created_at": "..."
    }
  ]
}
```

---

### POST /api/issuer-classes

Creates a new class for the authenticated educator.

**Auth required:** Yes (issuer role)

**Request body:**
```json
{
  "name": "Intro to Solidity",
  "description": "...",
  "topics": ["ERC721", "Foundry"]
}
```

**Success 201:** The created class object.

**Errors:** Per use case validation (e.g. name required, duplicate name)

---

### PATCH /api/issuer-classes/:id

Updates a class. The class must belong to the authenticated educator.

**Auth required:** Yes (issuer role, own class only)

**Request body (all optional):**
```json
{
  "name": "...",
  "description": "...",
  "topics": [...],
  "is_active": false
}
```

**Success 200:** The updated class object.

**Errors:** 403 Not owner, 404 Not found

---

### DELETE /api/issuer-classes/:id

Deletes a class. The class must belong to the authenticated educator.

**Auth required:** Yes (issuer role, own class only)

**Success 204:** No content.

**Errors:** 403 Not owner, 404 Not found

---

## Class Requests

### POST /api/class-requests

Creates a class booking request. Only students can submit requests.

**Auth required:** Yes (student role)

**Rate limit:** 10 per minute per wallet

**Request body:**
```json
{
  "issuer_wallet_address": "0x...",
  "requested_date": "2025-02-10",
  "start_time": "10:00",
  "duration_minutes": 60,
  "hourly_rate_usd": 50,
  "student_message": "...",
  "issuer_class_id": 1,
  "requested_timestamp_utc": "2025-02-10T10:00:00Z"
}
```

**Success 201:** The created class request object.

Fires an email notification to the educator (fire-and-forget — does not block the response).

---

### GET /api/class-requests/pending-count

Returns the count of pending requests for the authenticated educator. Used for the notification badge.

**Auth required:** Yes (issuer role)

**Success 200:**
```json
{ "count": 3 }
```

---

### GET /api/class-requests/mine

Lists all class requests received by the authenticated educator, ordered by date ascending.

**Auth required:** Yes (issuer role)

**Success 200:**
```json
{
  "requests": [
    {
      "id": 1,
      "student_name": "Jane Doe",
      "student_wallet": "0x...",
      "requested_date": "2025-02-10",
      "start_time": "10:00",
      "duration_minutes": 60,
      "hourly_rate_usd": 50,
      "student_message": "...",
      "class_name": "Intro to Solidity",
      "status": "pending",
      "created_at": "..."
    }
  ]
}
```

---

### GET /api/class-requests/sent

Lists all class requests sent by the authenticated student.

**Auth required:** Yes (student role)

**Success 200:**
```json
{
  "requests": [
    {
      "id": 1,
      "issuer_organization": "...",
      "issuer_photo": "ipfs://...",
      "issuer_wallet": "0x...",
      "requested_date": "...",
      "start_time": "...",
      "duration_minutes": 60,
      "hourly_rate_usd": 50,
      "class_name": "...",
      "status": "pending",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

---

### PATCH /api/class-requests/:id/status

Educator updates the status of a class request.

**Auth required:** Yes (issuer role, must own the request)

**Request body:**
```json
{
  "status": "confirmed",
  "cancellation_reason": "..."    // optional, max 500 chars, only used when status is "cancelled"
}
```

Valid status transitions: `pending` -> `confirmed`, `cancelled`, `completed`

**Success 200:** The updated request object.

Fires email notifications to the student (and a calendar invite to the educator if status is `confirmed`), fire-and-forget.

---

### PATCH /api/class-requests/:id/cancel

Student withdraws a pending class request.

**Auth required:** Yes (student role, must own the request)

**Request body:**
```json
{
  "cancellation_reason": "..."    // optional, max 500 chars
}
```

**Success 200:**
```json
{ "id": 1, "status": "cancelled" }
```

Fires an email notification to the educator (fire-and-forget).

---

## Referrals

### GET /api/referrals/validate/:code

Validates a referral code without authentication. Used during registration to show referrer info.

**Auth required:** No

**Rate limit:** 30 per minute per IP

**Path param:** `code` — 8-character Crockford base-32 code (uppercase)

**Success 200:**
```json
{ "valid": true, "referrerName": "...", "code": "ABCD1234" }
```

**Errors:** 400 Malformed code, 404 Code not found

---

### GET /api/referrals/me/code

Returns the authenticated user's referral code, generating one if it does not exist.

**Auth required:** Yes (any role)

**Success 200:**
```json
{
  "code": "ABCD1234",
  "shareUrl": "https://hackchain.app/register?ref=ABCD1234"
}
```

---

### GET /api/referrals/me

Lists the authenticated user's referrals with pagination.

**Auth required:** Yes (any role)

**Query params:**
- `page` — default 1
- `pageSize` — default 10, max 100

**Success 200:**
```json
{
  "referrals": [ { "id": 1, "status": "confirmed", "referred_at": "...", "reward_usd": 5 } ],
  "total": 25,
  "page": 1,
  "pageSize": 10
}
```

---

### GET /api/referrals/me/stats

Returns summary statistics for the authenticated user's referral activity.

**Auth required:** Yes (any role)

**Success 200:**
```json
{
  "totalReferrals": 10,
  "confirmedReferrals": 8,
  "pendingRewards": 15.0,
  "totalEarned": 40.0
}
```

---

## Admin

All admin endpoints require authentication and the `requireAdmin` middleware. Admin wallets are configured via the `ADMIN_WALLETS` environment variable (comma-separated, case-insensitive). The legacy `ADMIN_WALLET` single-value variable is also supported as a fallback.

### GET /api/admin/access

Self-check: returns whether the authenticated wallet has admin access. Always 200 — no admin gate.

**Auth required:** Yes (any role)

**Success 200:**
```json
{ "isAdmin": true }
```

---

### GET /api/admin/educators

Lists issuers with pagination and filters.

**Auth required:** Yes (admin)

**Rate limit:** 120 read requests per minute per admin wallet

**Query params:**
- `status` — `pending_approval` | `approved` | `rejected` | `all` (default: all)
- `search` — free-text substring, max 80 chars
- `page` — default 1
- `limit` — default 25, max 100

**Success 200:**
```json
{
  "items": [ { "id": 1, "name": "...", "email": "...", "organization_name": "...", "educator_approval_status": "pending_approval" } ],
  "total": 50,
  "page": 1,
  "limit": 25,
  "totalPages": 2
}
```

---

### POST /api/admin/educators/:userId/approve

Approves a pending educator. Sends approval email to the educator.

**Auth required:** Yes (admin)

**Rate limit:** 100 write actions per hour per admin wallet

**Path param:** `userId` — positive integer

**Request body:** None

**Success 200:**
```json
{ "message": "Educator approved", "user": { ... } }
```

**Errors:** 404 USER_NOT_FOUND, 400 NOT_AN_ISSUER, 409 ALREADY_APPROVED, 422 Validation

---

### POST /api/admin/educators/:userId/reject

Rejects a pending educator. Requires a reason. Sends rejection email.

**Auth required:** Yes (admin)

**Request body:**
```json
{ "reason": "..." }    // required, max 1000 chars
```

**Success 200:**
```json
{ "message": "Educator rejected", "user": { ... } }
```

**Errors:** 404 USER_NOT_FOUND, 400 NOT_AN_ISSUER, 422 Validation

---

### GET /api/admin/stats

Dashboard counters: educator counts, certificate volume, revenue, treasury queue snapshot.

**Auth required:** Yes (admin)

**Success 200:** Statistics object (counts by educator status, total certificates, revenue figures).

---

### GET /api/admin/payments

Lists payments with date range and wallet filters.

**Auth required:** Yes (admin)

**Query params:**
- `from` — ISO 8601 date (inclusive lower bound on `created_at`)
- `to` — ISO 8601 date (exclusive upper bound)
- `fromWallet` — 0x-prefixed educator wallet
- `status` — payment status string, default `confirmed`
- `page`, `limit` (default 1, 25, max 100)

**Success 200:**
```json
{
  "items": [ { "id": 1, "amount_hack": "100", "status": "confirmed", "created_at": "..." } ],
  "total": 100,
  "page": 1,
  "limit": 25
}
```

---

### GET /api/admin/treasury-queue

Lists treasury transfers pending manual USDT settlement.

**Auth required:** Yes (admin)

**Query params:**
- `status` — default `awaiting_manual_conversion`
- `page`, `limit`

**Success 200:** Paginated treasury transfer list.

---

### POST /api/admin/treasury-queue/:id/mark-sent

Records that a USDT settlement has been sent manually.

**Auth required:** Yes (admin)

**Path param:** `id` — positive integer

**Request body:**
```json
{ "usdtTxHash": "0x..." }    // 0x-prefixed 32-byte hash
```

**Success 200:**
```json
{ "message": "Treasury transfer marked as sent", "transfer": { ... } }
```

**Errors:** 404 NOT_FOUND, 409 ALREADY_SENT / WRONG_STATE

---

### POST /api/admin/referrals/:id/cancel

Cancels a referral flagged for review or in pending status.

**Auth required:** Yes (admin)

**Request body:**
```json
{ "reason": "..." }    // optional
```

**Success 200:**
```json
{ "message": "Referral cancelled", "referral": { ... } }
```

**Errors:** 404 Not found

---

### POST /api/admin/referrals/:id/approve-review

Approves a referral that was flagged for manual review, allowing it to proceed.

**Auth required:** Yes (admin)

**Request body:** None

**Success 200:**
```json
{ "message": "Referral review approved", "referral": { ... } }
```

**Errors:** 404 Not found

---

## OpenSea Metadata

### GET /api/opensea/:tokenId

Returns OpenSea-compatible metadata for a certificate token.

**Auth required:** No

**Success 200:** ERC721 metadata JSON with `name`, `description`, `image`, and `attributes`.

**Errors:** 404 Token not found
