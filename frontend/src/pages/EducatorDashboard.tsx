import Navbar from '@/components/Navbar';
import Layout from '@/components/Layout';
import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import CertificateCard from '@/components/CertificateCard/CertificateCard';
import html2canvas from 'html2canvas';
import { useCreateCertificate } from '@/hooks/useCreateCertificate';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Award } from 'lucide-react';

const EducatorDashboard = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    certificateType: '',
    certificateTitle: '',
    studentName: '',
    issuer: '',
    issueDate: new Date().toISOString().split('T')[0],
    logo: '',
  });
  const [logoPreview, setLogoPreview] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Hook para crear certificado
  const { createCertificate, isLoading, error, success } = useCreateCertificate();
  const { toast } = useToast();

  // Verificar autenticación y obtener datos del usuario
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');
    
    if (!userStr || !token) {
      toast({
        title: "Authentication Required",
        description: "Please login to access this page.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    const user = JSON.parse(userStr);
    
    // Verificar que sea un Issuer
    if (user.role !== 'Issuer') {
      toast({
        title: "Access Denied",
        description: "This page is only for educators.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    setUserData(user);
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
      };
      reader.readAsDataURL(file);
      setForm({ ...form, logo: URL.createObjectURL(file) });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
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
    if (!form.certificateTitle || !form.studentName || !form.issuer) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Preparar datos para enviar al backend
    const certificateData = {
      issuer_wallet_address: userData.walletAddress,
      title: form.certificateTitle,
      description: `${form.certificateType || 'Certificate'} issued to ${form.studentName} by ${form.issuer}`,
      issue_date: form.issueDate,
    };

    // Enviar al backend
    const result = await createCertificate(certificateData);

    if (result) {
      toast({
        title: "Success!",
        description: `Certificate created successfully with ID: ${result.certificate.id}`,
      });
      
      // Limpiar formulario después de crear
      setForm({
        certificateType: '',
        certificateTitle: '',
        studentName: '',
        issuer: '',
        issueDate: new Date().toISOString().split('T')[0],
        logo: '',
      });
      setLogoPreview('');
    } else {
      toast({
        title: "Error",
        description: error || "Failed to create certificate",
        variant: "destructive",
      });
    }
  };

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
    return null; // O un loading spinner
  }

  return (
    <Layout>
      <Navbar />
      <main className="min-h-screen flex flex-col px-4 md:px-12 pt-8 pb-12">
        {/* Header con info del educador */}
        <div className="w-full max-w-7xl mx-auto mb-8">
          <div className="flex justify-between items-center bg-gradient-to-r from-purple-900/30 to-violet-900/30 border border-purple-500/20 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full flex items-center justify-center">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Educator Dashboard</h1>
                <p className="text-sm text-slate-300">
                  Welcome back, {userData.name || userData.email}
                </p>
              </div>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex flex-col md:flex-row items-start justify-center gap-8 max-w-7xl mx-auto w-full">
          {/* NFT Preview */}
          <section className="w-full md:w-1/2 flex justify-center">
            <div ref={cardRef}>
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
          </section>

          {/* Form */}
          <section className="w-full md:w-1/2 flex justify-center">
            <form className="bg-gray-900 border border-white/20 rounded-xl shadow-lg p-6 w-full max-w-md space-y-5">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-2">Create New Certificate</h2>
                <p className="text-sm text-slate-400">
                  Fill in the details to create a blockchain-verified certificate
                </p>
              </div>

              <div>
                <Label htmlFor="certificateTitle" className="text-slate-200">
                  Certificate Title <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="certificateTitle"
                  name="certificateTitle"
                  value={form.certificateTitle}
                  onChange={handleChange}
                  placeholder="e.g., Blockchain Development Course"
                  autoComplete="off"
                  className="mt-1 bg-slate-800/50 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="studentName" className="text-slate-200">
                  Student Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="studentName"
                  name="studentName"
                  value={form.studentName}
                  onChange={handleChange}
                  placeholder="Enter student's full name"
                  autoComplete="off"
                  className="mt-1 bg-slate-800/50 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="issuer" className="text-slate-200">
                  Issuer/Institution <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="issuer"
                  name="issuer"
                  value={form.issuer}
                  onChange={handleChange}
                  placeholder="Enter institution name"
                  autoComplete="off"
                  className="mt-1 bg-slate-800/50 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="certificateType" className="text-slate-200">
                  Certificate Type (Optional)
                </Label>
                <Input
                  id="certificateType"
                  name="certificateType"
                  value={form.certificateType}
                  onChange={handleChange}
                  placeholder="e.g., Certificate of Completion"
                  autoComplete="off"
                  className="mt-1 bg-slate-800/50 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="logo" className="text-slate-200">
                  Institution Logo (Optional)
                </Label>
                <Input
                  id="logo"
                  name="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleChange}
                  className="mt-1 bg-slate-800/50 border-slate-700 text-white"
                />
                {logoPreview && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-400 mb-1">Logo Preview:</p>
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="h-16 w-auto object-contain bg-white/5 rounded p-2"
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 space-y-3">
                <Button 
                  type="button" 
                  onClick={handleCreateCertificate} 
                  className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Certificate...' : 'Create Certificate'}
                </Button>
                <Button 
                  type="button" 
                  onClick={handleDownload} 
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Download Preview
                </Button>
              </div>
              
              {success && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm text-green-400 text-center">
                    ✓ Certificate created successfully!
                  </p>
                </div>
              )}
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400 text-center">
                    {error}
                  </p>
                </div>
              )}
            </form>
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default EducatorDashboard;
