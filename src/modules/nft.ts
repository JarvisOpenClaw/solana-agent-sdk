import { Connection, PublicKey } from '@solana/web3.js';
import { WalletModule } from './wallet';

export interface NFT {
  mint: string;
  name: string;
  image: string;
  collection?: string;
  attributes?: Record<string, string>;
}

export interface NFTListing {
  mint: string;
  price: number;
  seller: string;
  marketplace: 'tensor' | 'magiceden';
}

export interface BuyParams {
  mint: string;
  maxPrice?: number;
  marketplace?: 'tensor' | 'magiceden';
}

export interface ListParams {
  mint: string;
  price: number;
  marketplace?: 'tensor' | 'magiceden';
}

export class NFTModule {
  private connection: Connection;
  private wallet: WalletModule;

  constructor(connection: Connection, wallet: WalletModule) {
    this.connection = connection;
    this.wallet = wallet;
  }

  async getOwned(): Promise<NFT[]> {
    const publicKey = this.wallet.getPublicKey();
    if (!publicKey) throw new Error('No wallet loaded');

    // TODO: Fetch NFTs owned by wallet using Helius or similar
    throw new Error('NFT getOwned not yet implemented');
  }

  async getFloorPrice(collection: string): Promise<number> {
    // Fetch floor price from Tensor or Magic Eden
    try {
      const response = await fetch(`https://api.tensor.so/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query { collection(slug: "${collection}") { floorPrice } }`
        })
      });
      const data: any = await response.json();
      return data.data?.collection?.floorPrice || 0;
    } catch {
      return 0;
    }
  }

  async getListings(collection: string, limit = 20): Promise<NFTListing[]> {
    // TODO: Fetch active listings for collection
    throw new Error('NFT getListings not yet implemented');
  }

  async buy(params: BuyParams): Promise<string> {
    const { mint, maxPrice, marketplace = 'tensor' } = params;

    if (!this.wallet.getKeypair()) {
      throw new Error('No wallet loaded');
    }

    // TODO: Implement NFT purchase
    // 1. Get listing info
    // 2. Check price against maxPrice
    // 3. Build buy transaction
    // 4. Sign and send
    throw new Error('NFT buy not yet implemented');
  }

  async list(params: ListParams): Promise<string> {
    const { mint, price, marketplace = 'tensor' } = params;

    if (!this.wallet.getKeypair()) {
      throw new Error('No wallet loaded');
    }

    // TODO: Implement NFT listing
    throw new Error('NFT list not yet implemented');
  }

  async delist(mint: string): Promise<string> {
    if (!this.wallet.getKeypair()) {
      throw new Error('No wallet loaded');
    }

    // TODO: Implement NFT delisting
    throw new Error('NFT delist not yet implemented');
  }

  async transfer(mint: string, to: string): Promise<string> {
    if (!this.wallet.getKeypair()) {
      throw new Error('No wallet loaded');
    }

    // TODO: Implement NFT transfer
    throw new Error('NFT transfer not yet implemented');
  }
}
