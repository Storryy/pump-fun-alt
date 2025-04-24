"use strict";
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
const launch_1 = require("./src/launch");
class Example {
    constructor(deployerPrivatekey, tokenUri, tokenSymbol, tokenName) {
        this.deployerPrivatekey = deployerPrivatekey;
        this.tokenUri = tokenUri;
        this.tokenSymbol = tokenSymbol;
        this.tokenName = tokenName;
    }
    main() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`Launching token: ${this.tokenName} (${this.tokenSymbol})...`);
                const result = yield (0, launch_1.launchToken)(this.deployerPrivatekey, this.tokenName, this.tokenSymbol, this.tokenUri);
                if (result && result.signature) {
                    console.log("Token launch successful!");
                    console.log(`Mint Address: ${result.mintAddress}`);
                    console.log(`Transaction Signature: ${result.signature}`);
                }
                else {
                    console.error("Token launch may have failed or confirmation timed out.");
                    console.log("Check your wallet to see if the token was created.");
                }
            }
            catch (error) {
                console.error('Error in main function:', error);
            }
        });
    }
}
// Usage
const deployerPrivatekey = '3z6chDBEyZyWEWU2KK7KASB316F5oDtyqP8KbJt5dhj6S4utTTFSmZicSM61Hev3E2VZhAXoobzzx2hqoCYge8TU'; // Replace with your actual private key
const tokenUri = 'https://ipfs.io/ipfs/QmZSNjLebXni9n67i8UWYt73vt1agkSxQraNtr54D8Vj8d'; // Replace with actual token URI
const tokenSymbol = 'abcd'; // Symbol (will automatically add .pump if needed)
const tokenName = 'abcd'; // Token name
const example = new Example(deployerPrivatekey, tokenUri, tokenSymbol, tokenName);
example.main();
