import { DriftModule, OpenPositionParams, ClosePositionParams, DepositParams, WithdrawParams } from '../src/modules/drift';
import { WalletModule } from '../src/modules/wallet';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { BN } from '@drift-labs/sdk';

// Mock Drift SDK
jest.mock('@drift-labs/sdk', () => ({
  DriftClient: jest.fn().mockImplementation(() => ({
    subscribe: jest.fn().mockResolvedValue(undefined),
    unsubscribe: jest.fn().mockResolvedValue(undefined),
    getPerpMarketAccounts: jest.fn().mockReturnValue([
      {
        marketIndex: 0,
        volume24h: new BN(1000000000),
        openInterest: new BN(500000000),
        amm: { lastFundingRate: new BN(100) },
      },
      {
        marketIndex: 1,
        volume24h: new BN(2000000000),
        openInterest: new BN(1000000000),
        amm: { lastFundingRate: new BN(-50) },
      },
    ]),
    getOracleDataForPerpMarket: jest.fn().mockReturnValue({ price: new BN(25000000) }),
    getUser: jest.fn().mockReturnValue({
      getUserAccount: jest.fn().mockReturnValue({
        perpPositions: [],
        orders: [],
      }),
      getTotalCollateral: jest.fn().mockReturnValue(new BN(10000000)),
      getFreeCollateral: jest.fn().mockReturnValue(new BN(8000000)),
      getTotalPerpPositionValue: jest.fn().mockReturnValue(new BN(5000000)),
      getLeverage: jest.fn().mockReturnValue(new BN(2000000)),
      getMarginRatio: jest.fn().mockReturnValue(new BN(500000)),
      getUnrealizedPNL: jest.fn().mockReturnValue(new BN(100000)),
      getPerpPosition: jest.fn().mockReturnValue(null),
    }),
    initializeUserAccount: jest.fn().mockReturnValue({}),
    deposit: jest.fn().mockReturnValue({}),
    withdraw: jest.fn().mockReturnValue({}),
    placePerpOrder: jest.fn().mockReturnValue({}),
    sendTransaction: jest.fn().mockResolvedValue('mock-tx-signature'),
    getPerpMarketAccount: jest.fn().mockReturnValue({
      amm: { lastFundingRate: new BN(100) },
    }),
  })),
  Wallet: jest.fn(),
  BN: jest.fn().mockImplementation((val: number) => ({
    toNumber: () => val,
    isZero: () => val === 0,
    isPos: () => val > 0,
    abs: () => ({ toNumber: () => Math.abs(val) }),
  })),
  PERP_MARKETS: [
    { symbol: 'SOL-PERP', marketIndex: 0 },
    { symbol: 'BTC-PERP', marketIndex: 1 },
    { symbol: 'ETH-PERP', marketIndex: 2 },
  ],
  DriftEnv: { 'mainnet-beta': 'mainnet-beta' },
  PositionDirection: { LONG: 'long', SHORT: 'short' },
  OrderType: { MARKET: 'market', LIMIT: 'limit' },
  MarketType: { PERP: 'perp' },
  getMarketOrderParams: jest.fn().mockReturnValue({}),
  getUserAccountPublicKey: jest.fn().mockReturnValue(new PublicKey('11111111111111111111111111111111')),
  getUserStatsAccountPublicKey: jest.fn(),
}));

jest.mock('@solana/spl-token', () => ({
  getAssociatedTokenAddress: jest.fn().mockResolvedValue(new PublicKey('22222222222222222222222222222222')),
  TOKEN_PROGRAM_ID: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
  ASSOCIATED_TOKEN_PROGRAM_ID: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
}));

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

    it('should throw error if no wallet is loaded', async () => {
      const emptyWalletModule = new WalletModule(connection);
      const newDriftModule = new DriftModule(connection, emptyWalletModule);
      await expect(newDriftModule.initialize('mainnet-beta')).rejects.toThrow('No wallet loaded');
    });
  });

  describe('getMarkets', () => {
    it('should return list of perpetual markets', async () => {
      const markets = await driftModule.getMarkets();
      expect(Array.isArray(markets)).toBe(true);
      expect(markets.length).toBeGreaterThan(0);
      expect(markets[0]).toHaveProperty('symbol');
      expect(markets[0]).toHaveProperty('price');
      expect(markets[0]).toHaveProperty('volume24h');
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
      expect(txSignature).toBe('mock-tx-signature');
    });

    it('should throw error if no wallet loaded', async () => {
      const emptyWalletModule = new WalletModule(connection);
      const newDriftModule = new DriftModule(connection, emptyWalletModule);
      await newDriftModule.initialize('mainnet-beta');
      
      // Override getKeypair to return undefined for this test
      jest.spyOn(emptyWalletModule, 'getKeypair').mockReturnValue(undefined);
      
      const params: DepositParams = { amount: 100 };
      await expect(newDriftModule.deposit(params)).rejects.toThrow();
      
      await newDriftModule.cleanup();
    });
  });

  describe('withdraw', () => {
    it('should withdraw USDC collateral', async () => {
      const params: WithdrawParams = { amount: 50, token: 'USDC' };
      const txSignature = await driftModule.withdraw(params);
      expect(typeof txSignature).toBe('string');
      expect(txSignature).toBe('mock-tx-signature');
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
      // Mock having a position
      const mockPosition = {
        baseAssetAmount: { isZero: () => false, isPos: () => true, abs: () => ({ toNumber: () => 1000000000 }) },
        marketIndex: 0,
        quoteAssetAmount: { toNumber: () => 100000 },
        quoteEntryAmount: { toNumber: () => 90000 },
      };
      
      jest.spyOn(driftModule as any, 'driftClient', 'get').mockReturnValue({
        getUser: jest.fn().mockReturnValue({
          getPerpPosition: jest.fn().mockReturnValue(mockPosition),
        }),
        placePerpOrder: jest.fn().mockReturnValue({}),
        sendTransaction: jest.fn().mockResolvedValue('close-tx-signature'),
      });

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
  });
});
