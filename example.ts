import { launchToken } from './src/launch';

class Example {
    private deployerPrivatekey: string;
    private tokenUri: string;
    private tokenSymbol: string;
    private tokenName: string;

    constructor(deployerPrivatekey: string, tokenUri: string, tokenSymbol: string, tokenName: string) {
        this.deployerPrivatekey = deployerPrivatekey;
        this.tokenUri = tokenUri;
        this.tokenSymbol = tokenSymbol;
        this.tokenName = tokenName;
    }

    async main() {
        try {
            console.log(`Launching token: ${this.tokenName} (${this.tokenSymbol})...`);
            const result = await launchToken(
                this.deployerPrivatekey, 
                this.tokenName, 
                this.tokenSymbol, 
                this.tokenUri
            );
            
            if (result && result.signature) {
                console.log("Token launch successful!");
                console.log(`Mint Address: ${result.mintAddress}`);
                console.log(`Transaction Signature: ${result.signature}`);
            } else {
                console.error("Token launch may have failed or confirmation timed out.");
                console.log("Check your wallet to see if the token was created.");
            }
        } catch (error) {
            console.error('Error in main function:', error);
        }
    }
}

// Usage
const deployerPrivatekey = '3z6chDBEyZyWEWU2KK7KASB316F5oDtyqP8KbJt5dhj6S4utTTFSmZicSM61Hev3E2VZhAXoobzzx2hqoCYge8TU'; // Replace with your actual private key
const tokenUri = 'https://ipfs.io/ipfs/QmZSNjLebXni9n67i8UWYt73vt1agkSxQraNtr54D8Vj8d'; // Replace with actual token URI
const tokenSymbol = 'abcd'; // Symbol (will automatically add .pump if needed)
const tokenName = 'abcd'; // Token name

const example = new Example(deployerPrivatekey, tokenUri, tokenSymbol, tokenName);
example.main();
