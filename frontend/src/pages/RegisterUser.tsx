import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, User, Award, Users } from "lucide-react";
import { UserRegistrationForm } from "@/components/auth/userRegistrationForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BackgroundAnimation from "@/components/BackgroundAnimation";
import Footer from "@/components/Footer";
import { LanguageToggle } from "@/components/LanguageToggle";
import { FormCardParticles } from "@/components/animations/FormCardParticles";
import { useScrollReveal } from "@/hooks/useAnimeHooks";
import { useCardAnimation } from "@/hooks/useFormCardAnimation";
import hackChainLogo from "/images/logoHackchain.webp";

export function RegisterUser() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Animation refs
  const formCardRef = useRef<HTMLDivElement>(null);

  // Apply scroll reveal for left side elements
  useScrollReveal();

  // Apply card entrance animation
  useCardAnimation(formCardRef, { delay: 300 });

  // Auto-hide navbar logic
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <>
      <div className="fixed inset-0 -z-30 bg-background" />
      <div className="fixed inset-0 -z-20 pointer-events-none">
        <BackgroundAnimation />
      </div>
      <div className="min-h-screen relative overflow-x-hidden flex flex-col font-lato">

        {/* Page Content */}
        <div className="relative z-20 animate-in fade-in duration-700 flex flex-col flex-1">

          {/* Header */}
          <div className={`z-40 w-full border-b border-white/10 fixed top-0 left-0 right-0 bg-[#0B0B0F]/80 backdrop-blur transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`} style={{ minHeight: '56px' }}>
            <div className="flex items-center justify-between max-w-6xl mx-auto px-4 py-3 sm:py-4">

              {/* Logo */}
              <Link to="/" className="flex items-center gap-2 group">
                <img
                  src={hackChainLogo}
                  alt="HackChain Logo"
                  className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 drop-shadow-lg"
                />
                <span className="font-title text-xl sm:text-2xl font-bold gradient-text">
                  HackChain
                </span>
              </Link>

              {/* Controls */}
              <div className="flex items-center gap-2 sm:gap-4">
                <LanguageToggle />
                <Link to="/register" className="flex items-center gap-2 group">
                  <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all duration-300 group-hover:-translate-x-1" />
                  <span className="text-sm md:text-base font-lato font-medium text-slate-300 group-hover:text-purple-400 transition-colors duration-300">
                    {t('registerUser.back')}
                  </span>
                </Link>
              </div>

            </div>
          </div>

          {/* Main Content */}
          <div className="relative z-10 w-full max-w-6xl mx-auto px-4 pt-28 pb-12 flex-1 animate-in slide-in-from-bottom duration-700 delay-150">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 w-full">

              {/* Left Side — only visible on lg+ */}
              <div className="hidden lg:block space-y-8 reveal-group">

                {/* Welcome Text */}
                <div className="space-y-4 reveal-item">
                  <h1 className="text-4xl md:text-5xl font-exo font-bold text-white leading-tight">
                    {t('registerUser.title1')}
                    <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{t('registerUser.title2')}</span>
                  </h1>

                  <p className="text-[14px] text-gray-300 font-lato leading-relaxed">
                    {t('registerUser.desc')}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-6">
                  <div className="flex items-start gap-4 group p-6 glass rounded-xl border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 reveal-item">
                    <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-exo font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {t('registerUser.expTitle')}
                      </h3>
                      <p className="text-slate-300 font-lato mb-4">
                        {t('registerUser.expDesc')}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                          <span className="text-[13px] text-slate-400 font-lato">{t('registerUser.p1')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                          <span className="text-[13px] text-slate-400 font-lato">{t('registerUser.p2')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                          <span className="text-[13px] text-slate-400 font-lato">{t('registerUser.p3')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                          <span className="text-[13px] text-slate-400 font-lato">{t('registerUser.p4')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Benefits */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 reveal-item">
                  <div className="flex items-center gap-3 p-4 glass rounded-lg border border-purple-500/20 hover:border-purple-500/30 transition-all duration-200">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Award className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-exo font-semibold text-[#c026d3]">NFT Certificates</h4>
                      <p className="text-xs text-white/50 font-lato">Blockchain-verified credentials</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 glass rounded-lg border border-purple-500/20 hover:border-purple-500/30 transition-all duration-200">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-exo font-semibold text-[#c026d3]">Top Recruiters</h4>
                      <p className="text-xs text-white/50 font-lato">Direct access to companies</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Side - Registration Form - aligned with benefits section */}
              <div className="flex items-center lg:items-start w-full pt-8 lg:pt-12 lg:pl-8 xl:pl-12">
                <Card
                  ref={formCardRef}
                  className="w-full max-w-md shadow-2xl hover:shadow-3xl transition-all duration-300 glass border-purple-500/20 hover:border-purple-500/40 rounded-2xl relative overflow-hidden"
                >
                  {/* Floating Particles */}
                  <FormCardParticles
                    color="rgba(168, 85, 247, 0.15)"
                    shadowColor="rgba(168, 85, 247, 0.3)"
                    count={25}
                  />

                  <CardHeader className="space-y-1 text-center font-lato relative z-10">
                    <CardTitle className="text-[22px] font-exo font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {t('registerUser.formTitle')}
                    </CardTitle>
                    <CardDescription className="text-[13px] text-white/50 font-normal font-lato mb-6">
                      {t('registerUser.formDesc')}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="font-lato text-slate-300 relative z-10">
                    <UserRegistrationForm />
                  </CardContent>
                </Card>
              </div>

            </div>
          </div>

          {/* Footer */}
          <Footer />

        </div>
      </div>
    </>
  );
}
