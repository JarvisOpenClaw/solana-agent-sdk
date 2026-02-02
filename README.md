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

// AgentDEX — swap routing, limit orders, portfolio tracking
const adxQuote = await sdk.agentDex?.getQuote(SOL_MINT, USDC_MINT, 1_000_000_000);
const portfolio = await sdk.agentDex?.getPortfolio(walletAddress);
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
| `agentDex` | ✅ Working | AgentDEX swap routing, limit orders, portfolio |

## AgentDEX Module

The `agentDex` module connects to the [AgentDEX](https://agentdex.com) API for optimised swap routing, limit orders, and portfolio tracking.

### Setup

Pass your AgentDEX credentials when creating the SDK:

```typescript
const sdk = new SolanaAgentSDK({
  wallet: yourKeypair,
  rpcUrl: 'https://api.mainnet-beta.solana.com',
  agentDex: {
    baseUrl: 'https://api.agentdex.com',   // or your self-hosted URL
    apiKey: 'adx_xxx',                      // Bearer token
  },
});
```

### Swap

```typescript
// Get a quote (amount in base units, slippage in bps)
const quote = await sdk.agentDex!.getQuote(inputMint, outputMint, 1_000_000_000, 50);

// Execute the swap
const result = await sdk.agentDex!.executeSwap(inputMint, outputMint, 1_000_000_000, 50);
console.log('tx:', result.txSignature);
```

### Portfolio

```typescript
const portfolio = await sdk.agentDex!.getPortfolio(walletAddress);
console.log(`Total: $${portfolio.totalUsdValue}`);
portfolio.tokens.forEach(t => console.log(`${t.symbol}: ${t.balance} ($${t.usdValue})`));
```

### Prices

```typescript
const sol = await sdk.agentDex!.getPrice('So11111111111111111111111111111111111111112');
const all = await sdk.agentDex!.getPrices();
```

### Limit Orders

```typescript
// Create
const order = await sdk.agentDex!.createLimitOrder(inputMint, outputMint, 500_000_000, 185.50);

// List
const orders = await sdk.agentDex!.getLimitOrders();

// Cancel
await sdk.agentDex!.cancelLimitOrder(order.id);
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/quote` | Get swap quote |
| POST | `/api/v1/swap` | Execute swap |
| GET | `/api/v1/portfolio/:wallet` | Portfolio balances + USD |
| GET | `/api/v1/prices/:mint` | Single token price |
| GET | `/api/v1/prices` | All token prices |
| POST | `/api/v1/limit-order` | Create limit order |
| GET | `/api/v1/limit-order` | List limit orders |
| DELETE | `/api/v1/limit-order/:id` | Cancel limit order |

---

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
