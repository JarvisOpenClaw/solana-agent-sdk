/**
 * Quick Play - Run the SDK in 30 seconds
 * npx ts-node examples/quick-start.ts
 */

import { SolanaAgentSDK, parseIntent, checkSwapSafety } from '../src';

async function main() {
  console.log('🚀 Solana Agent SDK - Quick Start\n');

  // Initialize SDK (no wallet needed for this demo)
  const sdk = new SolanaAgentSDK({ rpcUrl: 'https://api.devnet.solana.com' });

  // 1. Get live price from Pyth
  console.log('📊 Getting live SOL price from Pyth...');
  const price = await sdk.pyth.getPrice('SOL');
  console.log(`   SOL = $${price.price.toFixed(2)} (±$${price.confidence.toFixed(2)})\n`);

  // 2. Parse natural language
  console.log('🗣️ Parsing natural language...');
  const intent = parseIntent("swap 1 SOL for USDC");
  console.log(`   Input: "swap 1 SOL for USDC"`);
  console.log(`   Output: ${JSON.stringify(intent.params)}\n`);

  // 3. Safety check
  console.log('🛡️ Running safety check...');
  const safety = checkSwapSafety({
    inputAmount: 1,
    walletBalance: 10,
    slippageBps: 50,
    inputToken: 'SOL',
    outputToken: 'USDC'
  });
  console.log(`   Safe: ${safety.overallSafe ? 'YES ✅' : 'NO ❌'}`);
  console.log(`   ${safety.recommendation}\n`);

  // 4. RPC info
  console.log('⛓️ Getting blockchain info...');
  const slot = await sdk.rpc.getSlot();
  const epoch = await sdk.rpc.getEpochInfo();
  console.log(`   Current slot: ${slot}`);
  console.log(`   Epoch: ${epoch.epoch}\n`);

  console.log('✅ SDK is working! Ready for agent integration.');
}

main().catch(console.error);
