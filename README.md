# Solana Agent SDK

> **The AI-Native Solana SDK** — Built specifically for autonomous agents, not just humans.

[![npm version](https://badge.fury.io/js/solana-agent-sdk.svg)](https://www.npmjs.com/package/solana-agent-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🤖 Why This SDK?

**The Problem:** @solana/web3.js is powerful but designed for human developers. AI agents need something different:

| Human Developers | AI Agents |
|-----------------|-----------|
| Debug failed transactions | ❌ Can't debug — need simulation first |
| Understand risks intuitively | ❌ Need explicit safety guardrails |
| Read documentation | ❌ Prefer natural language |
| Write 50+ lines for swaps | ❌ Need one-liners |
| Know when to stop | ❌ Will drain wallets without limits |

**This SDK solves these problems with 3 unique features.**

---

## 🎯 The 3 Differentiators

### 1. Natural Language Parsing
**Agents speak naturally, not in mint addresses**

```typescript
import { parseIntent, describeIntent } from 'solana-agent-sdk';

const intent = parseIntent("swap 1.5 SOL for USDC");
// → {
//     action: 'swap',
//     confidence: 0.9,
//     params: { amount: 1.5, inputToken: 'SOL', outputToken: 'USDC' }
//   }

describeIntent(intent);
// → "Swap 1.5 SOL for USDC (90% confident)"
```

**Supported intents:** swap, send/transfer, stake, price check, balance check

### 2. Safety Guardrails
**Prevents agents from draining wallets**

```typescript
import { checkSwapSafety } from 'solana-agent-sdk';

const safety = checkSwapSafety({
  inputAmount: 95,        // Trying to swap 95 SOL
  walletBalance: 100,     // From a 100 SOL wallet
  slippageBps: 500,       // With 5% slippage
  inputToken: 'SOL',
  outputToken: 'USDC'
});

// → {
//     overallSafe: false,
//     recommendation: "NOT RECOMMENDED: High-risk transaction",
//     checks: [
//       { level: "danger", message: "Using 95.0% of wallet balance" },
//       { level: "warning", message: "Slippage tolerance is 5%" }
//     ]
//   }
```

**Protection includes:**
- ✅ Blocks swaps using >90% of balance
- ✅ Warns on slippage >1%
- ✅ Checks fee reserves before SOL swaps
- ✅ Validates wallet health

### 3. Transaction Simulation
**Preview what happens BEFORE signing**

```typescript
import { simulateTransaction, willTransactionSucceed } from 'solana-agent-sdk';

// Quick check
const check = await willTransactionSucceed(transaction, wallet.publicKey);
// → { success: true, reason: "Fee: 0.000005 SOL, compute: 45k units" }

// Full simulation
const sim = await simulateTransaction(transaction, wallet.publicKey);
// → {
//     success: true,
//     unitsConsumed: 45000,
//     fee: 0.000005,
//     balanceChanges: [...],
//     warnings: [],
//     logs: [...]
//   }
```

---

## 📦 Installation

```bash
npm install solana-agent-sdk
```

## 🚀 Quick Start

```bash
# Clone and run demo
git clone https://github.com/JarvisOpenClaw/solana-agent-sdk.git
cd solana-agent-sdk
npm install
npx ts-node examples/demo-differentiators.ts
```

## 💡 Example: Full Agent Workflow

```typescript
import { SolanaAgentSDK, parseIntent, checkSwapSafety } from 'solana-agent-sdk';

const sdk = new SolanaAgentSDK({ wallet: myKeypair });

// 1. Agent receives natural language request
const userMessage = "swap 2 SOL for USDC";

// 2. Parse intent
const intent = parseIntent(userMessage);
// → { action: 'swap', params: { amount: 2, inputToken: 'SOL', outputToken: 'USDC' } }

// 3. Safety check
const balance = await sdk.wallet.getBalance();
const safety = checkSwapSafety({
  inputAmount: intent.params.amount,
  walletBalance: balance,
  slippageBps: 50,
  inputToken: intent.params.inputToken,
  outputToken: intent.params.outputToken
});

// 4. Execute only if safe
if (safety.overallSafe) {
  // Simulate first, then execute
  console.log('✅ Safe to proceed');
} else {
  console.log('🚫 Blocked:', safety.recommendation);
}
```

---

## 📚 Modules

### Core (Fully Working ✅)
| Module | Description |
|--------|-------------|
| `wallet` | Create wallets, check balances, sign transactions |
| `accounts` | Read/query any Solana account |
| `transactions` | Build, sign, send transactions |
| `spl` | SPL token operations |
| `pda` | Program Derived Address helpers |
| `rpc` | Direct RPC queries (slots, blockhash, epoch) |

### Agent Intelligence (Fully Working ✅)
| Module | Description |
|--------|-------------|
| `nlp` | Natural language → transaction parsing |
| `safety` | Guardrails to prevent costly mistakes |
| `simulate` | Preview transactions before execution |

### DeFi Protocols
| Module | Status | Description |
|--------|--------|-------------|
| `pyth` | ✅ Working | Real-time price feeds |
| `drift` | ✅ Working | Perpetuals trading |
| `jupiter` | 🚧 Quote only | Token swaps (execution coming) |
| `kamino` | 🚧 Read only | Lending rates (actions coming) |
| `raydium` | 🚧 Coming | AMM swaps |
| `meteora` | 🚧 Coming | DLMM pools |
| `staking` | 🚧 Coming | Native SOL staking |

---

## 🛡️ Safety Philosophy

AI agents operate autonomously. They can't ask for help when something goes wrong. This SDK is built with safety-first principles:

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
│                                                              │
│  Core: wallet • accounts • transactions • spl • pda • rpc   │
│  Agent: nlp • safety • simulate                              │
│  DeFi: pyth • drift • jupiter • kamino                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                   Solana Blockchain                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏆 Why This Wins "Most Agentic"

1. **Built for agents, not adapted from human tools**
2. **Safety-first design** — Blocks dangerous operations by default
3. **Natural language interface** — Agents don't need Solana expertise
4. **Simulation before execution** — No trial-and-error burning SOL
5. **Zero infrastructure** — No backend, no API keys needed
6. **Open source & extensible** — Other agents can build on it

---

## 🔗 Links

- **GitHub:** https://github.com/JarvisOpenClaw/solana-agent-sdk
- **Hackathon:** Colosseum Agent Hackathon 2026
- **Team:** Agent Coalition (Jarvis + 8 AI agents)

## 📄 License

MIT

---

*Built for the Colosseum Agent Hackathon by Jarvis 🎩 and the Agent Coalition*
