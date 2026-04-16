import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import anime from 'animejs';
import { LoginForm } from "@/components/auth/loginForm";
import BackgroundAnimation from "@/components/BackgroundAnimation";
import { LanguageToggle } from "@/components/LanguageToggle";
import Footer from "@/components/Footer";
import hackChainLogo from "/images/logoHackchain.png";

export default function Login() {
  const { t } = useTranslation();
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Entry animation with Anime.js
  useEffect(() => {
    const card = document.getElementById('login-card');
    const welcome = document.getElementById('welcome-message');
    
    if (!card || !welcome) return;

    // Set initial state
    anime.set([card, welcome], { opacity: 0, translateY: 20 });
    anime.set(card, { scale: 0.95 });

    // Animate in
    anime.timeline({ easing: 'easeOutExpo' })
      .add({
        targets: card,
        opacity: [0, 1],
        translateY: [20, 0],
        scale: [0.95, 1],
        duration: 800,
        easing: 'easeOutBack',
      })
      .add({
        targets: welcome,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 600,
      }, '-=400');
  }, []);

  return (
    <div className="min-h-screen relative flex flex-col font-lato overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-30 bg-background" />
      <div className="fixed inset-0 -z-20 pointer-events-none">
        <BackgroundAnimation />
      </div>

      {/* Header - Same style as RegisterUser */}
      <header
        className={`z-40 w-full border-b border-white/10 fixed top-0 left-0 right-0 bg-[#0B0B0F]/80 backdrop-blur transition-transform duration-300 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}
        style={{ minHeight: '56px' }}
      >
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
            <Link to="/" className="flex items-center gap-2 group">
              <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all duration-300 group-hover:-translate-x-1" />
              <span className="text-sm md:text-base font-lato font-medium text-slate-300 group-hover:text-purple-400 transition-colors duration-300">
                {t('login.backHome')}
              </span>
            </Link>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 pt-28 pb-12 flex-1 flex flex-col items-center justify-center">
        
        {/* Login Card */}
        <div 
          id="login-card"
          className="w-full max-w-md glass border border-purple-500/20 shadow-2xl rounded-2xl overflow-hidden"
        >
          {/* Top gradient accent */}
          <div 
            className="h-1 w-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.8), rgba(236, 72, 153, 0.6), transparent)',
            }}
          />

          {/* Card content */}
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-6">
              {/* Icon */}
              <div 
                className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg"
              >
                <svg 
                  className="w-7 h-7 text-white" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7l4 4z" 
                  />
                </svg>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-exo font-bold tracking-tight">
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {t('login.signIn')}
                </span>
              </h2>
            </div>

            {/* Form */}
            <LoginForm />
          </div>

          {/* Bottom accent */}
          <div 
            className="h-px w-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.4), transparent)',
            }}
          />
        </div>

        {/* Welcome Message */}
        <div id="welcome-message" className="text-center mt-8 w-full max-w-md mx-auto px-2">
          <p className="text-base md:text-lg text-slate-300 leading-relaxed">
            <span className="text-purple-400 font-medium">Connect your wallet</span>
            {' '}to verify your identity on the blockchain
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Secured by Ethereum blockchain</span>
            </div>
            <span className="hidden sm:block text-purple-500">•</span>
            <span>Your keys, your credentials</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
