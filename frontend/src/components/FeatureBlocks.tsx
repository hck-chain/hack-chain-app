import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const FeatureBlocks = () => {
  const { t } = useTranslation();

  const features = [
    {
      imgSrc: '/icons/libro.avif',
      alt: 'NFT Certificates',
      title: t('features.items.nft.title'),
      description: t('features.items.nft.description'),
      claySrc: 'from-purple-500/80 via-fuchsia-500/65 to-purple-700/50',
      shadow: 'shadow-clay-purple',
    },
    {
      imgSrc: '/icons/maletin.avif',
      alt: 'Recruiter',
      title: t('features.items.recruiter.title'),
      description: t('features.items.recruiter.description'),
      claySrc: 'from-cyan-400/80 via-sky-500/65 to-blue-700/50',
      shadow: 'shadow-clay-cyan',
    },
    {
      imgSrc: '/icons/check.avif',
      alt: 'DAO',
      title: t('features.items.dao.title'),
      description: t('features.items.dao.description'),
      claySrc: 'from-emerald-400/80 via-green-500/65 to-emerald-700/50',
      shadow: 'shadow-clay-emerald',
    },
    {
      imgSrc: '/icons/escudo.avif',
      alt: 'Security',
      title: t('features.items.security.title'),
      description: t('features.items.security.description'),
      claySrc: 'from-pink-400/80 via-rose-500/65 to-pink-700/50',
      shadow: 'shadow-clay-pink',
    },
    {
      imgSrc: '/icons/rayo.avif',
      alt: 'Instant',
      title: t('features.items.instant.title'),
      description: t('features.items.instant.description'),
      claySrc: 'from-amber-300/80 via-orange-500/65 to-orange-700/50',
      shadow: 'shadow-clay-amber',
    },
    {
      imgSrc: '/icons/mundo.avif',
      alt: 'Global',
      title: t('features.items.global.title'),
      description: t('features.items.global.description'),
      claySrc: 'from-indigo-400/80 via-violet-500/65 to-indigo-700/50',
      shadow: 'shadow-clay-indigo',
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring' as const, stiffness: 90, damping: 18 },
    },
  };

  return (
    <section id="certificates" className="pt-12 sm:pt-20 pb-32 md:pb-48 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div
          className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-start text-left mb-10 md:mb-14"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        >
          <h2 className="font-title text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
            <span className="block">{t('features.title1')}</span>
            <span className="block gradient-text whitespace-nowrap">{t('features.title2')}</span>
          </h2>

          <div className="flex justify-start lg:justify-end">
            <p className="font-body text-lg md:text-xl text-white/55 w-full max-w-sm font-medium lg:translate-x-12">
              {t('features.subTitle')}
            </p>
          </div>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20 md:gap-y-24"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="flex flex-col items-center text-center md:items-start md:text-left"
            >
              <div
                className={`clay-icon w-20 h-20 mb-8 bg-gradient-to-br ${feature.claySrc} ${feature.shadow}`}
              >
                <img src={feature.imgSrc} alt={feature.alt} className="w-12 h-12 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />
              </div>

              <h3 className="font-title text-2xl md:text-3xl font-black mb-4 text-white tracking-tight">
                {feature.title}
              </h3>

              <p className="font-body text-base md:text-lg text-white/55 leading-relaxed font-medium max-w-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
};

export default FeatureBlocks;
