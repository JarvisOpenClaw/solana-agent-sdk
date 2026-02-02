import { Keypair, Connection } from '@solana/web3.js';

// Core Solana modules
import { WalletModule } from './modules/wallet';
import { AccountsModule } from './modules/accounts';
import { TransactionsModule } from './modules/transactions';
import { SPLModule } from './modules/spl';
import { PDAModule } from './modules/pda';
import { RPCModule } from './modules/rpc';

// DeFi protocol modules
import { TokensModule } from './modules/tokens';
import { JupiterModule } from './modules/jupiter';
import { StakingModule } from './modules/staking';
import { PythModule } from './modules/pyth';
import { KaminoModule } from './modules/kamino';
import { DriftModule } from './modules/drift';
import { RaydiumModule } from './modules/raydium';
import { MeteoraModule } from './modules/meteora';
import { NFTModule } from './modules/nft';

export interface SDKConfig {
  wallet?: Keypair;
  rpcUrl?: string;
  commitment?: 'processed' | 'confirmed' | 'finalized';
}

export class SolanaAgentSDK {
  public readonly connection: Connection;
  
  // Core Solana primitives
  public readonly wallet: WalletModule;
  public readonly accounts: AccountsModule;
  public readonly transactions: TransactionsModule;
  public readonly spl: SPLModule;
  public readonly pda: typeof PDAModule;
  public readonly rpc: RPCModule;
  
  // DeFi protocols
  public readonly tokens: TokensModule;
  public readonly jupiter: JupiterModule;
  public readonly staking: StakingModule;
  public readonly pyth: PythModule;
  public readonly kamino: KaminoModule;
  public readonly drift: DriftModule;
  public readonly raydium: RaydiumModule;
  public readonly meteora: MeteoraModule;
  public readonly nft: NFTModule;

  constructor(config: SDKConfig = {}) {
    const rpcUrl = config.rpcUrl || 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(rpcUrl, config.commitment || 'confirmed');
    
    // Core Solana primitives
    this.wallet = new WalletModule(this.connection, config.wallet);
    this.accounts = new AccountsModule(this.connection);
    this.transactions = new TransactionsModule(this.connection, this.wallet);
    this.spl = new SPLModule(this.connection, this.wallet);
    this.pda = PDAModule;
    this.rpc = new RPCModule(this.connection);
    
    // DeFi protocols
    this.tokens = new TokensModule(this.connection, this.wallet);
    this.jupiter = new JupiterModule(this.connection, this.wallet);
    this.staking = new StakingModule(this.connection, this.wallet);
    this.pyth = new PythModule(this.connection);
    this.kamino = new KaminoModule(this.connection, this.wallet);
    this.drift = new DriftModule(this.connection, this.wallet);
    this.raydium = new RaydiumModule(this.connection, this.wallet);
    this.meteora = new MeteoraModule(this.connection, this.wallet);
    this.nft = new NFTModule(this.connection, this.wallet);
  }
}

// Export all modules
export { WalletModule } from './modules/wallet';
export { AccountsModule } from './modules/accounts';
export { TransactionsModule } from './modules/transactions';
export { SPLModule } from './modules/spl';
export { PDAModule } from './modules/pda';
export { RPCModule } from './modules/rpc';
export { TokensModule } from './modules/tokens';
export { JupiterModule } from './modules/jupiter';
export { StakingModule } from './modules/staking';
export { PythModule } from './modules/pyth';
export { KaminoModule } from './modules/kamino';
export { DriftModule } from './modules/drift';
export { RaydiumModule } from './modules/raydium';
export { MeteoraModule } from './modules/meteora';
export { NFTModule } from './modules/nft';
