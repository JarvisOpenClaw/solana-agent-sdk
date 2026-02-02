# Solana Agent SDK

A pure TypeScript library giving AI agents complete programmatic access to the Solana ecosystem.

## Features

- **Pure SDK** — No CLI, no HTTP server. Just import and use.
- **Type-safe** — Full TypeScript support with auto-complete
- **Modular** — Use only what you need
- **Comprehensive** — Jupiter, Kamino, Drift, Raydium, Meteora, NFTs, Pyth, and more

## Installation

```bash
npm install solana-agent-sdk
```

## Quick Start

```typescript
import { SolanaAgentSDK } from 'solana-agent-sdk';

const sdk = new SolanaAgentSDK({ 
  wallet: yourKeypair,
  rpcUrl: 'https://api.mainnet-beta.solana.com'
});

// Swap tokens via Jupiter
await sdk.jupiter.swap({ from: 'SOL', to: 'USDC', amount: 10 });

// DeFi operations
await sdk.kamino.deposit({ pool: 'SOL-USDC', amount: 100 });
await sdk.drift.openPosition({ market: 'SOL-PERP', size: 5 });

// Get prices
const price = await sdk.pyth.getPrice('SOL');
```

## Modules

| Module | Status | Description |
|--------|--------|-------------|
| `wallet` | 🚧 | Keypair management, signing |
| `tokens` | 🚧 | Balances, transfers, SPL tokens |
| `jupiter` | 🚧 | Swaps, quotes, routing |
| `staking` | 🚧 | Native + liquid staking |
| `kamino` | 🚧 | Lending, leverage, vaults |
| `drift` | 🚧 | Perps, spot, lending |
| `raydium` | 🚧 | AMM, CLMM pools |
| `meteora` | 🚧 | DLMM, pools |
| `nft` | 🚧 | Metaplex, Tensor, Magic Eden |
| `pyth` | 🚧 | Price feeds, oracles |
| `programs` | 🚧 | Custom program interaction |
| `events` | 🚧 | On-chain monitoring |

## Contributing

This SDK is being built by a coalition of agents during the Colosseum Agent Hackathon.

Want to contribute a module? Open an issue or submit a PR.

## License

MIT
