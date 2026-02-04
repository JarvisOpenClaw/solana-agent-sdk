import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js';
import { WalletModule } from './wallet';
import {
  DriftClient,
  Wallet,
  BN,
  PerpMarkets,
  DriftEnv,
  PerpPosition,
  PositionDirection,
  MarketType,
  getMarketOrderParams,
  getLimitOrderParams,
  getUserAccountPublicKey,
  initialize,
  convertToNumber,
  PRICE_PRECISION,
  BASE_PRECISION,
  QUOTE_PRECISION,
} from '@drift-labs/sdk';
import { getAssociatedTokenAddress } from '@solana/spl-token';

export interface DriftMarket {
  symbol: string;
  marketIndex: number;
  price: number;
  volume24h: number;
  openInterest: number;
  oraclePrice: number;
  fundingRate: number;
}

export interface Position {
  marketIndex: number;
  symbol: string;
  size: number;
  entryPrice: number;
  markPrice: number;
  pnl: number;
  leverage: number;
  side: 'long' | 'short' | null;
  liquidationPrice: number | null;
}

export interface DriftAccountInfo {
  collateral: number;
  freeCollateral: number;
  totalPositionValue: number;
  leverage: number;
  marginRatio: number;
  positions: Position[];
  unsettledPnl: number;
  openOrders: number;
}

export interface OpenPositionParams {
  market: string;
  size: number;
  leverage?: number;
  side: 'long' | 'short';
  orderType?: 'market' | 'limit';
  limitPrice?: number;
}

export interface ClosePositionParams {
  market: string;
  size?: number;
  orderType?: 'market' | 'limit';
  limitPrice?: number;
}

export interface DepositParams {
  amount: number;
  token?: 'USDC' | 'SOL';
}

export interface WithdrawParams {
  amount: number;
  token?: 'USDC' | 'SOL';
}

export interface DriftError {
  code: string;
  message: string;
  details?: any;
}

// Drift Program Constants
const DRIFT_PROGRAM_ID = new PublicKey('dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH');
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
const SPOT_MARKET_INDEX_USDC = 0;
const SPOT_MARKET_INDEX_SOL = 1;

// Market symbol to index mapping for mainnet
const MARKET_INDEX_MAP: Record<string, number> = {
  'SOL-PERP': 0,
  'BTC-PERP': 1,
  'ETH-PERP': 2,
  'APT-PERP': 3,
  'MATIC-PERP': 4,
  '1MPEPE-PERP': 5,
  'ARB-PERP': 6,
  'DOGE-PERP': 7,
  'BNB-PERP': 8,
  'SUI-PERP': 9,
  '1KBONK-PERP': 10,
  'OP-PERP': 11,
  'RENDER-PERP': 12,
  'XRP-PERP': 13,
  'HNT-PERP': 14,
  'INJ-PERP': 15,
  'LINK-PERP': 16,
  'RLB-PERP': 17,
  'PYTH-PERP': 18,
  'TIA-PERP': 19,
  'JTO-PERP': 20,
  'SEI-PERP': 21,
  'AVAX-PERP': 22,
  'WIF-PERP': 23,
  'JUP-PERP': 24,
  'DYM-PERP': 25,
  'STRK-PERP': 26,
  'W-PERP': 27,
  'KMNO-PERP': 28,
  'TNSR-PERP': 29,
};

// Logger utility
class DriftLogger {
  private prefix = '[Drift]';

  log(message: string, ...args: any[]) {
    console.log(`${this.prefix} ${message}`, ...args);
  }

  error(message: string, error: any) {
    console.error(`${this.prefix} ERROR: ${message}`, error);
    if (error instanceof Error) {
      console.error(`${this.prefix} Stack:`, error.stack);
    }
  }

  warn(message: string, ...args: any[]) {
    console.warn(`${this.prefix} WARN: ${message}`, ...args);
  }

  info(message: string, ...args: any[]) {
    console.info(`${this.prefix} INFO: ${message}`, ...args);
  }
}

export class DriftModule {
  private connection: Connection;
  private wallet: WalletModule;
  private driftClient: DriftClient | null = null;
  private logger: DriftLogger;
  private isInitialized = false;
  private env: DriftEnv = 'mainnet-beta';

