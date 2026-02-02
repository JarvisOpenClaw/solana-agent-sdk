/**
 * SDK Integration Tests
 * Run with: npx ts-node tests/integration.ts
 */

import { SolanaAgentSDK } from '../src';

async function testWallet() {
  console.log('🔧 Testing Wallet Module...');
  const sdk = new SolanaAgentSDK({ rpcUrl: 'https://api.devnet.solana.com' });
  
  // Create wallet
  const keypair = sdk.wallet.create();
  console.log(`  ✅ Created wallet: ${keypair.publicKey.toBase58()}`);
  
  // Get balance
  const balance = await sdk.wallet.getBalance();
  console.log(`  ✅ Balance: ${balance} SOL`);
  
  return true;
}

async function testAccounts() {
  console.log('🔧 Testing Accounts Module...');
  const sdk = new SolanaAgentSDK({ rpcUrl: 'https://api.devnet.solana.com' });
  
  // Get a known account (System Program)
  const systemProgram = '11111111111111111111111111111111';
  const exists = await sdk.accounts.exists(systemProgram);
  console.log(`  ✅ System Program exists: ${exists}`);
  
  const balance = await sdk.accounts.getBalance(systemProgram);
  console.log(`  ✅ System Program balance: ${balance} SOL`);
  
  return true;
}

async function testPyth() {
  console.log('🔧 Testing Pyth Module...');
  const sdk = new SolanaAgentSDK({ rpcUrl: 'https://api.devnet.solana.com' });
  
  try {
    const solPrice = await sdk.pyth.getPrice('SOL');
    console.log(`  ✅ SOL Price: $${solPrice.price.toFixed(2)} (±${solPrice.confidence.toFixed(2)})`);
    
    const btcPrice = await sdk.pyth.getPrice('BTC');
    console.log(`  ✅ BTC Price: $${btcPrice.price.toFixed(2)}`);
    
    return true;
  } catch (e: any) {
    console.log(`  ❌ Pyth error: ${e.message}`);
    return false;
  }
}

async function testJupiterQuote() {
  console.log('🔧 Testing Jupiter Module...');
  const sdk = new SolanaAgentSDK({ rpcUrl: 'https://api.mainnet-beta.solana.com' });
  
  try {
    // Use native fetch with proper headers
    const inputMint = 'So11111111111111111111111111111111111111112'; // SOL
    const outputMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC
    const amount = 1000000000; // 1 SOL in lamports
    
    const response = await fetch(
      `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data: any = await response.json();
    const outAmount = Number(data.outAmount) / 1e6;
    
    console.log(`  ✅ 1 SOL → ${outAmount.toFixed(2)} USDC`);
    console.log(`  ✅ Price impact: ${data.priceImpactPct || '0'}%`);
    
    return true;
  } catch (e: any) {
    console.log(`  ❌ Jupiter error: ${e.message}`);
    return false;
  }
}

async function testRPC() {
  console.log('🔧 Testing RPC Module...');
  const sdk = new SolanaAgentSDK({ rpcUrl: 'https://api.devnet.solana.com' });
  
  const slot = await sdk.rpc.getSlot();
  console.log(`  ✅ Current slot: ${slot}`);
  
  const blockHeight = await sdk.rpc.getBlockHeight();
  console.log(`  ✅ Block height: ${blockHeight}`);
  
  const { blockhash } = await sdk.rpc.getRecentBlockhash();
  console.log(`  ✅ Recent blockhash: ${blockhash.slice(0, 20)}...`);
  
  const epochInfo = await sdk.rpc.getEpochInfo();
  console.log(`  ✅ Epoch: ${epochInfo.epoch}, slot ${epochInfo.slotIndex}/${epochInfo.slotsInEpoch}`);
  
  return true;
}

async function runTests() {
  console.log('\n🚀 Solana Agent SDK - Integration Tests\n');
  console.log('='.repeat(50));
  
  const results: { name: string; passed: boolean }[] = [];
  
  try {
    results.push({ name: 'Wallet', passed: await testWallet() });
  } catch (e: any) {
    console.log(`  ❌ Wallet failed: ${e.message}`);
    results.push({ name: 'Wallet', passed: false });
  }
  
  try {
    results.push({ name: 'Accounts', passed: await testAccounts() });
  } catch (e: any) {
    console.log(`  ❌ Accounts failed: ${e.message}`);
    results.push({ name: 'Accounts', passed: false });
  }
  
  try {
    results.push({ name: 'Pyth', passed: await testPyth() });
  } catch (e: any) {
    console.log(`  ❌ Pyth failed: ${e.message}`);
    results.push({ name: 'Pyth', passed: false });
  }
  
  try {
    results.push({ name: 'Jupiter', passed: await testJupiterQuote() });
  } catch (e: any) {
    console.log(`  ❌ Jupiter failed: ${e.message}`);
    results.push({ name: 'Jupiter', passed: false });
  }
  
  try {
    results.push({ name: 'RPC', passed: await testRPC() });
  } catch (e: any) {
    console.log(`  ❌ RPC failed: ${e.message}`);
    results.push({ name: 'RPC', passed: false });
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Results:');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(r => {
    console.log(`  ${r.passed ? '✅' : '❌'} ${r.name}`);
  });
  
  console.log(`\n${passed}/${total} tests passed\n`);
}

runTests().catch(console.error);
