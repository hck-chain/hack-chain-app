import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Globe } from 'lucide-react';

export function LanguageToggle() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    // Add transition out class
    document.body.classList.add('language-transitioning');
    document.body.classList.remove('language-transition-ready');

    // Wait for the blur/fade effect
    setTimeout(() => {
      const newLang = i18n.language.startsWith('es') ? 'en' : 'es';
      i18n.changeLanguage(newLang);
      
      // Allow react to re-render, then fade back in
      setTimeout(() => {
        document.body.classList.remove('language-transitioning');
        document.body.classList.add('language-transition-ready');
        
        // Clean up ready class after transition completes
        setTimeout(() => {
          document.body.classList.remove('language-transition-ready');
        }, 400); // matches the 0.4s transition duration
      }, 50);
    }, 200); // matches the 0.2s transition out duration
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      title={i18n.language.startsWith('es') ? 'Switch to English' : 'Cambiar a Español'}
    >
      <Globe className="h-5 w-5" />
      <span className="sr-only">Toggle language</span>
    </Button>
  );
}
