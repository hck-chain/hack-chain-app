import { Rocket } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const CallToAction = () => {
  const { t } = useTranslation();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <section id="dao" className="pb-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          className="glass rounded-3xl p-10 md:p-20 text-center"
        >
          <div className="max-w-4xl mx-auto">

            {/* Headline */}
            <motion.h2 
              variants={itemVariants}
              className="font-title text-4xl md:text-6xl font-bold mb-6 leading-tight"
            >
              {t('cta.title1')}
              <span className="gradient-text">{t('cta.title2')}</span>
              {t('cta.title3')}
            </motion.h2>

            {/* Description */}
            <motion.p 
              variants={itemVariants}
              className="font-body text-xl md:text-2xl text-muted-foreground mb-16 leading-relaxed"
            >
              {t('cta.description')}
            </motion.p>

            {/* Trust Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <motion.div variants={itemVariants} className="glass rounded-xl p-6">
                <div className="font-title text-2xl font-bold gradient-text">{t('cta.stats.free.title')}</div>
                <div className="font-body text-muted-foreground">{t('cta.stats.free.subtitle')}</div>
              </motion.div>

              <motion.div variants={itemVariants} className="glass rounded-xl p-6">
                <div className="font-title text-2xl font-bold gradient-text">{t('cta.stats.247.title')}</div>
                <div className="font-body text-muted-foreground">{t('cta.stats.247.subtitle')}</div>
              </motion.div>

              <motion.div variants={itemVariants} className="glass rounded-xl p-6">
                <div className="font-title text-2xl font-bold gradient-text">{t('cta.stats.instant.title')}</div>
                <div className="font-body text-muted-foreground">{t('cta.stats.instant.subtitle')}</div>
              </motion.div>

              <motion.div variants={itemVariants} className="glass rounded-xl p-6">
                <div className="font-title text-2xl font-bold gradient-text">{t('cta.stats.global.title')}</div>
                <div className="font-body text-muted-foreground">{t('cta.stats.global.subtitle')}</div>
              </motion.div>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToAction;
