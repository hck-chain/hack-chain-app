import { Link } from "react-router-dom";
import { ArrowLeft, LogIn, Shield, Lock } from "lucide-react";
import { LoginForm } from "@/components/auth/loginForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BackgroundAnimation from "@/components/BackgroundAnimation";
import FloatingElements from "@/components/FloatingElements";
import hackChainLogo from "/images/logoHackchain.png";

export default function Login() {
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
            <Link to="/" className="flex items-center gap-2 group transition-all duration-300 hover:scale-105">
              <img
                src={hackChainLogo}
                alt="Hack Chain Logo"
                className="h-9 w-9 md:h-10 md:w-10 drop-shadow-lg transition-transform duration-300 group-hover:rotate-12"
              />
              <span className="text-xl md:text-2xl font-exo font-bold gradient-text drop-shadow-lg tracking-tight transition-all duration-300 group-hover:tracking-wide">
                HackChain
              </span>
            </Link>

            {/* Back Button */}
            <Link to="/" className="flex items-center gap-2 group">
              <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all duration-300 group-hover:-translate-x-1" />
              <span className="text-sm md:text-base font-lato font-medium text-slate-300 group-hover:text-purple-400 transition-colors duration-300">
                Back to Home
              </span>
            </Link>

          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 container mx-auto px-4 pb-12 flex-1 flex items-center animate-in slide-in-from-bottom duration-700 delay-150">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto w-full">

            {/* Left Side - Information */}
            <div className="space-y-8 animate-in slide-in-from-left duration-700 delay-300">

              {/* Welcome Text */}
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-exo font-bold text-white leading-tight">
                  Welcome Back to
                  <br />
                  <span className="bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
                    HackChain
                  </span>
                </h1>

                <p className="text-lg md:text-lg text-slate-300 font-lato leading-relaxed">
                  Access your dashboard and manage your blockchain-verified certificates,
                  track your achievements, and connect with the community.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4">

                <div className="flex items-start gap-4 group p-4 glass rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-exo font-bold text-purple-400 mb-1">Secure Access</h3>
                    <p className="text-sm text-slate-300 font-lato">
                      Your account is protected with industry-standard encryption
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group p-4 glass rounded-xl border border-violet-500/20 hover:border-violet-500/40 transition-all duration-300">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <Lock className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-exo font-bold text-violet-400 mb-1">Blockchain Verified</h3>
                    <p className="text-sm text-slate-300 font-lato">
                      All your certificates are immutably stored on the blockchain
                    </p>
                  </div>
                </div>

              </div>

              {/* New User CTA */}
              <div className="bg-slate-900/70 backdrop-blur-sm rounded-lg p-6 border border-purple-500/30 hover:border-purple-500/50 hover:bg-slate-900/85 transition-all duration-200">
                <p className="text-sm text-slate-300 font-lato mb-3">
                  New to Hack Chain?
                </p>
                <Link to="/register">
                  <Button variant="outline" size="sm" className="hover:scale-105 transition-transform duration-200 border-purple-500 text-slate-300 hover:text-white hover:bg-purple-700 font-lato">
                    Create an Account
                  </Button>
                </Link>
              </div>

            </div>

            {/* Right Side - Login Form */}
            <div className="flex justify-center animate-in slide-in-from-right duration-700 delay-500">
              <Card className="w-full max-w-md shadow-2xl hover:shadow-3xl transition-all duration-300 border border-purple-500/30 hover:border-purple-500/50 bg-gradient-to-br from-slate-900/95 via-purple-900/20 to-slate-900/95 backdrop-blur-xl rounded-2xl">

                <CardHeader className="flex flex-col items-center space-y-1 text-center font-lato">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-2xl font-exo font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
                      Sign In
                    </CardTitle>
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full flex items-center justify-center shadow-lg">
                      <LogIn className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <CardDescription className="text-slate-300 font-lato">
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>

                <CardContent className="p- pt-1 font-lato text-slate-300">
                  <LoginForm />
                </CardContent>

              </Card>
            </div>

          </div>
        </div>

        {/* Footer */}
        <footer className="relative z-10 border-t border-purple-500/20 bg-slate-900/50 backdrop-blur animate-in slide-in-from-bottom duration-700 delay-700 mt-auto font-lato">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-slate-300">
                © 2025 HackChain. Non-Fungible Talent.
              </p>

            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
