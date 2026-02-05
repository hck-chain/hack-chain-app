import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { web3Service } from "@/utils/web3Service";
import { ethers } from "ethers";

const API = import.meta.env.VITE_API_URL;

interface CertificateData {
  studentName: string;
  studentWallet: string;
  courseName: string;
  imageCID: string; // 👈 YA SUBIDA
}

export const useCreateCertificate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createCertificate = async (
    data: CertificateData,
    issuerWallet: string
  ) => {
    setIsLoading(true);

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

      if (!metaRes.ok) {
        throw new Error("Failed to upload metadata");
      }

      const metaData = await metaRes.json();
      const tokenUri = `ipfs://${metaData.cid}`;

      // 3️⃣ Mint NFT on-chain
      await web3Service.mintCertificateOnChain(
        data.studentWallet,
        data.studentName,
        data.courseName,
        tokenUri,
        issuerWallet
      );

      toast({
        title: "Certificate minted",
        description: "NFT successfully created 🎉",
      });

      return true;

    } catch (err: any) {
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
