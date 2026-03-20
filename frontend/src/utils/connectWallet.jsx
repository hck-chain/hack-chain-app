import React, { use, useState } from 'react';
import { ethers } from "ethers";

const POLYGON_CHAIN_ID = '0x89';

//App

function App() {

    const [account, setAccount] = useState('');
    const [isConnected, setIsConnected] = useState(false);

    // Connect wallet
    const connectWallet = async () => {

        if (!window.ethereum) {
            alert('Please install Metamask');
            return;
        }

        try {

            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];

            // Connect to Polygon L2

            const chain = await window.ethereum.request({
                method: 'eth_chainId'
            });

            if (chain !== POLYGON_CHAIN_ID) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: POLYGON_CHAIN_ID }],
                    });
                } catch (switchError) {
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: POLYGON_CHAIN_ID,
                                chainName: 'Polygon',
                                nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
                                rpcUrls: ['https://polygon-mainnet.g.alchemy.com/v2/djWqQ_BGGPMVHWmbASvBf'],
                                blockExplorerUrls: ['https://polygonscan.com/']
                            }]
                        });
                    }
                }
            }
            setAccount(account);
            setIsConnected(true);
        }

        catch (error) {
            console.error('Connection error', error);
            alert('Failed to connect');
        }
    }

    return (
        <div>
            {!isConnected ? (
                <button onClick={connectWallet}>
                    Connect MetaMask
                </button>
            ) : (
                <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
            )}
        </div>
    )

}
export default App;