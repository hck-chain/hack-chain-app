# HackChain — Architecture

## System Overview

HackChain connects three actors through a web platform and a Polygon blockchain:

1. A **talent (student)** registers, connects an Ethereum wallet, and builds a profile.
2. An **educator (issuer)** registers, is reviewed by an admin, and once approved can issue certificates and offer classes.
3. A **recruiter** browses verified talent profiles and their on-chain credential history.

When an educator issues a certificate, the backend:
- Accepts a PDF and payment transaction hash
- Verifies the HACK token payment on-chain
- Uploads the certificate file to IPFS via Pinata
- Mints a soulbound NFT on Polygon (ERC721, non-transferable)
- Persists the record in PostgreSQL
- Queues a treasury transfer for the educator payout

Certificates are immutable once minted. Revocation burns the token on-chain.

---

## Backend: Clean Architecture

```
HTTP Request
     |
     v
+----------+
|  routes/ |   Defines Express router. No logic — just mounts handlers.
+----------+
     |
     v
+-------------+
| middleware/ |   Cross-cutting concerns: authenticate, requireAdmin,
+-------------+   correlationId, harjootAccess rate-limiting.
     |
     v
+--------------+
| controllers/ |   Receive req/res, call one use case, return HTTP response.
|  (in routes) |   If there is a business-rule if/else here, it is in the
+--------------+   wrong place.
     |
     v
+------------+
| usecases/  |   ALL business logic lives here. Pure functions, no Express,
+------------+   no direct DB imports. Receive dependencies as parameters.
     |
     v
+------------+
| services/  |   External integrations: emailService (Resend), redis,
+------------+   ipfsCertificateUploader (Pinata), paymentService,
                  issuerDiscoveryService, calendarService, userService,
                  studentService, issuerService, adminService.
     |
     v
+----------+
| adapters/ |   Thin wrappers around blockchain providers and third-party
+----------+   APIs (polygonProvider, nftMintAdapter).
     |
     v
+--------+
| models/|   Sequelize model definitions and associations only.
+--------+   No queries outside this layer except through services/usecases.
```

### Golden Rules

- A controller is an HTTP-to-domain translator. It reads request data, calls a use case, and serialises the result. Nothing else.
- A use case does one thing. If its name contains "and", it does two things.
- Use cases receive their dependencies (models, services) as parameters — they never import them directly. This makes them unit-testable without mocking modules.

```js
// Correct: dependencies injected
async function requestClass({ models, studentWallet, issuerWalletAddress, ... }) {
  const issuer = await models.Issuer.findOne({ where: { wallet_address: issuerWalletAddress } });
  // ...
}

// Wrong: direct import couples the use case to the module system
async function requestClass(studentWallet, issuerWalletAddress) {
  const db = require('../models');  // cannot unit-test without module mocking
}
```

### Use Case Inventory

```
usecases/
  classes/
    cancelClassRequest.js
    createIssuerClass.js
    deleteIssuerClass.js
    requestClass.js
    updateClassRequestStatus.js
    updateIssuerClass.js
  referrals/
    approveReferralReview.js
    attachReferralOnRegister.js
    cancelReferral.js
    ensureReferralCode.js
    flushQueuedReferrals.js
    getReferralStats.js
    listMyReferrals.js
    payoutReferralRewards.js
    validateReferralCode.js
```

Harjoot-related use cases live under `harjoot/usecases/` (approveEducator, rejectEducator, issueCertificate, precheckCertificate, inviteTalent, adminStats, listPayments, listTreasuryQueue, markTreasurySent).

---

## Frontend: Container / Presentational Pattern

```
User interaction
      |
      v
+--------+
| pages/ |   Container components. Own state, fire queries via TanStack Query,
+--------+   pass data and handlers down as props. Import services indirectly
              through custom hooks.
      |
      v
+----------+
|  hooks/  |   Extract stateful logic from pages. One hook per responsibility.
+----------+   Call service functions, manage loading/error states, expose
              clean interfaces to pages.
      |
      v
+-------------+
| components/ |   Presentational. Receive props, render UI. No fetching,
+-------------+   no services, no business logic. Fully reusable.
      |
      v
+----------+
| services/|   HTTP calls to the backend. Never called from components
+----------+   directly — always through hooks or pages.
```

