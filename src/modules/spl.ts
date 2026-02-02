import { 
  Connection, 
  PublicKey, 
  TransactionInstruction,
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import {
  createInitializeMintInstruction,
  createMintToInstruction,
  createTransferInstruction,
  createBurnInstruction,
  createCloseAccountInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getMint,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  MintLayout,
} from '@solana/spl-token';
import { WalletModule } from './wallet';

export interface TokenInfo {
  address: string;
  decimals: number;
  supply: bigint;
  mintAuthority: string | null;
  freezeAuthority: string | null;
}

export interface CreateTokenParams {
  decimals?: number;
  mintAuthority?: string;
  freezeAuthority?: string;
}

export class SPLModule {
  private connection: Connection;
  private wallet: WalletModule;

  constructor(connection: Connection, wallet: WalletModule) {
    this.connection = connection;
    this.wallet = wallet;
  }

  /**
   * Get token info
   */
  async getTokenInfo(mint: string | PublicKey): Promise<TokenInfo> {
    const mintPubkey = typeof mint === 'string' ? new PublicKey(mint) : mint;
    const info = await getMint(this.connection, mintPubkey);

    return {
      address: mintPubkey.toBase58(),
      decimals: info.decimals,
      supply: info.supply,
      mintAuthority: info.mintAuthority?.toBase58() || null,
      freezeAuthority: info.freezeAuthority?.toBase58() || null,
    };
  }

  /**
   * Get associated token address
   */
  async getAssociatedTokenAddress(
    mint: string | PublicKey,
    owner?: string | PublicKey
  ): Promise<PublicKey> {
    const mintPubkey = typeof mint === 'string' ? new PublicKey(mint) : mint;
    const ownerPubkey = owner 
      ? (typeof owner === 'string' ? new PublicKey(owner) : owner)
      : this.wallet.getPublicKey();

    if (!ownerPubkey) throw new Error('No wallet loaded and no owner provided');

    return await getAssociatedTokenAddress(mintPubkey, ownerPubkey);
  }

  /**
   * Get token account balance
   */
  async getBalance(
    mint: string | PublicKey,
    owner?: string | PublicKey
  ): Promise<{ amount: bigint; decimals: number; uiAmount: number }> {
    const ata = await this.getAssociatedTokenAddress(mint, owner);
    
    try {
      const account = await getAccount(this.connection, ata);
      const tokenInfo = await this.getTokenInfo(mint);
      
      return {
        amount: account.amount,
        decimals: tokenInfo.decimals,
        uiAmount: Number(account.amount) / Math.pow(10, tokenInfo.decimals),
      };
    } catch {
      return { amount: BigInt(0), decimals: 0, uiAmount: 0 };
    }
  }

  /**
   * Create token mint instructions
   */
  createMintInstructions(
    mintKeypair: Keypair,
    params: CreateTokenParams = {}
  ): TransactionInstruction[] {
    const payer = this.wallet.getPublicKey();
    if (!payer) throw new Error('No wallet loaded');

    const decimals = params.decimals ?? 9;
    const mintAuthority = params.mintAuthority 
      ? new PublicKey(params.mintAuthority) 
      : payer;
    const freezeAuthority = params.freezeAuthority
      ? new PublicKey(params.freezeAuthority)
      : null;

    const lamports = this.connection.getMinimumBalanceForRentExemption(MintLayout.span);

    return [
      SystemProgram.createAccount({
        fromPubkey: payer,
        newAccountPubkey: mintKeypair.publicKey,
        space: MintLayout.span,
        lamports: lamports as unknown as number,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        decimals,
        mintAuthority,
        freezeAuthority
      ),
    ];
  }

  /**
   * Create associated token account instruction
   */
  createATAInstruction(
    mint: string | PublicKey,
    owner?: string | PublicKey
  ): TransactionInstruction {
    const payer = this.wallet.getPublicKey();
    if (!payer) throw new Error('No wallet loaded');

    const mintPubkey = typeof mint === 'string' ? new PublicKey(mint) : mint;
    const ownerPubkey = owner
      ? (typeof owner === 'string' ? new PublicKey(owner) : owner)
      : payer;

    const ata = getAssociatedTokenAddress(mintPubkey, ownerPubkey);

    return createAssociatedTokenAccountInstruction(
      payer,
      ata as unknown as PublicKey,
      ownerPubkey,
      mintPubkey
    );
  }

  /**
   * Create mint-to instruction
   */
  mintToInstruction(
    mint: string | PublicKey,
    destination: string | PublicKey,
    amount: bigint,
    authority?: string | PublicKey
  ): TransactionInstruction {
    const mintPubkey = typeof mint === 'string' ? new PublicKey(mint) : mint;
    const destPubkey = typeof destination === 'string' ? new PublicKey(destination) : destination;
    const authPubkey = authority
      ? (typeof authority === 'string' ? new PublicKey(authority) : authority)
      : this.wallet.getPublicKey();

    if (!authPubkey) throw new Error('No authority provided');

    return createMintToInstruction(mintPubkey, destPubkey, authPubkey, amount);
  }

  /**
   * Create transfer instruction
   */
  transferInstruction(
    source: string | PublicKey,
    destination: string | PublicKey,
    amount: bigint,
    owner?: string | PublicKey
  ): TransactionInstruction {
    const srcPubkey = typeof source === 'string' ? new PublicKey(source) : source;
    const destPubkey = typeof destination === 'string' ? new PublicKey(destination) : destination;
    const ownerPubkey = owner
      ? (typeof owner === 'string' ? new PublicKey(owner) : owner)
      : this.wallet.getPublicKey();

    if (!ownerPubkey) throw new Error('No owner provided');

    return createTransferInstruction(srcPubkey, destPubkey, ownerPubkey, amount);
  }

  /**
   * Create burn instruction
   */
  burnInstruction(
    account: string | PublicKey,
    mint: string | PublicKey,
    amount: bigint,
    owner?: string | PublicKey
  ): TransactionInstruction {
    const accountPubkey = typeof account === 'string' ? new PublicKey(account) : account;
    const mintPubkey = typeof mint === 'string' ? new PublicKey(mint) : mint;
    const ownerPubkey = owner
      ? (typeof owner === 'string' ? new PublicKey(owner) : owner)
      : this.wallet.getPublicKey();

    if (!ownerPubkey) throw new Error('No owner provided');

    return createBurnInstruction(accountPubkey, mintPubkey, ownerPubkey, amount);
  }

  /**
   * Create close account instruction
   */
  closeAccountInstruction(
    account: string | PublicKey,
    destination?: string | PublicKey,
    owner?: string | PublicKey
  ): TransactionInstruction {
    const accountPubkey = typeof account === 'string' ? new PublicKey(account) : account;
    const ownerPubkey = owner
      ? (typeof owner === 'string' ? new PublicKey(owner) : owner)
      : this.wallet.getPublicKey();
    const destPubkey = destination
      ? (typeof destination === 'string' ? new PublicKey(destination) : destination)
      : ownerPubkey;

    if (!ownerPubkey || !destPubkey) throw new Error('No owner provided');

    return createCloseAccountInstruction(accountPubkey, destPubkey, ownerPubkey);
  }
}
