import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Wallet, Menu, X, UserPlus } from 'lucide-react';
import hackChainLogo from "/images/logoHackchain.png";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: 'Home', href: '#home' },
    { name: 'Certificates', href: '#certificates' },
    { name: 'Community', href: '#community' },
    { name: 'DAO', href: '#dao' },
  ];

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
    
    // Cerrar menú móvil si está abierto
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 animate-in slide-in-from-top duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center cursor-pointer group transition-all duration-300 hover:scale-105">
            <img 
              src={hackChainLogo} 
              alt="HackChain Logo" 
              className="h-8 w-auto mr-2 transition-transform duration-300 group-hover:rotate-12"
            />
            <div className="gradient-text text-2xl font-bold transition-all duration-300 group-hover:tracking-wide">
              HackChain
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-8">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleSmoothScroll(e, item.href)}
                  className="text-foreground/80 hover:text-foreground transition-all duration-300 cursor-pointer relative group"
                >
                  {item.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-full transition-all duration-300"></span>
                </a>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Sign In Button */}
            <Link to="/login">
              <Button 
                variant="ghost"
                className="text-foreground hover:text-white hover:bg-slate-800/50 transition-all duration-200"
              >
                Sign In
              </Button>
            </Link>
            
            {/* Get Started Button */}
            <Link to="/register">
              <Button 
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 glass rounded-lg mt-2">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleSmoothScroll(e, item.href)}
                  className="block px-3 py-2 text-foreground/80 hover:text-foreground transition-colors duration-200 cursor-pointer"
                >
                  {item.name}
                </a>
              ))}
              
              {/* Mobile Action Buttons */}
              <div className="px-3 py-2 space-y-2">
                <Link to="/login" className="block">
                  <Button 
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Button>
                </Link>
                
                <Link to="/register" className="block">
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0 shadow-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;