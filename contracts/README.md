# HackChain — Contracts

Solidity smart contracts for the HackChain platform. Built with Foundry, deployed on Polygon.

## Contracts

| Contract | Standard | Description |
|---|---|---|
| `HackCertificate` | ERC721 | Soulbound NFT certificates. Minted by authorized issuers, revocable by owner. Non-transferable after mint. |
| `HackToken` | ERC20 | Platform token (`$HACK`). Minteable by authorized minters, pausable by owner. Used for class payments (escrow system — in development). |

## Stack

| Tool | Purpose |
|---|---|
| Solidity 0.8.24 | Contract language |
| Foundry / Forge | Build, test, deploy |
| OpenZeppelin | ERC721, ERC20, Ownable, Pausable base contracts |
| Polygon | Target network (mainnet + Amoy testnet) |

## Folder Structure

```
contracts/
├── src/
│   ├── HackCertificate.sol    ERC721 soulbound certificate contract
│   └── HackToken.sol          ERC20 platform token contract
├── test/
│   ├── HackCertificate.t.sol  Foundry tests for HackCertificate
│   └── HackToken.t.sol        Foundry tests for HackToken
├── script/
│   └── Deploy.s.sol           Deployment script
└── foundry.toml               Foundry configuration
```

## Getting Started

### Install Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Build

```bash
cd contracts
forge build
```

### Test

```bash
forge test
forge test -vv    # verbose output with logs
forge test -vvv   # very verbose (includes traces)
```

### Deploy

Always deploy to Amoy testnet first. Never deploy directly to Polygon mainnet without prior testnet validation.

```bash
# Deploy to Polygon Amoy testnet
forge script script/Deploy.s.sol \
  --rpc-url $AMOY_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify

# Deploy to Polygon mainnet (requires explicit confirmation)
forge script script/Deploy.s.sol \
  --rpc-url $POLYGON_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

## HackCertificate

Key behaviors:

- Only wallets registered as issuers (via `addIssuer`) can call `mintCertificate`.
- Certificates are soulbound: `_transfer` is overridden to revert on any transfer attempt after the initial mint.
- An owner or authorized issuer can revoke a certificate by calling `revokeCertificate(tokenId)`, which burns the token.
- `tokenURI` returns an IPFS URI pointing to the certificate metadata JSON stored on Pinata.

## HackToken

Key behaviors:

- Authorized minters can call `mint(address to, uint256 amount)`.
- The owner can pause all transfers and mints via `pause()`.
- Will be integrated with the `HackEscrow` contract (in development) to handle class payment escrow.

## Pending Contracts

- `HackEscrow` — escrow contract for class payments in `$HACK`. Planned functions: `deposit`, `release`, `refund`, `setPlatformFee`, `setTreasury`. See `docs/architecture.md` for the full payment flow design.
