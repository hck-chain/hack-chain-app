import React, { useRef } from "react";
import "./CertificateCard.css";
import GradientText from "./GradientText.tsx";

interface CertificateCardProps {
  name?: string;
  title?: string;
  certificateType?: string;
  issuer?: string;
  issueDate?: string;
  logoUrl?: string;
  className?: string;
  enableTilt?: boolean;
  innerGradient?: string;
}

const hackChainLogo = "/images/logoHackchain.png";
const sealLogo = "/images/certificateSeal.png";

const CertificateCard: React.FC<CertificateCardProps> = ({
  className = "",
  name = "Emmanuel Pastor",
  title = "Introducción a HackChain",
  certificateType = "Curso",
  issuer = "Red Linuxera",
  issueDate = "2026-04-17",
  logoUrl,
  enableTilt = false,
  innerGradient = "none",
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableTilt || !cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const px = (x / rect.width) * 100;
    const py = (y / rect.height) * 100;

    const ox = (px - 50) / 2;
    const oy = (py - 50) / 2;

    const dx = px - 50;
    const dy = py - 50;
    const d = Math.sqrt(dx * dx + dy * dy);

    card.style.setProperty("--pointer-x", `${px}%`);
    card.style.setProperty("--pointer-y", `${py}%`);
    card.style.setProperty("--pointer-from-center", `${d / 50}`);
    card.style.setProperty("--pointer-from-top", `${py / 100}`);
    card.style.setProperty("--pointer-from-left", `${px / 100}`);
    card.style.setProperty("--rotate-x", `${ox}deg`);
    card.style.setProperty("--rotate-y", `${-oy}deg`);
    card.style.setProperty("--background-x", `${px}%`);
    card.style.setProperty("--background-y", `${py}%`);
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    card.style.setProperty("--rotate-x", `0deg`);
    card.style.setProperty("--rotate-y", `0deg`);
    card.style.setProperty("--pointer-from-center", `0`);
    card.style.setProperty("--card-opacity", `0`);
  };

  const handleMouseEnter = () => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    card.style.setProperty("--card-opacity", `1`);
  };

  // Estilo base para los labels grises
  const labelStyle: React.CSSProperties = {
    margin: "0 0 4px 0",
    fontSize: "10px",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "1.5px",
    fontWeight: "800",
    display: "block",
    position: "relative",
    zIndex: 11
  };

  return (
    <div
      ref={wrapRef}
      className={`pc-card-wrapper ${className}`}
      style={{ position: "relative" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      <section
        ref={cardRef}
        className="pc-card"
        style={{
          position: "relative",
          overflow: "hidden",
          "--inner-gradient": innerGradient,
        } as React.CSSProperties}
      >
        <div className="pc-inside" style={{ position: "relative", width: "100%", height: "100%" }}>

          <div className="pc-shine" style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }} />
          <div className="pc-glare" style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }} />

          <div style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            padding: "50px",
            boxSizing: "border-box"
          }}>

            {/* --- HEADER --- */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <p style={labelStyle}>{certificateType}</p>
                <GradientText text={title} fontSize={34} fontWeight={800} />
              </div>
              <img src={sealLogo} alt="Seal" style={{ width: "90px", height: "90px", objectFit: "contain" }} />
            </div>

            <hr style={{ width: "100%", border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", margin: "10px 0" }} />

            {/* --- BODY (AWARDED TO & DATE) --- */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "30px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <p style={labelStyle}>Awarded To</p>
                <GradientText text={name} fontSize={30} fontWeight={700} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", textAlign: "right" }}>
                <p style={labelStyle}>Issue Date</p>
                <GradientText text={issueDate} fontSize={22} fontWeight={600} />
              </div>
            </div>

            {/* --- FOOTER (ISSUED BY & LOGO) --- */}
            <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <p style={labelStyle}>Issued By</p>
                <GradientText text={issuer} fontSize={24} fontWeight={700} />
              </div>
              <div style={{ background: "rgba(255,255,255,0.05)", padding: "10px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
                <img
                  src={logoUrl || hackChainLogo}
                  alt="Logo"
                  style={{ height: "60px", width: "auto", objectFit: "contain" }}
                />
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default CertificateCard;