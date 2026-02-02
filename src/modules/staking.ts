import { Connection } from '@solana/web3.js';
import { WalletModule } from './wallet';

export interface StakeParams {
  amount: number;
  validator?: string;
  provider?: 'native' | 'marinade' | 'jito';
}

export class StakingModule {
  private connection: Connection;
  private wallet: WalletModule;

  constructor(connection: Connection, wallet: WalletModule) {
    this.connection = connection;
    this.wallet = wallet;
  }

  async stake(params: StakeParams): Promise<string> {
    const { amount, provider = 'native' } = params;

    switch (provider) {
      case 'marinade':
        return this.stakeMarinade(amount);
      case 'jito':
        return this.stakeJito(amount);
      default:
        return this.stakeNative(amount, params.validator);
    }
  }

  private async stakeNative(amount: number, validator?: string): Promise<string> {
    // TODO: Implement native staking
    throw new Error('Native staking not yet implemented');
  }

  private async stakeMarinade(amount: number): Promise<string> {
    // TODO: Implement Marinade liquid staking
    throw new Error('Marinade staking not yet implemented');
  }

  private async stakeJito(amount: number): Promise<string> {
    // TODO: Implement Jito liquid staking
    throw new Error('Jito staking not yet implemented');
  }
}
