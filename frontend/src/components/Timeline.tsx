import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Rocket, 
  Code2, 
  FileBadge, 
  Coins, 
  ShieldCheck, 
  LineChart, 
  FlaskConical, 
  Globe2, 
  Users 
} from 'lucide-react';

export const Timeline = () => {
  const { t } = useTranslation();

  const timelineData = [
    {
      id: 'jul25',
      icon: Rocket,
      iconColor: 'text-purple-400',
    },
    {
      id: 'aug25',
      icon: Code2,
      iconColor: 'text-blue-400',
    },
    {
      id: 'sep25',
      icon: FileBadge,
      iconColor: 'text-pink-400',
    },
    {
      id: 'oct25',
      icon: Coins,
      iconColor: 'text-amber-400',
    },
    {
      id: 'nov25',
      icon: ShieldCheck,
      iconColor: 'text-emerald-400',
    },
    {
      id: 'dec25',
      icon: LineChart,
      iconColor: 'text-cyan-400',
    },
    {
      id: 'jan26',
      icon: FlaskConical,
      iconColor: 'text-violet-400',
    },
    {
      id: 'feb26',
      icon: Globe2,
      iconColor: 'text-indigo-400',
    },
    {
      id: 'mar26',
      icon: Users,
      iconColor: 'text-rose-400',
    }
  ];

  return (
    <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      {/* Dynamic Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="text-center mb-24 relative z-10"
      >
        <h3 className="text-sm font-exo tracking-widest text-purple-400 font-bold mb-3 uppercase">
          {t('team.timeline.subtitle')}
        </h3>
        <h2 className="text-4xl md:text-5xl font-title font-bold text-white drop-shadow-md">
          {t('team.timeline.title')}
        </h2>
      </motion.div>

      <div className="relative">
        {/* Glow Line Background */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-600/30 via-pink-500/30 to-purple-600/30 transform md:-translate-x-1/2 rounded-full blur-[2px]"></div>
        
        {/* Neon Line Core */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 via-pink-400 to-purple-500 transform md:-translate-x-1/2 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.7)]"></div>

        <div className="space-y-16">
          {timelineData.map((item, index) => {
            const isEven = index % 2 === 0;
            const Icon = item.icon;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 50, x: isEven ? -50 : 50 }}
                whileInView={{ opacity: 1, y: 0, x: 0 }}
                viewport={{ once: false, margin: "-100px" }}
                transition={{ duration: 0.6, type: 'spring', bounce: 0.3 }}
                className={`relative flex items-center md:justify-between w-full ${isEven ? 'md:flex-row-reverse' : ''}`}
              >
                {/* Desktop Spacer */}
                <div className="hidden md:block w-[45%]"></div>

                {/* Central Node & Icon */}
                <div className="absolute left-4 md:left-1/2 transform -translate-x-1/2 z-20 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-2 border-purple-400 bg-slate-900 shadow-[0_0_20px_rgba(168,85,247,0.6)] flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                </div>

                {/* Content Card */}
                <div className="w-full md:w-[45%] pl-16 md:pl-0">
                  <div className={`p-6 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-purple-500/30 shadow-xl relative group transition-all duration-300 hover:border-purple-400/60 hover:shadow-[0_0_25px_rgba(168,85,247,0.15)]`}>
                    
                    {/* Connecting Line (Desktop) */}
                    <div className={`hidden md:block absolute top-1/2 transform -translate-y-1/2 w-8 h-[2px] bg-purple-500/30 ${isEven ? 'left-full' : 'right-full'}`}></div>

                    <div className="inline-block px-3 py-1 mb-4 text-xs font-bold font-exo text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-full">
                      {t(`team.timeline.${item.id}.date`)}
                    </div>
                    
                    <h3 className="text-xl font-bold font-exo text-white mb-2 group-hover:text-purple-300 transition-colors">
                      {t(`team.timeline.${item.id}.title`)}
                    </h3>
                    
                    <p className="text-slate-300 font-lato text-sm leading-relaxed">
                      {t(`team.timeline.${item.id}.description`)}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
