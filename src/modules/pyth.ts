import { Connection } from '@solana/web3.js';

export interface PriceData {
  symbol: string;
  price: number;
  confidence: number;
  timestamp: number;
}

export class PythModule {
  private connection: Connection;
  private baseUrl = 'https://hermes.pyth.network';

  constructor(connection: Connection) {
    this.connection = connection;
  }

  async getPrice(symbol: string): Promise<PriceData> {
    // Price feed IDs (simplified mapping)
    const feedIds: Record<string, string> = {
      'SOL': '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
      'BTC': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
      'ETH': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
    };

    const feedId = feedIds[symbol.toUpperCase()];
    if (!feedId) throw new Error(`Unknown symbol: ${symbol}`);

    const response = await fetch(`${this.baseUrl}/api/latest_price_feeds?ids[]=${feedId}`);
    const data: any = await response.json();
    
    if (!data[0]) throw new Error(`No price data for ${symbol}`);

    const priceData = data[0].price;
    
    return {
      symbol,
      price: Number(priceData.price) * Math.pow(10, priceData.expo),
      confidence: Number(priceData.conf) * Math.pow(10, priceData.expo),
      timestamp: priceData.publish_time
    };
  }
}
