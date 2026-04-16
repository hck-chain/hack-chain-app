import { useState } from 'react';
import { ethers } from 'ethers';
import { useToast } from "@/components/ui/use-toast";
import { web3Service } from '@/utils/web3Service';
import { api } from '@/services/api';

export interface CertificateData {
  talentName: string;
  talentWallet: string;
  courseName: string;
  imageUri: string;
  professorName: string; 
  issueDate: string;
}

interface CertificateMetadataResponse {
  uri: string;
}

export const useCreateCertificate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createCertificate = async (data: CertificateData, professorWallet: string) => {
    setIsLoading(true);
    try {
      // 0. Validate Inputs
      if (!data.talentWallet || !ethers.utils.isAddress(data.talentWallet)) {
        throw new Error("Invalid talent wallet address");
      }

      // 1. Backend: Upload JSON metadata to Pinata
      const payload = {
        name: data.talentName,
        course: data.courseName,
        professor: data.professorName, 
        date: data.issueDate,          
        imageCID: data.imageUri.replace('ipfs://', '')
      };

      const result = await api.post<CertificateMetadataResponse>('/api/certificates', payload);
      const tokenUri = result.uri;

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
