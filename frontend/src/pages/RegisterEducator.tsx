import { Link } from "react-router-dom";
import { ArrowLeft, Users, Award, GraduationCapIcon, ArrowDownNarrowWideIcon } from "lucide-react";
import { EducatorRegistrationForm } from "@/components/auth/educatorRegistrationForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BackgroundAnimation from "@/components/BackgroundAnimation";
import FloatingElements from "@/components/FloatingElements";
import hackChainLogo from "/images/logoHackchain.png";

export default function RegisterEducator() {
  return (
    <div className="min-h-screen relative overflow-x-hidden bg-background flex flex-col font-lato">
      {/* Background Animation */}
      <div className="absolute inset-0 z-0 bg-background" />
      <div className="absolute inset-0 z-10">
        <BackgroundAnimation />
        <FloatingElements />
      </div>

      {/* Page Content */}
      <div className="relative z-20 animate-in fade-in duration-700 flex flex-col flex-1">

        {/* Header */}
        <div className="z-30 w-full border-b border-white/10 bg-background/80 backdrop-blur mb-6 min-h-[56px]">
          <div className="flex items-center justify-between max-w-6xl mx-auto px-4 pt-6 pb-3">

            {/* Logo */}
            <div className="flex items-center gap-2 justify-start">
              <img
                src={hackChainLogo}
                alt="Hack Chain Logo"
                className="h-9 w-9 md:h-10 md:w-10 drop-shadow-lg"
              />
              <span className="text-xl md:text-2xl font-exo font-bold gradient-text drop-shadow-lg tracking-tight">
                HackChain
              </span>
            </div>

            {/* Back */}
            <Link to="/register" className="flex items-center gap-2 group">
              <span className="text-sm md:text-base font-lato font-medium text-slate-300 group-hover:text-blue-400 transition-colors">
                Back to Register
              </span>
              <ArrowLeft className="h-4 w-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
            </Link>

          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 container mx-auto px-4 pb-12 flex-1 flex items-center animate-in slide-in-from-bottom duration-700 delay-150">
          <div className="grid lg:grid-cols-2 gap-12 items-center w-full">

            {/* Left Side - Information */}
            <div className="space-y-8 animate-in slide-in-from-left duration-700 delay-300">

              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-exo font-bold text-white leading-tight">
                  Empower the Next
                  <br />
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Generation of Professionals
                  </span>
                </h1>

                <p className="text-lg md:text-lg text-slate-300 font-lato leading-relaxed">
                  Join as an educator and issue blockchain-verified certificates that
                  prove student achievements in any field - from technology and business to arts and sciences.
                </p>
              </div>


              {/* Features */}
              <div className="space-y-6">
                <div className="flex items-start gap-4 group p-6 glass rounded-xl border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg">
                    <ArrowDownNarrowWideIcon className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-exo font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      Educator Experience
                    </h3>
                    <p className="text-slate-300 font-lato mb-4">
                      Issue tamper-proof blockchain certificates and build trust with industry partners through verifiable credentials.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                        <span className="text-sm text-slate-400 font-lato">Issue blockchain-secured certificates</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                        <span className="text-sm text-slate-400 font-lato">Track student progress and achievements</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                        <span className="text-sm text-slate-400 font-lato">Build institutional trust with recruiters</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                        <span className="text-sm text-slate-400 font-lato">White-label customization available</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Benefits */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 glass rounded-lg border border-cyan-500/20 hover:border-cyan-500/30 transition-all duration-200">
                    <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <GraduationCapIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-exo font-semibold text-cyan-400">Issue Certificates</h4>
                      <p className="text-xs text-slate-400 font-lato">Blockchain-verified credentials</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 glass rounded-lg border border-cyan-500/20 hover:border-cyan-500/30 transition-all duration-200">
                    <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-exo font-semibold text-cyan-400">Manage Students</h4>
                      <p className="text-xs text-slate-400 font-lato">Centralized dashboard</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Call to action for existing users */}
              <div className="bg-slate-900/70 backdrop-blur-sm rounded-lg p-6 border border-blue-500/30 hover:border-blue-500/50 hover:bg-slate-900/85 transition-all duration-200">
                <p className="text-sm text-slate-300 font-lato mb-3">
                  Already have an educator account?
                </p>
                <Link to="/login">
                  <Button variant="outline" size="sm" className="hover:scale-105 transition-transform duration-200 border-blue-500 text-slate-300 hover:text-white hover:bg-blue-700 font-lato">
                    Sign In Instead
                  </Button>
                </Link>
              </div>

            </div>

            {/* Right Side - Registration Form */}
            <div className="flex justify-center animate-in slide-in-from-right duration-700 delay-500">
              <Card className="w-full max-w-md shadow-2xl hover:shadow-3xl transition-all duration-300 border border-blue-500/30 hover:border-blue-500/50 bg-gradient-to-br from-slate-900/95 via-blue-900/20 to-slate-900/95 backdrop-blur-xl rounded-2xl">
                <CardHeader className="space-y-1 text-center font-lato">
                  <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-exo font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Create Educator Account
                  </CardTitle>
                  <CardDescription className="text-slate-300 font-lato">
                    Register your institution to start issuing verified certificates
                  </CardDescription>
                </CardHeader>

                <CardContent className="font-lato text-slate-300">
                  <EducatorRegistrationForm />
                </CardContent>
              </Card>
            </div>

          </div>
        </div>

        {/* Footer */}
        <footer className="relative z-10 border-t border-blue-500/20 bg-slate-900/50 backdrop-blur animate-in slide-in-from-bottom duration-700 delay-700 mt-auto font-lato">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-slate-300 font-lato">
                © 2025 HackChain. Non-Fungible Talent.
              </p>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
