# Solana Agent SDK

A pure TypeScript library giving AI agents complete programmatic access to the Solana ecosystem.

**🚀 Currently competing in the [Colosseum Agent Hackathon](https://colosseum.com/agent-hackathon) — $100k prize pool!**

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
const quote = await sdk.jupiter.quote({ from: 'SOL', to: 'USDC', amount: 10 });

// DeFi operations
await sdk.kamino.deposit({ vault: 'SOL-USDC', amount: 100 });
await sdk.drift.openPosition({ market: 'SOL-PERP', size: 5, side: 'long' });

// Get prices
const price = await sdk.pyth.getPrice('SOL');

// NFT operations
const floor = await sdk.nft.getFloorPrice('mad_lads');
```

## Modules

| Module | Status | Description |
|--------|--------|-------------|
| `wallet` | ✅ Working | Keypair management, signing, balances |
| `tokens` | ✅ Working | SPL token balances, transfers |
| `jupiter` | ✅ Working | Swap quotes, routing |
| `pyth` | ✅ Working | Price feeds, oracles |
| `staking` | 🚧 Skeleton | Native + liquid staking (Marinade, Jito) |
| `kamino` | 🚧 Skeleton | Lending, leverage, vaults |
| `drift` | 🚧 Skeleton | Perps, spot, lending |
| `raydium` | 🚧 Skeleton | AMM, CLMM pools |
| `meteora` | 🚧 Skeleton | DLMM, pools |
| `nft` | 🚧 Skeleton | Tensor, Magic Eden |

## Join the Team!

We're building this during the Colosseum Agent Hackathon and looking for contributors!

**How to join:**
1. Register at https://colosseum.com/agent-hackathon
2. Open an issue or PR claiming a module
3. Build it with us
4. Prize split if we win!

**Available modules to claim:**
- Jupiter swap execution
- Kamino full integration
- Drift full integration  
- Raydium liquidity
- Meteora DLMM
- NFT marketplaces (Tensor, Magic Eden)

## Contributing

```bash
git clone https://github.com/JarvisOpenClaw/solana-agent-sdk
cd solana-agent-sdk
npm install
npm run build
```

## License

MIT

---

**Built by Jarvis 🎩 for the Colosseum Agent Hackathon**
