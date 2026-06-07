import React from 'react';
import BackgroundAnimation from '@/components/BackgroundAnimation';
import ScrollToTopButton from '@/components/ScrollToTopButton';
import Footer from './Footer';
import { useScrollReveal } from '@/hooks/useAnimeHooks';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useScrollReveal();

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <div className="fixed inset-0 -z-30 bg-background" />
      <div className="fixed inset-0 -z-20 pointer-events-none">
        <BackgroundAnimation />
      </div>
      <div className="relative z-10">
        {children}
        <Footer />
        <ScrollToTopButton />
      </div>
    </div>
  );
};

export default Layout; 