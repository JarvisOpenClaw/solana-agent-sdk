import { Connection, VersionedTransaction, PublicKey } from '@solana/web3.js';
import { WalletModule } from './wallet';

export interface SwapParams {
  from: string;
  to: string;
  amount: number;
  slippage?: number;
}

export interface Quote {
  inAmount: string;
  outAmount: string;
  priceImpact: number;
  route: string[];
}

export interface SwapResult {
  signature: string;
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
}

export class JupiterModule {
  private connection: Connection;
  private wallet: WalletModule;
  private baseUrl = 'https://quote-api.jup.ag/v6';

  constructor(connection: Connection, wallet: WalletModule) {
    this.connection = connection;
    this.wallet = wallet;
  }

  async quote(params: SwapParams): Promise<Quote> {
    const { from, to, amount, slippage = 0.5 } = params;
    
    // Token mint mapping (simplified)
    const mints: Record<string, string> = {
      'SOL': 'So11111111111111111111111111111111111111112',
      'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    };

    const inputMint = mints[from] || from;
    const outputMint = mints[to] || to;
    const amountLamports = Math.floor(amount * 1e9);

    const response = await fetch(
      `${this.baseUrl}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountLamports}&slippageBps=${slippage * 100}`
    );
    
    if (!response.ok) {
      throw new Error(`Jupiter quote failed: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();
    
    return {
      inAmount: data.inAmount,
      outAmount: data.outAmount,
      priceImpact: data.priceImpactPct,
      route: data.routePlan?.map((r: any) => r.swapInfo?.label) || []
    };
  }

  async swap(from: string, to: string, amount: number, slippage: number = 0.5): Promise<SwapResult> {
    // Token mint mapping
    const mints: Record<string, string> = {
      'SOL': 'So11111111111111111111111111111111111111112',
      'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    };

    const inputMint = mints[from] || from;
    const outputMint = mints[to] || to;
    const amountLamports = Math.floor(amount * 1e9);
    const slippageBps = Math.floor(slippage * 100);

    // Get wallet public key
    const publicKey = this.wallet.getPublicKey();
    if (!publicKey) {
      throw new Error('No wallet loaded. Please create or import a wallet first.');
    }

    // Step 1: Get quote
    const quoteResponse = await fetch(
      `${this.baseUrl}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountLamports}&slippageBps=${slippageBps}`
    );
    
    if (!quoteResponse.ok) {
      throw new Error(`Jupiter quote failed: ${quoteResponse.status}`);
    }

    const quoteData: any = await quoteResponse.json();

    // Step 2: Get swap transaction
    const swapResponse = await fetch(`${this.baseUrl}/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: quoteData,
        userPublicKey: publicKey.toBase58(),
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 'auto'
      })
    });

    if (!swapResponse.ok) {
      throw new Error(`Jupiter swap transaction failed: ${swapResponse.status}`);
    }

    const swapData: any = await swapResponse.json();

    // Step 3: Deserialize and sign transaction
    const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    
    // Sign with wallet
    const keypair = this.wallet.getKeypair();
    if (!keypair) {
      throw new Error('Wallet keypair not available for signing');
    }
    
    transaction.sign([keypair]);

    // Step 4: Send transaction
    const signature = await this.connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      maxRetries: 3
    });

    // Step 5: Confirm transaction
    const latestBlockhash = await this.connection.getLatestBlockhash();
    await this.connection.confirmTransaction({
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
    });

    return {
      signature,
      inputAmount: Number(quoteData.inAmount) / 1e9,
      outputAmount: Number(quoteData.outAmount) / 1e6, // Assuming USDC (6 decimals)
      priceImpact: quoteData.priceImpactPct || 0
    };
  }
}
