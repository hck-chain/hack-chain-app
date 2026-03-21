import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Users, Award, GraduationCapIcon, ArrowDownNarrowWideIcon } from "lucide-react";
import { EducatorRegistrationForm } from "@/components/auth/educatorRegistrationForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BackgroundAnimation from "@/components/BackgroundAnimation";
import FloatingElements from "@/components/FloatingElements";
import Footer from "@/components/Footer";
import { LanguageToggle } from "@/components/LanguageToggle";
import hackChainLogo from "/images/logoHackchain.png";

export default function RegisterEducator() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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
    <div className="min-h-screen relative overflow-x-hidden bg-background flex flex-col font-lato">
      {/* Background Animation */}
      <div className="fixed inset-0 z-0 bg-background" />
      <div className="fixed inset-0 z-10 pointer-events-none">
        <BackgroundAnimation />
        <FloatingElements />
      </div>

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
                  {t('registerEducator.back')}
                </span>
              </Link>
            </div>

          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 pt-28 pb-12 flex-1 flex items-start animate-in slide-in-from-bottom duration-700 delay-150">
          <div className="grid lg:grid-cols-2 gap-12 items-start w-full">

            {/* Left Side — only visible on lg+ */}
            <div className="hidden lg:block space-y-8 animate-in slide-in-from-left duration-700 delay-300">

              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-exo font-bold text-white leading-tight">
                  {t('registerEducator.title1')}
                  <br />
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    {t('registerEducator.title2')}
                  </span>
                </h1>

                <p className="text-lg md:text-lg text-gray-300 font-lato leading-relaxed">
                  {t('registerEducator.desc')}
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
                      {t('registerEducator.expTitle')}
                    </h3>
                    <p className="text-slate-300 font-lato mb-4">
                      {t('registerEducator.expDesc')}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                        <span className="text-sm text-slate-400 font-lato">{t('registerEducator.p1')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                        <span className="text-sm text-slate-400 font-lato">{t('registerEducator.p2')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                        <span className="text-sm text-slate-400 font-lato">{t('registerEducator.p3')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                        <span className="text-sm text-slate-400 font-lato">{t('registerEducator.p4')}</span>
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
                      <h4 className="font-exo font-semibold text-cyan-400">{t('registerEducator.b1Title')}</h4>
                      <p className="text-xs text-slate-400 font-lato">{t('registerEducator.b1Desc')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 glass rounded-lg border border-cyan-500/20 hover:border-cyan-500/30 transition-all duration-200">
                    <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-exo font-semibold text-cyan-400">{t('registerEducator.b2Title')}</h4>
                      <p className="text-xs text-slate-400 font-lato">{t('registerEducator.b2Desc')}</p>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Right Side - Registration Form */}
            <div className="flex flex-col items-center lg:items-end w-full animate-in slide-in-from-right duration-700 delay-500 mt-4 lg:mt-0">
              <Card className="w-full max-w-md shadow-2xl hover:shadow-3xl transition-all duration-300 glass border-blue-500/20 hover:border-blue-500/40 rounded-2xl">
                <CardHeader className="space-y-1 text-center font-lato">
                  <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-exo font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    {t('registerEducator.formTitle')}
                  </CardTitle>
                  <CardDescription className="text-slate-300 font-lato">
                    {t('registerEducator.formDesc')}
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
        <div className="w-full border-t border-white/10 bg-[#0B0B0F] mt-auto">
          <Footer />
        </div>

      </div>
    </div>
  );
}
