import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useCreateCertificate } from "@/hooks/useCreateCertificate";

const API = import.meta.env.VITE_API_URL;

const EducatorDashboard = () => {
  const { toast } = useToast();
  const { createCertificate, isLoading } = useCreateCertificate();

  const [form, setForm] = useState({
    studentName: "",
    studentWallet: "",
    courseName: "",
    issuerWallet: "", // 👈 Agregado para el educador
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // 🔹 Handle text inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔹 Handle certificate image
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // 🔹 Submit certificate
  const handleSubmit = async () => {
    try {
      if (!imageFile) {
        throw new Error("Please select a certificate image");
      }

      // 1️⃣ Upload image to IPFS (Pinata)
      const imgForm = new FormData();
      imgForm.append("file", imageFile);

      const imgRes = await fetch(`${API}/api/upload/image`, {
        method: "POST",
        body: imgForm,
      });

      if (!imgRes.ok) {
        throw new Error("Failed to upload image to IPFS");
      }

      const imgData = await imgRes.json();
      const imageCID = imgData.cid;

      // 2️⃣ Create certificate (metadata + mint)
      await createCertificate({
        studentName: form.studentName,
        studentWallet: form.studentWallet,
        courseName: form.courseName,
        imageCID,
      }, form.issuerWallet);

      toast({
        title: "Certificate created",
        description: "NFT successfully minted 🎉",
      });

      // Reset form
      setForm({
        studentName: "",
        studentWallet: "",
        courseName: "",
        issuerWallet: "",
      });
      setImageFile(null);
      setPreview(null);

    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto mt-10">
        <Card>
          <CardHeader>
            <CardTitle>Issue NFT Certificate</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <Label>Student Name</Label>
              <Input
                name="studentName"
                value={form.studentName}
                onChange={handleChange}
                placeholder="John Doe"
              />
            </div>

            <div>
              <Label>Student Wallet Address</Label>
              <Input
                name="studentWallet"
                value={form.studentWallet}
                onChange={handleChange}
                placeholder="0x..."
              />
            </div>

            <div>
              <Label>Course Name</Label>
              <Input
                name="courseName"
                value={form.courseName}
                onChange={handleChange}
                placeholder="Introduction to Blockchain"
              />
            </div>

            <div>
              <Label>Issuer Wallet Address (Your Wallet)</Label>
              <Input
                name="issuerWallet"
                value={form.issuerWallet}
                onChange={handleChange}
                placeholder="0x..."
              />
            </div>

            <div>
              <Label>Certificate Image</Label>
              <Input type="file" accept="image/*" onChange={handleImage} />
            </div>

            {preview && (
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={preview}
                  alt="Certificate preview"
                  className="w-full object-cover"
                />
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Minting..." : "Create Certificate"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EducatorDashboard;