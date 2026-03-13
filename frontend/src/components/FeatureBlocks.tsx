import { Award, UserCheck, Vote, Shield, Zap, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const FeatureBlocks = () => {
  const { t } = useTranslation();
  const features = [
    {
      Icon: Award,
      title: t('features.items.nft.title'),
      description: t('features.items.nft.description'),
      color: 'from-purple-500 to-pink-500',
    },
    {
      Icon: UserCheck,
      title: t('features.items.recruiter.title'),
      description: t('features.items.recruiter.description'),
      color: 'from-blue-500 to-cyan-500',
    },
    {
      Icon: Vote,
      title: t('features.items.dao.title'),
      description: t('features.items.dao.description'),
      color: 'from-green-500 to-emerald-500',
    },
    {
      Icon: Shield,
      title: t('features.items.security.title'),
      description: t('features.items.security.description'),
      color: 'from-orange-500 to-red-500',
    },
    {
      Icon: Zap,
      title: t('features.items.instant.title'),
      description: t('features.items.instant.description'),
      color: 'from-yellow-500 to-orange-500',
    },
    {
      Icon: Globe,
      title: t('features.items.global.title'),
      description: t('features.items.global.description'),
      color: 'from-indigo-500 to-purple-500',
    },
  ];

  return (
    <section id="certificates" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-title text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            {t('features.title1')}<span className="gradient-text">{t('features.title2')}</span>
          </h2>

          <p className="font-body text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('features.subTitle')}
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass rounded-2xl p-5 sm:p-8 glass-hover group"
            >
              <div
                className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.Icon className="w-8 h-8 text-white" />
              </div>

              <h3 className="font-title text-2xl font-bold mb-4 gradient-text">
                {feature.title}
              </h3>

              <p className="font-body text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default FeatureBlocks;
