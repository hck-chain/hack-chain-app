import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Menu, X, ArrowRight, Home, Shield, Activity, Coins, Phone, Info } from 'lucide-react';
// @ts-ignore
import anime from 'animejs/lib/anime.es.js';
import { AnimatedButton } from './auth/AnimatedButton';
import hackChainLogo from "/images/logoHackchain.png";
import { LanguageToggle } from './LanguageToggle';
import styles from '@/styles/navbar-effects.module.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Hide on scroll down, show on scroll up, always show at the top
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

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      // Execute Anime.js staggered entry
      if (menuRef.current) {
        const items = menuRef.current.querySelectorAll('.mobile-nav-item');
        anime({
          targets: items,
          translateY: [40, 0],
          opacity: [0, 1],
          easing: 'easeOutExpo',
          duration: 800,
          delay: anime.stagger(100)
        });
      }
    } else {
      document.body.style.overflow = '';
    }
  }, [isMenuOpen]);

  const navItems = [
    { id: '1', name: t('nav.home'), href: '/#home', icon: Home, color: 'text-purple-400', tooltip: 'Main Page' },
    { id: '2', name: t('nav.features'), href: '/#certificates', icon: Shield, color: 'text-pink-400', tooltip: 'Certificates' },
    { id: '3', name: t('nav.process'), href: '/#community', icon: Activity, color: 'text-blue-400', tooltip: 'How It Works' },
    { id: '4', name: t('nav.tokenHack'), href: '/token', icon: Coins, color: 'text-yellow-400', tooltip: 'Tokenomics' },
    { id: '5', name: t('nav.contact'), href: '/contact', icon: Phone, color: 'text-green-400', tooltip: 'Get In Touch' },
    { id: '6', name: t('nav.about'), href: '/about', icon: Info, color: 'text-cyan-400', tooltip: 'What We Do' },
  ];

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/#') && window.location.pathname === '/') {
      e.preventDefault();
      const targetId = href.replace('/#', '');
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        const navbarHeight = 96; // h-24 = 96px
        const elementTop = targetElement.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: elementTop - navbarHeight, behavior: 'smooth' });
      }
    }
    setIsMenuOpen(false);
  };

  return (
    <>
    <nav className={`fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-24">

          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <img
              src={hackChainLogo}
              alt="HackChain Logo"
              className="h-10 sm:h-16 w-auto mr-1"
            />
            <span className="font-title text-xl sm:text-2xl font-bold gradient-text">
              HackChain
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <div key={item.name} className={styles.navItem}>
                <Link
                  to={item.href}
                  onClick={(e: any) => handleNavigation(e, item.href)}
                  className={styles.navLink}
                >
                  {item.name}
                </Link>
                <span className={styles.tooltip}>{item.tooltip}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons — desktop only */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageToggle />
            <AnimatedButton to="/login" variant="secondary" icon="login">
              {t('nav.signIn')}
            </AnimatedButton>
            <AnimatedButton to="/register" variant="primary" icon="register">
              {t('nav.getStarted')}
            </AnimatedButton>
          </div>

          {/* Hamburger button — mobile only */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)} className="relative z-50">
              <div
                className={`transition-transform duration-500 ease-[cubic-bezier(0.68,-0.55,0.26,1.55)] ${
                  isMenuOpen ? 'rotate-180' : 'rotate-0'
                }`}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </div>
            </Button>
          </div>
        </div>
      </div>
    </nav>

    {/* Full Screen Mobile Navigation */}
        {/* Google-style Sidebar Drawer Navigation */}
        <div
          className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ${
            isMenuOpen ? 'visible' : 'invisible'
          }`}
        >
          {/* Backdrop overlay */}
          <div 
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Sidebar Drawer */}
          <div 
            className={`absolute top-0 left-0 bottom-0 w-[80%] max-w-sm bg-[#0B0B0F] border-r border-white/5 shadow-[20px_0_40px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
          >
            {/* Ambient glows inside drawer */}
            <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-purple-500/10 blur-[80px] pointer-events-none rounded-full" />

            {/* Header / Logo */}
            <div className="h-20 sm:h-24 flex items-center px-6 border-b border-white/5 flex-shrink-0 relative z-10">
              <img src={hackChainLogo} alt="HackChain Logo" className="h-8 sm:h-10 w-auto mr-3" />
              <span className="font-title text-xl font-bold gradient-text">HackChain</span>
            </div>

            {/* Scrollable Nav Items */}
            <div ref={menuRef} className="flex-1 overflow-y-auto py-6 flex flex-col custom-scrollbar relative z-10">
              <div className="flex flex-col space-y-1 mt-2 px-3">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  // Handle optional Icon mapping since TS was complaining, we will just use ArrowRight as fallback if icon is undefined momentarily until next chunk fixes navItems
                  const SafeIcon = Icon || ArrowRight;
                  return (
                    <Link
                      key={item.id || item.name}
                      to={item.href}
                      onClick={(e) => handleNavigation(e, item.href)}
                      className="mobile-nav-item flex items-center px-4 py-3.5 rounded-xl hover:bg-white/5 transition-colors opacity-0 group"
                    >
                      <SafeIcon className={`w-5 h-5 flex-shrink-0 mr-4 text-slate-400 group-hover:${item.color || 'text-purple-400'} transition-colors`} />
                      <span className="font-body font-medium text-slate-200 group-hover:text-white transition-colors">
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="my-6 mx-6 border-t border-white/5" />

              {/* Language Toggle */}
              <div className="mobile-nav-item opacity-0 px-7 flex items-center mb-6">
                <span className="text-sm font-medium text-slate-400 mr-4">Language</span>
                <LanguageToggle />
              </div>

              {/* Action Buttons */}
              <div className="mobile-nav-item opacity-0 px-6 flex flex-col gap-3 mt-auto mb-6">
                <AnimatedButton 
                  to="/login"
                  variant="secondary"
                  icon="login"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full justify-center text-sm py-4 border-transparent bg-white/5 hover:bg-white/10"
                >
                  {t('nav.signIn')}
                </AnimatedButton>
                <AnimatedButton 
                  to="/register" 
                  variant="primary"
                  icon="register"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full justify-center text-sm py-4 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                >
                  {t('nav.getStarted')}
                </AnimatedButton>
              </div>
            </div>
          </div>
        </div>
    </>
  );
};

export default Navbar;