### Frontend Folder Structure

```
frontend/src/
  pages/         Container components, one file per route
  components/    Reusable presentational components
  hooks/         Custom hooks (one responsibility each)
  contexts/      Global state (AuthContext, UI preferences)
  services/      HTTP service layer (apiService, adminService, etc.)
  types/         Shared TypeScript interfaces and types
  utils/         Pure helpers (formatDate, resolveIpfs, etc.)
  lib/           Third-party configuration (queryClient, i18n setup)
```

### Data Flow

```
TanStack Query (useQuery/useMutation)
  |
  v
Custom Hook (e.g. useClassRequests)
  |-- calls service function
  |-- manages loading / error / refetch state
  v
Page Component (container)
  |-- receives data from hook
  |-- composes layout from presentational components
  v
Presentational Component
  |-- renders UI from props
  |-- emits user events via callbacks
```

---

## Authentication Flow

HackChain uses wallet-based authentication. There is no password login for the primary flow — users sign a nonce with MetaMask (or any Reown AppKit wallet).

### Wallet Sign-In Sequence

```
1. Frontend calls GET /api/auth/nonce (or reads nonce from login page state)
2. User signs the challenge message with their wallet
3. Frontend POST /api/auth/login { wallet_address, signature }
4. Backend verifies the signature with ethers.verifyMessage()
5. Backend creates/replaces UserSession in DB, caches wallet in Redis
6. Backend sets two httpOnly cookies:
     access_token  — JWT, 15 min, path /
     refresh_token — JWT, 7 days, path /api/auth/refresh
7. Frontend stores { id, role, wallet_address } in AuthContext (memory only, no localStorage)
```

### Token Lifecycle

```
Every authenticated request
  |
  v
authenticate middleware
  |-- reads access_token cookie (falls back to Authorization: Bearer header)
  |-- verifies JWT signature
  |-- checks Redis: sessionExists(wallet)?
  |     YES -> proceed (fast path, ~1ms)
  |     NO  -> query UserSession in DB
  |             FOUND -> warm Redis cache, proceed
  |             NOT FOUND -> 401 Session not found or expired
  v
req.auth = { sub, role, wallet }
```

Access tokens expire in 15 minutes. The frontend calls `POST /api/auth/refresh` (using the httpOnly refresh cookie) to get a new access token without user interaction. The refresh endpoint validates the refresh token, confirms the UserSession still exists in DB, re-fetches the user's current ID to guard against stale tokens, issues a new access cookie, and extends the Redis TTL.

`POST /api/auth/logout` destroys the UserSession in DB, deletes the Redis key, and clears both cookies simultaneously.

### Redis Failure Mode

If Redis is unavailable, `sessionExists()` throws, and the middleware catches it silently and falls back to the DB query. Authentication continues without Redis. There is no crash, no 500, no user impact beyond slightly higher latency.

---

## Blockchain Integration

### HackCertificate (ERC721)

- Deployed on Polygon (mainnet address in `CONTRACT_ADDRESS` env var)
- Soulbound: `transferFrom` and `safeTransferFrom` both revert unconditionally — certificates cannot be transferred
- Issuance: only addresses in `authorizedIssuers` mapping can call `issueCertificate()`
- Revocation: contract owner or the original issuer address can call `revokeCertificate()`, which burns the token and deletes its data
- Metadata: each token stores a `tokenURI` pointing to an `ipfs://` CID

### HackToken (ERC20)

- Symbol: HACK
- Used as the payment token for certificate issuance
- Pausable, with mint and burn capabilities reserved for the owner
- Issuers pay a fixed HACK amount to the treasury wallet before the backend will mint a certificate

