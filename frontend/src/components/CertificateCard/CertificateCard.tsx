import React, { useRef, useMemo } from "react";
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
  name = "Talent Name",
  title = "Course Title",
  certificateType = "Certificate of Completion",
  issuer = "Issuer Name",
  issueDate = "Issue Date",
  logoUrl,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={wrapRef} className={`pc-card-wrapper ${className}`} style={{ position: "relative" }}>
      <section ref={cardRef} className="pc-card" style={{ position: "relative", overflow: "hidden" }}>
        <div className="pc-inside" style={{ position: "relative", width: "100%", height: "100%" }}>

          {/* Capas de efecto */}
          <div className="pc-shine" style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }} />
          <div className="pc-glare" style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }} />

          {/* CONTENIDO PRINCIPAL CON FLEXBOX FORZADO */}
          <div style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            padding: "40px",
            boxSizing: "border-box",
            textAlign: "left"
          }}>

            {/* HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "2px" }}>
                  {certificateType}
                </p>
                <GradientText text={title} fontSize={28} fontWeight={800} />
              </div>
              <img src={sealLogo} alt="Seal" style={{ width: "80px", height: "80px", objectFit: "contain" }} />
            </div>

            <hr style={{ width: "100%", border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", margin: "20px 0" }} />

            {/* BODY */}
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginTop: "20px" }}>
              <div>
                <p style={{ margin: "0 0 5px 0", fontSize: "10px", color: "#64748b", textTransform: "uppercase", fontWeight: "bold" }}>Awarded To</p>
                <GradientText text={name} fontSize={24} />
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: "0 0 5px 0", fontSize: "10px", color: "#64748b", textTransform: "uppercase", fontWeight: "bold" }}>Issue Date</p>
                <GradientText text={issueDate} fontSize={20} />
              </div>
            </div>

            {/* FOOTER - Empujado al fondo con margin-top: auto */}
            <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end", width: "100%" }}>
              <div>
                <p style={{ margin: "0 0 5px 0", fontSize: "10px", color: "#64748b", textTransform: "uppercase", fontWeight: "bold" }}>Issued By</p>
                <GradientText text={issuer} fontSize={22} />
              </div>
              <img
                src={logoUrl || hackChainLogo}
                alt="Logo"
                style={{ height: "50px", width: "auto", objectFit: "contain" }}
              />
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default CertificateCard;