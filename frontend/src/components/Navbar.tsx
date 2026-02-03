import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, UserPlus } from 'lucide-react';
import hackChainLogo from "/images/logoHackchain.png";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: 'Home', href: '#home' },
    { name: 'Features', href: '#certificates' },
    { name: 'Process', href: '#community' },
    { name: 'Build', href: '#dao' },
  ];

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 animate-in slide-in-from-top duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">

          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <img
              src={hackChainLogo}
              alt="HackChain Logo"
              className="h-16 w-auto mr-1"
            />
            <span className="font-title text-2xl font-bold gradient-text">
              HackChain
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => handleSmoothScroll(e, item.href)}
                className="font-body text-foreground/80 hover:text-foreground transition-colors"
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button
                variant="ghost"
                className="font-body text-foreground hover:text-white"
              >
                Sign In
              </Button>
            </Link>

            <Link to="/register">
              <Button
                className="font-title bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-2 glass rounded-lg p-3 space-y-2">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => handleSmoothScroll(e, item.href)}
                className="block font-body px-3 py-2 text-foreground/80 hover:text-foreground"
              >
                {item.name}
              </a>
            ))}

            <Link to="/login">
              <Button
                variant="outline"
                className="w-full font-body"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign In
              </Button>
            </Link>

            <Link to="/register">
              <Button
                className="w-full font-title bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Get Started
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
