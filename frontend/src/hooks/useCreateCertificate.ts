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

  const createCertificate = async (data: CertificateData, issuerWallet: string) => {
    setIsLoading(true);

    // 🕵️ DEBUG inicial: ¿Qué recibimos del Dashboard?
    console.log("🚀 [DEBUG] Datos recibidos en el Hook:", {
      student: data.studentWallet,
      issuer: issuerWallet
    });

    try {
      // 1️⃣ Validate wallet
      if (!ethers.utils.isAddress(data.studentWallet)) {
        throw new Error("Invalid student wallet");
      }

      // 2️⃣ Upload metadata (JSON)
      const today = new Date().toISOString().split("T")[0];
      const metaRes = await fetch(`${API}/api/certificates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.studentName,
          course: data.courseName,
          professor: issuerWallet,
          date: today,
          imageCID: data.imageCID,
        }),
      });

      if (!metaRes.ok) throw new Error("Failed to upload metadata");

      const metaData = await metaRes.json();
      const tokenUri = `ipfs://${metaData.cid}`;

      // 3️⃣ Mint NFT on-chain
      console.log("🏗️ [DEBUG] Iniciando minado On-Chain...");
      const { success, txHash, tokenId } = await web3Service.mintCertificateOnChain(
        data.studentWallet,
        data.studentName,
        data.courseName,
        tokenUri,
        issuerWallet
      );

      if (!success) throw new Error("Mint failed");

      console.log("✅ [DEBUG] Minado exitoso:", { txHash, tokenId });

      // 5️⃣ Guardar en la base de datos (EL PUNTO CRÍTICO)
      const payloadDB = {
        student_wallet_address: data.studentWallet,
        issuer_wallet_address: issuerWallet, // 👈 VIGILA ESTO EN LA CONSOLA
        title: data.courseName,
        description: "HackChain Tokenized Certificate",
        certificate_hash: data.imageCID,
        blockchain_tx_hash: txHash,
        token_id: tokenId,
        issue_date: today,
      };

      console.log("📡 [DEBUG] Intentando guardar en DB. Payload:", payloadDB);

      const dbRes = await fetch(`${API}/api/certificates/database`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadDB),
      });

      if (!dbRes.ok) {
        // 🚨 DEBUG: Si falla, capturamos la respuesta del backend
        const errorDetail = await dbRes.json();
        console.error("❌ [DEBUG] Error detallado del Backend:", errorDetail);

        // Si el backend envió información de depuración, la mostramos
        if (errorDetail.debug_info) {
          console.table(errorDetail.debug_info.encontradas_en_db);
        }

        throw new Error(errorDetail.error || "Failed to save in DB");
      }

      toast({ title: "Certificate minted", description: "NFT successfully created!" });
      return true;

    } catch (err: any) {
      console.error("🔥 [DEBUG] Catch del Hook:", err);
      toast({
        title: "Error",
        description: err.message || "Mint failed",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { createCertificate, isLoading };
};