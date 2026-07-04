# HackChain

HackChain is a blockchain-based certification platform for education. Authorized educators issue certificates as soulbound NFTs (ERC721) on Polygon. Students receive them and build a verifiable credential portfolio. Recruiters explore verified talent profiles.

Three roles:

- **Talent (student)** — registers, connects a wallet, receives certificates, books classes with educators
- **Educator (issuer)** — registers, awaits admin approval, issues certificates, manages a class catalog
- **Recruiter** — registers, browses verified student profiles and their certificate records

---

## Monorepo Structure

```
hack-chain-app/
├── frontend/     React 18 + TypeScript SPA, deployed on Vercel
├── backend/      Express 5 REST API, deployed on Render (or similar Node host)
└── contracts/    Solidity 0.8.24 smart contracts, deployed on Polygon via Foundry
```

Managed with **npm workspaces**. A single `npm install` at the root installs all workspace dependencies.

---

## Prerequisites

| Tool | Minimum version | Notes |
|------|----------------|-------|
| Node.js | 18.0.0 | LTS recommended |
| npm | 8.0.0 | comes with Node 18 |
| Foundry | latest | required for contracts only — install via `curl -L https://foundry.paradigm.xyz \| bash` |

---

## Installation

```bash
# Clone the repository (fork model — see Branch Strategy below)
git clone https://github.com/SH4DY44/hack-chain-app.git
cd hack-chain-app
git remote add upstream https://github.com/hck-chain/hack-chain-app.git

# Install all workspaces at once
npm install
```

---

## Environment Variables

### Backend (`backend/.env`)

```bash
# Database
DATABASE_URL=postgresql://...              # NeonDB pooled connection string (PgBouncer endpoint)
DATABASE_URL_UNPOOLED=postgresql://...     # NeonDB direct connection string, used for DDL migrations only

# Authentication
JWT_SECRET=...                             # Secret for signing access tokens (keep long and random)
JWT_EXPIRES_IN=15m                         # Access token lifetime (default: 15 minutes)
REFRESH_SECRET=...                         # Secret for signing refresh tokens (different from JWT_SECRET)
REFRESH_EXPIRES_IN=7d                      # Refresh token lifetime (default: 7 days)
SALT_ROUNDS=10                             # bcrypt cost factor

# Redis (session cache)
REDIS_URL=redis://...                      # Redis connection string; if absent, session auth falls back to DB

# Blockchain
POLYGON_RPC_URL=https://...               # Polygon RPC endpoint (Amoy testnet or mainnet)
PRIVATE_KEY=0x...                          # Backend wallet private key for contract interactions
CONTRACT_ADDRESS=0x...                     # Deployed HackCertificate contract address

# IPFS / Pinata
PINATA_JWT=...                             # Pinata API JWT token
GATEWAY_URL=https://...                    # Pinata gateway domain (e.g. your-gateway.mypinata.cloud)

# Email (Resend)
RESEND_API_KEY=re_...                      # Resend API key
RESEND_FROM=noreply@hackchain.app          # Sender address configured in Resend

# Frontend URL (used in email links)
FRONTEND_URL=https://www.hackchain.app

# Admin wallets (comma-separated, case-insensitive)
ADMIN_WALLETS=0xabc...,0xdef...            # Wallet addresses with admin panel access
ADMIN_WALLET=0xabc...                      # Legacy single-admin fallback (still supported)

# Cloudflare Turnstile (optional)
TURNSTILE_SECRET=...                       # If set, login endpoint verifies Turnstile token

# Rate limiting / misc
NODE_ENV=production                        # Set to "development" locally
```

### Frontend (`frontend/.env`)

```bash
VITE_API_URL=https://api.hackchain.app     # Backend API base URL
VITE_REOWN_PROJECT_ID=...                  # Reown AppKit project ID (from cloud.reown.com)
VITE_CONTRACT_ADDRESS=0x...               # Deployed HackCertificate contract address
VITE_CHAIN_ID=137                          # Polygon chain ID (137 mainnet, 80002 Amoy testnet)
```

---

## Running Locally

Each workspace has its own dev command. Open three terminals or use a process manager.

```bash
# Terminal 1 — Backend (Express, nodemon)
cd backend
npm run dev

# Terminal 2 — Frontend (Vite dev server)
cd frontend
npm run dev

# Terminal 3 — Contracts (optional, Foundry)
cd contracts
forge build
```

Alternatively, from the monorepo root:

```bash
npm run dev:frontend
npm run dev:backend
```

The frontend Vite dev server starts on `http://localhost:5173` by default. The backend listens on the port defined in `backend/index.js` (typically 3000 or 4000).

---

## Running Tests

```bash
# Backend (Jest + Supertest)
cd backend
npm test

# Frontend (Vitest)
cd frontend
npm test

# Contracts (Forge)
cd contracts
forge test

# Contract coverage
cd contracts
forge coverage
# or from root:
npm run coverage:contracts
```

---

## Database Migrations

Migrations are standalone Node scripts, not Sequelize CLI migrations. Run them once after schema changes:

```bash
cd backend
npm run migrate:issuer-profile        # adds bio, photo_url, knowledge_areas to issuers
npm run migrate:harjoot-phase1        # adds payment, treasury, talent-invitation tables + user columns
npm run migrate:referrals-phase1      # adds referrals, incentives_pool_ledger tables + referral_code column
npm run migrate:issuer-share-count    # adds share_count column to issuers
```

Each script is idempotent — safe to run more than once.

---

## Deployment Overview

### Frontend

Deployed automatically to **Vercel** on push to the main branch. The `frontend/` directory is the Vite build root. Set all `VITE_*` environment variables in the Vercel project settings.

### Backend

Deployed to **Render** (or any Node.js host). The start command is:

```bash
node --max-old-space-size=1536 index.js
```

Set all backend environment variables in the host's dashboard. Run migrations manually after each deploy that includes schema changes.

### Contracts

Contracts are deployed to **Polygon** using Foundry scripts:

```bash
cd contracts
forge script script/Deploy.s.sol --rpc-url $POLYGON_RPC_URL --private-key $PRIVATE_KEY --broadcast
```

Always use **Polygon Amoy testnet** (`POLYGON_RPC_URL` pointing to Amoy, `VITE_CHAIN_ID=80002`) for development and staging. Never deploy to mainnet from a development environment.

---

## Branch Strategy

This repository is a **fork**. The authoritative upstream is `hck-chain/hack-chain-app`. Your origin is `SH4DY44/hack-chain-app`.

```bash
# Set up remotes after cloning
git remote add upstream https://github.com/hck-chain/hack-chain-app.git

# Keep your fork current
git fetch upstream
git rebase upstream/main

# Create a feature branch
git checkout -b feature/my-feature

# Push to your fork, then open a PR from SH4DY44/hack-chain-app to hck-chain/hack-chain-app
git push origin feature/my-feature
```

Rules:
- Always rebase onto `upstream/main`, never `origin/main`
- Never push directly to `main`
- Branch naming: `feature/`, `fix/`, `chore/` prefixes
- Commit format: Conventional Commits (`feat(frontend):`, `fix(backend):`, `refactor(contracts):`)
- Resolve conflicts in translation files carefully — using `--theirs` silently deletes translation keys
