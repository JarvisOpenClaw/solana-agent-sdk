/**
 * Safety Guards Module
 * Protect AI agents from making costly mistakes
 * Pre-flight checks before any dangerous operation
 */

import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';

export interface SafetyCheck {
  passed: boolean;
  level: 'safe' | 'warning' | 'danger' | 'blocked';
  message: string;
  details?: string;
}

export interface SafetyReport {
  overallSafe: boolean;
  checks: SafetyCheck[];
  recommendation: string;
}

export interface SwapSafetyParams {
  inputAmount: number;
  inputToken: string;
  outputToken: string;
  walletBalance: number;
  slippageBps: number;
  expectedOutput?: number;
}

const DEFAULT_RPC = 'https://api.mainnet-beta.solana.com';

/**
 * Check if a swap is safe for an agent to execute
 */
export function checkSwapSafety(params: SwapSafetyParams): SafetyReport {
  const checks: SafetyCheck[] = [];
  
  // Check 1: Balance percentage
  const percentageOfBalance = (params.inputAmount / params.walletBalance) * 100;
  if (percentageOfBalance > 90) {
    checks.push({
      passed: false,
      level: 'danger',
      message: `Using ${percentageOfBalance.toFixed(1)}% of wallet balance`,
      details: 'Consider keeping reserves for fees and emergencies'
    });
  } else if (percentageOfBalance > 50) {
    checks.push({
      passed: true,
      level: 'warning',
      message: `Using ${percentageOfBalance.toFixed(1)}% of wallet balance`,
      details: 'Large position relative to portfolio'
    });
  } else {
    checks.push({
      passed: true,
      level: 'safe',
      message: `Using ${percentageOfBalance.toFixed(1)}% of wallet balance`
    });
  }
  
  // Check 2: Slippage tolerance
  if (params.slippageBps > 500) { // > 5%
    checks.push({
      passed: false,
      level: 'danger',
      message: `Slippage tolerance is ${params.slippageBps / 100}%`,
      details: 'High slippage may result in significant value loss'
    });
  } else if (params.slippageBps > 100) { // > 1%
    checks.push({
      passed: true,
      level: 'warning',
      message: `Slippage tolerance is ${params.slippageBps / 100}%`,
      details: 'Consider lower slippage for better execution'
    });
  } else {
    checks.push({
      passed: true,
      level: 'safe',
      message: `Slippage tolerance is ${params.slippageBps / 100}%`
    });
  }
  
  // Check 3: Sufficient balance for fees
  const estimatedFee = 0.001; // SOL for fees
  if (params.inputToken === 'SOL' && params.walletBalance - params.inputAmount < estimatedFee) {
    checks.push({
      passed: false,
      level: 'blocked',
      message: 'Insufficient SOL remaining for transaction fees',
      details: `Need at least ${estimatedFee} SOL for fees after swap`
    });
  }
  
  // Generate recommendation
  const hasDanger = checks.some(c => c.level === 'danger');
  const hasBlocked = checks.some(c => c.level === 'blocked');
  const hasWarning = checks.some(c => c.level === 'warning');
  
  let recommendation: string;
  let overallSafe: boolean;
  
  if (hasBlocked) {
    recommendation = 'BLOCKED: Transaction cannot proceed due to critical issues';
    overallSafe = false;
  } else if (hasDanger) {
    recommendation = 'NOT RECOMMENDED: High-risk transaction, proceed with extreme caution';
    overallSafe = false;
  } else if (hasWarning) {
    recommendation = 'CAUTION: Transaction has some risks, review before proceeding';
    overallSafe = true;
  } else {
    recommendation = 'SAFE: Transaction appears safe to execute';
    overallSafe = true;
  }
  
  return { overallSafe, checks, recommendation };
}

/**
 * Check wallet health before operations
 */
export async function checkWalletHealth(
  walletAddress: string,
  rpcUrl: string = DEFAULT_RPC
): Promise<SafetyReport> {
  const connection = new Connection(rpcUrl, 'confirmed');
  const pubkey = new PublicKey(walletAddress);
  const checks: SafetyCheck[] = [];
  
  try {
    const balance = await connection.getBalance(pubkey);
    const solBalance = balance / 1e9;
    
    // Check SOL balance for fees
    if (solBalance < 0.001) {
      checks.push({
        passed: false,
        level: 'blocked',
        message: `SOL balance (${solBalance.toFixed(6)}) too low for transactions`,
        details: 'Need at least 0.001 SOL for transaction fees'
      });
    } else if (solBalance < 0.01) {
      checks.push({
        passed: true,
        level: 'warning',
        message: `Low SOL balance: ${solBalance.toFixed(4)} SOL`,
        details: 'Consider adding more SOL for multiple transactions'
      });
    } else {
      checks.push({
        passed: true,
        level: 'safe',
        message: `SOL balance: ${solBalance.toFixed(4)} SOL`
      });
    }
    
    const overallSafe = !checks.some(c => c.level === 'blocked' || c.level === 'danger');
    const recommendation = overallSafe 
      ? 'Wallet is healthy and ready for transactions'
      : 'Wallet has issues that need to be resolved';
    
    return { overallSafe, checks, recommendation };
    
  } catch (error: any) {
    return {
      overallSafe: false,
      checks: [{
        passed: false,
        level: 'blocked',
        message: 'Failed to check wallet health',
        details: error.message
      }],
      recommendation: 'Unable to verify wallet status'
    };
  }
}

/**
 * Pre-flight check for any transaction
 */
export async function preflightCheck(
  walletAddress: string,
  operation: string,
  params: Record<string, any>,
  rpcUrl: string = DEFAULT_RPC
): Promise<SafetyReport> {
  const checks: SafetyCheck[] = [];
  
  // Always check wallet health first
  const walletHealth = await checkWalletHealth(walletAddress, rpcUrl);
  checks.push(...walletHealth.checks);
  
  // Operation-specific checks
  if (operation === 'swap') {
    const swapSafety = checkSwapSafety(params as SwapSafetyParams);
    checks.push(...swapSafety.checks);
  }
  
  const hasBlocked = checks.some(c => c.level === 'blocked');
  const hasDanger = checks.some(c => c.level === 'danger');
  
  return {
    overallSafe: !hasBlocked && !hasDanger,
    checks,
    recommendation: hasBlocked ? 'BLOCKED' : hasDanger ? 'NOT RECOMMENDED' : 'SAFE TO PROCEED'
  };
}

/**
 * Quick safety check - returns simple yes/no with reason
 */
export function quickSafetyCheck(report: SafetyReport): { safe: boolean; reason: string } {
  if (report.overallSafe) {
    const warnings = report.checks.filter(c => c.level === 'warning');
    if (warnings.length > 0) {
      return { safe: true, reason: `Safe with ${warnings.length} warning(s): ${warnings[0].message}` };
    }
    return { safe: true, reason: 'All safety checks passed' };
  } else {
    const issues = report.checks.filter(c => c.level === 'danger' || c.level === 'blocked');
    return { safe: false, reason: issues.map(i => i.message).join('; ') };
  }
}
