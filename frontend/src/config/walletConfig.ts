import { createAppKit } from '@reown/appkit';
import { Ethers5Adapter } from '@reown/appkit-adapter-ethers5';
import { polygon } from '@reown/appkit/networks';

export const walletConnectProjectId = '0d4e4ceff6942a88bbb47bf3971dcf4a';

const ethersAdapter = new Ethers5Adapter();

// Use the runtime origin for the dapp URL so the WalletConnect session
// metadata always matches the actual host the user is on (preview deploys,
// staging, www vs apex, etc.). MetaMask Mobile validates this match and its
// signing UI crashes ("TypeError: undefined is not a function — View: Root")
// when there's a mismatch or when the icon URL points to an unsupported
// format like .ico. Use a PNG so the dapp avatar renders cleanly.
const dappUrl = typeof window !== 'undefined'
  ? window.location.origin
  : 'https://www.hackchain.app';

const dappIcon = `${dappUrl}/images/logoHackchain.webp`;

export const appKit = createAppKit({
  adapters: [ethersAdapter],
  networks: [polygon],
  defaultNetwork: polygon,
  projectId: walletConnectProjectId,
  metadata: {
    name: 'HackChain',
    description: 'Blockchain-based NFT certification platform for cybersecurity education',
    url: dappUrl,
    icons: [dappIcon],
  },
  features: {
    analytics: true,
    email: false,
    socials: false,
  },
});
