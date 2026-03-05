import { useEffect } from "react";
import { Link } from "react-router-dom";
import { User, Award, Building, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BackgroundAnimation from "@/components/BackgroundAnimation";
import FloatingElements from "@/components/FloatingElements";
import hackChainLogo from "/images/logoHackchain.png";
import Footer from "@/components/Footer";

const RegisterLanding = () => {
  useEffect(() => {
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, 0);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden bg-[#0B0B0F] font-lato">
      {/* Background animations */}
      <BackgroundAnimation />
      <FloatingElements />

      {/* Header */}
      <div className="z-30 w-full border-b border-white/10 sticky top-0 bg-[#0B0B0F]/80 backdrop-blur" style={{ minHeight: '56px' }}>
        <div className="flex items-center justify-between max-w-6xl mx-auto px-4 pt-6 pb-3">
          <div className="flex items-center gap-2">
            <img
              src={hackChainLogo}
              alt="HackChain Logo"
              className="h-12 w-12 md:h-14 md:w-14 drop-shadow-lg"
            />
            <span className="text-2xl md:text-3xl font-exo font-bold gradient-text drop-shadow-lg tracking-tight">
              HackChain
            </span>
          </div>
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-sm md:text-base font-lato text-gray-400 group-hover:text-blue-500 transition-colors">
              Back to Home
            </span>
            <ArrowLeft className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="animate-in fade-in duration-700 slide-in-from-bottom">
        <div className="z-10 flex flex-col items-start max-w-4xl mx-auto px-4 mt-8 mb-8">
          <h1 className="text-4xl md:text-5xl font-exo font-bold text-white leading-tight mb-6">
            Join the Future of
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Professional Certification
            </span>
          </h1>

          <p className="mt-3 text-base md:text-lg text-gray-300 max-w-2xl">
            Choose your role and start your journey with blockchain-verified certificates in any professional field or skill area.
          </p>
        </div>

        {/* Role Cards */}
        <div className="z-10 w-full flex flex-col flex-1 max-w-6xl px-4 space-y-12 mx-auto">
          <div className="grid md:grid-cols-3 gap-8">

            {/* Student Card */}
            <Card className="relative overflow-hidden glass glass-hover border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 neon-glow-subtle">
              <CardHeader className="space-y-4 text-center">
                <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl font-exo gradient-text">Student</CardTitle>
                  <CardDescription className="text-gray-300 font-lato">
                    Learn any skill and earn blockchain-verified certificates
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3 text-gray-300 font-lato text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                    <span>Earn NFT certificates</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                    <span>Build verifiable skill portfolio</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                    <span>Connect with recruiters</span>
                  </div>
                </div>
                <Link to="/register/user" className="block">
                  <Button className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-500/90 hover:to-pink-500/90 neon-glow transition-all duration-300 hover:scale-105 font-lato">
                    Join as Student
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Educator Card */}
            <Card className="relative overflow-hidden glass glass-hover border-blue-500/30 hover:border-cyan-500/50 transition-all duration-300 neon-glow-subtle">
              <CardHeader className="space-y-4 text-center">
                <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl font-exo bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Educator</CardTitle>
                  <CardDescription className="text-gray-300 font-lato">
                    Issue verified certificates and build your teaching reputation
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3 text-gray-300 font-lato text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                    <span>Issue NFT certificates</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                    <span>Track student progress</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                    <span>Verified educator status</span>
                  </div>
                </div>
                <Link to="/register/issuer" className="block">
                  <Button
                    className="w-full gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-500/90 hover:to-cyan-500/90 neon-glow transition-all duration-300 hover:scale-105 font-lato"
                  >
                    Join as Educator
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>

              </CardContent>
            </Card>

            {/* Recruiter Card */}
            <Card className="relative overflow-hidden glass glass-hover border-green-500/30 hover:border-emerald-500/50 transition-all duration-300 neon-glow-subtle">
              <CardHeader className="space-y-4 text-center">
                <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Building className="h-8 w-8 text-white" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl font-exo bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Recruiter</CardTitle>
                  <CardDescription className="text-gray-300 font-lato">
                    Find and verify top talent across all industries with confidence
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3 text-gray-300 font-lato text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
                    <span>Search verified talent</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
                    <span>Verify skill certificates</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
                    <span>Advanced filtering tools</span>
                  </div>
                </div>
                <Link to="/register/recruiter" className="block">
                  <Button
                    className="w-full gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-500/90 hover:to-emerald-500/90 neon-glow transition-all duration-300 hover:scale-105 font-lato"
                  >
                    Join as Recruiter
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

          </div>

          {/* Already have account */}
          <div className="flex flex-col gap-6">
            <div className="text-center glass rounded-xl p-6 border border-primary/20 mt-4 mb-6">
              <p className="text-gray-300 mb-4 font-lato">
                Already have an account?
              </p>
              <Link to="/login">
                <Button variant="outline" className="glass glass-hover font-lato">
                  Sign In Instead
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="w-full border-t border-white/10 bg-[#0B0B0F]">
        <Footer />
      </div>
    </div>
  );
};

export default RegisterLanding;
