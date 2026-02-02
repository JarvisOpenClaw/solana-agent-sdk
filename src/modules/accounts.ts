import { Connection, PublicKey, AccountInfo as SolanaAccountInfo } from '@solana/web3.js';

export interface AccountData {
  address: string;
  lamports: number;
  owner: string;
  executable: boolean;
  data: Buffer;
  rentEpoch: number;
}

export interface ParsedAccountData {
  address: string;
  lamports: number;
  owner: string;
  parsed: any;
  type: string;
}

export class AccountsModule {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Get account info
   */
  async get(address: string | PublicKey): Promise<AccountData | null> {
    const pubkey = typeof address === 'string' ? new PublicKey(address) : address;
    const info = await this.connection.getAccountInfo(pubkey);
    
    if (!info) return null;

    return {
      address: pubkey.toBase58(),
      lamports: info.lamports,
      owner: info.owner.toBase58(),
      executable: info.executable,
      data: info.data,
      rentEpoch: info.rentEpoch,
    };
  }

  /**
   * Get multiple accounts
   */
  async getMultiple(addresses: (string | PublicKey)[]): Promise<(AccountData | null)[]> {
    const pubkeys = addresses.map(a => typeof a === 'string' ? new PublicKey(a) : a);
    const infos = await this.connection.getMultipleAccountsInfo(pubkeys);
    
    return infos.map((info, i) => {
      if (!info) return null;
      return {
        address: pubkeys[i].toBase58(),
        lamports: info.lamports,
        owner: info.owner.toBase58(),
        executable: info.executable,
        data: info.data,
        rentEpoch: info.rentEpoch,
      };
    });
  }

  /**
   * Get parsed account (for known account types like tokens)
   */
  async getParsed(address: string | PublicKey): Promise<ParsedAccountData | null> {
    const pubkey = typeof address === 'string' ? new PublicKey(address) : address;
    const info = await this.connection.getParsedAccountInfo(pubkey);
    
    if (!info.value) return null;

    const data = info.value.data;
    if (Buffer.isBuffer(data)) {
      return {
        address: pubkey.toBase58(),
        lamports: info.value.lamports,
        owner: info.value.owner.toBase58(),
        parsed: null,
        type: 'raw',
      };
    }

    return {
      address: pubkey.toBase58(),
      lamports: info.value.lamports,
      owner: info.value.owner.toBase58(),
      parsed: data.parsed,
      type: data.program,
    };
  }

  /**
   * Check if account exists
   */
  async exists(address: string | PublicKey): Promise<boolean> {
    const pubkey = typeof address === 'string' ? new PublicKey(address) : address;
    const info = await this.connection.getAccountInfo(pubkey);
    return info !== null;
  }

  /**
   * Get account balance in SOL
   */
  async getBalance(address: string | PublicKey): Promise<number> {
    const pubkey = typeof address === 'string' ? new PublicKey(address) : address;
    const balance = await this.connection.getBalance(pubkey);
    return balance / 1e9; // Convert lamports to SOL
  }

  /**
   * Get minimum balance for rent exemption
   */
  async getMinimumBalanceForRentExemption(dataSize: number): Promise<number> {
    return await this.connection.getMinimumBalanceForRentExemption(dataSize);
  }

  /**
   * Subscribe to account changes
   */
  onAccountChange(
    address: string | PublicKey,
    callback: (account: AccountData) => void
  ): number {
    const pubkey = typeof address === 'string' ? new PublicKey(address) : address;
    
    return this.connection.onAccountChange(pubkey, (info) => {
      callback({
        address: pubkey.toBase58(),
        lamports: info.lamports,
        owner: info.owner.toBase58(),
        executable: info.executable,
        data: info.data,
        rentEpoch: info.rentEpoch,
      });
    });
  }

  /**
   * Unsubscribe from account changes
   */
  async removeAccountChangeListener(subscriptionId: number): Promise<void> {
    await this.connection.removeAccountChangeListener(subscriptionId);
  }
}
