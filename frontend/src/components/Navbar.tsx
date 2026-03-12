import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Menu, X, UserPlus } from 'lucide-react';
import hackChainLogo from "/images/logoHackchain.png";
import { LanguageToggle } from './LanguageToggle';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();

  const navItems = [
    { name: t('nav.home'), href: '/#home' },
    { name: t('nav.features'), href: '/#certificates' },
    { name: t('nav.process'), href: '/#community' },
    { name: t('nav.build'), href: '/#dao' },
    { name: t('nav.contact'), href: '/contact' },
    { name: t('nav.about'), href: '/about' },
  ];

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/#') && window.location.pathname === '/') {
      e.preventDefault();
      const targetId = href.replace('/#', '');
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        const navbarHeight = 96;
        const elementTop = targetElement.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: elementTop - navbarHeight, behavior: 'smooth' });
      }
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 animate-in slide-in-from-top duration-500">
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
              <Link
                key={item.name}
                to={item.href}
                onClick={(e: any) => handleNavigation(e, item.href)}
                className="font-body text-foreground/80 hover:text-foreground transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Action Buttons — desktop only */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageToggle />
            <Link to="/login">
              <Button variant="ghost" className="font-body text-foreground hover:text-white">
                {t('nav.signIn')}
              </Button>
            </Link>
            <Link to="/register">
              <Button className="font-title bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg">
                <UserPlus className="w-4 h-4 mr-2" />
                {t('nav.getStarted')}
              </Button>
            </Link>
          </div>

          {/* Hamburger button — mobile only */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation — animated slide-down */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-[520px] opacity-100 pb-4' : 'max-h-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="glass rounded-xl p-3 mt-1 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={(e: any) => handleNavigation(e, item.href)}
                className="block font-body px-4 py-2.5 rounded-lg text-foreground/80 hover:text-foreground hover:bg-white/5 transition-colors"
              >
                {item.name}
              </Link>
            ))}

            <div className="flex justify-center py-2 border-t border-white/10 mt-1">
              <LanguageToggle />
            </div>

            <Link to="/login" onClick={() => setIsMenuOpen(false)}>
              <Button variant="outline" className="w-full font-body mt-1">
                {t('nav.signIn')}
              </Button>
            </Link>

            <Link to="/register" onClick={() => setIsMenuOpen(false)}>
              <Button className="w-full font-title bg-gradient-to-r from-blue-600 to-cyan-600 text-white mt-1">
                <UserPlus className="w-4 h-4 mr-2" />
                {t('nav.getStarted')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
