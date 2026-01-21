import { ethers } from 'ethers';

// Contract configuration
const CONTRACT_ADDRESS = '0x8D21aC87475eC2EE80fB149E376035F5E29DCa7C';
const POLYGON_CHAIN_ID = '0x13881'; // Mumbai Testnet

const CONTRACT_ABI = [
    {
        "type": "function",
        "name": "issueCertificate",
        "inputs": [
            { "name": "to", "type": "address", "internalType": "address" },
            { "name": "studentName", "type": "string", "internalType": "string" },
            { "name": "courseName", "type": "string", "internalType": "string" },
            { "name": "tokenUri", "type": "string", "internalType": "string" }
        ],
        "outputs": [
            { "name": "newId", "type": "uint256", "internalType": "uint256" }
        ],
        "stateMutability": "nonpayable"
    }
];

export interface Web3Service {
    connectWallet: () => Promise<string | null>;
    mintCertificateOnChain: (
        studentWallet: string,
        studentName: string,
        courseName: string,
        tokenUri: string
    ) => Promise<boolean>;
}

export const web3Service: Web3Service = {
    connectWallet: async () => {
        if (!window.ethereum) {
            alert("Please install MetaMask!");
            return null;
        }

        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];

            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (chainId !== POLYGON_CHAIN_ID) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: POLYGON_CHAIN_ID }],
                    });
                } catch (switchError: any) {
                    console.error("Failed to switch chain:", switchError);
                    // Ideally handle 'chain not added' error here (code 4902)
                    alert("Please switch to Polygon Mumbai Testnet manually.");
                    return null;
                }
            }
            return account;
        } catch (error) {
            console.error("Wallet connection failed:", error);
            return null;
        }
    },

    mintCertificateOnChain: async (studentWallet, studentName, courseName, tokenUri) => {
        if (!window.ethereum) return false;

        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

            console.log(`Minting certificate for ${studentName} (${studentWallet})...`);

            const tx = await contract.issueCertificate(
                studentWallet,
                studentName,
                courseName,
                tokenUri
            );

            console.log("Transaction sent:", tx.hash);
            await tx.wait();
            console.log("Minting confirmed!");

            return true;
        } catch (error) {
            console.error("Minting failed:", error);
            return false;
        }
    }
};
