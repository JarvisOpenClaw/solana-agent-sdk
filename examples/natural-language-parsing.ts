import { SolanaAgentSDK, parseIntent, checkSwapSafety } from 'solana-agent-sdk';
import { Keypair } from '@solana/web3.js';

/**
 * Example: Natural Language Intent Parsing
 * 
 * This example demonstrates how AI agents can parse natural language
 * commands into structured parameters for Solana operations.
 */

async function main() {
  console.log('🧠 Natural Language Parsing Examples\n');

  // Example 1: Swap Intent
  console.log('1️⃣ Swap Intent:');
  const swapIntent = parseIntent("swap 2 SOL for USDC");
  console.log('Input: "swap 2 SOL for USDC"');
  console.log('Parsed:', JSON.stringify(swapIntent, null, 2));
  console.log('');

  // Example 2: Transfer Intent
  console.log('2️⃣ Transfer Intent:');
  const transferIntent = parseIntent("send 100 USDC to 8xG...Abc");
  console.log('Input: "send 100 USDC to 8xG...Abc"');
  console.log('Parsed:', JSON.stringify(transferIntent, null, 2));
  console.log('');

  // Example 3: Stake Intent
  console.log('3️⃣ Stake Intent:');
  const stakeIntent = parseIntent("stake 50 SOL");
  console.log('Input: "stake 50 SOL"');
  console.log('Parsed:', JSON.stringify(stakeIntent, null, 2));
  console.log('');

  // Example 4: Query Intent
  console.log('4️⃣ Query Intent:');
  const queryIntent = parseIntent("what is the price of SOL");
  console.log('Input: "what is the price of SOL"');
  console.log('Parsed:', JSON.stringify(queryIntent, null, 2));
  console.log('');

  // Example 5: Complex Intent
  console.log('5️⃣ Complex Intent with Slippage:');
  const complexIntent = parseIntent("swap 1.5 SOL for USDC with 1% slippage");
  console.log('Input: "swap 1.5 SOL for USDC with 1% slippage"');
  console.log('Parsed:', JSON.stringify(complexIntent, null, 2));
  console.log('');

  // Example 6: Using Parsed Intent in SDK
  console.log('6️⃣ Using Parsed Intent with SDK:\n');
  
  const wallet = Keypair.generate();
  const sdk = new SolanaAgentSDK({
    wallet,
    network: 'devnet',
    commitment: 'confirmed'
  });

  // Parse user input
  const userInput = "swap 2 SOL for USDC";
  const intent = parseIntent(userInput);

  console.log(`User said: "${userInput}"`);
  console.log(`Action: ${intent.action}`);
  console.log(`Amount: ${intent.params.amount} ${intent.params.inputToken}`);
  console.log(`Target: ${intent.params.outputToken}`);

  // Safety check before execution
  const balance = await sdk.wallet.getBalance();
  console.log(`\nWallet balance: ${balance / 1e9} SOL`);

  const safety = checkSwapSafety({
    inputAmount: intent.params.amount,
    walletBalance: balance / 1e9,
    slippageBps: intent.params.slippageBps || 50,
    inputToken: intent.params.inputToken,
    outputToken: intent.params.outputToken
  });

  console.log('\nSafety Check:');
  console.log(`- Overall Safe: ${safety.overallSafe ? '✅' : '❌'}`);
  console.log(`- Recommendation: ${safety.recommendation}`);
  if (safety.issues.length > 0) {
    console.log('- Issues:', safety.issues.join(', '));
  }
  if (safety.warnings.length > 0) {
    console.log('- Warnings:', safety.warnings.join(', '));
  }

  if (safety.overallSafe) {
    console.log('\n✅ Safe to proceed with swap!');
    // In a real agent, you would execute the swap here:
    // const result = await sdk.agentdex.swap({
    //   inputToken: intent.params.inputToken,
    //   outputToken: intent.params.outputToken,
    //   amount: intent.params.amount,
    //   slippageBps: intent.params.slippageBps || 50
    // });
  } else {
    console.log('\n❌ Unsafe operation - aborting');
  }
}

main().catch(console.error);
