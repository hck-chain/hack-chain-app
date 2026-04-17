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
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

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
    <div ref={wrapRef} className={`pc-card-wrapper ${className}`} style={{ position: "relative" }}>
      <section ref={cardRef} className="pc-card" style={{ position: "relative", overflow: "hidden" }}>
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