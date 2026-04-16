import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, ArrowLeft, Menu, X } from "lucide-react";
import { ROLE_ICONS } from "@/config/roles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BackgroundAnimation from "@/components/BackgroundAnimation";
import hackChainLogo from "/images/logoHackchain.png";
import Footer from "@/components/Footer";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useScrollReveal, useHoverInteractions } from "@/hooks/useAnimeHooks";

const RegisterLanding = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  useScrollReveal();
  const { handleIconHover, handleIconLeave } = useHoverInteractions();

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
    <>
      <div className="fixed inset-0 -z-30 bg-[#0B0B0F]" />
      <div className="fixed inset-0 -z-20 pointer-events-none">
        <BackgroundAnimation />
      </div>
      <div className="relative z-0 min-h-screen flex flex-col overflow-x-hidden font-lato pt-16">

      {/* Header */}
      <div className={`z-40 w-full border-b border-white/10 fixed top-0 left-0 right-0 bg-[#0B0B0F]/80 backdrop-blur transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`} style={{ minHeight: '56px' }}>
        <div className="flex items-center justify-between max-w-6xl mx-auto px-4 py-3 sm:py-4">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={hackChainLogo}
              alt="HackChain Logo"
              className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 drop-shadow-lg"
            />
            <span className="font-title text-xl sm:text-2xl font-bold gradient-text tracking-wide">
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
              <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:text-white transition-all duration-300 group-hover:-translate-x-1" />
              <span className="font-lato text-slate-300 group-hover:text-white transition-colors duration-300">{t('login.backHome')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative z-20 animate-in fade-in duration-700 slide-in-from-bottom pt-10 sm:pt-16">
        <div className="z-10 flex flex-col items-center max-w-4xl mx-auto px-4 mt-4 mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-exo font-bold text-white leading-tight mb-4 sm:mb-6 tracking-tighter drop-shadow-md">
            {t('registerLanding.title1')}
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
              {t('registerLanding.title2')}
            </span>
          </h1>

          <p className="mt-3 text-base sm:text-xl text-muted-foreground font-body max-w-2xl leading-relaxed">
            {t('registerLanding.description')}
          </p>
        </div>

        {/* Role Cards */}
        <div className="z-10 w-full flex flex-col flex-1 max-w-6xl px-4 space-y-6 sm:space-y-12 mx-auto pb-10 reveal-group">
          <div className="grid md:grid-cols-3 gap-8">

            {/* Talent Card */}
            <Card 
              className="role-card talent-card reveal-item opacity-0 relative overflow-hidden bg-black/40 backdrop-blur-md border border-pink-500/30 md:border-white/10 md:hover:border-pink-500/50 transition-all duration-500 group"
              onMouseEnter={handleIconHover}
              onMouseLeave={handleIconLeave}
            >
              <CardHeader className="space-y-4 text-center">
                <div 
                  className="w-14 h-14 mx-auto rounded-lg border border-pink-500/30 md:border-white/10 bg-pink-500/10 md:bg-white/5 flex items-center justify-center transition-colors duration-300 md:group-hover:bg-pink-500/10 md:group-hover:border-pink-500/30 breathing-icon"
                >
                  <ROLE_ICONS.talent className="h-6 w-6 text-pink-400 md:text-gray-400 md:group-hover:text-pink-400 transition-colors duration-300" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl font-exo bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(236,72,153,0.5)] md:drop-shadow-none md:group-hover:drop-shadow-[0_0_10px_rgba(236,72,153,0.5)] transition-all duration-300">
                    {t('registerLanding.talent.title')}
                  </CardTitle>
                  <CardDescription className="text-slate-200 md:text-gray-400 md:group-hover:text-slate-200 transition-colors duration-300 font-lato font-light">
                    {t('registerLanding.talent.desc')}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3 text-slate-100 md:text-gray-400 md:group-hover:text-slate-100 transition-colors duration-300 font-lato text-sm font-light">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-1 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)] md:shadow-none md:group-hover:shadow-[0_0_8px_rgba(236,72,153,0.8)] transition-shadow duration-300"></div>
                    <span>{t('registerLanding.talent.p1')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-1 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)] md:shadow-none md:group-hover:shadow-[0_0_8px_rgba(236,72,153,0.8)] transition-shadow duration-300"></div>
                    <span>{t('registerLanding.talent.p2')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-1 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)] md:shadow-none md:group-hover:shadow-[0_0_8px_rgba(236,72,153,0.8)] transition-shadow duration-300"></div>
                    <span>{t('registerLanding.talent.p3')}</span>
                  </div>
                </div>
                <Link to="/register/user" className="block pt-2">
                  <Button className="w-full gap-2 bg-pink-500/10 md:bg-transparent border border-pink-500/50 md:border-white/10 md:hover:border-pink-500 md:hover:bg-pink-500/10 text-white transition-all duration-300 font-lato group/btn">
                    {t('registerLanding.talent.btn')}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Educator Card */}
            <Card 
              className="role-card educator-card reveal-item opacity-0 relative overflow-hidden bg-black/40 backdrop-blur-md border border-blue-500/30 md:border-white/10 md:hover:border-blue-500/50 transition-all duration-500 group"
              onMouseEnter={handleIconHover}
              onMouseLeave={handleIconLeave}
            >
              <CardHeader className="space-y-4 text-center">
                <div 
                  className="w-14 h-14 mx-auto rounded-lg border border-blue-500/30 md:border-white/10 bg-blue-500/10 md:bg-white/5 flex items-center justify-center transition-colors duration-300 md:group-hover:bg-blue-500/10 md:group-hover:border-blue-500/30 breathing-icon"
                >
                  <ROLE_ICONS.educator className="h-6 w-6 text-blue-400 md:text-gray-400 md:group-hover:text-blue-400 transition-colors duration-300" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl font-exo bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] md:drop-shadow-none md:group-hover:drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-300">
                    {t('registerLanding.educator.title')}
                  </CardTitle>
                  <CardDescription className="text-slate-200 md:text-gray-400 md:group-hover:text-slate-200 transition-colors duration-300 font-lato font-light">
                    {t('registerLanding.educator.desc')}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3 text-slate-100 md:text-gray-400 md:group-hover:text-slate-100 transition-colors duration-300 font-lato text-sm font-light">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] md:shadow-none md:group-hover:shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-shadow duration-300"></div>
                    <span>{t('registerLanding.educator.p1')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] md:shadow-none md:group-hover:shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-shadow duration-300"></div>
                    <span>{t('registerLanding.educator.p2')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] md:shadow-none md:group-hover:shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-shadow duration-300"></div>
                    <span>{t('registerLanding.educator.p3')}</span>
                  </div>
                </div>
                <Link to="/register/issuer" className="block pt-2">
                  <Button className="w-full gap-2 bg-blue-500/10 md:bg-transparent border border-blue-500/50 md:border-white/10 md:hover:border-blue-500 md:hover:bg-blue-500/10 text-white transition-all duration-300 font-lato group/btn">
                    {t('registerLanding.educator.btn')}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recruiter Card */}
            <Card 
              className="role-card recruiter-card reveal-item opacity-0 relative overflow-hidden bg-black/40 backdrop-blur-md border border-green-500/30 md:border-white/10 md:hover:border-green-500/50 transition-all duration-500 group"
              onMouseEnter={handleIconHover}
              onMouseLeave={handleIconLeave}
            >
              <CardHeader className="space-y-4 text-center">
                <div 
                  className="w-14 h-14 mx-auto rounded-lg border border-green-500/30 md:border-white/10 bg-green-500/10 md:bg-white/5 flex items-center justify-center transition-colors duration-300 md:group-hover:bg-green-500/10 md:group-hover:border-green-500/30 breathing-icon"
                >
                  <ROLE_ICONS.recruiter className="h-6 w-6 text-green-400 md:text-gray-400 md:group-hover:text-green-400 transition-colors duration-300" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl font-exo bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(7ade80,0.5)] md:drop-shadow-none md:group-hover:drop-shadow-[0_0_10px_rgba(7ade80,0.5)] transition-all duration-300">
                    {t('registerLanding.recruiter.title')}
                  </CardTitle>
                  <CardDescription className="text-slate-200 md:text-gray-400 md:group-hover:text-slate-200 transition-colors duration-300 font-lato font-light">
                    {t('registerLanding.recruiter.desc')}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3 text-slate-100 md:text-gray-400 md:group-hover:text-slate-100 transition-colors duration-300 font-lato text-sm font-light">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] md:shadow-none md:group-hover:shadow-[0_0_8px_rgba(34,197,94,0.8)] transition-shadow duration-300"></div>
                    <span>{t('registerLanding.recruiter.p1')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] md:shadow-none md:group-hover:shadow-[0_0_8px_rgba(34,197,94,0.8)] transition-shadow duration-300"></div>
                    <span>{t('registerLanding.recruiter.p2')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] md:shadow-none md:group-hover:shadow-[0_0_8px_rgba(34,197,94,0.8)] transition-shadow duration-300"></div>
                    <span>{t('registerLanding.recruiter.p3')}</span>
                  </div>
                </div>
                <Link to="/register/recruiter" className="block pt-2">
                  <Button className="w-full gap-2 bg-green-500/10 md:bg-transparent border border-green-500/50 md:border-white/10 md:hover:border-green-500 md:hover:bg-green-500/10 text-white transition-all duration-300 font-lato group/btn">
                    {t('registerLanding.recruiter.btn')}
                  </Button>
                </Link>
              </CardContent>
            </Card>

          </div>

          {/* Already have account */}
          <div className="mt-8 text-center pb-8 border-t border-white/5 pt-8 max-w-2xl mx-auto w-full group">
            <p className="text-gray-500 font-lato text-base sm:text-lg font-light">
              {t('registerLanding.alreadyHave')}{' '}
              <Link to="/login" className="text-white hover:text-white font-medium underline-offset-4 hover:underline transition-all">
                {t('registerLanding.signInInstead')}
              </Link>
            </p>
          </div>

        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
    </>
  );
};

export default RegisterLanding;
