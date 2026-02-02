import { PublicKey } from '@solana/web3.js';

export interface PDAResult {
  address: PublicKey;
  bump: number;
}

export class PDAModule {
  /**
   * Derive a Program Derived Address
   */
  static derive(
    seeds: (Buffer | Uint8Array | string)[],
    programId: string | PublicKey
  ): PDAResult {
    const programPubkey = typeof programId === 'string' ? new PublicKey(programId) : programId;
    
    const seedBuffers = seeds.map(seed => {
      if (typeof seed === 'string') {
        return Buffer.from(seed);
      }
      return seed;
    });

    const [address, bump] = PublicKey.findProgramAddressSync(seedBuffers, programPubkey);
    
    return { address, bump };
  }

  /**
   * Derive PDA with specific bump
   */
  static deriveWithBump(
    seeds: (Buffer | Uint8Array | string)[],
    programId: string | PublicKey,
    bump: number
  ): PublicKey {
    const programPubkey = typeof programId === 'string' ? new PublicKey(programId) : programId;
    
    const seedBuffers: Buffer[] = seeds.map(seed => {
      if (typeof seed === 'string') {
        return Buffer.from(seed);
      }
      return Buffer.from(seed);
    });

    seedBuffers.push(Buffer.from([bump]));

    const address = PublicKey.createProgramAddressSync(seedBuffers, programPubkey);
    return address;
  }

  /**
   * Common PDA patterns
   */
  static patterns = {
    /**
     * Token account PDA (Associated Token Account)
     */
    associatedTokenAccount(
      walletAddress: string | PublicKey,
      tokenMint: string | PublicKey
    ): PDAResult {
      const wallet = typeof walletAddress === 'string' ? new PublicKey(walletAddress) : walletAddress;
      const mint = typeof tokenMint === 'string' ? new PublicKey(tokenMint) : tokenMint;
      const ATA_PROGRAM = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
      const TOKEN_PROGRAM = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

      return PDAModule.derive(
        [wallet.toBuffer(), TOKEN_PROGRAM.toBuffer(), mint.toBuffer()],
        ATA_PROGRAM
      );
    },

    /**
     * Metadata PDA (Metaplex)
     */
    metadata(mint: string | PublicKey): PDAResult {
      const mintPubkey = typeof mint === 'string' ? new PublicKey(mint) : mint;
      const METADATA_PROGRAM = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

      return PDAModule.derive(
        ['metadata', METADATA_PROGRAM.toBuffer(), mintPubkey.toBuffer()],
        METADATA_PROGRAM
      );
    },

    /**
     * Master Edition PDA (Metaplex)
     */
    masterEdition(mint: string | PublicKey): PDAResult {
      const mintPubkey = typeof mint === 'string' ? new PublicKey(mint) : mint;
      const METADATA_PROGRAM = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

      return PDAModule.derive(
        ['metadata', METADATA_PROGRAM.toBuffer(), mintPubkey.toBuffer(), 'edition'],
        METADATA_PROGRAM
      );
    },
  };
}
