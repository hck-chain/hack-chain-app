import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { web3Service } from '@/utils/web3Service';
const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface CertificateData {
  studentName: string;
  studentWallet: string;
  courseName: string;
  imageUri: string;
}

export const useCreateCertificate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createCertificate = async (data: CertificateData, professorWallet: string) => {
    setIsLoading(true);
    try {
      console.log("Starting certificate creation process...");

      // 0. Validate Inputs
      if (!data.studentWallet || !ethers.utils.isAddress(data.studentWallet)) {
        throw new Error("Invalid student wallet address");
      }

      // 1. Backend: Validate Student & Pin Metadata to IPFS
      const payload = {
        walletStudent: data.studentWallet,
        nameStudent: data.studentName,
        professor: professorWallet,
        courseName: data.courseName,
        imageUri: data.imageUri
      };

      const response = await fetch(`${API_BASE_URL}/api/issuers/mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload metadata to IPFS');
      }

      const result = await response.json();
      const tokenUri = result.tokenUri;
      console.log("Metadata pinned to IPFS:", tokenUri);

      // 2. Blockchain: Mint Certificate
      const mintSuccess = await web3Service.mintCertificateOnChain(
        data.studentWallet,
        data.studentName,
        data.courseName,
        tokenUri,
        professorWallet
      );

      if (!mintSuccess) {
        throw new Error("User rejected transaction or blockchain error occurred.");
      }

      toast({
        title: "Success!",
        description: "Certificate minted and sent to student's wallet.",
      });

      return true;

    } catch (error: any) {
      console.error('Certificate creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create certificate",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createCertificate,
    isLoading
  };
};

// Helper for address validation if ethers is not globally available in scope, 
// though we use simple check or assume implicit via web3Service. 
// Adding minimal polyfill for validation if needed, or import from ethers.
import { ethers } from 'ethers';
