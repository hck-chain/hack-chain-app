import Layout from '@/components/Layout';
import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CertificateCard from '@/components/CertificateCard/CertificateCard';
import html2canvas from 'html2canvas';
import { useCreateCertificate } from '@/hooks/useCreateCertificate';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Award, ChevronDown, Mail, Briefcase, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCertificatesByEducator } from '@/utils/web3Service';
import HackChainLogo from '@/../public/images/logoHackchain2.png'; // 🔹 Logo de HackChain
const API_BASE_URL = import.meta.env.VITE_API_URL;

interface Student {
  id: number;
  wallet_address: string;
  field_of_study: string;
  user: {
    id: number;
    name: string;
    wallet_address: string;
    email: string;
  };
}

const EducatorDashboard = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    certificateType: '',
    certificateTitle: '',
    studentName: '',
    studentWallet: '',
    issuer: '',
    issueDate: new Date().toISOString().split('T')[0],
    logo: '',
    imageUri: '',
  });

  const [wallet, setWallet] = useState<string>("");
  const [organizationName, setOrganizationName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [logoPreview, setLogoPreview] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const [certificatesIssued, setCertificatesIssued] = useState<number>(0);


  // Hook para crear certificado
  const { createCertificate, isLoading } = useCreateCertificate();
  const { toast } = useToast();

  // Verificar autenticación y obtener datos del usuario
  useEffect(() => {

    const loadProfile = async () => {
      try {
        const token = localStorage.getItem("authToken");

        if (!token) {
          console.error("No auth token found");
          return;
        }

        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        console.log("AUTH /me RESPONSE 👉", data);

        if (!res.ok) {
          console.error("Auth error:", data);
          return;
        }

        // data.user viene de ISSUERS
        // data.modelName === "issuer"
        setUserData({
          organization_name: data.user.organization_name,
          walletAddress: data.user.wallet_address,
          email: data.user.email ?? "No email registered",
          role: "Educator",
        });


        // Aquí no usamos userData, usamos directamente la wallet
        const certCount = await getCertificatesByEducator(data.user.wallet_address);
        console.log("Certificates fetched:", certCount);

        setCertificatesIssued(certCount); // <-- directo, es un número

      } catch (err) {
        console.error("Dashboard load error:", err);
      }
    };

    loadProfile();
    // Fetch Students
    const fetchStudents = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/students`);
        if (response.ok) {
          const data = await response.json();
          // The API returns { students: [...] } or just [...]? 
          // Based on file read: res.json({ students: ... })
          if (data.students) {
            setStudents(data.students);
          }
        }
      } catch (error) {
        console.error("Failed to fetch students", error);
        toast({
          title: "Error",
          description: "Failed to load student list.",
          variant: "destructive",
        });
      }
    };

    fetchStudents();

  }, [navigate, toast]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
    navigate('/login');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === 'logo' && e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        // Ideally upload image here to get a URI, or assume backend handles it. 
        // For now keeping local preview logic.
      };
      reader.readAsDataURL(file);
      setForm({ ...form, logo: URL.createObjectURL(file) });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleStudentChange = (walletAddress: string) => {
    const selectedStudent = students.find(s => s.user.wallet_address === walletAddress);
    if (selectedStudent) {
      setForm({
        ...form,
        studentWallet: selectedStudent.user.wallet_address,
        studentName: selectedStudent.user.name
      });
    }
  };

  const uploadCertificateImage = async (): Promise<string | null> => {
    const card = cardRef.current?.querySelector('.pc-card') as HTMLElement;
    if (!card) return null;

    const canvas = await html2canvas(card, {
      backgroundColor: "#0b0b0b",
      scale: 2,
      useCORS: true,
    });

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );

    if (!blob) return null;

    const formData = new FormData();
    formData.append("file", blob, "certificate.png");

    const res = await fetch(`${API_BASE_URL}/api/upload/image`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    return data.cid; // 
  };

  const handleCreateCertificate = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // Validar que el usuario esté autenticado y tenga wallet
    if (!userData?.walletAddress) {
      toast({
        title: "Error",
        description: "No wallet address found. Please login again.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    // Validar campos requeridos
    if (!form.certificateTitle || !form.studentName || !form.issuer || !form.studentWallet) {
      toast({
        title: "Error",
        description: "Please fill in all required fields, including selecting a student.",
        variant: "destructive",
      });
      return;
    }

    // Preparar datos para enviar al hook

    try {
      toast({
        title: "Uploading image",
        description: "Generating certificate image...",
      });

      const imageCID = await uploadCertificateImage();

      if (!imageCID) {
        throw new Error("Image upload failed");
      }


      const certificateData = {
        studentName: form.studentName,
        studentWallet: form.studentWallet,
        courseName: form.certificateTitle, // Using title as course name
        imageCID: imageCID,
      };

      // Enviar al hook logic
      const success = await createCertificate(certificateData, userData.walletAddress);

      if (success) {
        // Limpiar formulario después de crear
        setForm({
          certificateType: '',
          certificateTitle: '',
          studentName: '',
          studentWallet: '',
          issuer: '',
          issueDate: new Date().toISOString().split('T')[0],
          logo: '',
          imageUri: '',
        });
        setLogoPreview('');
      }

    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to create certificate",
        variant: "destructive",
      });

    }
  }

  const handleDownload = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const container = cardRef.current;
    if (!container) return;

    const card = (container.querySelector('.pc-card') as HTMLElement) || container;
    const shine = card.querySelector('.pc-shine') as HTMLElement | null;
    const glare = card.querySelector('.pc-glare') as HTMLElement | null;

    const prevShineDisplay = shine?.style.display;
    const prevGlareDisplay = glare?.style.display;
    if (shine) shine.style.display = 'none';
    if (glare) glare.style.display = 'none';
    card.classList.remove('active');

    try {
      const canvas = await html2canvas(card, {
        backgroundColor: '#0b0b0b',
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
      });
      const dataUrl = canvas.toDataURL('image/png');

      const link = document.createElement('a');
      const title = (typeof form.certificateTitle === 'string' && form.certificateTitle) || 'certificate';
      link.download = `${title}.png`;
      link.href = dataUrl;
      link.click();

      toast({
        title: "Downloaded!",
        description: "Certificate preview downloaded successfully.",
      });
    } catch (err) {
      console.error('Failed to generate image', err);
      toast({
        title: "Error",
        description: "Failed to download certificate preview.",
        variant: "destructive",
      });
    } finally {
      if (shine) shine.style.display = prevShineDisplay ?? '';
      if (glare) glare.style.display = prevGlareDisplay ?? '';
    }
  };

  if (!userData) {
    return null;
  }

  return (
    <Layout>
      {/* Container principal transparente para dejar ver el fondo global */}
      <div className="min-h-screen relative font-sans text-slate-200">

        <motion.main
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 px-6 md:px-12 pt-12 pb-20 max-w-[1600px] mx-auto"
        >

          {/* Header Section */}
          <header
            className="mb-28 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
          >
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                  Educator Dashboard
                </span>
              </h1>

              <p className="text-lg text-slate-400 font-light">
                Create and issue blockchain-verified credentials with ease.
              </p>
            </div>
            {/* Logo centrado */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <img src={HackChainLogo} alt="Logo" className="h-16 md:h-28" />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                >
                  <div className="flex flex-row items-baseline gap-1">
                    <span className="text-sm text-slate-400 font-medium">Welcome back,</span>
                    <span className="text-sm font-bold text-white">{userData.organization_name || "Educator"}</span>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </Button>
              </PopoverTrigger>

              <PopoverContent
                className="w-80 p-0 bg-slate-900/40 backdrop-blur-xl border-white/10 shadow-2xl"
                align="end"
                sideOffset={8}
              >
                <div className="p-6 space-y-4">
                  {/* Header with Avatar */}
                  <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                      <Award className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-white">{userData.organization_name || "My Organization"}</h3>
                      <p className="text-xs text-purple-400 font-medium">{userData.role || "Issuer"}</p>
                    </div>
                  </div>

                  {/* User Information */}
                  <div className="space-y-3">
                    {/* Email */}
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                      <Mail className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-1">Certificates Issued</p>
                        <p className="text-sm text-slate-200 truncate">{certificatesIssued > 0 ? certificatesIssued : "No certificates issued yet"}</p>
                      </div>
                    </div>

                    {/* Role */}
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                      <Briefcase className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-1">Role</p>
                        <p className="text-sm text-slate-200">Educator</p>
                      </div>
                    </div>

                    {/* Wallet */}
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                      <Wallet className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-1">Wallet Address</p>
                        <p className="text-sm text-slate-200 font-mono">
                          ••••{userData.walletAddress?.slice(-4) || "••••"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <div className="pt-4 border-t border-white/10">
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </header>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

            {/* Left Column: Form (Create) */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5 order-2 lg:order-1"
            >
              <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                {/* Internal decorative gradient */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">Details</h2>
                  <p className="text-slate-400 text-sm">Fill in the certificate information below.</p>
                </div>

                <form className="space-y-6">
                  <div className="space-y-4">
                    <div className="group/input">
                      <Label htmlFor="certificateTitle" className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1 block group-focus-within/input:text-purple-400 transition-colors">Certificate Title</Label>
                      <Input
                        id="certificateTitle"
                        name="certificateTitle"
                        value={form.certificateTitle}
                        onChange={handleChange}
                        placeholder="e.g. Master of Blockchain 2024"
                        className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl h-12 transition-all"
                      />
                    </div>

                    <div className="group/input">
                      <Label htmlFor="studentName" className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1 block group-focus-within/input:text-purple-400 transition-colors">Student Name</Label>
                      <Select onValueChange={handleStudentChange} value={form.studentWallet}>
                        <SelectTrigger className="w-full bg-black/20 border-white/10 text-white rounded-xl h-12">
                          <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10 text-white">
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.user.wallet_address}>
                              {student.user.name} ({student.user.wallet_address.slice(0, 6)}...{student.user.wallet_address.slice(-4)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-slate-500 mt-1 pl-1">
                        Selected Wallet: {form.studentWallet || "None"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="group/input">
                        <Label htmlFor="issuer" className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1 block group-focus-within/input:text-purple-400 transition-colors">Issuer</Label>
                        <Input
                          id="issuer"
                          name="issuer"
                          value={form.issuer}
                          onChange={handleChange}
                          placeholder="Organization"
                          className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl h-12 transition-all"
                        />
                      </div>
                      <div className="group/input">
                        <Label htmlFor="issueDate" className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1 block group-focus-within/input:text-purple-400 transition-colors">Date</Label>
                        <Input
                          id="issueDate"
                          name="issueDate"
                          type="date"
                          value={form.issueDate}
                          onChange={handleChange}
                          className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl h-12 transition-all [color-scheme:dark]"
                        />
                      </div>
                    </div>

                    <div className="group/input">
                      <Label htmlFor="certificateType" className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1 block group-focus-within/input:text-purple-400 transition-colors">Type / Subtitle</Label>
                      <Input
                        id="certificateType"
                        name="certificateType"
                        value={form.certificateType}
                        onChange={handleChange}
                        placeholder="e.g. Certificate of Excellence"
                        className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl h-12 transition-all"
                      />
                    </div>

                    <div className="group/input">
                      <Label htmlFor="logo" className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1 block group-focus-within/input:text-purple-400 transition-colors">Logo Upload</Label>
                      <div className="relative">
                        <Input
                          id="logo"
                          name="logo"
                          type="file"
                          accept="image/*"
                          onChange={handleChange}
                          className="bg-black/20 border-white/10 file:bg-white/10 file:text-white file:border-0 file:rounded-lg file:px-4 file:mr-4 hover:file:bg-white/20 text-slate-400 cursor-pointer rounded-xl pt-2 pb-2 h-auto transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 flex gap-4">
                    <Button
                      type="button"
                      onClick={handleCreateCertificate}
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold h-12 rounded-xl shadow-lg shadow-purple-900/40 border border-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</span>
                      ) : 'Create Certificate'}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleDownload}
                      variant="outline"
                      className="px-6 h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all hover:scale-[1.02]"
                    >
                      Preview
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>

            {/* Right Column: Preview (Large) */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="lg:col-span-7 order-1 lg:order-2 sticky top-8"
            >
              <div className="bg-slate-900/20 backdrop-blur-sm border border-white/5 rounded-[40px] p-8 md:p-8 flex flex-col items-center justify-center min-h-[600px] relative">
                {/* "Preview" Label */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                  <span className="text-xs font-medium tracking-widest uppercase text-slate-400">Live Preview</span>
                </div>

                <div className="transform transition-transform hover:scale-[1.02] duration-500" ref={cardRef}>
                  <CertificateCard
                    certificateType={form.certificateType || "Certificate of Completion"}
                    name={form.studentName || 'Student Name'}
                    title={form.certificateTitle || 'Certificate Title'}
                    issuer={form.issuer || 'Issuer Name'}
                    issueDate={form.issueDate || 'Issue Date'}
                    logoUrl={form.logo || ''}
                    enableTilt={true}
                    innerGradient={""}
                  />
                </div>

                <div className="mt-3 text-center max-w-md">
                  <h3 className="text-white font-semibold text-lg mb-1">Review before Minting</h3>
                  <p className="text-slate-500 text-sm">
                    This is exactly how the NFT metadata will appear. Once minted, the details are immutable on the blockchain.
                  </p>
                </div>
              </div>
            </motion.div>

          </div>
        </motion.main>
      </div>
    </Layout>
  );
};

export default EducatorDashboard;