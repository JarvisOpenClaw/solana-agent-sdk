/**
 * Natural Language Parser Module
 * Convert human/agent natural language to Solana actions
 * "swap 1 SOL for USDC" → structured transaction params
 */

export interface ParsedIntent {
  action: 'swap' | 'transfer' | 'stake' | 'balance' | 'price' | 'unknown';
  confidence: number; // 0-1
  params: Record<string, any>;
  originalText: string;
  clarificationNeeded?: string;
}

// Common token aliases
const TOKEN_ALIASES: Record<string, string> = {
  'sol': 'SOL',
  'solana': 'SOL',
  'usdc': 'USDC',
  'usdt': 'USDT',
  'tether': 'USDT',
  'bonk': 'BONK',
  'jup': 'JUP',
  'jupiter': 'JUP',
  'ray': 'RAY',
  'raydium': 'RAY',
  'wif': 'WIF',
  'dogwifhat': 'WIF',
  'jito': 'JTO',
  'pyth': 'PYTH',
  'orca': 'ORCA',
  'msol': 'mSOL',
  'marinade': 'mSOL',
  'bsol': 'bSOL',
  'eth': 'ETH',
  'ethereum': 'ETH',
  'weth': 'WETH',
  'btc': 'BTC',
  'bitcoin': 'BTC',
  'wbtc': 'WBTC',
};

// Action keywords
const SWAP_KEYWORDS = ['swap', 'exchange', 'trade', 'convert', 'buy', 'sell'];
const TRANSFER_KEYWORDS = ['send', 'transfer', 'pay', 'give'];
const STAKE_KEYWORDS = ['stake', 'deposit', 'lend', 'supply', 'provide'];
const BALANCE_KEYWORDS = ['balance', 'how much', 'check', 'show', 'wallet'];
const PRICE_KEYWORDS = ['price', 'worth', 'value', 'cost', 'quote'];

/**
 * Parse natural language into structured intent
 */
export function parseIntent(text: string): ParsedIntent {
  const lower = text.toLowerCase().trim();
  const words = lower.split(/\s+/);
  
  // Detect action
  let action: ParsedIntent['action'] = 'unknown';
  let confidence = 0;
  
  if (SWAP_KEYWORDS.some(k => lower.includes(k))) {
    action = 'swap';
    confidence = 0.8;
  } else if (TRANSFER_KEYWORDS.some(k => lower.includes(k))) {
    action = 'transfer';
    confidence = 0.8;
  } else if (STAKE_KEYWORDS.some(k => lower.includes(k))) {
    action = 'stake';
    confidence = 0.7;
  } else if (BALANCE_KEYWORDS.some(k => lower.includes(k))) {
    action = 'balance';
    confidence = 0.9;
  } else if (PRICE_KEYWORDS.some(k => lower.includes(k))) {
    action = 'price';
    confidence = 0.9;
  }
  
  const params: Record<string, any> = {};
  
  // Extract amount (number followed by token or just number)
  const amountMatch = lower.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?/);
  if (amountMatch) {
    params.amount = parseFloat(amountMatch[1]);
    if (amountMatch[2]) {
      const token = normalizeToken(amountMatch[2]);
      if (token) params.inputToken = token;
    }
  }
  
  // For swaps, find "for/to/into" pattern
  if (action === 'swap') {
    const swapMatch = lower.match(/(?:for|to|into|→|->)\s+([a-zA-Z]+)/);
    if (swapMatch) {
      const outputToken = normalizeToken(swapMatch[1]);
      if (outputToken) params.outputToken = outputToken;
      confidence += 0.1;
    }
    
    // Alternative: "buy X with Y"
    const buyMatch = lower.match(/buy\s+([a-zA-Z]+)\s+(?:with|using)\s+(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?/);
    if (buyMatch) {
      params.outputToken = normalizeToken(buyMatch[1]);
      params.amount = parseFloat(buyMatch[2]);
      if (buyMatch[3]) params.inputToken = normalizeToken(buyMatch[3]);
      confidence = 0.9;
    }
    
    // "sell X for Y"
    const sellMatch = lower.match(/sell\s+(\d+(?:\.\d+)?)\s*([a-zA-Z]+)\s+(?:for|into)\s+([a-zA-Z]+)/);
    if (sellMatch) {
      params.amount = parseFloat(sellMatch[1]);
      params.inputToken = normalizeToken(sellMatch[2]);
      params.outputToken = normalizeToken(sellMatch[3]);
      confidence = 0.9;
    }
  }
  
  // For transfers, find recipient
  if (action === 'transfer') {
    // Look for wallet address (base58, ~32-44 chars)
    const addressMatch = lower.match(/([1-9A-HJ-NP-Za-km-z]{32,44})/);
    if (addressMatch) {
      params.recipient = addressMatch[1];
      confidence += 0.1;
    }
    
    // Look for "to @username" or "to name"
    const toMatch = lower.match(/to\s+@?(\w+)/);
    if (toMatch && !addressMatch) {
      params.recipientName = toMatch[1];
    }
  }
  
  // For price checks, extract token
  if (action === 'price') {
    for (const word of words) {
      const token = normalizeToken(word);
      if (token) {
        params.token = token;
        break;
      }
    }
  }
  
  // Check if we need clarification
  let clarificationNeeded: string | undefined;
  
  if (action === 'swap') {
    if (!params.inputToken) clarificationNeeded = 'Which token do you want to swap FROM?';
    else if (!params.outputToken) clarificationNeeded = 'Which token do you want to swap TO?';
    else if (!params.amount) clarificationNeeded = 'How much do you want to swap?';
  }
  
  if (action === 'transfer') {
    if (!params.recipient && !params.recipientName) clarificationNeeded = 'Who do you want to send to?';
    else if (!params.amount) clarificationNeeded = 'How much do you want to send?';
  }
  
  return {
    action,
    confidence: Math.min(confidence, 1),
    params,
    originalText: text,
    clarificationNeeded
  };
}

