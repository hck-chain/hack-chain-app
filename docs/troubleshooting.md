# HackChain — Troubleshooting Guide

This guide covers issues that developers commonly hit when setting up or working on HackChain for the first time.

---

## Setup Issues

### npm install fails or installs wrong versions

**Symptom:** `npm install` succeeds at the root but packages resolve to unexpected versions, or `npm install` inside a workspace fails.

**Cause:** npm workspaces hoist shared packages to the root `node_modules`. The root `package.json` has React 19 declared as a direct dependency (installed for tooling), while `frontend/package.json` specifies React 18. When both are present, the hoisting algorithm can produce a version that satisfies one workspace but not the other.

**Fix:** Always run `npm install` from the monorepo root, never from inside a workspace. If the state is corrupted:

```bash
# From the monorepo root
rm -rf node_modules frontend/node_modules backend/node_modules
npm install
```

Do not add `--legacy-peer-deps` globally — it masks real conflicts.

---

### Database connection error on startup

**Symptom:** Backend starts and immediately throws `SequelizeConnectionError` or `Error: connect ECONNREFUSED`.

**Cause 1 — Wrong connection string format.** NeonDB requires SSL. The connection string must include `sslmode=require` (the backend normalises this to `sslmode=verify-full` internally). A plain `postgresql://host/db` without SSL will be rejected by NeonDB.

**Fix:** Copy the full connection string from the NeonDB dashboard, including all query parameters. It should look like:

```
postgresql://user:pass@ep-something-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Cause 2 — Using the pooled URL for migrations.** PgBouncer in transaction mode rejects DDL statements. If you run a migration script and it hangs or fails with `cannot run inside a transaction block`, you are using `DATABASE_URL` instead of `DATABASE_URL_UNPOOLED`.

**Fix:** Set both `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct) in `.env`. Migration scripts read `DATABASE_URL_UNPOOLED`. Application queries use `DATABASE_URL`.

---

### Missing environment variable crashes the server

**Symptom:** Server throws `Error: JWT_SECRET environment variable is required` or similar on startup.

**Cause:** `backend/middleware/auth.js` fails fast if `JWT_SECRET` or `REFRESH_SECRET` are missing. Other required variables produce subtler failures (e.g. Redis silently skipped, emails not sent).

**Fix:** Copy `backend/.env.example` (or use the variable list in the README) and fill in every required value before starting. The minimum set for local development:

```bash
DATABASE_URL=...
JWT_SECRET=any-long-random-string
REFRESH_SECRET=a-different-long-random-string
```

Redis, Pinata, and Resend will gracefully degrade or skip when absent, but authentication will not start without both JWT secrets.

---

## Backend Issues

### JWT authentication failures

**Symptom:** API returns 401 even though the user just logged in.

**Cause 1 — Redis is down and DB fallback activates.** The `authenticate` middleware checks Redis first. On Redis failure it falls back to `UserSession` in the DB. If the DB session record was never created (bug in login) or expired, the fallback also returns 401.

**Diagnosis:** Check the backend logs. A Redis failure looks like:
```
[ioredis] Unhandled error event ... ECONNREFUSED
```
A DB fallback success is silent. A DB fallback failure produces the 401.

**Fix:** If Redis is down, the system still works — sessions are just validated against the DB. Investigate the Redis connection string if the service is supposed to be up. Do not disable the Redis check; it is a performance optimisation, not a feature gate.

**Cause 2 — Access token expired.** The default access token lifetime is 15 minutes. The frontend must call `POST /api/auth/refresh` to get a new one before expiry. If the refresh token is also expired (after 7 days), the user must log in again.

**Cause 3 — Cookie not sent.** In local development, the frontend and backend may run on different ports (cross-origin). Ensure the Vite dev server proxy is configured, or that `VITE_API_URL` points to the correct backend URL and the frontend uses `credentials: 'include'` on all fetch calls.

---

### Sequelize sync vs. migrations

**Symptom:** A schema change deployed to production is not reflected in the database. Or `sync({ force: true })` wipes the database.

**Rule:** Never call `sequelize.sync({ force: true })` outside of a test environment. It drops and recreates all tables. Never call `sequelize.sync({ alter: true })` in production without testing the generated SQL — it can silently drop columns.

**The correct approach:** All schema changes must go through the migration scripts in `backend/scripts/`. Run the appropriate migration command after deploying:

```bash
cd backend
npm run migrate:issuer-profile
npm run migrate:harjoot-phase1
npm run migrate:referrals-phase1
```

Each script uses `queryInterface.addColumn`, `addIndex`, etc. and is idempotent (it catches `already exists` errors).

If you add a new column to a Sequelize model without a migration script, the column will be silently ignored in production. The app will not crash, but reads will return `null` and writes will not persist the field.

---

### Email not sending (silent failure)

**Symptom:** Class booking succeeds, educator gets no email. Or the educator approval fires and the candidate is never notified.

**Cause:** All email sends are fire-and-forget. An error in the Resend SDK, a missing API key, or an invalid recipient address will be swallowed and only logged to `console.error`. There is no retry queue.

