# Solana Agent SDK

> **The AI-Native Solana SDK** — Built specifically for autonomous agents, not just humans.

## 🤖 Why This SDK?

**The Problem:** The standard Solana SDK (@solana/web3.js) is powerful but designed for human developers. AI agents need something different:

- **Simulation before execution** — Agents can't debug failed transactions
- **Safety guardrails** — Prevent agents from draining wallets or getting rekt
- **Natural language parsing** — Convert "swap 1 SOL for USDC" to transactions
- **High-level abstractions** — One-liner for complex DeFi operations
- **Agent-friendly errors** — Clear messages, not cryptic hex codes

**This SDK is infrastructure-free.** No backend, no API keys, no servers. Just `npm install` and your agent is ready.

---

## 🎯 Key Differentiators

### 1. Transaction Simulation
Preview what will happen *before* signing:

```typescript
import { simulateTransaction, willTransactionSucceed } from 'solana-agent-sdk';

// Before executing, check if it will work
const result = await willTransactionSucceed(transaction, wallet.publicKey);
// { success: true, reason: "Transaction will succeed. Fee: 0.000005 SOL" }

// Get detailed simulation
const sim = await simulateTransaction(transaction, wallet.publicKey);
// { success: true, unitsConsumed: 45000, fee: 0.000005, warnings: [] }
```

### 2. Safety Guards
Protect agents from costly mistakes:

```typescript
import { checkSwapSafety, preflightCheck } from 'solana-agent-sdk';

// Before any swap
const safety = checkSwapSafety({
  inputAmount: 100,
  walletBalance: 105,
  slippageBps: 500,
  inputToken: 'SOL',
  outputToken: 'USDC'
});
// { overallSafe: false, recommendation: "NOT RECOMMENDED: Using 95% of wallet balance" }

// Preflight check for any operation
const preflight = await preflightCheck(walletAddress, 'swap', params);
// Checks wallet health, balance, fees, slippage, everything
```

### 3. Natural Language Parsing
Let agents speak naturally:

```typescript
import { parseIntent, describeIntent, intentToParams } from 'solana-agent-sdk';

const intent = parseIntent("swap 1.5 SOL for USDC");
// {
//   action: 'swap',
//   confidence: 0.9,
//   params: { amount: 1.5, inputToken: 'SOL', outputToken: 'USDC' }
// }

// Convert to SDK params
const params = intentToParams(intent);
// { inputMint: 'SOL', outputMint: 'USDC', amount: 1.5, slippageBps: 50 }
```

### 4. One-Line DeFi Operations
What takes 50+ lines with native SDK:

```typescript
import { SolanaAgentSDK } from 'solana-agent-sdk';

const sdk = new SolanaAgentSDK({ wallet: myKeypair });

// Swap tokens
await sdk.jupiter.swap('SOL', 'USDC', 1.0);

// Get prices
const price = await sdk.pyth.getPrice('SOL');

// Check yields across protocols
const rates = await sdk.kamino.getMarketRates('USDC');
```

---

## 📦 Installation

```bash
npm install solana-agent-sdk
```

## 🚀 Quick Start

```typescript
import { SolanaAgentSDK, parseIntent, checkSwapSafety } from 'solana-agent-sdk';
import { Keypair } from '@solana/web3.js';

// Initialize
const wallet = Keypair.generate(); // or load from file
const sdk = new SolanaAgentSDK({
  wallet,
  rpcUrl: 'https://api.mainnet-beta.solana.com'
});

// Example: Agent wants to swap
const userMessage = "swap 2 SOL for USDC";

// 1. Parse intent
const intent = parseIntent(userMessage);

// 2. Safety check
const safety = checkSwapSafety({
  inputAmount: intent.params.amount,
  walletBalance: await sdk.wallet.getBalance(),
  slippageBps: 50,
  inputToken: intent.params.inputToken,
  outputToken: intent.params.outputToken
});

// 3. Execute if safe
if (safety.overallSafe) {
  const result = await sdk.jupiter.swap(
    intent.params.inputToken,
    intent.params.outputToken,
    intent.params.amount
  );
  console.log('Swap executed:', result);
} else {
  console.log('Blocked:', safety.recommendation);
}
```

---

## 📚 Modules

### Core Solana Primitives
| Module | Description |
|--------|-------------|
| `wallet` | Create wallets, check balances, sign transactions |
| `accounts` | Read/query any Solana account |
| `transactions` | Build, sign, send transactions |
| `spl` | SPL token operations (transfer, mint, burn) |
| `pda` | Program Derived Address helpers |
| `rpc` | Direct RPC queries (slots, blockhash, epoch) |

### DeFi Protocols
| Module | Description |
|--------|-------------|
| `jupiter` | Token swaps with best route finding |
| `pyth` | Real-time price feeds |
| `kamino` | Lending/borrowing, yield vaults |
| `drift` | Perpetuals trading |
| `raydium` | AMM swaps and liquidity |
| `meteora` | Dynamic AMM and DLMM |
| `staking` | Native SOL staking |

### Agent Intelligence (🎯 The Differentiators)
| Module | Description |
|--------|-------------|
| `simulate` | Preview transactions before execution |
| `safety` | Guardrails to prevent costly mistakes |
| `nlp` | Natural language → transaction parsing |

---

## 🛡️ Safety Philosophy

AI agents are autonomous. They can't ask for help when something goes wrong. This SDK is built with safety-first principles:

1. **Simulate First** — Always preview before executing
2. **Guard Rails** — Block dangerous operations by default
3. **Clear Errors** — Human-readable, not hex codes
4. **Fail Safe** — When in doubt, don't execute

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AI Agent                                 │
│  "swap 1 SOL for USDC"                                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│              Solana Agent SDK                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ NLP Parser → Safety Check → Simulation → Execution   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   Jupiter   │ │    Pyth     │ │   Kamino    │  ...      │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                   Solana Blockchain                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 Links

- **GitHub:** https://github.com/JarvisOpenClaw/solana-agent-sdk
- **Hackathon:** Colosseum Agent Hackathon 2026

---

## 📄 License

MIT

---

*Built for the Colosseum Agent Hackathon by Jarvis 🎩*
