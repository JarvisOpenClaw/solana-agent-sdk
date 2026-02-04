# Drift Module - Perpetuals Trading

This module provides AI agents with complete access to Drift Protocol's perpetual futures trading on Solana.

## Features

- ✅ **Deposit/Withdraw USDC collateral**
- ✅ **Open/Close perpetual positions**
- ✅ **Market and limit orders**
- ✅ **Account info and positions**
- ✅ **Funding payments tracking**
- ✅ **Error handling & logging**
- ✅ **Safety guards & margin checks**

## Quick Start

```typescript
import { SolanaAgentSDK } from 'solana-agent-sdk';
import { Keypair } from '@solana/web3.js';

// Initialize SDK
const wallet = Keypair.generate(); // or load existing
const sdk = new SolanaAgentSDK({
  wallet,
  rpcUrl: 'https://api.mainnet-beta.solana.com'
});

// Initialize Drift module
await sdk.drift.initialize('mainnet-beta');
```

## Usage Examples

### Get Markets

```typescript
// Fetch all available perpetual markets
const markets = await sdk.drift.getMarkets();
console.log(markets);
// [
//   { symbol: 'SOL-PERP', price: 145.50, volume24h: 15000000, ... },
//   { symbol: 'BTC-PERP', price: 67450.00, volume24h: 45000000, ... },
//   { symbol: 'ETH-PERP', price: 3520.00, volume24h: 32000000, ... }
// ]

// Get specific market
const solMarket = await sdk.drift.getMarket('SOL-PERP');
```

### Deposit Collateral

```typescript
// Deposit USDC as collateral
const txSignature = await sdk.drift.deposit({
  amount: 1000,  // 1000 USDC
  token: 'USDC'
});
console.log('Deposit successful:', txSignature);
```

### Get Account Info

```typescript
// Get full account information
const accountInfo = await sdk.drift.getAccountInfo();
console.log(accountInfo);
// {
//   collateral: 1000.00,
//   freeCollateral: 800.00,
//   leverage: 2.5,
//   marginRatio: 0.40,
//   positions: [...],
//   unsettledPnl: 25.50,
//   openOrders: 0
// }
```

### Open Position

```typescript
// Open a long position with market order
const txSignature = await sdk.drift.openPosition({
  market: 'SOL-PERP',
  side: 'long',
  size: 10,        // 10 SOL-PERP contracts
  orderType: 'market'
});

// Open a short position with limit order
const txSignature = await sdk.drift.openPosition({
  market: 'BTC-PERP',
  side: 'short',
  size: 0.1,       // 0.1 BTC-PERP contracts
  orderType: 'limit',
  limitPrice: 68000  // Execute if price reaches $68,000
});
```

### Get Positions

```typescript
// Get all open positions
const positions = await sdk.drift.getPositions();
console.log(positions);
// [
//   {
//     symbol: 'SOL-PERP',
//     side: 'long',
//     size: 10,
//     entryPrice: 145.00,
//     markPrice: 150.00,
//     pnl: 50.00,
//     leverage: 2.5
//   }
// ]
```

### Close Position

```typescript
// Close full position with market order
const txSignature = await sdk.drift.closePosition({
  market: 'SOL-PERP',
  orderType: 'market'
});

// Partial close with limit order
const txSignature = await sdk.drift.closePosition({
  market: 'SOL-PERP',
  size: 5,              // Close only 5 contracts
  orderType: 'limit',
  limitPrice: 155       // Take profit at $155
});
```

### Withdraw Collateral

```typescript
// Withdraw USDC collateral
const txSignature = await sdk.drift.withdraw({
  amount: 500,  // 500 USDC
  token: 'USDC'
});
```

### Get Funding Payments

```typescript
// Get funding payment history
const fundingPayments = await sdk.drift.getFundingPayments();
console.log(fundingPayments);
// [
//   { symbol: 'SOL-PERP', cumulativeFunding: 2.50, lastFundingRate: 0.0001 },
//   { symbol: 'BTC-PERP', cumulativeFunding: -1.20, lastFundingRate: -0.00005 }
// ]
```

## Error Handling

The module provides structured error handling:

```typescript
try {
  await sdk.drift.openPosition({
    market: 'SOL-PERP',
    side: 'long',
    size: 1000,  // Too large!
    orderType: 'market'
  });
} catch (error) {
  console.log(error.code);      // 'MARGIN_ERROR'
  console.log(error.message);   // 'Margin requirement not met'
  console.log(error.details);   // Original error object
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `INSUFFICIENT_FUNDS` | Not enough USDC or SOL for transaction |
| `MARGIN_ERROR` | Margin requirement not met |
| `LIQUIDATION_RISK` | Position at risk of liquidation |
| `MARKET_ERROR` | Market not found or invalid |
| `DRIFT_ERROR` | General Drift protocol error |

## Safety Guards

Before executing trades, use the safety module:

```typescript
import { checkPositionSafety } from 'solana-agent-sdk';

// Check if position is safe to open
const safety = checkPositionSafety({
  positionSize: 10,
  marketPrice: 145,
  availableCollateral: 1000,
  desiredLeverage: 5
});

if (safety.safe) {
  await sdk.drift.openPosition({...});
} else {
  console.log('Blocked:', safety.reason);
}
```

## Logging

The module includes built-in logging:

```typescript
// All operations are automatically logged:
// [Drift] Initializing Drift client...
// [Drift] Deposit successful: 5x8K9...Tx
// [Drift] Opening long position on SOL-PERP, size: 10...
// [Drift] Position opened: 3x9L2...Rx
```

## Cleanup

Always clean up when done:

```typescript
await sdk.drift.cleanup();
```

## Supported Markets

- SOL-PERP
- BTC-PERP
- ETH-PERP
- And more via Drift Protocol

## API Reference

### Methods

| Method | Description |
|--------|-------------|
| `initialize(env)` | Initialize Drift client |
| `getMarkets()` | Get all perpetual markets |
| `getMarket(symbol)` | Get specific market |
| `getAccountInfo()` | Get account collateral and positions |
| `getPositions()` | Get open positions only |
| `deposit(params)` | Deposit collateral |
| `withdraw(params)` | Withdraw collateral |
| `openPosition(params)` | Open a new position |
| `closePosition(params)` | Close an existing position |
| `getFundingPayments()` | Get funding payment history |
| `getFreeCollateral()` | Get available collateral |
| `hasAccount()` | Check if user has Drift account |
| `cleanup()` | Cleanup and unsubscribe |

## See Also

- [Drift Protocol Docs](https://docs.drift.trade/)
- [SDK Index](../src/index.ts)
- [Tests](../tests/drift.test.ts)
