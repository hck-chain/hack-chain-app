import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Settings, Check, X, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('hackchain_cookie_consent');
    if (!consent) {
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('hackchain_cookie_consent', 'all');
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem('hackchain_cookie_consent', 'essential_only');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6 pb-6 sm:pb-8"
        >
          {/* Banner Container */}
          <div className="max-w-5xl mx-auto glass rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_-10px_40px_-15px_rgba(168,85,247,0.2)] border border-purple-500/30">
            
            <div className="flex-1 space-y-2">
              <h3 className="text-white font-title text-xl font-bold flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-purple-400" />
                {t('cookieBanner.title')}
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed font-body">
                {t('cookieBanner.desc1')}
                <Link to="/legal/cookies" className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors">
                  {t('cookieBanner.policyLink')}
                </Link>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 shrink-0">
              <Button 
                variant="outline" 
                onClick={handleReject}
                className="font-body text-gray-300 border-white/10 hover:bg-white/5 gap-2"
              >
                <X className="w-4 h-4" />
                {t('cookieBanner.reject')}
              </Button>
              
              <Link to="/legal/cookies" className="w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  className="w-full font-body text-gray-300 border-white/10 hover:bg-white/5 gap-2"
                >
                  <Settings className="w-4 h-4" />
                  {t('cookieBanner.config')}
                </Button>
              </Link>
              
              <Button 
                onClick={handleAcceptAll}
                className="font-body bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)] gap-2 border border-purple-400"
              >
                <Check className="w-4 h-4" />
                {t('cookieBanner.accept')}
              </Button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;
