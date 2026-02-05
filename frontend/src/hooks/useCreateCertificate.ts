import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { web3Service } from "@/utils/web3Service";
import { ethers } from "ethers";

const API = import.meta.env.VITE_API_URL;

export const useCreateCertificate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createCertificate = async (data: any, organizationName: string) => {
    setIsLoading(true);

    try {
      // 1️⃣ Obtener Identidad Real del Emisor
      const token = localStorage.getItem("authToken");
      const authRes = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!authRes.ok) throw new Error("No se pudo verificar la identidad del emisor.");
      const authData = await authRes.json();

      // EXTREMA VIGILANCIA AQUÍ:
      const realIssuerWallet = authData.user.wallet_address;

      // 2️⃣ Subir a Pinata
      const metaRes = await fetch(`${API}/api/certificates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.studentName,
          course: data.courseName,
          professor: organizationName, // Aquí sí va el nombre legible
          date: new Date().toISOString().split("T")[0],
          imageCID: data.imageCID,
        }),
      });

      if (!metaRes.ok) throw new Error("Error al subir metadatos");
      const metaData = await metaRes.json();

      // 3️⃣ Minado On-Chain
      const { success, txHash, tokenId } = await web3Service.mintCertificateOnChain(
        data.studentWallet,
        data.studentName,
        data.courseName,
        `ipfs://${metaData.cid}`,
        organizationName
      );

      if (!success) throw new Error("El minado falló en la blockchain");

      // 4️⃣ Sincronización con DB (EL PUNTO DEL ERROR)
      const payloadDB = {
        student_wallet_address: data.studentWallet,
        issuer_wallet_address: realIssuerWallet, // <--- REVISA QUE ESTO NO SEA 'organizationName'
        title: data.courseName,
        description: "HackChain Tokenized Certificate",
        certificate_hash: data.imageCID,
        blockchain_tx_hash: txHash,
        token_id: tokenId,
        issue_date: new Date().toISOString().split("T")[0],
      };

      // 🔥 LOG CRÍTICO: Mira tu consola antes de que falle
      console.log("🚀 ENVIANDO A /api/certificates/database:", payloadDB);

      const dbRes = await fetch(`${API}/api/certificates/database`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadDB),
      });

      const dbData = await dbRes.json();

      if (!dbRes.ok) {
        throw new Error(dbData.details || dbData.error || "Error al guardar en DB");
      }

      toast({ title: "¡Éxito!", description: "Certificado creado y guardado." });
      return true;

    } catch (err: any) {
      console.error("🔥 Error detallado:", err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { createCertificate, isLoading };
};