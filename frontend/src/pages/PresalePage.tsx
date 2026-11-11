import { useMemo } from "react";
import { getActivePhase } from "@/utils/presale";
import { usePresaleWallet } from "@/hooks/usePresaleWallet";
import CountdownHero from "@/components/presale/CountdownHero";
import AboutToken from "@/components/presale/AboutToken";
import PhaseTable from "@/components/presale/PhaseTable";
import Calculator from "@/components/presale/Calculator";
import PurchaseProcess from "@/components/presale/PurchaseProcess";
import WalletPanel from "@/components/presale/WalletPanel";
import ContributorsRegistry from "@/components/presale/ContributorsRegistry";
import Faq from "@/components/presale/Faq";
import Footer from "@/components/presale/Footer";
import Layout from "@/components/Layout";
import Navbar from "@/components/Navbar";

export default function PresalePage() {
  // Una sola instancia del estado de cartera para toda la pagina: dos hooks
  // vivos serian dos maquinas de estado compitiendo por el mismo modal.
  const wallet = usePresaleWallet();
  const activePhase = useMemo(() => getActivePhase(new Date()), []);

  return (
    <Layout>
      <Navbar />
      <main className="pt-28 sm:pt-32 pb-24 relative overflow-hidden">
        {/* Ambient glow — sin superficie, solo luz */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-purple-500/[0.06] rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6">
          <CountdownHero activePhase={activePhase} wallet={wallet} />
          <AboutToken />
          <PhaseTable activePhase={activePhase} />
          <Calculator activePhase={activePhase} />
          <PurchaseProcess activePhase={activePhase} wallet={wallet} />
          <WalletPanel wallet={wallet} />
          <ContributorsRegistry />
          <Faq />
          <Footer />
        </div>
      </main>
    </Layout>
  );
}
