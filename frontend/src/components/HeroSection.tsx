import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { motion } from 'framer-motion';

const HeroSection = () => {
  const { t } = useTranslation();
  return (
    <section
      id="home"
      className="min-h-[90vh] flex items-center justify-center relative overflow-hidden pt-32 mt-16"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="glass rounded-3xl p-10 md:p-17"
        >

          {/* Main Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="font-title text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            {t('hero.title1')}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B11D1] to-[#F743EE]">
              {t('hero.title2')}
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="font-body text-xl md:text-1xl text-muted-foreground mb-0 max-w-4xl mx-auto leading-relaxed"
          >
            {t('hero.subTitle1')}
          </motion.p>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="font-body text-xl md:text-1xl text-muted-foreground mb-24 max-w-4xl mx-auto leading-relaxed"
          >
            {t('hero.subTitle2')}
          </motion.p>

          {/* Infrastructure Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            <p className="font-title text-4xl md:text-6xl lg:text-3xl font-bold mb-8 leading-tight">
              {t('hero.infrastructure')}
            </p>

            <div className="flex flex-wrap justify-center items-start gap-20">

              {/* Polygon */}
              <motion.div 
                whileHover={{ scale: 1.1 }}
                className="flex flex-col items-center gap-4 cursor-default"
              >
                <img
                  src="/images/polygon.png"
                  alt="Polygon"
                  className="h-24 md:h-28"
                />
                <span className="font-body text-sm text-white/80">
                  Polygon
                </span>
              </motion.div>

              {/* Pinata */}
              <motion.div 
                whileHover={{ scale: 1.1 }}
                className="flex flex-col items-center gap-4 cursor-default"
              >
                <img
                  src="/images/pinata.png"
                  alt="Pinata Cloud"
                  className="h-24 md:h-28"
                />
                <span className="font-body text-sm text-white/80">
                  Pinata Cloud
                </span>
              </motion.div>

              {/* OpenSea */}
              <motion.div 
                whileHover={{ scale: 1.1 }}
                className="flex flex-col items-center gap-4 cursor-default"
              >
                <img
                  src="/images/opensea.png"
                  alt="OpenSea"
                  className="h-24 md:h-28"
                />
                <span className="font-body text-sm text-white/80">
                  OpenSea
                </span>
              </motion.div>

              {/* MetaMask */}
              <motion.div 
                whileHover={{ scale: 1.1 }}
                className="flex flex-col items-center gap-4 cursor-default"
              >
                <img
                  src="/images/metamask.png"
                  alt="MetaMask"
                  className="h-24 md:h-28"
                />
                <span className="font-body text-sm text-white/80">
                  MetaMask
                </span>
              </motion.div>

            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