  constructor(connection: Connection, wallet: WalletModule) {
    this.connection = connection;
    this.wallet = wallet;
    this.logger = new DriftLogger();
  }

  /**
   * Initialize the Drift client
   */
  async initialize(env: DriftEnv = 'mainnet-beta'): Promise<void> {
    try {
      const keypair = this.wallet.getKeypair();
      if (!keypair) {
        throw new Error('No wallet loaded. Cannot initialize Drift client.');
      }

      this.env = env;
      this.logger.info('Initializing Drift client...');

      // Create a wallet adapter for Drift SDK
      const driftWallet = {
        publicKey: keypair.publicKey,
        payer: keypair,
        // Use 'any' to avoid version conflicts between @solana/web3.js versions
        signTransaction: async (tx: any) => {
          tx.partialSign(keypair);
          return tx;
        },
        signAllTransactions: async (txs: any[]) => {
          txs.forEach((tx: any) => tx.partialSign(keypair));
          return txs;
        },
        signVersionedTransaction: async (tx: any) => {
          tx.sign([keypair]);
          return tx;
        },
        signAllVersionedTransactions: async (txs: any[]) => {
          txs.forEach((tx: any) => tx.sign([keypair]));
          return txs;
        },
      } as unknown as Wallet;

      // Initialize Drift client
      this.driftClient = new DriftClient({
        connection: this.connection as any, // Cast to avoid version conflicts
        wallet: driftWallet,
        env: env,
      });

      await this.driftClient.subscribe();
      this.isInitialized = true;
      this.logger.info('Drift client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Drift client', error);
      throw this.handleError(error);
    }
  }

  /**
   * Ensure the client is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.driftClient) {
      throw new Error('Drift client not initialized. Call initialize() first.');
    }
  }

  /**
   * Handle errors consistently
   */
  private handleError(error: any): DriftError {
    const driftError: DriftError = {
      code: 'DRIFT_ERROR',
      message: error?.message || 'Unknown error occurred',
      details: error,
    };

    // Map common error patterns
    if (error?.message?.includes('insufficient funds')) {
      driftError.code = 'INSUFFICIENT_FUNDS';
      driftError.message = 'Insufficient funds for transaction';
    } else if (error?.message?.includes('margin')) {
      driftError.code = 'MARGIN_ERROR';
      driftError.message = 'Margin requirement not met';
    } else if (error?.message?.includes('liquidation')) {
      driftError.code = 'LIQUIDATION_RISK';
      driftError.message = 'Position at risk of liquidation';
    } else if (error?.message?.includes('market')) {
      driftError.code = 'MARKET_ERROR';
      driftError.message = 'Market not found or invalid';
    }

    return driftError;
  }

  /**
   * Get user account public key
   */
  private async getUserAccountPublicKey(): Promise<PublicKey> {
    const keypair = this.wallet.getKeypair();
    if (!keypair) throw new Error('No wallet loaded');
    
    return getUserAccountPublicKey(
      DRIFT_PROGRAM_ID,
      keypair.publicKey,
      0 // subAccountId
    );
  }

  /**
   * Get market index by symbol
   */
  private getMarketIndex(symbol: string): number {
    const index = MARKET_INDEX_MAP[symbol];
    if (index === undefined) {
      throw new Error(`Market ${symbol} not found. Available markets: ${Object.keys(MARKET_INDEX_MAP).join(', ')}`);
    }
    return index;
  }

  /**
   * Get symbol by market index
   */
  private getMarketSymbol(marketIndex: number): string {
    const entry = Object.entries(MARKET_INDEX_MAP).find(([_, idx]) => idx === marketIndex);
    return entry ? entry[0] : `PERP-${marketIndex}`;
  }

