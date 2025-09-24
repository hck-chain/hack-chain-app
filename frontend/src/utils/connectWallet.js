import { ethers } from "ethers";

const CONTRATC_ADDRESS = '0x20EA26e4F2d13c60147320A02BdAD66fC44C3f5a';
const ARBITRUM_CHAIN_ID = '0xa4b1';

// Connect wallet
async function connectWallet() {
    let signer = null;
    let provider;
    if (window.ethereum == null) {
        alert('Please install Metamask');
        return;
    } else {
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
    }

    // Connect wallet to Arbitrum

    const chain = await window.ethereum.request({
        method: 'eth_chainId'
    });

    if (chain !== ARBITRUM_CHAIN_ID) {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: ARBITRUM_CHAIN_ID }],
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: ARBITRUM_CHAIN_ID,
                        chainName: 'Arbitrum One',
                        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                        rpcUrls: ['https://arb1.arbitrum.io/rpc'],
                        blockExplorerUrls: ['https://arbiscan.io']
                    }]
                });
            }
        }
    }
    return signer;
}

connectWallet().then(async signer => {
    try {
        const walletAddress = await signer.getAddress();
        console.log('Wallet connected: ', walletAddress);
    } catch (error) {
        console.log('Failed to connect wallet: ', error);
    }
});

// Create contract instance

