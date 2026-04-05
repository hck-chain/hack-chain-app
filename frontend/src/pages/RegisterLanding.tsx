import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, Award, Building, ArrowRight, ArrowLeft, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BackgroundAnimation from "@/components/BackgroundAnimation";
import FloatingElements from "@/components/FloatingElements";
import hackChainLogo from "/images/logoHackchain.png";
import Footer from "@/components/Footer";
import { LanguageToggle } from "@/components/LanguageToggle";

const RegisterLanding = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Auto-hide navbar logic
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
        if (isMenuOpen) setIsMenuOpen(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isMenuOpen]);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  useEffect(() => {
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, 0);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden bg-[#0B0B0F] font-lato">
      {/* Background animations */}
      <div className="fixed inset-0 z-0 bg-[#0B0B0F]" />
      <div className="fixed inset-0 z-10 pointer-events-none">
        <BackgroundAnimation />
        <FloatingElements />
      </div>

      {/* Header */}
      <div className={`z-40 w-full border-b border-white/10 fixed top-0 left-0 right-0 bg-[#0B0B0F]/80 backdrop-blur transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`} style={{ minHeight: '56px' }}>
        <div className="flex items-center justify-between max-w-6xl mx-auto px-4 py-3 sm:py-4">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={hackChainLogo}
              alt="HackChain Logo"
              className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 drop-shadow-lg"
            />
            <span className="font-title text-xl sm:text-2xl font-bold gradient-text">
              HackChain
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageToggle />
            <Link to="/" className="flex items-center gap-2 group">
              <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all duration-300 group-hover:-translate-x-1" />
              <span className="text-sm md:text-base font-lato font-medium text-slate-300 group-hover:text-purple-400 transition-colors duration-300">
                {t('login.backHome')}
              </span>
            </Link>
          </div>

          {/* Mobile Controls */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageToggle />
            <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-300 p-1">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <div
          className={`md:hidden overflow-y-auto w-full bg-[#0B0B0F] border-b border-white/10 transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-[calc(100vh-5rem)] opacity-100 py-4' : 'max-h-0 opacity-0 pointer-events-none py-0'
          }`}
        >
          <div className="flex flex-col px-6 space-y-4">
            <Link 
              to="/" 
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 group text-lg py-2"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all duration-300 group-hover:-translate-x-1" />
              <span className="font-lato text-slate-300 group-hover:text-purple-400 transition-colors duration-300">{t('login.backHome')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative z-20 animate-in fade-in duration-700 slide-in-from-bottom pt-24">
        <div className="z-10 flex flex-col items-center max-w-4xl mx-auto px-4 mt-8 mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-exo font-bold text-white leading-tight mb-4 sm:mb-6 tracking-tighter drop-shadow-md">
            {t('registerLanding.title1')}
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
              {t('registerLanding.title2')}
            </span>
          </h1>

          <p className="mt-3 text-base md:text-lg text-gray-300 max-w-2xl">
            {t('registerLanding.description')}
          </p>
        </div>

        {/* Role Cards */}
        <div className="z-10 w-full flex flex-col flex-1 max-w-6xl px-4 space-y-6 sm:space-y-12 mx-auto pb-10">
          <div className="grid md:grid-cols-3 gap-8">

            {/* Talent Card */}
            <Card className="relative overflow-hidden glass glass-hover border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 neon-glow-subtle">
              <CardHeader className="space-y-4 text-center">
                <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl font-exo gradient-text">{t('registerLanding.talent.title')}</CardTitle>
                  <CardDescription className="text-gray-300 font-lato">
                    {t('registerLanding.talent.desc')}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3 text-gray-300 font-lato text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                    <span>{t('registerLanding.talent.p1')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                    <span>{t('registerLanding.talent.p2')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                    <span>{t('registerLanding.talent.p3')}</span>
                  </div>
                </div>
                <Link to="/register/user" className="block">
                  <Button className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-500/90 hover:to-pink-500/90 neon-glow transition-all duration-300 hover:scale-105 font-lato">
                    {t('registerLanding.talent.btn')}
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
                  <CardTitle className="text-xl font-exo bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{t('registerLanding.educator.title')}</CardTitle>
                  <CardDescription className="text-gray-300 font-lato">
                    {t('registerLanding.educator.desc')}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3 text-gray-300 font-lato text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                    <span>{t('registerLanding.educator.p1')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                    <span>{t('registerLanding.educator.p2')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                    <span>{t('registerLanding.educator.p3')}</span>
                  </div>
                </div>
                <Link to="/register/issuer" className="block">
                  <Button
                    className="w-full gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-500/90 hover:to-cyan-500/90 neon-glow transition-all duration-300 hover:scale-105 font-lato"
                  >
                    {t('registerLanding.educator.btn')}
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
                  <CardTitle className="text-xl font-exo bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">{t('registerLanding.recruiter.title')}</CardTitle>
                  <CardDescription className="text-gray-300 font-lato">
                    {t('registerLanding.recruiter.desc')}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3 text-gray-300 font-lato text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
                    <span>{t('registerLanding.recruiter.p1')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
                    <span>{t('registerLanding.recruiter.p2')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
                    <span>{t('registerLanding.recruiter.p3')}</span>
                  </div>
                </div>
                <Link to="/register/recruiter" className="block">
                  <Button
                    className="w-full gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-500/90 hover:to-emerald-500/90 neon-glow transition-all duration-300 hover:scale-105 font-lato"
                  >
                    {t('registerLanding.recruiter.btn')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

          </div>

          {/* Already have account */}
          <div className="mt-8 text-center pb-8 border-t border-white/10 pt-8 max-w-2xl mx-auto w-full">
            <p className="text-gray-400 font-lato text-base sm:text-lg">
              {t('registerLanding.alreadyHave')}{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-bold underline-offset-4 hover:underline transition-all">
                {t('registerLanding.signInInstead')}
              </Link>
            </p>
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
