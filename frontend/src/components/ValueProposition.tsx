import { ArrowRight, User, Award, Building } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const ValueProposition = () => {
  const { t } = useTranslation();
  return (
    <section id="community" className="pb-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-title text-4xl md:text-5xl font-bold mb-4">
            {t('valueProp.title1')}<span className="gradient-text">{t('valueProp.title2')}</span>
          </h2>

          <p className="font-body text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('valueProp.subTitle')}
          </p>
        </motion.div>

        {/* Flow Container */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8 }}
          className="glass rounded-3xl p-8 md:p-12"
        >
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-8 lg:space-y-0 lg:space-x-8">

            {/* Step 1 */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-1 text-center group"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <User className="w-12 h-12 text-white" />
              </div>

              <h3 className="font-title text-2xl font-bold mb-4 gradient-text">
                {t('valueProp.step1Title')}
              </h3>

              <p className="font-body text-muted-foreground">
                {t('valueProp.step1Desc')}
              </p>
            </motion.div>

            {/* Arrow */}
            <motion.div 
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="hidden lg:block"
            >
              <ArrowRight className="w-8 h-8 text-primary animate-pulse-neon" />
            </motion.div>

            {/* Step 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex-1 text-center group"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 neon-glow">
                <Award className="w-12 h-12 text-white" />
              </div>

              <h3 className="font-title text-2xl font-bold mb-4 gradient-text">
                {t('valueProp.step2Title')}
              </h3>

              <p className="font-body text-muted-foreground">
                {t('valueProp.step2Desc')}
              </p>
            </motion.div>

            {/* Arrow */}
            <motion.div 
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="hidden lg:block"
            >
              <ArrowRight className="w-8 h-8 text-primary animate-pulse-neon" />
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 1 }}
              className="flex-1 text-center group"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Building className="w-12 h-12 text-white" />
              </div>

              <h3 className="font-title text-2xl font-bold mb-4 gradient-text">
                {t('valueProp.step3Title')}
              </h3>

              <p className="font-body text-muted-foreground">
                {t('valueProp.step3Desc')}
              </p>
            </motion.div>
          </div>

          {/* Trust Line */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="mt-12 text-center"
          >
            <div className="glass rounded-xl p-6 inline-block">
              <p className="font-body text-lg text-muted-foreground">
                <span className="gradient-text font-semibold">{t('valueProp.trust1')}</span> •
                <span className="gradient-text font-semibold"> {t('valueProp.trust2')}</span> •
                <span className="gradient-text font-semibold"> {t('valueProp.trust3')}</span>
              </p>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
};

export default ValueProposition;
