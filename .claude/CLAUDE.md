# HackChain — Instrucciones para Claude Code

## Qué es este proyecto

HackChain es una plataforma de certificación blockchain para educación en ciberseguridad. Los educadores autorizados emiten certificados como NFTs (ERC721) en Polygon. Los talentos (students) los reciben y muestran a recruiters, que tienen su propio dashboard para explorar perfiles verificados.

Tres roles: **Talent** (student), **Educator** (issuer), **Recruiter**.

## Arquitectura del Monorepo

```
hack-chain-app/
├── frontend/     → React + Vite (cliente web, deploy en Vercel)
├── backend/      → Express + Node.js (API REST)
└── contracts/    → Solidity + Foundry (smart contracts en Polygon)
```

Manejado con **npm workspaces**. Un solo `npm install` en la raíz.

## Stack por capa

### Frontend (`frontend/`)

- React 18 + TypeScript 5.5 + Vite 5 (SWC)
- TailwindCSS 3.4 + shadcn/ui (Radix UI)
- React Router DOM v6 con lazy loading
- TanStack Query v5 para server state
- React Hook Form + Zod para validación
- Framer Motion + anime.js para animaciones
- i18next para internacionalización (ES/EN)
- Reown AppKit + Ethers.js v5 para Web3/wallet
- Vitest + Testing Library para tests

### Backend (`backend/`)

- Node.js ≥18 + Express 5
- Sequelize 6 + PostgreSQL (NeonDB serverless)
- JWT + bcrypt para auth (express-session está importado pero NUNCA montado — es código muerto pendiente de eliminar)
- Multer para uploads + Pinata SDK para IPFS
- Ethers.js v6 para interacción con contratos
- express-rate-limit
- Jest + Supertest para tests

### Contratos (`contracts/`)

- Solidity 0.8.24 + Foundry/Forge
- OpenZeppelin para estándares
- Red: Polygon (mainnet/testnet)
- HackCertificate (ERC721) — minteo por issuers autorizados, revocable
- HackToken (ERC20) — token $HACK, pausable, mint/burn

## Convenciones de código

### Nombrado

- Variables y funciones: camelCase
- Componentes React: PascalCase
- Archivos de componentes: PascalCase (e.g. `CertificateCard.tsx`)
- Archivos utilitarios: camelCase (e.g. `formatDate.ts`)
- Carpetas: kebab-case
- Contratos Solidity: PascalCase (e.g. `HackCertificate.sol`)
- Rutas API: kebab-case plural (e.g. `/api/certificates`)

### TypeScript

- Nunca usar `any` — usar `unknown` si el tipo no es claro y luego narrowing
- Interfaces para shapes de objetos, types para unions y utilitarios
- Zod schemas como fuente de verdad para validación de formularios

### Commits

- Formato: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`)
- Scope recomendado: `feat(frontend):`, `fix(backend):`, `refactor(contracts):`
- Idioma de commits: inglés
- Comentarios en código: español está bien

### Estilos (Frontend)

- TailwindCSS para todo — no CSS custom salvo excepciones justificadas
- Colores y spacing via el theme de Tailwind (tailwind.config)
- Componentes de shadcn/ui como base — modificar con Tailwind, no overrides CSS
- Mobile first

## Rutas API principales

```
POST   /api/auth/register     → registro
POST   /api/auth/login         → login con email/password
POST   /api/auth/wallet-login  → login con wallet (firma)
GET    /api/certificates       → listar certificados
POST   /api/certificates       → emitir certificado (solo issuers)
GET    /api/students/:id       → perfil del talento
GET    /api/issuers             → listar educadores
GET    /api/recruiters/dashboard → dashboard del recruiter
POST   /api/upload              → subida de imágenes (Multer → Pinata/IPFS)
GET    /api/opensea/:tokenId    → metadata para OpenSea
```

## Auth — Estado actual y contexto

El sistema de auth usa **JWT puro**. El middleware `authenticate` solo verifica el token JWT.

**Bug conocido:** Existe una tabla `UserSession` con endpoints CRUD (`/api/sessions`), pero `authenticate` NUNCA consulta esa tabla. Si borras una sesión, el JWT sigue válido hasta expirar. El logout real no funciona.

**Código muerto:** `express-session` y `connect-pg-simple` están importados en `index.js` pero nunca montados. Eliminar en la próxima limpieza.

**Plan de fix:** Vincular JWT con UserSession — al hacer login, incluir `sid` (session ID) en el payload del JWT y verificar en `authenticate` que la sesión exista en DB. Ver issue/task correspondiente.

## Modelos de base de datos (Sequelize)

- `User` — datos base (email, passwordHash, role, walletAddress)
- `Student` — perfil del talento (vinculado a User)
- `Issuer` — perfil del educador (vinculado a User)
- `Recruiter` — perfil del recruiter (vinculado a User)
- `Certificate` — certificado emitido (tokenId, contractAddress, metadata, issuerId, studentId)
- `UserSession` — sesiones (userId, uuid, expiresAt) — actualmente desconectada del middleware auth

## Comandos clave

```bash
# Raíz del monorepo
npm install                        # instala todo (workspaces)

