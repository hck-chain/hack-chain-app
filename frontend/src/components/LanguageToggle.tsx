import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Globe, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export function LanguageToggle() {
  const { i18n } = useTranslation();

  const changeLanguage = (newLang: string) => {
    if (i18n.language === newLang) return;

    // Add transition out class
    document.body.classList.add('language-transitioning');
    document.body.classList.remove('language-transition-ready');

    // Wait for the blur/fade effect
    setTimeout(() => {
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
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-white/10 transition-colors focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                <Globe className="h-5 w-5 text-slate-300 group-hover:text-white" />
                <span className="sr-only">Toggle language</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-[#1A1A24] border-white/10 text-white font-lato">
            <p>Language</p>
          </TooltipContent>
          <DropdownMenuContent align="end" className="bg-[#0B0B0F]/95 border-white/10 backdrop-blur-md text-slate-300">
            <DropdownMenuItem 
              onClick={() => changeLanguage('en')}
              className="flex items-center justify-between gap-8 cursor-pointer hover:bg-white/5 data-[highlighted]:bg-white/5 transition-colors font-lato py-2"
            >
              <span>English</span>
              {i18n.language.startsWith('en') && <Check className="h-4 w-4 text-purple-400" />}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => changeLanguage('es')}
              className="flex items-center justify-between gap-8 cursor-pointer hover:bg-white/5 data-[highlighted]:bg-white/5 transition-colors font-lato py-2"
            >
              <span>Español</span>
              {i18n.language.startsWith('es') && <Check className="h-4 w-4 text-purple-400" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Tooltip>
    </TooltipProvider>
  );
}
