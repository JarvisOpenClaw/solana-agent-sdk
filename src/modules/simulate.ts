/**
 * Transaction Simulation Module
 * Preview what a transaction will do BEFORE signing
 * Critical for AI agents to understand outcomes
 */

import { Connection, Transaction, VersionedTransaction, PublicKey } from '@solana/web3.js';

export interface SimulationResult {
  success: boolean;
  logs: string[];
  unitsConsumed: number;
  fee: number; // in SOL
  balanceChanges: BalanceChange[];
  error?: string;
  warnings: string[];
}

export interface BalanceChange {
  account: string;
  before: number;
  after: number;
  change: number;
  token?: string; // 'SOL' or mint address
}

const DEFAULT_RPC = 'https://api.mainnet-beta.solana.com';

/**
 * Simulate a transaction and return human-readable results
 * Agents can understand what will happen before committing
 */
export async function simulateTransaction(
  transaction: Transaction | VersionedTransaction,
  feePayer: PublicKey,
  rpcUrl: string = DEFAULT_RPC
): Promise<SimulationResult> {
  const connection = new Connection(rpcUrl, 'confirmed');
  
  const warnings: string[] = [];
  const balanceChanges: BalanceChange[] = [];
  
  try {
    // Get pre-simulation balance
    const preBalance = await connection.getBalance(feePayer);
    
    // Simulate
    let simulation;
    if (transaction instanceof Transaction) {
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = feePayer;
      simulation = await connection.simulateTransaction(transaction);
    } else {
      simulation = await connection.simulateTransaction(transaction);
    }
    
    const result = simulation.value;
    
    // Parse results
    const success = result.err === null;
    const logs = result.logs || [];
    const unitsConsumed = result.unitsConsumed || 0;
    
    // Estimate fee (5000 lamports per signature typical)
    const fee = 0.000005; // ~5000 lamports in SOL
    
    // Check for common warnings
    if (unitsConsumed > 200000) {
      warnings.push('High compute usage - transaction may be complex');
    }
    
    // Look for balance changes in logs
    for (const log of logs) {
      if (log.includes('Transfer')) {
        warnings.push('Transaction includes token/SOL transfers');
      }
      if (log.includes('insufficient')) {
        warnings.push('Possible insufficient funds');
      }
    }
    
    return {
      success,
      logs,
      unitsConsumed,
      fee,
      balanceChanges,
      error: result.err ? JSON.stringify(result.err) : undefined,
      warnings
    };
    
  } catch (error: any) {
    return {
      success: false,
      logs: [],
      unitsConsumed: 0,
      fee: 0,
      balanceChanges: [],
      error: error.message,
      warnings: ['Simulation failed - transaction may be invalid']
    };
  }
}

/**
 * Quick simulation check - just returns pass/fail with reason
 */
export async function willTransactionSucceed(
  transaction: Transaction | VersionedTransaction,
  feePayer: PublicKey,
  rpcUrl: string = DEFAULT_RPC
): Promise<{ success: boolean; reason: string }> {
  const result = await simulateTransaction(transaction, feePayer, rpcUrl);
  
  if (result.success) {
    return { 
      success: true, 
      reason: `Transaction will succeed. Estimated fee: ${result.fee} SOL, compute: ${result.unitsConsumed} units` 
    };
  } else {
    return { 
      success: false, 
      reason: result.error || 'Transaction simulation failed' 
    };
  }
}

/**
 * Estimate total cost of a transaction
 */
export async function estimateTransactionCost(
  transaction: Transaction | VersionedTransaction,
  feePayer: PublicKey,
  rpcUrl: string = DEFAULT_RPC
): Promise<{ fee: number; computeUnits: number; priorityFee?: number }> {
  const result = await simulateTransaction(transaction, feePayer, rpcUrl);
  
  return {
    fee: result.fee,
    computeUnits: result.unitsConsumed,
    priorityFee: 0 // Could be enhanced to detect priority fees
  };
}
