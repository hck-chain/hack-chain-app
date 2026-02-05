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
      // 1️⃣ Obtener Identidad Real del Emisor (0x...)
      const token = localStorage.getItem("authToken");
      const authRes = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!authRes.ok) throw new Error("No se pudo verificar la identidad del emisor.");
      const authData = await authRes.json();
      const realIssuerWallet = authData.user.wallet_address; // El 0xc97d...

      // 2️⃣ Subir Metadatos a Pinata
      const metaRes = await fetch(`${API}/api/certificates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.studentName,
          course: data.courseName,
          professor: organizationName, // Nombre para el NFT
          date: new Date().toISOString().split("T")[0],
          imageCID: data.imageCID,
        }),
      });

      if (!metaRes.ok) throw new Error("Error al subir metadatos a IPFS");
      const metaData = await metaRes.json();
      const tokenUri = `ipfs://${metaData.cid}`;

      // 3️⃣ Minado en Blockchain (Llamando a tu nueva versión limpia)
      // Ahora solo pasamos 4 argumentos, tal como definiste en web3Service
      const { success, txHash, tokenId } = await web3Service.mintCertificateOnChain(
        data.studentWallet,
        data.studentName,
        data.courseName,
        tokenUri
      );

      if (!success) throw new Error("El minado en la red falló.");

      // 4️⃣ Sincronización con Base de Datos
      const payloadDB = {
        student_wallet_address: data.studentWallet.toLowerCase().trim(),
        issuer_wallet_address: realIssuerWallet.toLowerCase().trim(), // ✅ HEX REAL
        title: data.courseName,
        description: "HackChain Tokenized Certificate",
        certificate_hash: data.imageCID,
        blockchain_tx_hash: txHash,
        token_id: tokenId,
        issue_date: new Date().toISOString().split("T")[0],
      };

      console.log("🚀 Sincronizando con DB:", payloadDB);

      const dbRes = await fetch(`${API}/api/certificates/database`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadDB),
      });

      if (!dbRes.ok) {
        const errorDetail = await dbRes.json();
        throw new Error(errorDetail.details || "Error al guardar en la base de datos.");
      }

      toast({ title: "¡Éxito!", description: "Certificado emitido y registrado en HackChain." });
      return true;

    } catch (err: any) {
      console.error("🔥 Error en el flujo:", err);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { createCertificate, isLoading };
};