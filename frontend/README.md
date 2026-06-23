# HackChain — Frontend

React 18 single-page application for the HackChain certification platform. Deployed on Vercel.

## Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript 5.5 |
| Build tool | Vite 5 (SWC) |
| Styling | TailwindCSS 3.4 + shadcn/ui (Radix UI) |
| Routing | React Router DOM v6 (lazy-loaded routes) |
| Server state | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Animations | Framer Motion + anime.js |
| i18n | i18next (Spanish / English) |
| Web3 | Reown AppKit + Ethers.js v5 |
| Tests | Vitest + Testing Library |

## Folder Structure

```
src/
├── components/       Presentational components (UI only, no data fetching)
├── pages/            Container components (state, queries, event handlers)
├── hooks/            Custom hooks — one hook per responsibility
├── contexts/         Global state (auth, UI preferences)
├── services/         HTTP calls via the api client — never inside components
├── types/            Shared TypeScript interfaces and types
├── utils/            Pure helper functions with no side effects
├── lib/              Third-party configuration (queryClient, i18n, ipfs resolver)
└── locales/          Translation files (es/, en/)
```

## Getting Started

Run from the monorepo root:

```bash
# Install all workspaces
npm install

# Start the frontend dev server (port 5173)
npm run dev --workspace=frontend
```

Or from inside this directory:

```bash
npm run dev
```

## Environment Variables

Create `frontend/.env`:

```bash
VITE_API_URL=http://localhost:3001          # Backend base URL
VITE_REOWN_PROJECT_ID=...                   # Reown AppKit project ID (wallet connection)
VITE_CONTRACT_ADDRESS=0x...                 # HackCertificate contract address on Polygon
VITE_CHAIN_ID=137                           # 137 = Polygon mainnet, 80002 = Polygon Amoy testnet
```

## Available Scripts

```bash
npm run dev        # Start dev server with HMR
npm run build      # Production build (outputs to dist/)
npm run preview    # Serve the production build locally
npm run test       # Run Vitest test suite
npm run lint       # ESLint
```

## Testing

Tests live in `src/test/`. The test suite covers pure logic only — utility functions, state transformations, hook parameter shapes.

Full component render tests are currently blocked by a React 18/19 version conflict (the monorepo root ships React 19 for tooling; the workspace uses React 18). Radix UI and Lucide pick up the root version at test time, causing hook failures. Until resolved, write tests for logic extraction rather than render output.

```bash
npm run test
```

## Key Conventions

- All IPFS URIs must be resolved through `resolveIpfs()` from `@/lib/ipfs` before use in `<img>` tags. Never pass a raw `ipfs://` URI to the browser.
- Ethers.js v5 is used here. The backend uses v6. The APIs differ — `ethers.utils.formatEther` (v5) vs `ethers.formatEther` (v6). Do not copy blockchain interaction code between layers without adjusting the API.
- Routes are lazy-loaded. When adding a new route, follow the `React.lazy()` pattern in `App.tsx`. Only `Index` and `NotFound` load eagerly.
- All text visible to users must go through i18next. UI language is Mexican Spanish (`es`) by default.
