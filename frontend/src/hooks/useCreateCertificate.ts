import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { web3Service } from "@/utils/web3Service";
import { ethers } from "ethers";

const API = import.meta.env.VITE_API_URL;

interface CertificateData {
  studentName: string;
  studentWallet: string;
  courseName: string;
  imageCID: string;
}

export const useCreateCertificate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createCertificate = async (data: CertificateData, organizationName: string) => {
    setIsLoading(true);

    try {
      // 1️⃣ Obtener la Wallet Real (Resolución de Identidad)
      // En lugar de confiar en el string "redlinux", preguntamos al servidor quién es el usuario actual
      const token = localStorage.getItem("authToken");
      const authRes = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!authRes.ok) throw new Error("No se pudo verificar la identidad del emisor.");

      const authData = await authRes.json();
      const realIssuerWallet = authData.user.wallet_address; // Aquí obtenemos el 0xc97d...

      console.log(`🔍 [RESOLVER] Nombre: ${organizationName} -> Wallet: ${realIssuerWallet}`);

      // 2️⃣ Validar wallet del estudiante
      if (!ethers.utils.isAddress(data.studentWallet)) {
        throw new Error("Invalid student wallet");
      }

      const today = new Date().toISOString().split("T")[0];

      // 3️⃣ Subir Metadatos (Pinata)
      // Aquí podemos seguir enviando el nombre para que el NFT se vea bien
      const metaRes = await fetch(`${API}/api/certificates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.studentName,
          course: data.courseName,
          professor: organizationName, // Nombre legible para el NFT
          date: today,
          imageCID: data.imageCID,
        }),
      });

      if (!metaRes.ok) throw new Error("Failed to upload metadata");
      const metaData = await metaRes.json();
      const tokenUri = `ipfs://${metaData.cid}`;

      // 4️⃣ Minar NFT On-Chain
      // Usamos la wallet real para el minado si el contrato lo requiere, 
      // o el nombre si es para visualización.
      const { success, txHash, tokenId } = await web3Service.mintCertificateOnChain(
        data.studentWallet,
        data.studentName,
        data.courseName,
        tokenUri,
        organizationName
      );

      if (!success) throw new Error("Mint failed");

      // 5️⃣ Guardar en Base de Datos (PUNTO CRÍTICO)
      // Usamos 'realIssuerWallet' (el 0xc97d...) para que la DB haga match
      const payloadDB = {
        student_wallet_address: data.studentWallet,
        issuer_wallet_address: realIssuerWallet,
        title: data.courseName,
        description: "HackChain Tokenized Certificate",
        certificate_hash: data.imageCID,
        blockchain_tx_hash: txHash,
        token_id: tokenId,
        issue_date: today,
      };

      const dbRes = await fetch(`${API}/api/certificates/database`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadDB),
      });

      if (!dbRes.ok) {
        const errorDetail = await dbRes.json();
        throw new Error(errorDetail.error || "Failed to save in DB");
      }

      toast({ title: "Success", description: "Certificate minted and saved in DB!" });
      return true;

    } catch (err: any) {
      console.error("🔥 Error en el Hook:", err);
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