**Diagnosis:**
1. Check the backend process logs (Render log stream, or your terminal in dev) for lines matching `[email]` prefix.
2. Verify `RESEND_API_KEY` and `RESEND_FROM` are set in the environment.
3. Verify the educator's `email` column is not null — if the user registered without an email, they will receive nothing.

**Common log patterns:**
```
[email] class-request: educator has no email — skipping notification
[email] class-request: error sending notification: ResendError: ...
```

**Fix:** If the API key is wrong, update the environment variable and restart. If the user has no email, there is nothing to send — this is logged as a warning, not an error.

---

### Running migrations — when and which ones

Each migration script corresponds to a feature phase:

| Script | When to run |
|--------|-------------|
| `migrate:issuer-profile` | First time deploying educator profiles (bio, photo, knowledge areas) |
| `migrate:harjoot-phase1` | First time deploying the Harjoot payment integration |
| `migrate:referrals-phase1` | First time deploying the referrals system |

Run all three if setting up a fresh database. They are idempotent, so running them more than once is safe. They use the `DATABASE_URL_UNPOOLED` (direct) connection to bypass PgBouncer DDL restrictions.

---

## Frontend Issues

### Vitest render tests fail with React version conflict

**Symptom:** `npm test` in the frontend workspace fails with:
```
Error: Invalid hook call. Hooks can only be called inside a function component.
```
or
```
TypeError: Cannot read properties of undefined (reading 'ReactCurrentDispatcher')
```

**Cause:** The root `package.json` declares `react@^5.x` (or React 19) as a direct dependency for tooling. npm workspaces hoist it to `node_modules/react` at the root. The frontend workspace declares `react@^18.x`. Vitest picks up the root version, which conflicts with the workspace version loaded by components.

**Fix:** Do not write render tests (`@testing-library/react`) for components in this project until the React version split is resolved. Instead, test pure business logic — utility functions, hooks that return plain values, use cases — without rendering JSX. This is the recommended approach per the project's test strategy.

If you must render components in tests, configure `resolve.alias` in `vitest.config.ts` to force a single React copy:

```ts
resolve: {
  alias: {
    react: path.resolve(__dirname, 'node_modules/react'),
    'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
  },
}
```

---

### IPFS images not loading

**Symptom:** Profile photos or certificate images show broken image icons. The `src` attribute contains `ipfs://Qm...`.

**Cause:** Browsers cannot resolve `ipfs://` URIs. They must be rewritten to an HTTP gateway URL.

**Fix:** Always use the `resolveIpfs()` utility from `@/lib/ipfs` when displaying any IPFS-backed resource:

```ts
import { resolveIpfs } from '@/lib/ipfs';

// Correct
<img src={resolveIpfs(photo_url)} alt="Profile" />

// Wrong — will show a broken image in all browsers
<img src={photo_url} alt="Profile" />
```

`resolveIpfs()` replaces the `ipfs://` scheme with the Pinata gateway URL configured via `VITE_API_URL` or a dedicated gateway variable. If the URL is already an HTTP/HTTPS URL, it is returned unchanged.

---

### Ethers.js version mismatch between frontend and backend

**Symptom:** You copy a utility function from `backend/` to `frontend/` (or vice versa) and get a `TypeError: ethers.utils is not a function` or `ethers.formatEther is not a function`.

**Cause:** The frontend uses Ethers.js v5 and the backend uses Ethers.js v6. The APIs differ significantly:

| Operation | v5 (frontend) | v6 (backend) |
|-----------|--------------|-------------|
| Format ether | `ethers.utils.formatEther(value)` | `ethers.formatEther(value)` |
| Parse ether | `ethers.utils.parseEther(value)` | `ethers.parseEther(value)` |
| Verify message | `ethers.utils.verifyMessage(msg, sig)` | `ethers.verifyMessage(msg, sig)` |
| BigNumber | `ethers.BigNumber.from(n)` | `BigInt(n)` |
| Wallet | `new ethers.Wallet(key)` | `new ethers.Wallet(key)` (same) |

**Fix:** Never copy Ethers.js code across layers without adapting it to the target version. Add a comment at the call site when using a version-specific API:

```js
// Ethers v5 (frontend) — uses utils namespace; v6 removed this
const formatted = ethers.utils.formatEther(value);
```

The split is intentional — see `docs/architecture.md` for the reason.

---

### html2canvas certificate clipping or misalignment

**Symptom:** The captured certificate image is cut off on one or more sides, or the layout inside the image looks different from what the browser renders.

**Cause:** When the browser zoom is not exactly 100%, html2canvas captures the element at the zoomed dimensions but writes the canvas at physical pixel dimensions, producing a mismatch. Additionally, CSS `transform: scale()` applied to the card for small screen sizes can cause clipping.

**Fix:** The `.pc-card-wrapper.is-capturing` CSS class in `CertificateCard.css` neutralises zoom and transform side-effects during the capture. This class is added by the component immediately before calling `html2canvas` and removed after. If images appear clipped:

1. Confirm `CertificateCard.css` is imported in the component.
2. Confirm the `.pc-card-wrapper.is-capturing` ruleset exists and sets `zoom: 1; transform: none;`.
3. Do not remove or rename this class — it is load-bearing.

