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

## Architecture Rules

- A controller is an HTTP translator, not a business logic layer. If there is a business-rule conditional in a controller, move it to a use case.
- Use cases receive all dependencies as parameters (repositories, services). They never import models directly. This makes them testable in isolation.
- Services hold external integrations. Use cases call services — services do not call use cases.
- Email notifications follow a fire-and-forget pattern: `Promise.all([...]).then(...).catch(console.error)` after the success response is sent. Email failures never block the main flow.
