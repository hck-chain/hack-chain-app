import React from 'react';
import BackgroundAnimation from '@/components/BackgroundAnimation';
import ScrollToTopButton from '@/components/ScrollToTopButton';
import Footer from './Footer';
import AdminAccessBadge from '@/components/AdminAccessBadge';
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
      {/* Floating admin entry — renders nothing for non-admins and hides
          itself automatically when the user is already inside /admin/*. */}
      <div className="fixed bottom-6 left-6 z-40">
        <AdminAccessBadge variant="pill" />
      </div>
    </div>
  );
};

export default Layout; 