/**
 * Normalize token name to standard symbol
 */
function normalizeToken(input: string): string | null {
  const lower = input.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Check aliases first
  if (TOKEN_ALIASES[lower]) {
    return TOKEN_ALIASES[lower];
  }
  
  // Check if it's already a valid symbol (uppercase, 2-10 chars)
  if (lower.length >= 2 && lower.length <= 10) {
    return lower.toUpperCase();
  }
  
  return null;
}

/**
 * Generate human-readable confirmation of parsed intent
 */
export function describeIntent(intent: ParsedIntent): string {
  const { action, params, confidence } = intent;
  
  switch (action) {
    case 'swap':
      if (params.inputToken && params.outputToken && params.amount) {
        return `Swap ${params.amount} ${params.inputToken} for ${params.outputToken} (${(confidence * 100).toFixed(0)}% confident)`;
      }
      return `Swap tokens (incomplete: ${intent.clarificationNeeded})`;
      
    case 'transfer':
      const recipient = params.recipient || params.recipientName || 'unknown';
      return `Send ${params.amount || '?'} ${params.inputToken || 'tokens'} to ${recipient}`;
      
    case 'balance':
      return `Check wallet balance${params.token ? ` for ${params.token}` : ''}`;
      
    case 'price':
      return `Get price for ${params.token || 'token'}`;
      
    case 'stake':
      return `Stake ${params.amount || '?'} ${params.inputToken || 'tokens'}`;
      
    default:
      return `Unknown action: "${intent.originalText}"`;
  }
}

/**
 * Validate that parsed intent has all required params
 */
export function isIntentComplete(intent: ParsedIntent): boolean {
  return !intent.clarificationNeeded && intent.confidence >= 0.7;
}

/**
 * Convert parsed intent to SDK function call params
 */
export function intentToParams(intent: ParsedIntent): Record<string, any> | null {
  if (!isIntentComplete(intent)) return null;
  
  switch (intent.action) {
    case 'swap':
      return {
        inputMint: intent.params.inputToken,
        outputMint: intent.params.outputToken,
        amount: intent.params.amount,
        slippageBps: 50 // Default 0.5%
      };
      
    case 'transfer':
      return {
        recipient: intent.params.recipient,
        amount: intent.params.amount,
        token: intent.params.inputToken || 'SOL'
      };
      
    case 'price':
      return {
        token: intent.params.token
      };
      
    default:
      return intent.params;
  }
}
