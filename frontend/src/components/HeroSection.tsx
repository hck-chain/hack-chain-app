import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const HeroSection = () => {
  const { t } = useTranslation();
  return (
    <section
      id="home"
      className="min-h-[90vh] flex items-center justify-center relative overflow-hidden pt-16 sm:pt-20 mt-6 sm:mt-10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="glass rounded-3xl p-6 sm:p-10 md:p-14"
        >

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="font-title text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
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
            className="font-body text-base sm:text-xl text-muted-foreground mb-0 max-w-4xl mx-auto leading-relaxed"
          >
            {t('hero.subTitle1')}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="font-body text-base sm:text-xl text-muted-foreground mb-10 md:mb-24 max-w-4xl mx-auto leading-relaxed"
          >
            {t('hero.subTitle2')}
          </motion.p>

          {/* Infrastructure Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            <p className="font-title text-xl sm:text-3xl font-bold mb-6 sm:mb-8 leading-tight">
              {t('hero.infrastructure')}
            </p>

            <div className="flex flex-wrap justify-center items-start gap-8 sm:gap-12 lg:gap-20">
              {[
                { src: '/images/polygon.png', alt: 'Polygon', label: 'Polygon' },
                { src: '/images/pinata.png', alt: 'Pinata Cloud', label: 'Pinata Cloud' },
                { src: '/images/opensea.png', alt: 'OpenSea', label: 'OpenSea' },
                { src: '/images/metamask.png', alt: 'MetaMask', label: 'MetaMask' },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  whileHover={{ scale: 1.1 }}
                  className="flex flex-col items-center gap-3 cursor-default"
                >
                  <img
                    src={item.src}
                    alt={item.alt}
                    className="h-14 sm:h-20 md:h-28"
                  />
                  <span className="font-body text-xs sm:text-sm text-white/80">
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