### Ethers.js Version Split (Intentional)

| Layer | Ethers version | Reason |
|-------|---------------|--------|
| Frontend (`frontend/`) | v5 (`ethers@^5.7.2`) | Reown AppKit Ethers5 adapter requires v5; the adapter is not compatible with v6 |
| Backend (`backend/`) | v6 (`ethers@^6.x`) | v6 is the current stable release; used for server-side signature verification and contract calls |

This is a known, intentional split. Do not unify versions without verifying Reown AppKit compatibility.

API differences to remember:
- `ethers.utils.formatEther(value)` — v5 (frontend)
- `ethers.formatEther(value)` — v6 (backend)
- `ethers.verifyMessage(message, sig)` — v6 (backend); in v5 this is `ethers.utils.verifyMessage()`

---

## IPFS / Pinata

### Image Upload Flow (Profile Photos)

```
User selects image
  |
  v
POST /api/upload/image (multipart/form-data, field: "file", max 2 MB)
  |-- validateImageBuffer: magic-byte check to reject non-images
  |-- sharp: resize to 400x400, convert to JPEG, quality 85
  |-- pinata.upload.public.file()
  v
Response: { cid, uri: "ipfs://<cid>" }
```

### Certificate Metadata JSON Structure

When an educator issues a certificate via the legacy flow (`POST /api/certificates`), the backend assembles and pins this JSON to IPFS:

```json
{
  "name": "Certificate for <studentName>",
  "description": "",
  "image": "ipfs://<imageCID>",
  "attributes": [
    { "trait_type": "Student",   "value": "<name>" },
    { "trait_type": "Course",    "value": "<course>" },
    { "trait_type": "Professor", "value": "<professor>" },
    { "trait_type": "Date",      "value": "<date>" }
  ]
}
```

The resulting CID becomes the `tokenURI` passed to `issueCertificate()` on the contract.

### tokenURI Convention

All `tokenURI` values stored on-chain follow the format `ipfs://<CID>`. The frontend resolves these for display using the `resolveIpfs()` utility in `frontend/src/lib/ipfs.ts`, which replaces the `ipfs://` scheme with the configured Pinata gateway URL. Never use raw `ipfs://` URIs in `<img>` tags — browsers do not resolve them.

---

## Database

### Connection Strategy

PostgreSQL is hosted on **NeonDB serverless**. Two connection strings are used:

| Variable | Endpoint | Used for |
|----------|----------|---------|
| `DATABASE_URL` | Pooled (PgBouncer) | All application queries |
| `DATABASE_URL_UNPOOLED` | Direct | DDL-only (migration scripts) |

PgBouncer in transaction mode does not support DDL statements (`CREATE TABLE`, `ALTER TABLE`). Migration scripts connect to the direct endpoint to avoid this restriction.

### Model Relationships

```
User (users)
  |-- hasOne Issuer       (wallet_address -> issuers.wallet_address)
  |-- hasOne Student      (wallet_address -> students.wallet_address)
  |-- hasOne Recruiter    (wallet_address -> recruiters.wallet_address)
  |-- hasMany UserSession (wallet_address -> user_sessions.wallet_address)

Issuer (issuers)
  |-- belongsTo User
  |-- hasMany Certificate (wallet_address -> certificates.issuer_wallet_address)

Student (students)
  |-- belongsTo User
  |-- hasMany Certificate (wallet_address -> certificates.student_wallet_address)

Certificate (certificates)
  |-- belongsTo Issuer
  |-- belongsTo Student
  |-- belongsTo Payment (payment_id -> payments.id, Harjoot integration)

IssuerClass (issuer_classes)
  |-- belongs to Issuer implicitly via issuer_wallet_address

ClassRequest (class_requests)
  |-- belongs to User (student) via student_wallet_address
  |-- belongs to Issuer via issuer_wallet_address

Referral (referrals)
  |-- belongs to User (referrer) via referrer_id
  |-- belongs to User (referred) via referred_id

Payment (payments)           — Harjoot integration
TreasuryTransfer (treasury_transfers) — Harjoot integration
TalentInvitation (talent_invitations) — Harjoot integration
IncentivesPoolLedger (incentives_pool_ledger) — Referrals system
UserSession (user_sessions)
```

