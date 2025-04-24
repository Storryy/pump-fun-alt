"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buyTokens = exports.launchToken = void 0;
const utils_1 = require("./utils");
const web3_js_1 = __importStar(require("@solana/web3.js"));
const spl_token_1 = require("@solana/spl-token");
const constants_1 = require("./constants");
function launchToken(deployerPrivatekey, name, symbol, uri) {
    return __awaiter(this, void 0, void 0, function* () {
        const connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)("mainnet-beta"), 'confirmed');
        // Ensure symbol ends with ".pump"
        let formattedSymbol = symbol;
        if (!formattedSymbol.toLowerCase().endsWith('.pump')) {
            formattedSymbol = `${formattedSymbol}.pump`;
        }
        const payer = yield (0, utils_1.getKeyPairFromPrivateKey)(deployerPrivatekey);
        const owner = payer.publicKey;
        //Create new wallet to be used as mint
        const mint = web3_js_1.Keypair.generate();
        const [bondingCurve, bondingCurveBump] = yield web3_js_1.PublicKey.findProgramAddress([Buffer.from("bonding-curve"), mint.publicKey.toBuffer()], constants_1.PUMP_FUN_PROGRAM);
        const [associatedBondingCurve, associatedBondingCurveBump] = web3_js_1.PublicKey.findProgramAddressSync([
            bondingCurve.toBuffer(),
            new web3_js_1.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA").toBuffer(),
            mint.publicKey.toBuffer()
        ], new web3_js_1.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"));
        const [metadata, metadataBump] = yield web3_js_1.PublicKey.findProgramAddress([Buffer.from("metadata"), constants_1.MPL_TOKEN_METADATA.toBuffer(), mint.publicKey.toBuffer()], constants_1.MPL_TOKEN_METADATA);
        const txBuilder = new web3_js_1.default.Transaction();
        // Adding the Compute Budget instruction
        const computeBudgetInstruction = new web3_js_1.default.TransactionInstruction({
            keys: [],
            programId: constants_1.COMPUTE_BUDGET_PROGRAM_ID,
            data: Buffer.concat([
                Buffer.from(Uint8Array.of(3)), // discriminator for SetComputeUnitPrice
                (0, utils_1.bufferFromUInt64)(100000) // microLamports
            ])
        });
        txBuilder.add(computeBudgetInstruction);
        const keys = [
            { pubkey: mint.publicKey, isSigner: true, isWritable: true }, // Mint account
            { pubkey: constants_1.MINT_AUTHORITY, isSigner: false, isWritable: false }, // Mint authority
            { pubkey: bondingCurve, isSigner: false, isWritable: true }, // Bonding curve PDA
            { pubkey: associatedBondingCurve, isSigner: false, isWritable: true }, // Associated bonding curve PDA
            { pubkey: constants_1.GLOBAL, isSigner: false, isWritable: false }, // Global config
            { pubkey: constants_1.MPL_TOKEN_METADATA, isSigner: false, isWritable: false }, // Metadata program ID
            { pubkey: metadata, isSigner: false, isWritable: true }, // Metadata PDA
            { pubkey: owner, isSigner: true, isWritable: true }, // Owner account
            { pubkey: constants_1.SYSTEM_PROGRAM, isSigner: false, isWritable: false }, // System program
            { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // Token program
            { pubkey: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // Associated token account program
            { pubkey: constants_1.RENT, isSigner: false, isWritable: false }, // Rent sysvar
            { pubkey: constants_1.PUMP_FUN_ACCOUNT, isSigner: false, isWritable: false }, // Pump fun account
            { pubkey: constants_1.PUMP_FUN_PROGRAM, isSigner: false, isWritable: false } // Pump fun program ID
        ];
        const nameBuffer = (0, utils_1.bufferFromString)(name);
        const symbolBuffer = (0, utils_1.bufferFromString)(formattedSymbol);
        const uriBuffer = (0, utils_1.bufferFromString)(uri);
        const deployerBuffer = (0, utils_1.bufferFromString)(payer.publicKey.toString());
        const data = Buffer.concat([
            Buffer.from("181ec828051c0777", "hex"),
            nameBuffer,
            symbolBuffer,
            uriBuffer,
            deployerBuffer
        ]);
        const instruction = new web3_js_1.default.TransactionInstruction({
            keys: keys,
            programId: constants_1.PUMP_FUN_PROGRAM,
            data: data
        });
        txBuilder.add(instruction);
        const transaction = yield (0, utils_1.createTransaction)(connection, txBuilder.instructions, payer.publicKey);
        const signature = yield (0, utils_1.sendAndConfirmTransactionWrapper)(connection, transaction, [payer, mint]);
        if (signature) {
            console.log(`Token launch completed. Mint address: ${mint.publicKey.toString()}`);
            console.log(`Check your token on Solana Explorer: https://explorer.solana.com/address/${mint.publicKey.toString()}`);
        }
        else {
            console.error("Failed to launch token");
        }
        return {
            signature,
            mintAddress: mint.publicKey.toString()
        };
    });
}
exports.launchToken = launchToken;
// Function to buy tokens with SOL
function buyTokens(connection, buyerPrivateKey, mintPubkey, solAmount) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Buying tokens with ${solAmount} SOL...`);
        const buyer = yield (0, utils_1.getKeyPairFromPrivateKey)(buyerPrivateKey);
        // Get the buyer's associated token account for this mint
        const buyerTokenAccount = yield (0, spl_token_1.getAssociatedTokenAddress)(mintPubkey, buyer.publicKey);
        // Get bonding curve PDA (this matches the PDA calculation in launchToken)
        const [bondingCurve] = yield web3_js_1.PublicKey.findProgramAddress([Buffer.from("bonding-curve"), mintPubkey.toBuffer()], constants_1.PUMP_FUN_PROGRAM);
        // Convert SOL amount to lamports
        const lamports = solAmount * web3_js_1.LAMPORTS_PER_SOL;
        // Create transaction for buying tokens
        const txBuilder = new web3_js_1.default.Transaction();
        // Adding the Compute Budget instruction
        const computeBudgetInstruction = new web3_js_1.default.TransactionInstruction({
            keys: [],
            programId: constants_1.COMPUTE_BUDGET_PROGRAM_ID,
            data: Buffer.concat([
                Buffer.from(Uint8Array.of(3)), // discriminator for SetComputeUnitPrice
                (0, utils_1.bufferFromUInt64)(100000) // microLamports
            ])
        });
        txBuilder.add(computeBudgetInstruction);
        // Create buy instruction
        const buyInstruction = new web3_js_1.default.TransactionInstruction({
            keys: [
                { pubkey: buyer.publicKey, isSigner: true, isWritable: true }, // Buyer
                { pubkey: buyerTokenAccount, isSigner: false, isWritable: true }, // Buyer's token account
                { pubkey: bondingCurve, isSigner: false, isWritable: true }, // Bonding curve PDA
                { pubkey: mintPubkey, isSigner: false, isWritable: true }, // Mint account
                { pubkey: constants_1.SYSTEM_PROGRAM, isSigner: false, isWritable: false }, // System program
                { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // Token program
                { pubkey: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // Associated token program
                { pubkey: constants_1.PUMP_FUN_ACCOUNT, isSigner: false, isWritable: true }, // PumpFun account to receive fees
            ],
            programId: constants_1.PUMP_FUN_PROGRAM,
            data: Buffer.concat([
                Buffer.from([0x01]), // 0x01 is instruction index for buying tokens
                (0, utils_1.bufferFromUInt64)(lamports), // Amount of lamports to spend
            ])
        });
        txBuilder.add(buyInstruction);
        // Send and confirm transaction
        const transaction = yield (0, utils_1.createTransaction)(connection, txBuilder.instructions, buyer.publicKey);
        const signature = yield (0, utils_1.sendAndConfirmTransactionWrapper)(connection, transaction, [buyer]);
        console.log(`Token purchase tx confirmed with signature: ${signature}`);
        return signature;
    });
}
exports.buyTokens = buyTokens;
