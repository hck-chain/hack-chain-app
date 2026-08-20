import { useMemo, useState } from "react";
import { getActivePhase } from "@/utils/presale";
import CountdownHero from "@/components/presale/CountdownHero";
import AboutToken from "@/components/presale/AboutToken";
import PhaseTable from "@/components/presale/PhaseTable";
import Calculator from "@/components/presale/Calculator";
import PurchaseProcess from "@/components/presale/PurchaseProcess";
import WalletPanel from "@/components/presale/WalletPanel";
import ContributorsRegistry from "@/components/presale/ContributorsRegistry";
import Faq from "@/components/presale/Faq";
import Footer from "@/components/presale/Footer";

export default function PresalePage() {
  const [walletConnected, setWalletConnected] = useState(false);
  const activePhase = useMemo(() => getActivePhase(new Date()), []);

  const handleConnect = () => {
    // integración real: MetaMask / WalletConnect (F-07), instrumentación F-15
    setWalletConnected(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-200 antialiased">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <CountdownHero
          activePhase={activePhase}
          walletConnected={walletConnected}
          onConnect={handleConnect}
        />
        <AboutToken />
        <PhaseTable activePhase={activePhase} />
        <Calculator activePhase={activePhase} />
        <PurchaseProcess />
        <WalletPanel walletConnected={walletConnected} onConnect={handleConnect} />
        <ContributorsRegistry />
        <Faq />
        <Footer />
      </div>
    </div>
  );
}
