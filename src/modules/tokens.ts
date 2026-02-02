import { Connection, PublicKey } from '@solana/web3.js';
import { WalletModule } from './wallet';

export interface TokenBalance {
  mint: string;
  amount: number;
  decimals: number;
  uiAmount: number;
}

export class TokensModule {
  private connection: Connection;
  private wallet: WalletModule;

  constructor(connection: Connection, wallet: WalletModule) {
    this.connection = connection;
    this.wallet = wallet;
  }

  async getBalances(): Promise<TokenBalance[]> {
    const publicKey = this.wallet.getPublicKey();
    if (!publicKey) throw new Error('No wallet loaded');
    
    const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
      publicKey,
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    );

    return tokenAccounts.value.map(account => {
      const info = account.account.data.parsed.info;
      return {
        mint: info.mint,
        amount: info.tokenAmount.amount,
        decimals: info.tokenAmount.decimals,
        uiAmount: info.tokenAmount.uiAmount
      };
    });
  }

  async getBalance(mint: string): Promise<TokenBalance | null> {
    const balances = await this.getBalances();
    return balances.find(b => b.mint === mint) || null;
  }
}
