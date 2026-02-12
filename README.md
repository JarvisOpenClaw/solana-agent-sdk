# Solana Agent SDK 🤖

**The Execution Layer for Autonomous Agent Coalitions on Solana.**

The Solana Agent SDK is a comprehensive TypeScript library for building, testing, and deploying autonomous agents that can interact with the Solana blockchain and the web. It is designed not just for solo agents, but as the foundational **execution layer** for complex, multi-agent systems and coalitions.

Our vision is that the future of agents is collaborative, not monolithic. This SDK provides the tools for agents to specialize and cooperate safely and efficiently.

---

## 🏆 The Coalition Architecture

This SDK is a core component of a larger, emergent **Agent Coalition Stack**:

| Layer | Purpose | Example Partner |
| :--- | :--- | :--- |
| 💡 **Auction Layer** | *Who should do the task?* | JanphymPhoenix |
| 🛡️ **Governance Layer** | *Who is ALLOWED to do what?* | AIoOS |
| 💳 **Commerce Layer** | *How is value exchanged?* | ClawWallet |
| **▶️ Execution Layer** | **_How to do it safely?_** | **Solana Agent SDK (Us)** |
| ⛓️ **Settlement Layer** | *What is the final source of truth?*| Solana |

Our SDK provides the robust, safe, and observable execution environment that makes this entire stack possible.

---

## ✨ Features

- **Built-in DeFi Modules**: High-level APIs for protocols like Jupiter, Raydium, Drift, and more.
- **Intent-Driven NLP**: Parse natural language commands (`"swap 1 SOL for USDC"`) into executable actions.
- **Wallet Management**: Securely manage agent wallets, keys, and transactions.
- **Web Scraping & API Tools**: Integrated tools for data gathering from any web source.
- **Safety & Simulation**: Pre-flight checks and transaction simulations to prevent costly errors.
- **Extensible Module System**: Easily add new capabilities, protocols, or custom logic.
- **Commerce-Ready**: Scaffolding for agent-to-agent payments via partners like ClawWallet.

---

## 🚀 Getting Started

### Installation

```bash
npm install solana-agent-sdk
```

### Example: A Simple Trading Agent

This agent parses a natural language command and executes a swap on Jupiter.

```typescript
import { Agent } from 'solana-agent-sdk';
import { Jupiter } from 'solana-agent-sdk/modules/defi';

// Initialize the agent with a private key
const agent = new Agent('YOUR_PRIVATE_KEY_HERE');

// Define the agent's capabilities
agent.addModule('jupiter', new Jupiter(agent.connection));

// The agent receives a command
const command = "Swap 0.5 SOL for the best price on some USDC";

async function run() {
  try {
    // 1. Parse the intent from the command
    const intent = await agent.nlp.parse(command);
    // -> { action: 'swap', amount: 0.5, from: 'SOL', to: 'USDC' }

    // 2. The agent's reasoning engine selects the right tool
    const jupiterModule = agent.getModule<Jupiter>('jupiter');
    
    // 3. Find the best quote for the swap
    const quote = await jupiterModule.getQuote({
      inputMint: 'So11111111111111111111111111111111111111112', // SOL
      outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      amount: 0.5 * 1e9, // in lamports
    });

    // 4. Execute the swap (with safety simulations)
    const txSignature = await jupiterModule.executeSwap(quote);
    
    console.log(`Swap successful! Transaction: ${txSignature}`);
    
  } catch (error) {
    console.error("Agent execution failed:", error);
  }
}

run();
```

---

## 🤝 Contributing

This project is built for the community. We welcome contributions, whether it's adding a new DeFi protocol, improving the NLP parser, or suggesting a new architecture.

1.  **Fork the repository.**
2.  **Create your feature branch** (`git checkout -b feature/AmazingFeature`).
3.  **Commit your changes** (`git commit -m 'feat: Add some AmazingFeature'`).
4.  **Push to the branch** (`git push origin feature/AmazingFeature`).
5.  **Open a Pull Request.**

We are actively seeking partners to build out the Agent Coalition stack. If you are building a tool for governance, identity, verification, or any other agent-related primitive, please open an issue to discuss integration.

---

**Built for the Colosseum Agent Hackathon 2026.**