# Frontend
cd frontend && npm run dev         # servidor local (Vite)
cd frontend && npm run build       # build de producción
cd frontend && npm run test        # Vitest

# Backend
cd backend && npm run dev          # servidor local (nodemon)
cd backend && npm run test         # Jest

# Contratos
cd contracts && forge build        # compilar contratos
cd contracts && forge test         # correr tests
cd contracts && forge script       # ejecutar scripts de deploy
```

## Variables de entorno

### Backend (.env)

```
DATABASE_URL=postgresql://...      # NeonDB connection string
JWT_SECRET=...                     # secret para firmar tokens
PINATA_API_KEY=...                 # para IPFS uploads
PINATA_SECRET_KEY=...
POLYGON_RPC_URL=...                # RPC de Polygon
PRIVATE_KEY=...                    # wallet del backend para interactuar con contratos
CONTRACT_ADDRESS=...               # dirección del HackCertificate desplegado
```

### Frontend (.env)

```
VITE_API_URL=...                   # URL del backend
VITE_REOWN_PROJECT_ID=...          # Reown AppKit project ID
VITE_CONTRACT_ADDRESS=...          # dirección del contrato
VITE_CHAIN_ID=...                  # Polygon chain ID
```

## Lo que NUNCA debes hacer

- No modificar contratos desplegados en mainnet sin confirmación explícita
- No exponer PRIVATE_KEY, JWT_SECRET o API keys en código, logs o respuestas
- No usar `any` en TypeScript
- No escribir CSS custom si TailwindCSS puede resolverlo
- No hacer push directo a `main` — siempre rama + PR
- No mintear NFTs en mainnet durante desarrollo — usar testnet (Polygon Amoy)
- No borrar migraciones de Sequelize existentes — crear nuevas
- No instalar dependencias sin justificación — el bundle size importa
- Generar comentarios solo necesarios y en ingles, estos deben ir sin ningun tipo de emoji.

## Notas técnicas importantes

1. **Ethers.js versión inconsistente:** Frontend usa v5, backend usa v6. APIs distintas (e.g. `ethers.utils.formatEther` vs `ethers.formatEther`). Tenerlo en cuenta al copiar código entre capas.

2. **Lazy loading:** Solo `Index` y `NotFound` se cargan en el primer paint. El resto usa `React.lazy()`. Mantener este patrón al agregar rutas nuevas.

3. **Rutas protegidas:** Se validan por rol (student, issuer, recruiter). Al crear una nueva ruta protegida, siempre especificar qué roles tienen acceso.

4. **IPFS:** Las imágenes y metadata de certificados se suben a Pinata (IPFS). Los URIs resultantes se usan como tokenURI en el ERC721.

5. **Revocación de certificados:** El contrato HackCertificate permite revocar NFTs. Esta es una función sensible — solo owners/issuers autorizados pueden ejecutarla.
