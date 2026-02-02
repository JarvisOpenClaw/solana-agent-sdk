import { Connection, PublicKey, Logs } from '@solana/web3.js';

export interface LogsSubscription {
  id: number;
  unsubscribe: () => Promise<void>;
}

export interface SlotSubscription {
  id: number;
  unsubscribe: () => Promise<void>;
}

export class RPCModule {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Get current slot
   */
  async getSlot(): Promise<number> {
    return await this.connection.getSlot();
  }

  /**
   * Get current block height
   */
  async getBlockHeight(): Promise<number> {
    return await this.connection.getBlockHeight();
  }

  /**
   * Get recent blockhash
   */
  async getRecentBlockhash(): Promise<{ blockhash: string; lastValidBlockHeight: number }> {
    return await this.connection.getLatestBlockhash();
  }

  /**
   * Get cluster nodes
   */
  async getClusterNodes(): Promise<{ pubkey: string; rpc: string | null; version: string | null }[]> {
    const nodes = await this.connection.getClusterNodes();
    return nodes.map(node => ({
      pubkey: node.pubkey,
      rpc: node.rpc,
      version: node.version,
    }));
  }

  /**
   * Get epoch info
   */
  async getEpochInfo(): Promise<{
    epoch: number;
    slotIndex: number;
    slotsInEpoch: number;
    absoluteSlot: number;
  }> {
    const info = await this.connection.getEpochInfo();
    return {
      epoch: info.epoch,
      slotIndex: info.slotIndex,
      slotsInEpoch: info.slotsInEpoch,
      absoluteSlot: info.absoluteSlot,
    };
  }

  /**
   * Get supply info
   */
  async getSupply(): Promise<{
    total: number;
    circulating: number;
    nonCirculating: number;
  }> {
    const supply = await this.connection.getSupply();
    return {
      total: supply.value.total / 1e9,
      circulating: supply.value.circulating / 1e9,
      nonCirculating: supply.value.nonCirculating / 1e9,
    };
  }

  /**
   * Subscribe to logs
   */
  onLogs(
    filter: 'all' | 'allWithVotes' | PublicKey,
    callback: (logs: Logs) => void
  ): LogsSubscription {
    const id = this.connection.onLogs(filter, callback);
    
    return {
      id,
      unsubscribe: async () => {
        await this.connection.removeOnLogsListener(id);
      },
    };
  }

  /**
   * Subscribe to program logs
   */
  onProgramLogs(
    programId: string | PublicKey,
    callback: (logs: Logs) => void
  ): LogsSubscription {
    const pubkey = typeof programId === 'string' ? new PublicKey(programId) : programId;
    const id = this.connection.onLogs(pubkey, callback);
    
    return {
      id,
      unsubscribe: async () => {
        await this.connection.removeOnLogsListener(id);
      },
    };
  }

  /**
   * Subscribe to slot changes
   */
  onSlotChange(callback: (slot: number) => void): SlotSubscription {
    const id = this.connection.onSlotChange((slotInfo) => {
      callback(slotInfo.slot);
    });
    
    return {
      id,
      unsubscribe: async () => {
        await this.connection.removeSlotChangeListener(id);
      },
    };
  }

  /**
   * Get transaction
   */
  async getTransaction(signature: string): Promise<{
    slot: number;
    blockTime: number | null;
    fee: number;
    success: boolean;
    logs: string[];
  } | null> {
    const tx = await this.connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) return null;

    return {
      slot: tx.slot,
      blockTime: tx.blockTime,
      fee: tx.meta?.fee || 0,
      success: tx.meta?.err === null,
      logs: tx.meta?.logMessages || [],
    };
  }

  /**
   * Get signatures for address
   */
  async getSignaturesForAddress(
    address: string | PublicKey,
    limit = 20
  ): Promise<{ signature: string; slot: number; blockTime: number | null; err: any }[]> {
    const pubkey = typeof address === 'string' ? new PublicKey(address) : address;
    const signatures = await this.connection.getSignaturesForAddress(pubkey, { limit });
    
    return signatures.map(sig => ({
      signature: sig.signature,
      slot: sig.slot,
      blockTime: sig.blockTime,
      err: sig.err,
    }));
  }

  /**
   * Request airdrop (devnet/testnet only)
   */
  async requestAirdrop(address: string | PublicKey, amount: number): Promise<string> {
    const pubkey = typeof address === 'string' ? new PublicKey(address) : address;
    const lamports = amount * 1e9;
    return await this.connection.requestAirdrop(pubkey, lamports);
  }
}
