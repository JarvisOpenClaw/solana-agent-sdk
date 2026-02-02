import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export class WalletModule {
  private connection: Connection;
  private keypair?: Keypair;

  constructor(connection: Connection, keypair?: Keypair) {
    this.connection = connection;
    this.keypair = keypair;
  }

  create(): Keypair {
    this.keypair = Keypair.generate();
    return this.keypair;
  }

  import(secretKey: Uint8Array): Keypair {
    this.keypair = Keypair.fromSecretKey(secretKey);
    return this.keypair;
  }

  getPublicKey(): PublicKey | null {
    return this.keypair?.publicKey || null;
  }

  async getBalance(): Promise<number> {
    if (!this.keypair) throw new Error('No wallet loaded');
    const balance = await this.connection.getBalance(this.keypair.publicKey);
    return balance / LAMPORTS_PER_SOL;
  }

  getKeypair(): Keypair | undefined {
    return this.keypair;
  }
}