// const abi = [
//     {
//         "type": "constructor",
//         "inputs": [],
//         "stateMutability": "nonpayable"
//     },
//     {
//         "type": "function",
//         "name": "approve",
//         "inputs": [
//             {
//                 "name": "to",
//                 "type": "address",
//                 "internalType": "address"
//             },
//             {
//                 "name": "tokenId",
//                 "type": "uint256",
//                 "internalType": "uint256"
//             }
//         ],
//         "outputs": [],
//         "stateMutability": "nonpayable"
//     },
//     {
//         "type": "function",
//         "name": "authorizeIssuer",
//         "inputs": [
//             {
//                 "name": "issuer",
//                 "type": "address",
//                 "internalType": "address"
//             }
//         ],
//         "outputs": [],
//         "stateMutability": "nonpayable"
//     },
//     {
//         "type": "function",
//         "name": "authorizedIssuers",
//         "inputs": [
//             {
//                 "name": "",
//                 "type": "address",
//                 "internalType": "address"
//             }
//         ],
//         "outputs": [
//             {
//                 "name": "",
//                 "type": "bool",
//                 "internalType": "bool"
//             }
//         ],
//         "stateMutability": "view"
//     },
//     {
//         "type": "function",
//         "name": "balanceOf",
//         "inputs": [
//             {
//                 "name": "owner",
//                 "type": "address",
//                 "internalType": "address"
//             }
//         ],
//         "outputs": [
//             {
//                 "name": "",
//                 "type": "uint256",
//                 "internalType": "uint256"
//             }
//         ],
//         "stateMutability": "view"
//     },
//     {
//         "type": "function",
//         "name": "certificates",
//         "inputs": [
//             {
//                 "name": "",
//                 "type": "uint256",
//                 "internalType": "uint256"
//             }
//         ],
//         "outputs": [
//             {
//                 "name": "studentName",
//                 "type": "string",
//                 "internalType": "string"
//             },
//             {
//                 "name": "courseName",
//                 "type": "string",
//                 "internalType": "string"
//             },
//             {
//                 "name": "issuedAt",
//                 "type": "uint256",
//                 "internalType": "uint256"
//             },
//             {
//                 "name": "issuer",
//                 "type": "address",
//                 "internalType": "address"
//             }
//         ],
//         "stateMutability": "view"
//     },
//     {
//         "type": "function",
//         "name": "currentTokenId",
//         "inputs": [],
//         "outputs": [
//             {
//                 "name": "",
//                 "type": "uint256",
//                 "internalType": "uint256"
//             }
//         ],
//         "stateMutability": "view"
//     },
//     {
//         "type": "function",
//         "name": "getApproved",
//         "inputs": [
//             {
//                 "name": "tokenId",
//                 "type": "uint256",
//                 "internalType": "uint256"
//             }
//         ],
//         "outputs": [
//             {
//                 "name": "",
//                 "type": "address",
//                 "internalType": "address"
//             }
//         ],
//         "stateMutability": "view"
//     },
//     {
//         "type": "function",
//         "name": "isApprovedForAll",
//         "inputs": [
//             {
//                 "name": "owner",
//                 "type": "address",
//                 "internalType": "address"
//             },
//             {
//                 "name": "operator",
//                 "type": "address",
//                 "internalType": "address"
//             }
//         ],
//         "outputs": [
//             {
//                 "name": "",
//                 "type": "bool",
//                 "internalType": "bool"
//             }
//         ],
//         "stateMutability": "view"
//     },
//     {
//         "type": "function",
//         "name": "issueCertificate",
//         "inputs": [
//             {
//                 "name": "to",
//                 "type": "address",
//                 "internalType": "address"
//             },
//             {
//                 "name": "studentName",
//                 "type": "string",
//                 "internalType": "string"
//             },
//             {
//                 "name": "courseName",
//                 "type": "string",
//                 "internalType": "string"
//             },
//             {
//                 "name": "tokenUri",
//                 "type": "string",
//                 "internalType": "string"
//             }
//         ],
//         "outputs": [
//             {
//                 "name": "newId",
//                 "type": "uint256",
//                 "internalType": "uint256"
//             }
//         ],
//         "stateMutability": "nonpayable"
//     },
//     {
//         "type": "function",
//         "name": "name",
//         "inputs": [],
//         "outputs": [
//             {
//                 "name": "",
//                 "type": "string",
//                 "internalType": "string"
//             }
//         ],
//         "stateMutability": "view"
//     },
//     {
//         "type": "function",
//         "name": "owner",
//         "inputs": [],
//         "outputs": [
//             {
//                 "name": "",
//                 "type": "address",
//                 "internalType": "address"
//             }
//         ],
//         "stateMutability": "view"
//     },
//     {
//         "type": "function",
//         "name": "ownerOf",
//         "inputs": [
//             {
//                 "name": "tokenId",
//                 "type": "uint256",
//                 "internalType": "uint256"
//             }
//         ],
//         "outputs": [
//             {
//                 "name": "",
//                 "type": "address",
//                 "internalType": "address"
//             }
//         ],
//         "stateMutability": "view"
//     },
//     {
//         "type": "function",
//         "name": "renounceOwnership",
//         "inputs": [],
//         "outputs": [],
//         "stateMutability": "nonpayable"
//     },
//     {
//         "type": "function",
//         "name": "revokeCertificate",
//         "inputs": [
//             {
//                 "name": "tokenId",
//                 "type": "uint256",
//                 "internalType": "uint256"
//             }
//         ],
//         "outputs": [],
//         "stateMutability": "nonpayable"
//     },
//     {
//         "type": "function",
//         "name": "revokeIssuer",
//         "inputs": [
//             {
//                 "name": "issuer",
//                 "type": "address",
//                 "internalType": "address"
//             }
//         ],
//         "outputs": [],
//         "stateMutability": "nonpayable"
//     },
//     {
//         "type": "function",
//         "name": "safeTransferFrom",
//         "inputs": [
//             {
//                 "name": "from",
//                 "type": "address",
//                 "internalType": "address"
//             },
//             {
//                 "name": "to",
//                 "type": "address",
//                 "internalType": "address"
//             },
//             {
//                 "name": "tokenId",
//                 "type": "uint256",
//                 "internalType": "uint256"
//             }
//         ],
//         "outputs": [],
//         "stateMutability": "nonpayable"
//     },
//     {
//         "type": "function",
//         "name": "safeTransferFrom",
//         "inputs": [
//             {
//                 "name": "from",
//                 "type": "address",
//                 "internalType": "address"
//             },
//             {
//                 "name": "to",
//                 "type": "address",
//                 "internalType": "address"
//             },
//             {
//                 "name": "tokenId",
//                 "type": "uint256",
//                 "internalType": "uint256"
//             },
//             {
//                 "name": "data",
//                 "type": "bytes",
//                 "internalType": "bytes"
//             }
//         ],
//         "outputs": [],
//         "stateMutability": "pure"
//     },
//     {
//         "type": "function",
//         "name": "setApprovalForAll",
//         "inputs": [
//             {
//                 "name": "operator",
//                 "type": "address",
//                 "internalType": "address"
//             },
//             {
//                 "name": "approved",
//                 "type": "bool",
//                 "internalType": "bool"
//             }
//         ],
//         "outputs": [],
//         "stateMutability": "nonpayable"
//     },
//     {
//         "type": "function",
//         "name": "supportsInterface",
//         "inputs": [
//             {
//                 "name": "interfaceId",
//                 "type": "bytes4",
//                 "internalType": "bytes4"
//             }
//         ],
//         "outputs": [
//             {
//                 "name": "",
//                 "type": "bool",
//                 "internalType": "bool"
//             }
//         ],
//         "stateMutability": "view"
//     },
//     {
//         "type": "function",
//         "name": "symbol",
//         "inputs": [],
//         "outputs": [
//             {
//                 "name": "",
//                 "type": "string",
//                 "internalType": "string"
//             }
//         ],
//         "stateMutability": "view"
//     },
//     {
//         "type": "function",
//         "name": "tokenURI",
//         "inputs": [
//             {
//                 "name": "tokenId",
//                 "type": "uint256",
//                 "internalType": "uint256"
//             }
//         ],
//         "outputs": [
//             {
//                 "name": "uri",
//                 "type": "string",
//                 "internalType": "string"
//             }
//         ],
//         "stateMutability": "view"
//     },
//     {
//         "type": "function",
//         "name": "transferFrom",
//         "inputs": [
//             {
//                 "name": "from",
//                 "type": "address",
//                 "internalType": "address"
//             },
//             {
//                 "name": "to",
//                 "type": "address",
//                 "internalType": "address"
//             },
//             {
//                 "name": "tokenId",
//                 "type": "uint256",
//                 "internalType": "uint256"
//             }
//         ],
//         "outputs": [],
//         "stateMutability": "pure"
//     },
//     {
//         "type": "function",
//         "name": "transferOwnership",
//         "inputs": [
//             {
//                 "name": "newOwner",
//                 "type": "address",
//                 "internalType": "address"
//             }
//         ],
//         "outputs": [],
//         "stateMutability": "nonpayable"
//     },
//     {
//         "type": "function",
//         "name": "verifyCertificate",
//         "inputs": [
//             {
//                 "name": "tokenId",
//                 "type": "uint256",
//                 "internalType": "uint256"
//             }
//         ],
//         "outputs": [
//             {
//                 "name": "",
//                 "type": "tuple",
//                 "internalType": "struct HackCertificate.Certificate",
//                 "components": [
//                     {
//                         "name": "studentName",
//                         "type": "string",
//                         "internalType": "string"
//                     },
//                     {
//                         "name": "courseName",
//                         "type": "string",
//                         "internalType": "string"
//                     },
//                     {
//                         "name": "issuedAt",
//                         "type": "uint256",
//                         "internalType": "uint256"
//                     },
//                     {
//                         "name": "issuer",
//                         "type": "address",
//                         "internalType": "address"
//                     }
//                 ]
//             }
//         ],
//         "stateMutability": "view"
//     },
//     {
//         "type": "event",
//         "name": "Approval",
//         "inputs": [
//             {
//                 "name": "owner",
//                 "type": "address",
//                 "indexed": true,
//                 "internalType": "address"
//             },
//             {
//                 "name": "approved",
//                 "type": "address",
//                 "indexed": true,
//                 "internalType": "address"
//             },
//             {
//                 "name": "tokenId",
//                 "type": "uint256",
//                 "indexed": true,
//                 "internalType": "uint256"
//             }
//         ],
//         "anonymous": false
//     },
//     {
//         "type": "event",
//         "name": "ApprovalForAll",
//         "inputs": [
//             {
//                 "name": "owner",
//                 "type": "address",
//                 "indexed": true,
//                 "internalType": "address"
//             },
//             {
//                 "name": "operator",
//                 "type": "address",
//                 "indexed": true,
//                 "internalType": "address"
//             },
//             {
//                 "name": "approved",
//                 "type": "bool",
//                 "indexed": false,
//                 "internalType": "bool"
//             }
//         ],
//         "anonymous": false
//     },
//     {
//         "type": "event",
//         "name": "CertificateIssued",
//         "inputs": [
//             {
//                 "name": "tokenId",
//                 "type": "uint256",
//                 "indexed": false,
//                 "internalType": "uint256"
//             },
//             {
//                 "name": "issuer",
//                 "type": "address",
//                 "indexed": true,
//                 "internalType": "address"
//             },
//             {
//                 "name": "student",
//                 "type": "address",
//                 "indexed": true,
//                 "internalType": "address"
//             }
//         ],
//         "anonymous": false
//     },
//     {
//         "type": "event",
//         "name": "OwnershipTransferred",
//         "inputs": [
//             {
//                 "name": "previousOwner",
//                 "type": "address",
//                 "indexed": true,
//                 "internalType": "address"
//             },
//             {
//                 "name": "newOwner",
//                 "type": "address",
//                 "indexed": true,
//                 "internalType": "address"
//             }
//         ],
//         "anonymous": false
//     },
//     {
//         "type": "event",
//         "name": "Transfer",
//         "inputs": [
//             {
//                 "name": "from",
//                 "type": "address",
//                 "indexed": true,
//                 "internalType": "address"
//             },
//             {
//                 "name": "to",
//                 "type": "address",
//                 "indexed": true,
//                 "internalType": "address"
//             },
//             {
//                 "name": "tokenId",
//                 "type": "uint256",
//                 "indexed": true,
//                 "internalType": "uint256"
//             }
//         ],
//         "anonymous": false
//     },
//     {
//         "type": "error",
//         "name": "ERC721IncorrectOwner",
//         "inputs": [
//             {
//                 "name": "sender",
//                 "type": "address",
//                 "internalType": "address"
//             },
//             {
//                 "name": "tokenId",
//                 "type": "uint256",
//                 "internalType": "uint256"
//             },
//             {
//                 "name": "owner",
//                 "type": "address",
//                 "internalType": "address"
//             }
//         ]
//     },
//     {
//         "type": "error",
//         "name": "ERC721InsufficientApproval",
//         "inputs": [
//             {
//                 "name": "operator",
//                 "type": "address",
//                 "internalType": "address"
//             },
//             {
//                 "name": "tokenId",
//                 "type": "uint256",
//                 "internalType": "uint256"
//             }
//         ]
//     },
//     {
//         "type": "error",
//         "name": "ERC721InvalidApprover",
//         "inputs": [
//             {
//                 "name": "approver",
//                 "type": "address",
//                 "internalType": "address"
//             }
//         ]
//     },
//     {
//         "type": "error",
//         "name": "ERC721InvalidOperator",
//         "inputs": [
//             {
//                 "name": "operator",
//                 "type": "address",
//                 "internalType": "address"
//             }
//         ]
//     },
//     {
//         "type": "error",
//         "name": "ERC721InvalidOwner",
//         "inputs": [
//             {
//                 "name": "owner",
//                 "type": "address",
//                 "internalType": "address"
//             }
//         ]
//     },
//     {
//         "type": "error",
//         "name": "ERC721InvalidReceiver",
//         "inputs": [
//             {
//                 "name": "receiver",
//                 "type": "address",
//                 "internalType": "address"
//             }
//         ]
//     },
//     {
//         "type": "error",
//         "name": "ERC721InvalidSender",
//         "inputs": [
//             {
//                 "name": "sender",
//                 "type": "address",
//                 "internalType": "address"
//             }
//         ]
//     },
//     {
//         "type": "error",
//         "name": "ERC721NonexistentToken",
//         "inputs": [
//             {
//                 "name": "tokenId",
//                 "type": "uint256",
//                 "internalType": "uint256"
//             }
//         ]
//     },
//     {
//         "type": "error",
//         "name": "OwnableInvalidOwner",
//         "inputs": [
//             {
//                 "name": "owner",
//                 "type": "address",
//                 "internalType": "address"
//             }
//         ]
//     },
//     {
//         "type": "error",
//         "name": "OwnableUnauthorizedAccount",
//         "inputs": [
//             {
//                 "name": "account",
//                 "type": "address",
//                 "internalType": "address"
//             }
//         ]
//     }
// ];

// contract = new Contract(CONTRATC_ADDRESS, abi, signer);