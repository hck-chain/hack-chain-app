import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { web3Service } from '@/utils/web3Service';

export interface CertificateData {
  talentName: string;
  talentWallet: string;
  courseName: string;
  imageUri: string;
  professorName: string; 
  issueDate: string;
}

export const useCreateCertificate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createCertificate = async (data: CertificateData, professorWallet: string) => {
    setIsLoading(true);
    try {
      console.log("Starting certificate creation process...");

      // 0. Validate Inputs
      if (!data.talentWallet || !ethers.utils.isAddress(data.talentWallet)) {
        throw new Error("Invalid talent wallet address");
      }

      // 1. Backend: Llamar al endpoint que REALMENTE sube el JSON a Pinata
      const payload = {
        name: data.talentName,
        course: data.courseName,
        professor: data.professorName, 
        date: data.issueDate,          
        imageCID: data.imageUri.replace('ipfs://', '') // Limpiamos el prefijo si lo tiene
      };

      const token = localStorage.getItem('authToken');
      if (!token) return false;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/certificates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Error al subir metadata a Pinata');
      }

      const result = await response.json();
      const tokenUri = result.uri; // Este ahora sí es el IPFS del JSON (con los traits)
      console.log("JSON Metadata en IPFS:", tokenUri);

      // 2. Blockchain: Mint Certificate
      const mintSuccess = await web3Service.mintCertificateOnChain(
        data.talentWallet,
        data.talentName,
        data.courseName,
        tokenUri,
        professorWallet
      );

      if (!mintSuccess) {
        throw new Error("User rejected transaction or blockchain error occurred.");
      }

      toast({
        title: "Success!",
        description: "Certificate minted and sent to talent's wallet.",
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
