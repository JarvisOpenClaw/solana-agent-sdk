import { Keypair, Connection } from '@solana/web3.js';
import { WalletModule } from './modules/wallet';
import { TokensModule } from './modules/tokens';
import { JupiterModule } from './modules/jupiter';
import { StakingModule } from './modules/staking';
import { PythModule } from './modules/pyth';

export interface SDKConfig {
  wallet?: Keypair;
  rpcUrl?: string;
  commitment?: 'processed' | 'confirmed' | 'finalized';
}

export class SolanaAgentSDK {
  public readonly connection: Connection;
  public readonly wallet: WalletModule;
  public readonly tokens: TokensModule;
  public readonly jupiter: JupiterModule;
  public readonly staking: StakingModule;
  public readonly pyth: PythModule;

  constructor(config: SDKConfig = {}) {
    const rpcUrl = config.rpcUrl || 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(rpcUrl, config.commitment || 'confirmed');
    
    this.wallet = new WalletModule(this.connection, config.wallet);
    this.tokens = new TokensModule(this.connection, this.wallet);
    this.jupiter = new JupiterModule(this.connection, this.wallet);
    this.staking = new StakingModule(this.connection, this.wallet);
    this.pyth = new PythModule(this.connection);
  }
}

export { WalletModule } from './modules/wallet';
export { TokensModule } from './modules/tokens';
export { JupiterModule } from './modules/jupiter';
export { StakingModule } from './modules/staking';
export { PythModule } from './modules/pyth';