  /**
   * Get all perpetual markets
   */
  async getMarkets(): Promise<DriftMarket[]> {
    this.ensureInitialized();
    
    try {
      this.logger.log('Fetching Drift markets...');
      
      const perpMarkets = this.driftClient!.getPerpMarketAccounts();
      const markets: DriftMarket[] = perpMarkets.map(market => {
        const oracleData = this.driftClient!.getOracleDataForPerpMarket(market.marketIndex);
        const oraclePrice = oracleData ? convertToNumber(oracleData.price, PRICE_PRECISION) : 0;
        
        return {
          symbol: this.getMarketSymbol(market.marketIndex),
          marketIndex: market.marketIndex,
          price: oraclePrice,
          volume24h: 0, // Volume data requires historical API
          openInterest: convertToNumber(market.amm.baseAssetAmountWithAmm, BASE_PRECISION),
          oraclePrice: oraclePrice,
          fundingRate: convertToNumber(market.amm.lastFundingRate, PRICE_PRECISION),
        };
      });

      this.logger.log(`Found ${markets.length} markets`);
      return markets;
    } catch (error) {
      this.logger.error('Failed to fetch markets', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get specific market by symbol
   */
  async getMarket(symbol: string): Promise<DriftMarket | null> {
    const markets = await this.getMarkets();
    return markets.find(m => m.symbol === symbol) || null;
  }

  /**
   * Get user Drift account info including collateral and positions
   */
  async getAccountInfo(): Promise<DriftAccountInfo> {
    this.ensureInitialized();
    
    try {
      this.logger.log('Fetching account info...');
      
      const user = this.driftClient!.getUser();
      
      if (!user) {
        return {
          collateral: 0,
          freeCollateral: 0,
          totalPositionValue: 0,
          leverage: 0,
          marginRatio: 0,
          positions: [],
          unsettledPnl: 0,
          openOrders: 0,
        };
      }

      const userAccount = user.getUserAccount();
      const positions = this.parsePositions(userAccount.perpPositions);
      
      const accountInfo: DriftAccountInfo = {
        collateral: convertToNumber(user.getTotalCollateral(), QUOTE_PRECISION),
        freeCollateral: convertToNumber(user.getFreeCollateral(), QUOTE_PRECISION),
        totalPositionValue: convertToNumber((user as any).getTotalPerpPositionValue?.() || new BN(0), QUOTE_PRECISION),
        leverage: convertToNumber(user.getLeverage(), new BN(10000)) / 100, // Leverage is in 4 decimal places
        marginRatio: convertToNumber(user.getMarginRatio(), new BN(10000)) / 100,
        positions,
        unsettledPnl: convertToNumber(user.getUnrealizedPNL(true), QUOTE_PRECISION),
        openOrders: userAccount.orders.filter(o => !o.baseAssetAmount.eq(new BN(0))).length,
      };

      this.logger.log('Account info fetched successfully');
      return accountInfo;
    } catch (error) {
      this.logger.error('Failed to fetch account info', error);
      throw this.handleError(error);
    }
  }

  /**
   * Parse positions from user account
   */
  private parsePositions(perpPositions: PerpPosition[]): Position[] {
    const positions: Position[] = [];
    
    for (const pos of perpPositions) {
      if (pos.baseAssetAmount.eq(new BN(0))) continue;
      
      const isLong = pos.baseAssetAmount.gt(new BN(0));
      const side: 'long' | 'short' = isLong ? 'long' : 'short';
      const size = Math.abs(convertToNumber(pos.baseAssetAmount, BASE_PRECISION));
      
      positions.push({
        marketIndex: pos.marketIndex,
        symbol: this.getMarketSymbol(pos.marketIndex),
        size,
        entryPrice: size > 0 ? Math.abs(convertToNumber(pos.quoteEntryAmount, QUOTE_PRECISION)) / size : 0,
        markPrice: 0, // Will be filled from market data
        pnl: convertToNumber(pos.quoteAssetAmount, QUOTE_PRECISION),
        leverage: 0, // Calculated from account info
        side,
        liquidationPrice: null, // Requires complex calculation
      });
    }
    
    return positions;
  }

  /**
   * Get user's open positions
   */
  async getPositions(): Promise<Position[]> {
    const accountInfo = await this.getAccountInfo();
    return accountInfo.positions;
  }

  /**
   * Deposit USDC collateral to Drift
   */
  async deposit(params: DepositParams): Promise<string> {
    this.ensureInitialized();
    
    const { amount, token = 'USDC' } = params;
    
    try {
      const keypair = this.wallet.getKeypair();
      if (!keypair) {
        throw new Error('No wallet loaded');
      }

      this.logger.log(`Depositing ${amount} ${token}...`);

      const decimals = token === 'USDC' ? 6 : 9; // USDC has 6 decimals, SOL has 9
      const amountBN = new BN(Math.floor(amount * Math.pow(10, decimals)));
      const spotMarketIndex = token === 'USDC' ? SPOT_MARKET_INDEX_USDC : SPOT_MARKET_INDEX_SOL;
      const mint = token === 'USDC' ? USDC_MINT : SOL_MINT;

      // Get associated token account
      const associatedTokenAccount = await getAssociatedTokenAddress(
        mint,
        keypair.publicKey
      );

      // Initialize user account if needed
      const userAccountPublicKey = await this.getUserAccountPublicKey();
      const userAccountExists = await this.connection.getAccountInfo(userAccountPublicKey);

      if (!userAccountExists) {
        this.logger.log('Initializing user account...');
        const [txSig] = await this.driftClient!.initializeUserAccount();
        this.logger.log(`User account initialized: ${txSig}`);
      }

      // Deposit collateral
      const txSig = await this.driftClient!.deposit(
        amountBN,
        spotMarketIndex,
        associatedTokenAccount
      );

      const signature = typeof txSig === 'string' ? txSig : (txSig as any)?.txSig || String(txSig);
      this.logger.log(`Deposit successful: ${signature}`);
      return signature;
    } catch (error) {
      this.logger.error('Deposit failed', error);
      throw this.handleError(error);
    }
  }

  /**
   * Withdraw USDC collateral from Drift
   */
  async withdraw(params: WithdrawParams): Promise<string> {
    this.ensureInitialized();
    
    const { amount, token = 'USDC' } = params;
    
    try {
      const keypair = this.wallet.getKeypair();
      if (!keypair) {
        throw new Error('No wallet loaded');
      }

      this.logger.log(`Withdrawing ${amount} ${token}...`);

      const decimals = token === 'USDC' ? 6 : 9;
      const amountBN = new BN(Math.floor(amount * Math.pow(10, decimals)));
      const spotMarketIndex = token === 'USDC' ? SPOT_MARKET_INDEX_USDC : SPOT_MARKET_INDEX_SOL;
      const mint = token === 'USDC' ? USDC_MINT : SOL_MINT;

      // Get associated token account
      const associatedTokenAccount = await getAssociatedTokenAddress(
        mint,
        keypair.publicKey
      );

      // Withdraw collateral
      const txSig = await this.driftClient!.withdraw(
        amountBN,
        spotMarketIndex,
        associatedTokenAccount,
        false // reduceOnly
      );

      const signature = typeof txSig === 'string' ? txSig : (txSig as any)?.txSig || String(txSig);
      this.logger.log(`Withdrawal successful: ${signature}`);
      return signature;
    } catch (error) {
      this.logger.error('Withdrawal failed', error);
      throw this.handleError(error);
    }
  }

  /**
   * Open a perpetual position
   */
  async openPosition(params: OpenPositionParams): Promise<string> {
    this.ensureInitialized();
    
    const { market, size, side, orderType = 'market', limitPrice } = params;
    
    try {
      const keypair = this.wallet.getKeypair();
      if (!keypair) {
        throw new Error('No wallet loaded');
      }

      this.logger.log(`Opening ${side} position on ${market}, size: ${size}...`);

      const marketIndex = this.getMarketIndex(market);
      const direction = side === 'long' ? PositionDirection.LONG : PositionDirection.SHORT;
      
      // Convert size to base asset amount (9 decimals for perps)
      const baseAssetAmount = new BN(Math.floor(size * Math.pow(10, 9)));

      let txSig: any;
      
      if (orderType === 'market') {
        const orderParams = getMarketOrderParams({
          marketIndex,
          marketType: MarketType.PERP,
          direction,
          baseAssetAmount,
        });
        txSig = await this.driftClient!.placePerpOrder(orderParams);
      } else {
        // Limit order
        if (!limitPrice) {
          throw new Error('Limit price required for limit orders');
        }
        const orderParams = getLimitOrderParams({
          marketIndex,
          marketType: MarketType.PERP,
          direction,
          baseAssetAmount,
          price: new BN(Math.floor(limitPrice * Math.pow(10, 6))),
        });
        txSig = await this.driftClient!.placePerpOrder(orderParams);
      }

      const signature = typeof txSig === 'string' ? txSig : (txSig as any)?.txSig || String(txSig);
      this.logger.log(`Position opened: ${signature}`);
      return signature;
    } catch (error) {
      this.logger.error('Failed to open position', error);
      throw this.handleError(error);
    }
  }

  /**
   * Close a perpetual position
   */
  async closePosition(params: ClosePositionParams): Promise<string> {
    this.ensureInitialized();
    
    const { market, size, orderType = 'market', limitPrice } = params;
    
    try {
      const keypair = this.wallet.getKeypair();
      if (!keypair) {
        throw new Error('No wallet loaded');
      }

      this.logger.log(`Closing position on ${market}...`);

      const marketIndex = this.getMarketIndex(market);
      
      // Get current position to determine direction and size
      const user = this.driftClient!.getUser();
      const position = user?.getPerpPosition(marketIndex);
      
      if (!position || position.baseAssetAmount.eq(new BN(0))) {
        throw new Error(`No open position found for ${market}`);
      }

      // Determine close order direction (opposite of current position)
      const isLong = position.baseAssetAmount.gt(new BN(0));
      const closeSide = isLong ? 'short' : 'long';
      const direction = closeSide === 'long' ? PositionDirection.LONG : PositionDirection.SHORT;
      
      // Use specified size or close full position
      const closeSize = size 
        ? new BN(Math.floor(size * Math.pow(10, 9)))
        : position.baseAssetAmount.abs();

      let txSig: any;
      
      if (orderType === 'market') {
        const orderParams = getMarketOrderParams({
          marketIndex,
          marketType: MarketType.PERP,
          direction,
          baseAssetAmount: closeSize,
        });
        txSig = await this.driftClient!.placePerpOrder(orderParams);
      } else {
        if (!limitPrice) {
          throw new Error('Limit price required for limit orders');
        }
        const orderParams = getLimitOrderParams({
          marketIndex,
          marketType: MarketType.PERP,
          direction,
          baseAssetAmount: closeSize,
          price: new BN(Math.floor(limitPrice * Math.pow(10, 6))),
        });
        txSig = await this.driftClient!.placePerpOrder(orderParams);
      }

      const signature = typeof txSig === 'string' ? txSig : (txSig as any)?.txSig || String(txSig);
      this.logger.log(`Position closed: ${signature}`);
      return signature;
    } catch (error) {
      this.logger.error('Failed to close position', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get funding payments history
   */
  async getFundingPayments(marketIndex?: number): Promise<any[]> {
    this.ensureInitialized();
    
    try {
      const user = this.driftClient!.getUser();
      if (!user) return [];

      const userAccount = user.getUserAccount();
      const payments: any[] = [];

      // Get funding payments from position data
      for (const position of userAccount.perpPositions) {
        if (marketIndex !== undefined && position.marketIndex !== marketIndex) continue;
        if (position.baseAssetAmount.eq(new BN(0))) continue;

        const market = this.driftClient!.getPerpMarketAccount(position.marketIndex);

        payments.push({
          marketIndex: position.marketIndex,
          symbol: this.getMarketSymbol(position.marketIndex),
          cumulativeFunding: convertToNumber(position.quoteAssetAmount, QUOTE_PRECISION),
          lastFundingRate: market ? convertToNumber(market.amm.lastFundingRate, PRICE_PRECISION) : 0,
        });
      }

      return payments;
    } catch (error) {
      this.logger.error('Failed to fetch funding payments', error);
      throw this.handleError(error);
    }
  }

  /**
   * Check if user has an account
   */
  async hasAccount(): Promise<boolean> {
    try {
      const userAccountPublicKey = await this.getUserAccountPublicKey();
      const accountInfo = await this.connection.getAccountInfo(userAccountPublicKey);
      return accountInfo !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get available collateral for trading
   */
  async getFreeCollateral(): Promise<number> {
    this.ensureInitialized();
    
    try {
      const user = this.driftClient!.getUser();
      if (!user) return 0;
      
      return convertToNumber(user.getFreeCollateral(), QUOTE_PRECISION);
    } catch (error) {
      this.logger.error('Failed to get free collateral', error);
      return 0;
    }
  }

  /**
   * Cleanup and unsubscribe
   */
  async cleanup(): Promise<void> {
    if (this.driftClient) {
      await this.driftClient.unsubscribe();
      this.isInitialized = false;
      this.logger.info('Drift client cleaned up');
    }
  }
}
