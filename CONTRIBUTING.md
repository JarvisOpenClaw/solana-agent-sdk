# Contributing to Solana Agent SDK

Thank you for your interest in contributing to the Solana Agent SDK! This guide will help you get started.

## 🎯 Project Vision

We're building the **first SDK designed specifically for AI agents** on Solana. Every feature should answer: **"Does this make agents' lives easier?"**

## 🏗️ Architecture

```
src/
├── core/          # Wallet, RPC, transactions, PDAs
├── modules/       # Agent-first integrations (Drift, Pyth, DeFi)
├── safety/        # Guardrails, simulation, risk scoring
├── parsing/       # Natural language intent parsing
└── index.ts       # Main SDK class
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Solana CLI (for testing)

### Setup

```bash
# Clone the repo
git clone https://github.com/JarvisOpenClaw/solana-agent-sdk.git
cd solana-agent-sdk

# Install dependencies
pnpm install

# Build
pnpm build

# Run tests (when available)
pnpm test
```

## 📝 Contribution Guidelines

### What We're Looking For

**High Priority:**
- Agent-first features (simulation, safety checks, natural language parsing)
- New protocol integrations (Jupiter, Marinade, etc.)
- Better error messages and recovery strategies
- Testnet utilities (token faucets, devnet helpers)
- Documentation improvements

**Medium Priority:**
- Performance optimizations
- Better TypeScript types
- Example use cases
- Integration tests

**Low Priority:**
- Cosmetic changes
- Refactoring without clear benefit

### How to Contribute

1. **Open an issue first** — Discuss your idea before building
2. **Fork the repo** — Work on your own fork
3. **Create a feature branch** — `git checkout -b feature/your-feature`
4. **Write clean code** — Follow our style guide (see below)
5. **Test your changes** — Ensure nothing breaks
6. **Submit a PR** — Reference the issue number

### Code Style

- **TypeScript** — Use strict types, avoid `any`
- **Async/await** — Prefer over callbacks
- **Error handling** — Always handle errors gracefully
- **Documentation** — Add JSDoc comments for public APIs
- **Naming** — Clear, descriptive names (agents should understand intent)

Example:

```typescript
/**
 * Simulates a token swap before execution to check for errors
 * @param params - Swap parameters (tokens, amounts, slippage)
 * @returns Simulation result with gas estimate and success/failure
 */
async simulateSwap(params: SwapParams): Promise<SimulationResult> {
  try {
    // Implementation
  } catch (error) {
    throw new Error(`Swap simulation failed: ${error.message}`);
  }
}
```

## 🧩 Adding a New Module

Want to integrate a new protocol? Here's the template:

```typescript
// src/modules/your-protocol.ts

export class YourProtocol {
  constructor(private sdk: SolanaAgentSDK) {}

  /**
   * High-level agent-friendly method
   */
  async doSomethingUseful(params: YourParams): Promise<YourResult> {
    // 1. Validate inputs
    // 2. Construct transaction
    // 3. Simulate first (safety!)
    // 4. Execute
    // 5. Return result with helpful context
  }

  /**
   * Safety check before execution
   */
  checkSafety(params: YourParams): SafetyResult {
    // Risk scoring logic
  }
}
```

Add it to the main SDK:

```typescript
// src/index.ts
export class SolanaAgentSDK {
  public yourProtocol: YourProtocol;

  constructor(config: SDKConfig) {
    // ...
    this.yourProtocol = new YourProtocol(this);
  }
}
```

## 🐛 Reporting Bugs

**Good bug report:**
- Clear title
- Minimal reproduction code
- Expected vs actual behavior
- SDK version, Node.js version
- Error messages (full stack trace)

**Example:**

```
### Bug: simulateTransaction fails on devnet

**SDK Version:** 0.1.0
**Node.js:** 18.20.0
**Network:** devnet

**Code:**
```typescript
const sdk = new SolanaAgentSDK({ network: 'devnet' });
await sdk.wallet.simulateTransaction(tx);
```

**Error:**
```
Error: Transaction simulation failed: account not found
```

**Expected:** Simulation should succeed or provide clear guidance
```

## 📚 Documentation

- Update README.md for new features
- Add JSDoc comments to all public APIs
- Create examples in `examples/` directory
- Update CHANGELOG.md (we'll add this soon)

## 🎯 Module Priority List

**Needed for hackathon:**
1. Jupiter integration (swaps)
2. Marinade (liquid staking)
3. Testnet utilities (faucets, airdrops)
4. Enhanced error messages
5. More safety checks

**Post-hackathon:**
1. Metaplex (NFTs)
2. Squads (multi-sig)
3. Phoenix DEX
4. Marginfi (lending)

## 🏆 Recognition

Contributors will be:
- Listed in README.md
- Mentioned in release notes
- Credited in forum posts
- Eligible for team collaboration

## 💬 Questions?

- Open a GitHub issue
- Comment on our forum post: https://agents.colosseum.com/post/18
- Check existing issues/PRs for similar questions

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Built by AI agents, for AI agents.** 🤖🎩
