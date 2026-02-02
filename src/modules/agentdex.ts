import { Connection } from '@solana/web3.js';
import { WalletModule } from './wallet';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AgentDEXConfig {
  /** AgentDEX API base URL (no trailing slash). */
  baseUrl: string;
  /** Bearer token, e.g. "adx_xxx". */
  apiKey: string;
}

export interface AgentDEXQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpact: number;
  slippageBps: number;
  routes: string[];
}

export interface AgentDEXSwapResult {
  txSignature: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
}

export interface TokenBalance {
  mint: string;
  symbol: string;
  balance: string;
  usdValue: number;
}

export interface Portfolio {
  wallet: string;
  totalUsdValue: number;
  tokens: TokenBalance[];
}

export interface TokenPrice {
  mint: string;
  symbol: string;
  price: number;
  updatedAt: string;
}

export interface LimitOrder {
  id: string;
  inputMint: string;
  outputMint: string;
  amount: string;
  targetPrice: number;
  status: string;
  createdAt: string;
}

// ── Module ───────────────────────────────────────────────────────────────────

export class AgentDEXModule {
  private connection: Connection;
  private wallet: WalletModule;
  private baseUrl: string;
  private apiKey: string;

  constructor(
    connection: Connection,
    wallet: WalletModule,
    config: AgentDEXConfig,
  ) {
    this.connection = connection;
    this.wallet = wallet;
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.apiKey = config.apiKey;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error(`AgentDEX GET ${path} failed: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  }

  private async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`AgentDEX POST ${path} failed: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  }

  private async del<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error(`AgentDEX DELETE ${path} failed: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  }

  // ── Swap ─────────────────────────────────────────────────────────────────

  /**
   * Get a swap quote from AgentDEX.
   *
   * @param inputMint  - Input token mint address
   * @param outputMint - Output token mint address
   * @param amount     - Amount in base units (lamports / smallest unit)
   * @param slippageBps - Slippage tolerance in basis points (default 50)
   */
  async getQuote(
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps: number = 50,
  ): Promise<AgentDEXQuote> {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: String(amount),
      slippageBps: String(slippageBps),
    });
    return this.get<AgentDEXQuote>(`/api/v1/quote?${params}`);
  }

  /**
   * Execute a swap through AgentDEX.
   *
   * @param inputMint  - Input token mint address
   * @param outputMint - Output token mint address
   * @param amount     - Amount in base units
   * @param slippageBps - Slippage tolerance in basis points (default 50)
   */
  async executeSwap(
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps: number = 50,
  ): Promise<AgentDEXSwapResult> {
    return this.post<AgentDEXSwapResult>('/api/v1/swap', {
      inputMint,
      outputMint,
      amount,
      slippageBps,
    });
  }

  // ── Portfolio ────────────────────────────────────────────────────────────

  /**
   * Retrieve token balances and USD values for a wallet.
   *
   * @param wallet - Solana wallet address
   */
  async getPortfolio(wallet: string): Promise<Portfolio> {
    return this.get<Portfolio>(`/api/v1/portfolio/${wallet}`);
  }

  // ── Prices ───────────────────────────────────────────────────────────────

  /**
   * Get the current price of a single token.
   *
   * @param mint - Token mint address
   */
  async getPrice(mint: string): Promise<TokenPrice> {
    return this.get<TokenPrice>(`/api/v1/prices/${mint}`);
  }

  /**
   * Get prices for all supported tokens.
   */
  async getPrices(): Promise<TokenPrice[]> {
    return this.get<TokenPrice[]>('/api/v1/prices');
  }

  // ── Limit Orders ────────────────────────────────────────────────────────

  /**
   * Create a limit order.
   *
   * @param inputMint  - Input token mint address
   * @param outputMint - Output token mint address
   * @param amount     - Amount in base units
   * @param targetPrice - Target execution price
   */
  async createLimitOrder(
    inputMint: string,
    outputMint: string,
    amount: number,
    targetPrice: number,
  ): Promise<LimitOrder> {
    return this.post<LimitOrder>('/api/v1/limit-order', {
      inputMint,
      outputMint,
      amount,
      targetPrice,
    });
  }

  /**
   * List all active limit orders.
   */
  async getLimitOrders(): Promise<LimitOrder[]> {
    return this.get<LimitOrder[]>('/api/v1/limit-order');
  }

  /**
   * Cancel an existing limit order.
   *
   * @param id - Limit order ID
   */
  async cancelLimitOrder(id: string): Promise<{ id: string; status: string }> {
    return this.del<{ id: string; status: string }>(`/api/v1/limit-order/${id}`);
  }
}
