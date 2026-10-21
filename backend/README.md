# HackChain — Backend

Express 5 REST API for the HackChain certification platform. Follows Clean Architecture.

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js >= 18 |
| Framework | Express 5 |
| ORM | Sequelize 6 |
| Database | PostgreSQL on NeonDB (serverless) |
| Cache / Sessions | Redis (Upstash or self-hosted) |
| Auth | JWT (access + refresh tokens) + bcrypt |
| File uploads | Multer + Pinata SDK (IPFS) |
| Email | Resend |
| Blockchain | Ethers.js v6 |
| Rate limiting | express-rate-limit (Redis-backed in production) |
| Tests | Jest + Supertest + SQLite (in-memory) |

## Folder Structure

```
backend/
├── routes/           Express routers — no business logic, route definitions only
├── middleware/        authenticate, requireRole, requireAdmin, rate limiters
├── controllers/       (inline in routes) — translate HTTP to domain, call one use case
├── usecases/          All business logic — pure functions, no Express, no direct DB imports
│   ├── classes/
│   ├── classPayments/       Manual deposit/final payment workflow for class requests
│   ├── certificateConfirmation/  Talent confirmation/flag of an issued certificate
│   └── referrals/
├── services/          External integrations: emailService, redis, ipfsCertificateUploader,
│                      paymentService, issuerDiscoveryService, calendarService
├── adapters/          Thin wrappers around blockchain providers (polygonProvider, nftMintAdapter)
├── models/            Sequelize model definitions and associations only
├── scripts/           One-off migration scripts (idempotent — safe to re-run)
├── workers/           Background processes
└── harjoot/           Payment verification module (internal)
```

## Getting Started

Run from the monorepo root:

```bash
# Install all workspaces
npm install

# Start the backend dev server (port 3001, nodemon)
npm run dev --workspace=backend
```

Or from inside this directory:

```bash
npm run dev
```

## Environment Variables

Create `backend/.env`:

```bash
# Database
DATABASE_URL=postgresql://...              # NeonDB pooled connection string (use for runtime)
DATABASE_URL_UNPOOLED=postgresql://...     # NeonDB direct connection string (use for migrations)

# Authentication
JWT_SECRET=...                             # Secret for signing access tokens (long random string)
JWT_REFRESH_SECRET=...                     # Secret for signing refresh tokens

# Redis
REDIS_URL=redis://...                      # Redis connection URL (rate limiting + session cache)

# IPFS / Pinata
PINATA_API_KEY=...
PINATA_SECRET_KEY=...
PINATA_JWT=...
GATEWAY_URL=https://...                    # Pinata dedicated gateway URL

# Blockchain
POLYGON_RPC_URL=https://...               # Polygon RPC endpoint
PRIVATE_KEY=0x...                          # Backend wallet private key (for contract interactions)
CONTRACT_ADDRESS=0x...                     # HackCertificate contract address
HACK_TOKEN_ADDRESS=0x...                  # HackToken (ERC20) contract address
USDT_CONTRACT_ADDRESS=0x...               # USDT (ERC20) contract address on Polygon — verify against
                                            # PolygonScan directly before setting, never copy from an
                                            # AI-summarized source. Used to verify class-payment wallet
                                            # transfers on-chain (usdtPaymentService.js).
USDT_DECIMALS=6                            # USDT decimals — 6 everywhere it's deployed, kept configurable

# Email
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@hackchain.app

# Misc
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## Available Scripts

```bash
npm run dev      # Start with nodemon (auto-restart on change)
npm start        # Start without nodemon (production)
npm test         # Run Jest test suite
```

## Running Database Migrations

Migrations are standalone scripts in `backend/scripts/`. They are idempotent — running them twice is safe.

```bash
# Add payment-related columns to class_requests
node backend/scripts/migrate-class-requests-add-payment.js

# Add cancellation_reason column to class_requests
node backend/scripts/migrate-class-requests-add-cancellation-reason.js

# Add manual payment-workflow columns to class_requests/certificates and
# create the class_payment_disputes table
node backend/scripts/migrate-class-requests-payment-workflow.js

# Add deposit_tx_hash/final_tx_hash columns to class_requests (USDT wallet payments)
node backend/scripts/migrate-class-requests-usdt-wallet-payment.js

# One-off: rename class_settings.accept_usdc -> accept_usdt on existing issuers
node backend/scripts/migrate-issuer-accept-usdt-rename.js

# Add meeting_url column to class_requests (educator sets a Meet/Zoom/Teams
# link when confirming a class)
node backend/scripts/migrate-class-requests-meeting-url.js

# Add privy_did, integrated_wallet_address and own_wallet_address to users
# (Privy identity layer — wallet_address is left untouched)
node backend/scripts/migrate-privy-identity.js
```

Always use `DATABASE_URL_UNPOOLED` (direct connection) when running migrations. PgBouncer in transaction mode rejects DDL statements.

## Testing

Tests use Jest + Supertest. The database is an in-memory SQLite instance — no external DB required to run tests.

```bash
npm test

# Run a specific test file
npx jest backend/routes/__tests__/classRequests.test.js

# Run tests matching a pattern (use explicit paths to avoid picking up frontend TS files)
npx jest "backend/usecases/classes/__tests__/cancelClassRequest"
```

### Verifying link-privy against a real Postgres (not part of CI)

SQLite cannot reproduce the partial unique indexes on `users`, and `link-privy` can take an email away from another account, so that part is also checked against a real Postgres:

```bash
npm run verify:privy-followup --workspace=backend
```

It runs 16 checks: the partial indexes (NULLs coexist, duplicates are rejected), the retry that completes a pending wallet, the verified email taking priority over an unverified one, the cases where an email must **not** be taken, an account that gets verified between the check and the write, and the rollback when the write fails halfway.

It needs a **local** Postgres on `localhost:5433` (user `postgres`, password `postgres`, database `hackchain`); change that with `VERIFY_DB_HOST`, `VERIFY_DB_PORT`, `VERIFY_DB_USER`, `VERIFY_DB_PASSWORD` and `VERIFY_DB_NAME`. To get one from scratch:

```bash
docker run -d --name hackchain-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=hackchain -p 5433:5432 postgres:16
npm run verify:privy-followup --workspace=backend -- --bootstrap
```

`--bootstrap` creates the `users` table from the Sequelize model when it does not exist and adds the Privy columns and the four partial unique indexes if they are missing (the same DDL as `migrate-email-unique.js` and `migrate-privy-identity.js`). Without it the script only checks that they are there and tells you which migration to run if not. The table built by `--bootstrap` is the model's view of the schema, not necessarily production's.

Safety:

- It **never reads `DATABASE_URL`, `DATABASE_URL_UNPOOLED` or `DB_DATABASE_URL`**, so a production URL in your environment or `.env` is not used. It only accepts `localhost`, `127.0.0.1` or `::1`, and checks the real connection target before touching anything.
- It creates and deletes only its own rows, built from random wallets and emails, so it never touches data that was already there, and it checks that none are left behind.
- It makes no network calls beyond the database, and sends no emails.

## Architecture Rules

- A controller is an HTTP translator, not a business logic layer. If there is a business-rule conditional in a controller, move it to a use case.
- Use cases receive all dependencies as parameters (repositories, services). They never import models directly. This makes them testable in isolation.
- Services hold external integrations. Use cases call services — services do not call use cases.
- Email notifications follow a fire-and-forget pattern: `Promise.all([...]).then(...).catch(console.error)` after the success response is sent. Email failures never block the main flow.
