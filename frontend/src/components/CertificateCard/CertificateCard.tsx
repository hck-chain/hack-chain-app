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
  backgroundUrl?: string;
}

const hackChainLogo = "/images/logoHackchain.png";
const sealLogo = "/images/certificateSeal.png";

const DEFAULT_BEHIND_GRADIENT = "radial-gradient(farthest-side circle at var(--pointer-x) var(--pointer-y),hsla(266,100%,90%,var(--card-opacity)) 4%,hsla(266,50%,80%,calc(var(--card-opacity)*0.75)) 10%,hsla(266,25%,70%,calc(var(--card-opacity)*0.5)) 50%,hsla(266,0%,60%,0) 100%),radial-gradient(35% 52% at 55% 20%,#00ffaac4 0%,#073aff00 100%),radial-gradient(100% 100% at 50% 50%,#00c1ffff 1%,#073aff00 76%),conic-gradient(from 124deg at 50% 50%,#c137ffff 0%,#07c6ffff 40%,#07c6ffff 60%,#c137ffff 100%)";
const DEFAULT_INNER_GRADIENT = "linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)";

const clamp = (value: number, min = 0, max = 100) => Math.min(Math.max(value, min), max);
const round = (value: number) => parseFloat(value.toFixed(3));
const adjust = (v: number, fMin: number, fMax: number, tMin: number, tMax: number) => round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));
const easeInOutCubic = (x: number) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

const CertificateCardComponent: React.FC<CertificateCardProps> = ({
  behindGradient, innerGradient, showBehindGradient = true, className = "", enableTilt = true,
  name = "Talent Name", title = "Course Title", certificateType = "Certificate of Completion",
  issuer = "Issuer Name", issueDate = "Issue Date", logoUrl, iconUrl, grainUrl
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // --- Lógica de Animación (Simplificada para el ejemplo) ---
  const animationHandlers = useMemo(() => {
    if (!enableTilt) return null;
    let rafId: number | null = null;
    return {
      updateCardTransform: (offsetX: number, offsetY: number, card: HTMLElement, wrap: HTMLElement) => {
        const percentX = clamp((100 / card.clientWidth) * offsetX);
        const percentY = clamp((100 / card.clientHeight) * offsetY);
        wrap.style.setProperty("--pointer-x", `${percentX}%`);
        wrap.style.setProperty("--pointer-y", `${percentY}%`);
        wrap.style.setProperty("--rotate-x", `${round(-((percentX - 50) / 5))}deg`);
        wrap.style.setProperty("--rotate-y", `${round((percentY - 50) / 4)}deg`);
      },
      cancelAnimation: () => rafId && cancelAnimationFrame(rafId)
    };
  }, [enableTilt]);

  useEffect(() => {
    const card = cardRef.current;
    const wrap = wrapRef.current;
    if (!card || !wrap || !animationHandlers) return;

    const move = (e: PointerEvent) => {
      const rect = card.getBoundingClientRect();
      animationHandlers.updateCardTransform(e.clientX - rect.left, e.clientY - rect.top, card, wrap);
    };

    card.addEventListener("pointermove", move);
    card.addEventListener("pointerenter", () => { card.classList.add("active"); wrap.classList.add("active"); });
    card.addEventListener("pointerleave", () => { card.classList.remove("active"); wrap.classList.remove("active"); });

    return () => card.removeEventListener("pointermove", move);
  }, [animationHandlers]);

  const cardStyle = useMemo(() => ({
    "--behind-gradient": showBehindGradient ? (behindGradient ?? DEFAULT_BEHIND_GRADIENT) : "none",
    "--inner-gradient": innerGradient ?? DEFAULT_INNER_GRADIENT,
  } as React.CSSProperties), [showBehindGradient, behindGradient, innerGradient]);

  return (
    <div ref={wrapRef} className={`pc-card-wrapper ${className}`} style={cardStyle}>
      <section ref={cardRef} className="pc-card">
        <div className="pc-inside">
          <div className="pc-shine" />
          <div className="pc-glare" />

          {/* Contenido con Flexbox para evitar superposición */}
          <div className="pc-content relative z-10 flex flex-col h-full">

            {/* 1. HEADER */}
            <div className="relative flex justify-between px-10 pt-10 items-start">
              <div className="flex flex-col max-w-[70%]">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">{certificateType}</p>
                <GradientText text={title} fontSize={26} fontWeight={800} />
              </div>
              <img src={sealLogo} alt="Seal" className="w-20 h-20 drop-shadow-xl" />
            </div>

            <hr className="mx-10 my-4 border-white/10" />

            {/* 2. BODY (flex-grow hace que este espacio empuje al footer hacia abajo) */}
            <div className="flex flex-col gap-8 px-10 py-4 flex-grow">
              <div className="flex justify-between">
                <div>
                  <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Awarded To</p>
                  <GradientText text={name} fontSize={22} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Issue Date</p>
                  <GradientText text={issueDate} fontSize={22} />
                </div>
              </div>

              {/* 3. FOOTER (siempre al fondo gracias a mt-auto) */}
              <div className="flex justify-between items-end mt-auto mb-6">
                <div>
                  <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Issued By</p>
                  <GradientText text={issuer} fontSize={20} />
                </div>
                <img src={logoUrl || hackChainLogo} alt="Logo" className="h-12 w-auto object-contain" />
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default React.memo(CertificateCardComponent);