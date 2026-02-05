// Mock BN class - must be before jest.mock
class MockBN {
  private value: number;
  constructor(val: number | string | MockBN = 0) {
    if (val instanceof MockBN) {
      this.value = val.toNumber();
    } else {
      this.value = Number(val);
    }
  }
  toNumber() { return this.value; }
  isZero() { return this.value === 0; }
  isPos() { return this.value > 0; }
  abs() { return new MockBN(Math.abs(this.value)); }
  eq(other: MockBN) { return this.value === other.value; }
  gt(other: MockBN) { return this.value > other.value; }
  lt(other: MockBN) { return this.value < other.value; }
}

// Mock @drift-labs/sdk before imports
jest.mock('@drift-labs/sdk', () => {
  const { PublicKey } = require('@solana/web3.js');
  
  return {
    DriftClient: jest.fn().mockImplementation(() => ({
      subscribe: jest.fn().mockResolvedValue(undefined),
      unsubscribe: jest.fn().mockResolvedValue(undefined),
      getPerpMarketAccounts: jest.fn().mockReturnValue([
        {
          marketIndex: 0,
          volume24h: new MockBN(1000000000),
          openInterest: new MockBN(500000000),
          amm: { 
            lastFundingRate: new MockBN(100),
            baseAssetAmountWithAmm: new MockBN(1000000000),
          },
        },
        {
          marketIndex: 1,
          volume24h: new MockBN(2000000000),
          openInterest: new MockBN(1000000000),
          amm: { 
            lastFundingRate: new MockBN(-50),
            baseAssetAmountWithAmm: new MockBN(2000000000),
          },
        },
      ]),
      getOracleDataForPerpMarket: jest.fn().mockReturnValue({ price: new MockBN(25000000) }),
      getUser: jest.fn().mockReturnValue({
        getUserAccount: jest.fn().mockReturnValue({
          perpPositions: [
            {
              marketIndex: 0,
              baseAssetAmount: new MockBN(1000000000), // 1 SOL-PERP position
              quoteAssetAmount: new MockBN(25000000),
              quoteEntryAmount: new MockBN(24000000),
            }
          ],
          orders: [],
        }),
        getTotalCollateral: jest.fn().mockReturnValue(new MockBN(10000000)),
        getFreeCollateral: jest.fn().mockReturnValue(new MockBN(8000000)),
        getTotalPerpPositionValue: jest.fn().mockReturnValue(new MockBN(5000000)),
        getLeverage: jest.fn().mockReturnValue(new MockBN(2000000)),
        getMarginRatio: jest.fn().mockReturnValue(new MockBN(500000)),
        getUnrealizedPNL: jest.fn().mockReturnValue(new MockBN(100000)),
        getPerpPosition: jest.fn().mockImplementation((marketIndex: number) => {
          if (marketIndex === 0) {
            return {
              marketIndex: 0,
              baseAssetAmount: new MockBN(1000000000),
              quoteAssetAmount: new MockBN(25000000),
              quoteEntryAmount: new MockBN(24000000),
            };
          }
          return null;
        }),
      }),
      initializeUserAccount: jest.fn().mockReturnValue(['mock-tx-sig']),
      deposit: jest.fn().mockResolvedValue('mock-deposit-sig'),
      withdraw: jest.fn().mockResolvedValue('mock-withdraw-sig'),
      placePerpOrder: jest.fn().mockResolvedValue('mock-order-sig'),
      sendTransaction: jest.fn().mockResolvedValue('mock-tx-signature'),
      getPerpMarketAccount: jest.fn().mockImplementation((marketIndex: number) => ({
        amm: { lastFundingRate: new MockBN(100) },
        marketIndex,
      })),
    })),
    Wallet: jest.fn(),
    BN: MockBN,
    PerpMarkets: [
      { symbol: 'SOL-PERP', marketIndex: 0 },
      { symbol: 'BTC-PERP', marketIndex: 1 },
      { symbol: 'ETH-PERP', marketIndex: 2 },
    ],
    DriftEnv: { 'mainnet-beta': 'mainnet-beta' },
    PositionDirection: { LONG: 'long', SHORT: 'short' },
    OrderType: { MARKET: 'market', LIMIT: 'limit' },
    MarketType: { PERP: 'perp' },
    getMarketOrderParams: jest.fn().mockReturnValue({}),
    getLimitOrderParams: jest.fn().mockReturnValue({}),
    getUserAccountPublicKey: jest.fn().mockImplementation(() => {
      const { PublicKey } = require('@solana/web3.js');
      return new PublicKey('11111111111111111111111111111111');
    }),
    getUserStatsAccountPublicKey: jest.fn(),
    convertToNumber: jest.fn((val, precision = new MockBN(1000000)) => {
      if (!val) return 0;
      const num = val instanceof MockBN ? val.toNumber() : Number(val);
      const prec = precision instanceof MockBN ? precision.toNumber() : Number(precision);
      return num / prec;
    }),
    PRICE_PRECISION: new MockBN(1000000),
    BASE_PRECISION: new MockBN(1000000000),
    QUOTE_PRECISION: new MockBN(1000000),
    initialize: jest.fn(),
  };
});

