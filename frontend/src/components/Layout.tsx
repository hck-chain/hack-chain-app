import React from 'react';
import ScrollToTopButton from '@/components/ScrollToTopButton';
import Footer from './Footer';
import { useScrollReveal } from '@/hooks/useAnimeHooks';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useScrollReveal();

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <div className="fixed inset-0 -z-30 bg-background" />
      {/* Columna de alto completo: el contenido crece (flex-1) y empuja el
          footer al fondo de la pantalla cuando la pagina es corta. Los hijos
          van envueltos para que su flujo interno no pase a ser flex. */}
      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="flex-1">{children}</div>
        <Footer />
        <ScrollToTopButton />
      </div>
    </div>
  );
};

export default Layout;