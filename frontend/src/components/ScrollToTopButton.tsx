import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Mostrar/ocultar el botón basado en la posición del scroll
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  // Función para hacer scroll al top con animación suave mejorada
  const scrollToTop = () => {
    const scrollDuration = 800; // Duración en milisegundos
    const scrollStep = -window.scrollY / (scrollDuration / 15);
    
    const scrollInterval = setInterval(() => {
      if (window.scrollY !== 0) {
        window.scrollBy(0, scrollStep);
      } else {
        clearInterval(scrollInterval);
      }
    }, 15);
  };

  return (
    <>
      {isVisible && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-110 active:scale-95 neon-glow animate-in fade-in slide-in-from-bottom group"
          size="sm"
        >
          <ChevronUp className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110" />
          <span className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          <span className="absolute inset-0 rounded-full animate-ping bg-pink-400 opacity-0 group-hover:opacity-30" />
        </Button>
      )}
    </>
  );
};

export default ScrollToTopButton;
