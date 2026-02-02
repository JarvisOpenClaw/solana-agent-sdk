import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionInstruction,
  VersionedTransaction,
  TransactionMessage,
  Keypair,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { WalletModule } from './wallet';

export interface SendTransactionOptions {
  priorityFee?: number; // microlamports per compute unit
  computeUnits?: number;
  skipPreflight?: boolean;
  maxRetries?: number;
}

export interface AccountInfo {
  address: string;
  lamports: number;
  owner: string;
  executable: boolean;
  data: Buffer;
  rentEpoch: number;
}

export class TransactionsModule {
  private connection: Connection;
  private wallet: WalletModule;

  constructor(connection: Connection, wallet: WalletModule) {
    this.connection = connection;
    this.wallet = wallet;
  }

  /**
   * Build a transaction from instructions
   */
  async build(instructions: TransactionInstruction[]): Promise<Transaction> {
    const keypair = this.wallet.getKeypair();
    if (!keypair) throw new Error('No wallet loaded');

    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
    
    const tx = new Transaction({
      feePayer: keypair.publicKey,
      blockhash,
      lastValidBlockHeight,
    });

    instructions.forEach(ix => tx.add(ix));
    return tx;
  }

  /**
   * Build a versioned transaction (v0)
   */
  async buildVersioned(instructions: TransactionInstruction[]): Promise<VersionedTransaction> {
    const keypair = this.wallet.getKeypair();
    if (!keypair) throw new Error('No wallet loaded');

    const { blockhash } = await this.connection.getLatestBlockhash();

    const messageV0 = new TransactionMessage({
      payerKey: keypair.publicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();

    return new VersionedTransaction(messageV0);
  }

  /**
   * Add priority fee to transaction
   */
  addPriorityFee(tx: Transaction, microLamports: number, computeUnits = 200000): Transaction {
    tx.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnits }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports })
    );
    return tx;
  }

  /**
   * Sign and send transaction
   */
  async send(tx: Transaction, options: SendTransactionOptions = {}): Promise<string> {
    const keypair = this.wallet.getKeypair();
    if (!keypair) throw new Error('No wallet loaded');

    if (options.priorityFee) {
      this.addPriorityFee(tx, options.priorityFee, options.computeUnits);
    }

    const signature = await sendAndConfirmTransaction(
      this.connection,
      tx,
      [keypair],
      {
        skipPreflight: options.skipPreflight ?? false,
        maxRetries: options.maxRetries ?? 3,
      }
    );

    return signature;
  }

  /**
   * Sign and send versioned transaction
   */
  async sendVersioned(tx: VersionedTransaction): Promise<string> {
    const keypair = this.wallet.getKeypair();
    if (!keypair) throw new Error('No wallet loaded');

    tx.sign([keypair]);
    
    const signature = await this.connection.sendTransaction(tx);
    await this.connection.confirmTransaction(signature);
    
    return signature;
  }

  /**
   * Get transaction status
   */
  async getStatus(signature: string): Promise<'confirmed' | 'finalized' | 'failed' | 'pending'> {
    const status = await this.connection.getSignatureStatus(signature);
    
    if (!status.value) return 'pending';
    if (status.value.err) return 'failed';
    if (status.value.confirmationStatus === 'finalized') return 'finalized';
    if (status.value.confirmationStatus === 'confirmed') return 'confirmed';
    return 'pending';
  }

  /**
   * Wait for confirmation
   */
  async confirm(signature: string, commitment: 'confirmed' | 'finalized' = 'confirmed'): Promise<boolean> {
    const result = await this.connection.confirmTransaction(signature, commitment);
    return !result.value.err;
  }

  /**
   * Simulate transaction before sending
   */
  async simulate(tx: Transaction): Promise<{ success: boolean; logs: string[]; unitsConsumed: number }> {
    const keypair = this.wallet.getKeypair();
    if (!keypair) throw new Error('No wallet loaded');

    tx.feePayer = keypair.publicKey;
    const { blockhash } = await this.connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    const simulation = await this.connection.simulateTransaction(tx);
    
    return {
      success: !simulation.value.err,
      logs: simulation.value.logs || [],
      unitsConsumed: simulation.value.unitsConsumed || 0,
    };
  }
}
