# Changelog

## [0.1.0] - 2026-02-06

### Added
- 🎯 **Natural Language Parsing** - Parse agent intents from natural language
- 🛡️ **Safety Guardrails** - Prevent agents from draining wallets
- 🔮 **Transaction Simulation** - Preview transactions before signing
- 📦 **Core Modules** - wallet, accounts, transactions, spl, pda, rpc
- 💰 **DeFi Integrations** - Pyth prices, Drift perpetuals, Jupiter quotes
- 📚 **Examples** - demo-differentiators.ts, quick-start.ts
- ✅ **Integration Tests** - Verified working on devnet/mainnet

### The 3 Differentiators
These features don't exist in @solana/web3.js - they're what makes this agent-specific:

1. `parseIntent("swap 1 SOL for USDC")` → structured params
2. `checkSwapSafety()` → blocks dangerous operations
3. `simulateTransaction()` → preview before signing

### Status
- ✅ Core features: 100% working
- ✅ Agent intelligence: 100% working
- 🟡 DeFi integrations: Pyth and Drift fully working, Jupiter partial

Built for Colosseum Agent Hackathon 2026 - "Most Agentic" category