jest.mock('@solana/spl-token', () => {
  const { PublicKey } = require('@solana/web3.js');
  return {
    getAssociatedTokenAddress: jest.fn().mockResolvedValue(new PublicKey('So11111111111111111111111111111111111111112')),
    TOKEN_PROGRAM_ID: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    ASSOCIATED_TOKEN_PROGRAM_ID: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
  };
});

import { DriftModule, OpenPositionParams, ClosePositionParams, DepositParams, WithdrawParams } from '../src/modules/drift';
import { WalletModule } from '../src/modules/wallet';
import { Connection, Keypair } from '@solana/web3.js';

describe('DriftModule', () => {
  let driftModule: DriftModule;
  let walletModule: WalletModule;
  let connection: Connection;
  let mockKeypair: Keypair;

  beforeEach(async () => {
    mockKeypair = Keypair.generate();
    connection = new Connection('https://api.mainnet-beta.solana.com');
    walletModule = new WalletModule(connection, mockKeypair);
    driftModule = new DriftModule(connection, walletModule);
    
    // Initialize the module
    await driftModule.initialize('mainnet-beta');
  });

  afterEach(async () => {
    await driftModule.cleanup();
  });

  describe('initialize', () => {
    it('should initialize successfully with a valid wallet', async () => {
      const newDriftModule = new DriftModule(connection, walletModule);
      await expect(newDriftModule.initialize('mainnet-beta')).resolves.not.toThrow();
      await newDriftModule.cleanup();
    });

  });

  describe('getMarkets', () => {
    it('should return list of perpetual markets', async () => {
      const markets = await driftModule.getMarkets();
      expect(Array.isArray(markets)).toBe(true);
      expect(markets.length).toBeGreaterThan(0);
      expect(markets[0]).toHaveProperty('symbol');
      expect(markets[0]).toHaveProperty('price');
    });
  });

  describe('getMarket', () => {
    it('should return specific market by symbol', async () => {
      const market = await driftModule.getMarket('SOL-PERP');
      expect(market).toBeDefined();
      if (market) {
        expect(market.symbol).toBe('SOL-PERP');
      }
    });

    it('should return null for non-existent market', async () => {
      const market = await driftModule.getMarket('FAKE-PERP');
      expect(market).toBeNull();
    });
  });

  describe('getAccountInfo', () => {
    it('should return account information', async () => {
      const accountInfo = await driftModule.getAccountInfo();
      expect(accountInfo).toHaveProperty('collateral');
      expect(accountInfo).toHaveProperty('freeCollateral');
      expect(accountInfo).toHaveProperty('leverage');
      expect(accountInfo).toHaveProperty('positions');
      expect(Array.isArray(accountInfo.positions)).toBe(true);
    });
  });

  describe('deposit', () => {
    it('should deposit USDC collateral', async () => {
      const params: DepositParams = { amount: 100, token: 'USDC' };
      const txSignature = await driftModule.deposit(params);
      expect(typeof txSignature).toBe('string');
    });

    it('should deposit SOL collateral', async () => {
      const params: DepositParams = { amount: 1, token: 'SOL' };
      const txSignature = await driftModule.deposit(params);
      expect(typeof txSignature).toBe('string');
    });
  });

  describe('withdraw', () => {
    it('should withdraw USDC collateral', async () => {
      const params: WithdrawParams = { amount: 50, token: 'USDC' };
      const txSignature = await driftModule.withdraw(params);
      expect(typeof txSignature).toBe('string');
    });
  });

  describe('openPosition', () => {
    it('should open a long position', async () => {
      const params: OpenPositionParams = {
        market: 'SOL-PERP',
        size: 1,
        side: 'long',
        orderType: 'market',
      };
      const txSignature = await driftModule.openPosition(params);
      expect(typeof txSignature).toBe('string');
    });

    it('should open a short position', async () => {
      const params: OpenPositionParams = {
        market: 'SOL-PERP',
        size: 0.5,
        side: 'short',
        orderType: 'market',
      };
      const txSignature = await driftModule.openPosition(params);
      expect(typeof txSignature).toBe('string');
    });

    it('should open a limit order position', async () => {
      const params: OpenPositionParams = {
        market: 'SOL-PERP',
        size: 1,
        side: 'long',
        orderType: 'limit',
        limitPrice: 200,
      };
      const txSignature = await driftModule.openPosition(params);
      expect(typeof txSignature).toBe('string');
    });

  });

  describe('closePosition', () => {
    it('should close a position', async () => {
      const params: ClosePositionParams = {
        market: 'SOL-PERP',
        orderType: 'market',
      };
      const txSignature = await driftModule.closePosition(params);
      expect(typeof txSignature).toBe('string');
    });
  });

  describe('getPositions', () => {
    it('should return open positions', async () => {
      const positions = await driftModule.getPositions();
      expect(Array.isArray(positions)).toBe(true);
    });
  });

  describe('getFreeCollateral', () => {
    it('should return free collateral amount', async () => {
      const freeCollateral = await driftModule.getFreeCollateral();
      expect(typeof freeCollateral).toBe('number');
      expect(freeCollateral).toBeGreaterThanOrEqual(0);
    });
  });

  describe('hasAccount', () => {
    it('should check if user has a Drift account', async () => {
      const hasAccount = await driftModule.hasAccount();
      expect(typeof hasAccount).toBe('boolean');
    });
  });

  describe('getFundingPayments', () => {
    it('should return funding payments', async () => {
      const payments = await driftModule.getFundingPayments();
      expect(Array.isArray(payments)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle insufficient funds error', async () => {
      const error = new Error('insufficient funds for transaction');
      const handleError = (driftModule as any).handleError.bind(driftModule);
      const result = handleError(error);
      
      expect(result.code).toBe('INSUFFICIENT_FUNDS');
      expect(result.message).toBe('Insufficient funds for transaction');
    });

    it('should handle margin error', async () => {
      const error = new Error('margin requirement not met');
      const handleError = (driftModule as any).handleError.bind(driftModule);
      const result = handleError(error);
      
      expect(result.code).toBe('MARGIN_ERROR');
    });

    it('should handle liquidation error', async () => {
      const error = new Error('liquidation risk detected');
      const handleError = (driftModule as any).handleError.bind(driftModule);
      const result = handleError(error);
      
      expect(result.code).toBe('LIQUIDATION_RISK');
    });

    it('should handle market error', async () => {
      const error = new Error('market not found');
      const handleError = (driftModule as any).handleError.bind(driftModule);
      const result = handleError(error);
      
      expect(result.code).toBe('MARKET_ERROR');
    });
  });
});
