import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { RecruiterRegistrationForm } from "@/components/auth/recruiterRegistrationForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BackgroundAnimation from "@/components/BackgroundAnimation";
import Footer from "@/components/Footer";
import { LanguageToggle } from "@/components/LanguageToggle";
import { FormCardParticles } from "@/components/animations/FormCardParticles";
import { useScrollReveal } from "@/hooks/useAnimeHooks";
import { useCardAnimation } from "@/hooks/useFormCardAnimation";
import hackChainLogo from "/images/logoHackchain.webp";

export function RegisterRecruiter() {
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
    <div className="min-h-screen relative overflow-x-hidden bg-background flex flex-col font-lato">
      {/* Background */}
      <div className="fixed inset-0 z-0 bg-background" />
      <div className="fixed inset-0 z-10 pointer-events-none">
        <BackgroundAnimation />
      </div>

      {/* Content */}
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
                  <span className="text-sm md:text-base font-lato font-medium text-slate-300 group-hover:text-green-400 transition-colors duration-300">
                  {t('registerRecruiter.back')}
                </span>
              </Link>
            </div>

          </div>
        </div>

        {/* Main */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 pt-28 pb-12 flex-1 flex items-start animate-in slide-in-from-bottom duration-700 delay-150">
          <div className="grid lg:grid-cols-2 gap-12 items-start w-full">

            {/* Left - Info — only visible on lg+ */}
            <div className="hidden lg:block space-y-8 reveal-group">

              {/* Header Text */}
              <div className="space-y-4 reveal-item">
                <h1 className="text-4xl md:text-5xl font-exo font-bold text-white leading-tight">
                  {t('registerRecruiter.title1')}
                  <br />
                  <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    {t('registerRecruiter.title2')}
                  </span>
                </h1>
                <p className="text-[14px] text-gray-300 font-lato leading-relaxed">
                  {t('registerRecruiter.desc')}
                </p>
              </div>

              {/* Features */}
              <div className="space-y-6">
                <div className="flex items-start gap-4 group p-6 glass rounded-xl border border-green-500/30 hover:border-green-500/50 transition-all duration-300 reveal-item">
                  <div className="flex-shrink-0 w-20 h-20 bg-green-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-[0_0_15px_rgba(34,197,94,0.3)] group-hover:shadow-[0_0_22px_rgba(34,197,94,0.5)]">
                    <img src="/icons/recruiterExperience.avif" alt="Recruiter Experience" className="h-14 w-14 object-contain drop-shadow-md" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-exo font-bold mb-2 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                      {t('registerRecruiter.expTitle')}
                    </h3>
                    <p className="text-slate-300 font-lato mb-4">
                      {t('registerRecruiter.expDesc')}
                    </p>
                    <div className="space-y-2">
                      {[
                        t('registerRecruiter.p1'),
                        t('registerRecruiter.p2'),
                        t('registerRecruiter.p3'),
                        t('registerRecruiter.p4')
                      ].map((text, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                          <span className="text-[13px] text-slate-400 font-lato">{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Additional Benefits */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 reveal-item">
                  <div className="flex items-center gap-3 p-4 glass rounded-lg border border-green-500/20 hover:border-green-500/30 transition-all duration-200">
                    <div className="w-12 h-12 flex-shrink-0 bg-green-400 rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                      <img src="/icons/lupa.avif" alt="Find Top Talent" className="h-8 w-8 object-contain drop-shadow-sm" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    </div>
                    <div>
                      <h4 className="font-exo font-semibold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">{t('registerRecruiter.b1Title')}</h4>
                      <p className="text-xs text-slate-400 font-lato">{t('registerRecruiter.b1Desc')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 glass rounded-lg border border-green-500/20 hover:border-green-500/30 transition-all duration-200">
                    <div className="w-12 h-12 flex-shrink-0 bg-green-400 rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                      <img src="/icons/check.avif" alt="Verified Talent" className="h-8 w-8 object-contain drop-shadow-sm" />
                    </div>
                    <div>
                      <h4 className="font-exo font-semibold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">{t('registerRecruiter.b2Title')}</h4>
                      <p className="text-xs text-slate-400 font-lato">{t('registerRecruiter.b2Desc')}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right - Form */}
            <div className="flex flex-col items-center lg:items-end w-full animate-in slide-in-from-right duration-700 delay-500 mt-4 lg:mt-0">
              <Card
                ref={formCardRef}
                className="w-full max-w-md shadow-2xl hover:shadow-3xl transition-all duration-300 glass border-green-500/20 hover:border-green-500/40 rounded-2xl relative overflow-hidden"
              >
                {/* Floating Particles - Green/Emerald theme */}
                <FormCardParticles
                  color="rgba(34, 197, 94, 0.15)"
                  shadowColor="rgba(34, 197, 94, 0.3)"
                  count={25}
                />

                <CardHeader className="space-y-1 text-center font-lato relative z-10">
                  <CardTitle className="text-[22px] font-exo font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    {t('registerRecruiter.formTitle')}
                  </CardTitle>
                  <CardDescription className="text-[13px] text-white/50 font-normal font-lato mb-6">
                    {t('registerRecruiter.formDesc')}
                  </CardDescription>
                </CardHeader>

                <CardContent className="font-lato text-slate-300 relative z-10">
                  <RecruiterRegistrationForm />
                </CardContent>
              </Card>
            </div>

          </div>
        </div>

        {/* Footer */}
        <Footer />

      </div>
    </div>
  );
}
