import React, { useEffect, useRef, useCallback, useMemo } from "react";
import "./CertificateCard.css";
import GradientText from "./GradientText.tsx";

interface CertificateCardProps {
  iconUrl?: string;
  grainUrl?: string;
  behindGradient?: string;
  innerGradient?: string;
  showBehindGradient?: boolean;
  className?: string;
  enableTilt?: boolean;
  name?: string;
  title?: string;
  certificateType?: string;
  issuer?: string;
  issueDate?: string;
  logoUrl?: string;
}

const hackChainLogo = "/images/logoHackchain.png";
const sealLogo = "/images/certificateSeal.png";

const CertificateCardComponent: React.FC<CertificateCardProps> = ({
  showBehindGradient = true,
  className = "",
  enableTilt = true,
  name = "Talent Name",
  title = "Course Title",
  certificateType = "Certificate of Completion",
  issuer = "Issuer Name",
  issueDate = "Issue Date",
  logoUrl,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // ... (Aquí van tus funciones clamp, round, adjust y la lógica de tilt que ya tienes)
  // Las mantengo igual para no romper tu animación 3D.

  return (
    <div ref={wrapRef} className={`pc-card-wrapper ${className}`} style={{/* tus estilos de gradiente */}}>
      <section ref={cardRef} className="pc-card">
        <div className="pc-inside">
          <div className="pc-shine" />
          <div className="pc-glare" />
          
          {/* --- ESTA ES LA ESTRUCTURA QUE ARREGLA EL AMONTONAMIENTO --- */}
          <div className="pc-content relative z-10 flex flex-col h-full w-full overflow-hidden">
            
            {/* PARTE SUPERIOR (Header) */}
            <div className="relative flex justify-between items-start px-10 pt-10">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
                  {certificateType}
                </p>
                <div className="max-w-[320px]">
                  <GradientText text={title} fontSize={28} fontWeight={800} />
                </div>
              </div>
              <img src={sealLogo} alt="Seal" className="w-20 h-20 drop-shadow-2xl" />
            </div>

            <div className="px-10 py-2">
              <hr className="border-white/10" />
            </div>

            {/* PARTE MEDIA (Awarded To / Date) */}
            <div className="flex flex-col gap-8 px-10 py-6">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <p className="text-[10px] uppercase tracking-widest text-gray-600 font-bold mb-1">Awarded To</p>
                  <GradientText text={name} fontSize={24} fontWeight={700} />
                </div>
                <div className="flex flex-col text-right">
                  <p className="text-[10px] uppercase tracking-widest text-gray-600 font-bold mb-1">Issue Date</p>
                  <GradientText text={issueDate} fontSize={20} fontWeight={600} />
                </div>
              </div>
            </div>

            {/* PARTE INFERIOR (Footer / Issued By) */}
            <div className="mt-auto px-10 pb-10 flex justify-between items-end">
              <div className="flex flex-col">
                <p className="text-[10px] uppercase tracking-widest text-gray-600 font-bold mb-1">Issued By</p>
                <GradientText text={issuer} fontSize={22} fontWeight={700} />
              </div>
              <div className="flex items-center">
                <img 
                  src={logoUrl || hackChainLogo} 
                  alt="Issuer Logo" 
                  className="h-12 w-auto object-contain max-w-[150px]" 
                />
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default React.memo(CertificateCardComponent);