If the issue persists, instruct the user to set their browser zoom to 100% before minting. This is a known limitation of html2canvas.

---

## Blockchain Issues

### Wallet not connecting

**Symptom:** The "Connect Wallet" button does nothing, or the Reown AppKit modal opens but shows no wallets.

**Cause 1 — Missing project ID.** `VITE_REOWN_PROJECT_ID` is not set or is empty.

**Fix:** Create a project at [cloud.reown.com](https://cloud.reown.com), copy the project ID, and add it to `frontend/.env`. Restart the Vite dev server.

**Cause 2 — Wrong chain ID.** The frontend is configured for Polygon mainnet (`VITE_CHAIN_ID=137`) but the user's wallet is on a different network. MetaMask will show the wrong network warning and refuse to sign.

**Fix:** For local development, set `VITE_CHAIN_ID=80002` (Polygon Amoy testnet) and ensure the backend `POLYGON_RPC_URL` also points to Amoy. The user must add the Amoy network to MetaMask if not already present.

---

### Mint fails silently

**Symptom:** The user clicks "Mint", the MetaMask popup appears, they confirm, but no certificate appears. No visible error message.

**Diagnosis:**
1. Open the browser DevTools console. MetaMask rejections surface as `Error: User rejected the request` or similar.
2. If MetaMask confirms but the certificate does not persist, check the backend logs. The frontend calls `POST /api/issuers/mint` (validation) and then calls the contract directly. A failure in the contract call (wrong gas, not authorized) will not reach the backend.
3. Check if the issuer wallet is in the `authorizedIssuers` mapping on the contract. Call `contract.authorizedIssuers(issuerWallet)` — it must return `true`.

**Common causes:**
- The issuer wallet is not authorized on the contract (call `POST /api/issuers/authorize` from the admin wallet)
- Insufficient MATIC for gas on the issuer wallet
- The student wallet is not a registered Student in the database

---

### Certificate appears duplicated

**Symptom:** A student's dashboard shows two identical certificates.

**Cause:** The frontend uses an `isMinting` guard to prevent double-click submission. If the guard was bypassed (e.g. browser refresh during minting), the contract may have minted once but the `POST /api/certificates/database` call was made twice (or the user initiated two separate mint flows for the same certificate before the first was persisted).

**Fix:** The canonical record is the on-chain token. Check the blockchain explorer for the issuer wallet's mint transactions. If only one token was minted, delete the duplicate DB record directly. If two tokens exist, use the revocation flow:
1. Call `revokeCertificate(tokenId)` on the contract for the duplicate token (requires the issuer or contract owner)
2. Call `PUT /api/certificates/database/:id/revoke` to mark the DB record as revoked

---

### Always use Polygon Amoy testnet for development

Production certificate data lives on Polygon mainnet. A mint on mainnet is permanent and consumes real HACK tokens. The revocation flow destroys the token — it cannot be undone.

During development:
- `VITE_CHAIN_ID=80002`
- `POLYGON_RPC_URL` pointing to Amoy RPC (e.g. `https://rpc-amoy.polygon.technology`)
- Deploy a fresh `HackCertificate` contract to Amoy and use that `CONTRACT_ADDRESS`

Never use the production `CONTRACT_ADDRESS` in a development environment.

---

## Git Workflow

### "I rebased but my changes conflict with the upstream"

**Situation:** You run `git rebase upstream/main` and get conflicts.

**Fix:**

```bash
# See which files conflict
git status

# Open each conflicting file, resolve manually, then:
git add <file>
git rebase --continue
```

Never use `git rebase --strategy-option=theirs` globally — it accepts all upstream changes and silently discards your local work.

---

### Translation files conflict — missing keys after merge

**Symptom:** After resolving a merge conflict in `frontend/src/lib/i18n/` (or wherever translation JSON files live), some UI strings appear as their key name (e.g. `"auth.login.title"`) instead of the translated text.

**Cause:** Using `git checkout --theirs` or `--ours` on a translation file discards all keys from the other branch. Translation files are JSON objects — a merge conflict in them must be resolved manually, key by key, keeping entries from both sides.

**Fix:** Open the conflicting translation file in an editor, remove the conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`), and ensure all keys from both branches are present in the final file. Validate the JSON syntax before committing:

```bash
node -e "JSON.parse(require('fs').readFileSync('path/to/translation.json','utf8'))"
```

---

### Wrong remote — pushing to origin instead of upstream

**Situation:** You run `git push` and it goes to `SH4DY44/hack-chain-app` (your fork) when you intended to push to the upstream.

**This is correct behavior.** You should never push directly to the upstream (`hck-chain/hack-chain-app`). The workflow is:

1. Push your branch to `origin` (your fork)
2. Open a Pull Request from your fork to `upstream/main`

```bash
# Push feature branch to your fork
git push origin feature/my-feature

# Then open a PR on GitHub: SH4DY44/hack-chain-app -> hck-chain/hack-chain-app
```

If a maintainer asks you to update your PR, push new commits to the same branch on `origin` — GitHub will update the PR automatically.
