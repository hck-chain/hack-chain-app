import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const CallToAction = () => {
  const { t } = useTranslation();

  const stats = [
    { title: t('cta.stats.free.title'), subtitle: t('cta.stats.free.subtitle') },
    { title: t('cta.stats.247.title'), subtitle: t('cta.stats.247.subtitle') },
    { title: t('cta.stats.instant.title'), subtitle: t('cta.stats.instant.subtitle') },
    { title: t('cta.stats.global.title'), subtitle: t('cta.stats.global.subtitle') },
  ];

  return (
    <section id="dao" className="pb-32 md:pb-48 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        <motion.h2
          className="font-title text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-10 leading-[1.02] tracking-tight"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        >
          {t('cta.title1')}
          <span className="gradient-text">{t('cta.title2')}</span>
          {t('cta.title3')}
        </motion.h2>

        <motion.p
          className="font-body text-lg md:text-xl lg:text-2xl text-white/55 mb-24 md:mb-32 leading-relaxed font-medium max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.1 }}
        >
          {t('cta.description')}
        </motion.p>

        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-y-16 gap-x-8 md:gap-x-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12 } },
          }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="relative flex flex-col items-center"
              variants={{
                hidden: { opacity: 0, y: 24, scale: 0.96 },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { type: 'spring' as const, stiffness: 90, damping: 18 },
                },
              }}
            >
              <div className="font-title text-5xl md:text-6xl lg:text-7xl font-black gradient-text mb-3 tracking-tight leading-none">
                {stat.title}
              </div>
              <div className="font-body text-sm md:text-base text-white/50 font-semibold uppercase tracking-[0.18em]">
                {stat.subtitle}
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
};

export default CallToAction;
