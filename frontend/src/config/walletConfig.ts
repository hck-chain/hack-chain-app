import { createAppKit } from '@reown/appkit';
import { Ethers5Adapter } from '@reown/appkit-adapter-ethers5';
import { polygon } from '@reown/appkit/networks';

export const walletConnectProjectId = '0d4e4ceff6942a88bbb47bf3971dcf4a';

const ethersAdapter = new Ethers5Adapter();

export const appKit = createAppKit({
  adapters: [ethersAdapter],
  networks: [polygon],
  defaultNetwork: polygon,
  projectId: walletConnectProjectId,
  metadata: {
    name: 'HackChain',
    description: 'Blockchain-based NFT certification platform for cybersecurity education',
    url: 'https://www.hackchain.app',
    icons: ['https://www.hackchain.app/favicon.ico'],
  },
  features: {
    analytics: true,
    email: false,
    socials: false,
  },
});
