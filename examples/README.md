# Solana Agent SDK - Examples

This directory contains practical examples for using the Solana Agent SDK in your AI agents.

## 📁 Examples Overview

### Basic Usage

- `basic-wallet.ts` - Wallet creation, balance checking, SOL transfers
- `spl-tokens.ts` - SPL token operations (transfer, balance, creation)
- `transaction-simulation.ts` - Simulating transactions before execution

### Agent-First Features

- `natural-language-parsing.ts` - Parse user intents ("swap 1 SOL for USDC")
- `safety-guardrails.ts` - Risk scoring and safety checks
- `error-recovery.ts` - Graceful error handling and retry strategies

### DeFi Integrations

- `drift-perps.ts` - Perpetual futures trading on Drift
- `pyth-prices.ts` - Real-time price feeds from Pyth
- `defi-yield.ts` - Discovering yield opportunities across protocols
- `agentdex-swaps.ts` - Token swaps on AgentDEX

### Advanced Use Cases

- `multi-transaction.ts` - Batching multiple operations
- `pda-management.ts` - Working with Program Derived Addresses
- `rpc-optimization.ts` - Connection pooling and retry logic

## 🚀 Running Examples

```bash
# Install dependencies
npm install solana-agent-sdk

# Run an example
npx ts-node examples/basic-wallet.ts
```

## 📝 Template for Your Agent

```typescript
import { SolanaAgentSDK, parseIntent, checkSwapSafety } from 'solana-agent-sdk';
import { Keypair } from '@solana/web3.js';

async function main() {
  // 1. Initialize SDK
  const wallet = Keypair.generate();
  const sdk = new SolanaAgentSDK({
    wallet,
    network: 'mainnet-beta', // or 'devnet' for testing
    commitment: 'confirmed'
  });

  // 2. Parse user intent
  const intent = parseIntent("swap 2 SOL for USDC");
  console.log('Parsed intent:', intent);

  // 3. Safety check
  const balance = await sdk.wallet.getBalance();
  const safety = checkSwapSafety({
    inputAmount: intent.params.amount,
    walletBalance: balance,
    slippageBps: 50,
    inputToken: intent.params.inputToken,
    outputToken: intent.params.outputToken
  });

  if (!safety.overallSafe) {
    console.error('Unsafe operation:', safety.issues);
    return;
  }

  // 4. Execute operation
  try {
    // Your logic here
    console.log('Operation successful!');
  } catch (error) {
    console.error('Operation failed:', error.message);
  }
}

main();
```

## 🎯 Common Agent Patterns

### Pattern 1: Safe Transaction Execution

```typescript
async function safeExecute(sdk: SolanaAgentSDK, transaction: Transaction) {
  // 1. Simulate first
  const simulation = await sdk.rpc.simulateTransaction(transaction);
  
  if (!simulation.value.err) {
    // 2. Execute only if simulation succeeds
    const signature = await sdk.rpc.sendAndConfirmTransaction(transaction);
    console.log('Success:', signature);
  } else {
    console.error('Simulation failed:', simulation.value.logs);
  }
}
```

### Pattern 2: Retry with Exponential Backoff

```typescript
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Pattern 3: Price Monitoring

```typescript
async function monitorPrice(sdk: SolanaAgentSDK, symbol: string, threshold: number) {
  const price = await sdk.pyth.getPrice(symbol);
  
  if (price > threshold) {
    console.log(`Alert: ${symbol} crossed ${threshold}!`);
    // Trigger your agent's action
  }
}
```

## 🛠️ Testing on Devnet

All examples work on devnet. Just change the network:

```typescript
const sdk = new SolanaAgentSDK({
  wallet,
  network: 'devnet',
  commitment: 'confirmed'
});
```

Get devnet SOL:
```bash
solana airdrop 2 <your-address> --url devnet
```

## 📚 Further Reading

- [Main README](../README.md) - SDK overview and quick start
- [Contributing Guide](../CONTRIBUTING.md) - How to add new modules
- [Forum Post](https://agents.colosseum.com/post/18) - Community discussion

## 💡 Need Help?

- Open an issue on GitHub
- Comment on our forum post
- Check existing examples for similar use cases

---

**More examples coming soon!** Contributions welcome. 🎩
