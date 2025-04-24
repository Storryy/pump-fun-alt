import { getKeyPairFromPrivateKey, createTransaction, sendAndConfirmTransactionWrapper, bufferFromUInt64, bufferFromString } from './utils';
import web3, { Connection, Keypair, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { COMPUTE_BUDGET_PROGRAM_ID, GLOBAL, MINT_AUTHORITY, MPL_TOKEN_METADATA, PUMP_FUN_ACCOUNT, PUMP_FUN_PROGRAM, RENT, SYSTEM_PROGRAM } from './constants';

export async function launchToken(deployerPrivatekey: string, name: string, symbol: string, uri: string) {
    const connection = new Connection(
        clusterApiUrl("mainnet-beta"),
        'confirmed'
    );

    // Ensure symbol ends with ".pump"
    let formattedSymbol = symbol;
    if (!formattedSymbol.toLowerCase().endsWith('.pump')) {
        formattedSymbol = `${formattedSymbol}.pump`;
    }

    const payer = await getKeyPairFromPrivateKey(deployerPrivatekey);
    const owner = payer.publicKey;

    //Create new wallet to be used as mint
    const mint = Keypair.generate();

    const [bondingCurve, bondingCurveBump] = await PublicKey.findProgramAddress(
        [Buffer.from("bonding-curve"), mint.publicKey.toBuffer()],
        PUMP_FUN_PROGRAM
    );

    const [associatedBondingCurve, associatedBondingCurveBump] = PublicKey.findProgramAddressSync(
        [
            bondingCurve.toBuffer(),
            new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA").toBuffer(),
            mint.publicKey.toBuffer()
        ],
        new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
    );

    const [metadata, metadataBump] = await PublicKey.findProgramAddress(
        [Buffer.from("metadata"), MPL_TOKEN_METADATA.toBuffer(), mint.publicKey.toBuffer()],
        MPL_TOKEN_METADATA
    );

    const txBuilder = new web3.Transaction();

    // Adding the Compute Budget instruction
    const computeBudgetInstruction = new web3.TransactionInstruction({
        keys: [],
        programId: COMPUTE_BUDGET_PROGRAM_ID,
        data: Buffer.concat([
            Buffer.from(Uint8Array.of(3)), // discriminator for SetComputeUnitPrice
            bufferFromUInt64(100000) // microLamports
        ])
    });

    txBuilder.add(computeBudgetInstruction);

    const keys = [
        { pubkey: mint.publicKey, isSigner: true, isWritable: true }, // Mint account
        { pubkey: MINT_AUTHORITY, isSigner: false, isWritable: false }, // Mint authority
        { pubkey: bondingCurve, isSigner: false, isWritable: true }, // Bonding curve PDA
        { pubkey: associatedBondingCurve, isSigner: false, isWritable: true }, // Associated bonding curve PDA
        { pubkey: GLOBAL, isSigner: false, isWritable: false }, // Global config
        { pubkey: MPL_TOKEN_METADATA, isSigner: false, isWritable: false }, // Metadata program ID
        { pubkey: metadata, isSigner: false, isWritable: true }, // Metadata PDA
        { pubkey: owner, isSigner: true, isWritable: true }, // Owner account
        { pubkey: SYSTEM_PROGRAM, isSigner: false, isWritable: false }, // System program
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // Token program
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // Associated token account program
        { pubkey: RENT, isSigner: false, isWritable: false }, // Rent sysvar
        { pubkey: PUMP_FUN_ACCOUNT, isSigner: false, isWritable: false }, // Pump fun account
        { pubkey: PUMP_FUN_PROGRAM, isSigner: false, isWritable: false } // Pump fun program ID
    ];

    const nameBuffer = bufferFromString(name);
    const symbolBuffer = bufferFromString(formattedSymbol);
    const uriBuffer = bufferFromString(uri);
    const deployerBuffer = bufferFromString(payer.publicKey.toString());

    const data = Buffer.concat([
        Buffer.from("181ec828051c0777", "hex"),
        nameBuffer,
        symbolBuffer,
        uriBuffer,
        deployerBuffer
    ]);

    const instruction = new web3.TransactionInstruction({
        keys: keys,
        programId: PUMP_FUN_PROGRAM,
        data: data
    });

    txBuilder.add(instruction);

    const transaction = await createTransaction(connection, txBuilder.instructions, payer.publicKey);
    const signature = await sendAndConfirmTransactionWrapper(connection, transaction, [payer, mint]);
    
    if (signature) {
        console.log(`Token launch completed. Mint address: ${mint.publicKey.toString()}`);
        console.log(`Check your token on Solana Explorer: https://explorer.solana.com/address/${mint.publicKey.toString()}`);
    } else {
        console.error("Failed to launch token");
    }

    return {
        signature,
        mintAddress: mint.publicKey.toString()
    };
}

// Function to buy tokens with SOL
export async function buyTokens(connection: Connection, buyerPrivateKey: string, mintPubkey: PublicKey, solAmount: number) {
    console.log(`Buying tokens with ${solAmount} SOL...`);
    
    const buyer = await getKeyPairFromPrivateKey(buyerPrivateKey);
    
    // Get the buyer's associated token account for this mint
    const buyerTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        buyer.publicKey
    );
    
    // Get bonding curve PDA (this matches the PDA calculation in launchToken)
    const [bondingCurve] = await PublicKey.findProgramAddress(
        [Buffer.from("bonding-curve"), mintPubkey.toBuffer()],
        PUMP_FUN_PROGRAM
    );
    
    // Convert SOL amount to lamports
    const lamports = solAmount * LAMPORTS_PER_SOL;
    
    // Create transaction for buying tokens
    const txBuilder = new web3.Transaction();
    
    // Adding the Compute Budget instruction
    const computeBudgetInstruction = new web3.TransactionInstruction({
        keys: [],
        programId: COMPUTE_BUDGET_PROGRAM_ID,
        data: Buffer.concat([
            Buffer.from(Uint8Array.of(3)), // discriminator for SetComputeUnitPrice
            bufferFromUInt64(100000) // microLamports
        ])
    });
    
    txBuilder.add(computeBudgetInstruction);
    
    // Create buy instruction
    const buyInstruction = new web3.TransactionInstruction({
        keys: [
            { pubkey: buyer.publicKey, isSigner: true, isWritable: true }, // Buyer
            { pubkey: buyerTokenAccount, isSigner: false, isWritable: true }, // Buyer's token account
            { pubkey: bondingCurve, isSigner: false, isWritable: true }, // Bonding curve PDA
            { pubkey: mintPubkey, isSigner: false, isWritable: true }, // Mint account
            { pubkey: SYSTEM_PROGRAM, isSigner: false, isWritable: false }, // System program
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // Token program
            { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // Associated token program
            { pubkey: PUMP_FUN_ACCOUNT, isSigner: false, isWritable: true }, // PumpFun account to receive fees
        ],
        programId: PUMP_FUN_PROGRAM,
        data: Buffer.concat([
            Buffer.from([0x01]), // 0x01 is instruction index for buying tokens
            bufferFromUInt64(lamports), // Amount of lamports to spend
        ])
    });
    
    txBuilder.add(buyInstruction);
    
    // Send and confirm transaction
    const transaction = await createTransaction(connection, txBuilder.instructions, buyer.publicKey);
    const signature = await sendAndConfirmTransactionWrapper(connection, transaction, [buyer]);
    console.log(`Token purchase tx confirmed with signature: ${signature}`);
    
    return signature;
}