### Key Model Fields

**User**: `id`, `wallet_address` (unique, 42 chars), `role` (enum: student/issuer/recruiter), `name`, `lastname`, `email`, `nonce` (32-char hex, rotated on each login), `is_active`, `email_verified`, `verification_token`, `educator_approval_status`, `referral_code`

**Issuer**: `wallet_address`, `organization_name`, `certificates_issued`, `photo_url`, `bio`, `knowledge_areas` (JSONB array), `class_settings` (JSONB object)

**Certificate**: `issuer_wallet_address`, `student_wallet_address`, `title`, `certificate_hash` (unique), `blockchain_tx_hash`, `token_id`, `issue_date`, `is_revoked`, `harjoot_verification_id`, `payment_id`

**IssuerClass**: `issuer_wallet_address`, `name`, `description`, `topics` (JSONB), `is_active`

**ClassRequest**: `student_wallet_address`, `issuer_wallet_address`, `issuer_class_id`, `requested_date`, `start_time`, `duration_minutes`, `hourly_rate_usd`, `student_message`, `class_name`, `status` (pending/confirmed/cancelled/completed), `cancellation_reason`

---

## Email

Email is sent via **Resend** SDK (`backend/services/emailService.js`).

### Fire-and-Forget Pattern

All email sends in route handlers are fire-and-forget:

```js
// Email failure must not fail the main response.
Promise.all([...lookupUsers...])
  .then(([educator, student]) => {
    return notifyEducatorClassRequest({ ... });
  })
  .catch((err) => console.error("[email] ...", err));
```

This is intentional. If the email provider is down or the address is invalid, the booking, status update, or registration still succeeds. The error is logged to `console.error` and visible in the host's log stream. There is no retry queue — if you need guaranteed delivery, add one explicitly.

### Notification Events

| Event | Recipient | Trigger |
|-------|-----------|---------|
| Email verification | Talent/Educator | Registration |
| Educator registered | Admins | New educator registration |
| Educator re-applied | Admins | Educator re-submits after rejection |
| Educator approved | Educator | Admin approves |
| Educator rejected | Educator | Admin rejects |
| Class request received | Educator | Student books a class |
| Class request status update | Student | Educator confirms/cancels/completes |
| Class confirmed (calendar invite) | Educator | Educator confirms a class |
| Class cancelled by student | Educator | Student cancels pending request |
| Talent invitation | Unregistered wallet owner | Educator invites via `/invite-talent` |

---

## Certificate Image Generation

The frontend uses **html2canvas** to capture a styled DOM element as a PNG before the educator triggers the mint.

### Capture Flow

```
Educator fills certificate form
  |
  v
CertificateCard component renders with class `.pc-card-wrapper`
  |
  v
Educator clicks "Capture" / "Mint"
  |
  v
Component adds class `.is-capturing` to `.pc-card-wrapper`
  |-- CSS in CertificateCard.css sets `zoom: 1` and adjusts layout
  |   to prevent clipping caused by fractional zoom levels
  |
  v
html2canvas(element, { scale: 2 }) captures the card at 2x resolution
  |
  v
Canvas is converted to Blob and uploaded to backend POST /api/upload/image
  |
  v
IPFS CID returned, stored as imageCID for the metadata JSON
```

### Known Limitation

Browser zoom affects html2canvas output. The `.is-capturing` class resets zoom to 1 and applies compensating padding. If certificate images appear clipped or misaligned, confirm that the `.pc-card-wrapper.is-capturing` CSS rules are present in `CertificateCard.css`. This CSS must not be removed.

Images uploaded to IPFS are permanent. Once a certificate is minted with a given `imageCID`, the image cannot be updated without revoking and re-issuing the certificate.
