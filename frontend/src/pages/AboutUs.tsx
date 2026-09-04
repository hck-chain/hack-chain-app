import React from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import Navbar from '@/components/Navbar';
import { TeamMemberCard } from '@/components/TeamMemberCard';
import { Timeline } from '@/components/Timeline';
import { motion } from 'framer-motion';

const AboutUs = () => {
  const { t } = useTranslation();

  const teamMembers = [
    {
      name: 'Emmanuel Pastor',
      role: t('team.roles.ceo'),
      imageUrl: '/images/team/Emmanuel Pastor.png',
      linkedinUrl: 'https://www.linkedin.com/in/juan-emmanuel-pastor-dominguez-a66787300/'
    },
    {
      name: 'Ainhoa López',
      role: t('team.roles.ciso'),
      imageUrl: '/images/team/Ainhoa Lopez.png',
      linkedinUrl: 'https://www.linkedin.com/in/ainhoa-lópez-perelló-2351b72ba/'
    },
    {
      name: 'Héctor Ledesma',
      role: t('team.roles.cto'),
      imageUrl: '/images/team/Hector Ledesma.png',
      linkedinUrl: 'www.linkedin.com/in/héctor-raciel-ledesma-vázquez-a67136311'
    },
    {
      name: 'Giana Cantarini',
      role: t('team.roles.cmo'),
      imageUrl: '/images/team/Giana Cantarini.png',
      linkedinUrl: 'https://www.linkedin.com/in/giana-cantarini/'
    },
    {
      name: 'Luis Soto',
      role: t('FullStack Developer'),
      imageUrl: '/images/team/Luis Soto.png',
      linkedinUrl: 'https://www.linkedin.com/in/luis-alberto-soto-zarate-89a143326/'
    },
    {
      name: 'Carlos Diaz',
      role: t('FullStack Developer'),
      imageUrl: '/images/team/Carlos Diaz.png',
      linkedinUrl: 'https://www.linkedin.com/in/cgds1/'
    },
    {
      name: 'Fernando Anastasia',
      role: t('FullStack Developer'),
      imageUrl: '/images/team/Fernando Anastasia.png',
      linkedinUrl: 'https://www.linkedin.com/in/fernandoanastasia1/'
    },
    {
      name: 'Angel Peguero',
      role: t('DevOps Engineer'),
      imageUrl: '/images/team/Angel Peguero.png',
      linkedinUrl: 'https://www.linkedin.com/in/angel-peguero/'
    },
    {
      name: 'Julián Ruiz',
      role: t('Blockchain Engineer'),
      imageUrl: '/images/team/Julian Ruiz.png',
      linkedinUrl: 'https://www.linkedin.com/in/julian-ruiz-v/'
    },
    {
      name: 'Victor Reyes',
      role: t('Blockchain Developer'),
      imageUrl: '/images/team/Victor Reyes.png',
      linkedinUrl: 'https://www.linkedin.com/in/v%C3%ADctor-reyes-cazorla-75361b10b/'
    },
    {
      name: 'Alido de Leon',
      role: t('Cyber Threat Hunter'),
      imageUrl: '/images/team/Alido de Leon.png',
      linkedinUrl: 'https://www.linkedin.com/in/alido-de-leon-8b0a9233b/'
    },
    {
      name: 'Pol Ribera',
      role: t('Blockchain Developer'),
      imageUrl: '/images/team/Pol Ribera.png',
      linkedinUrl: 'https://www.linkedin.com/in/pol-ribera-moreno-084a46344/'
    }
    
  ];

  return (
    <Layout>
      <Navbar />
      <main className="pt-32 pb-24">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="mb-20 flex flex-col md:flex-row items-start md:items-center gap-6"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-title font-black text-white tracking-tight drop-shadow-md">
              {t('team.title')}{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 drop-shadow-[0_0_28px_rgba(168,85,247,0.55)]">
                {t('team.subtitle')}
              </span>
            </h1>
            <div className="hidden md:block h-[2px] bg-white/10 flex-grow mt-2"></div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="animate-in fade-in slide-in-from-bottom-[20px] fill-mode-both"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <TeamMemberCard
                  name={member.name}
                  role={member.role}
                  imageUrl={member.imageUrl}
                  linkedinUrl={member.linkedinUrl}
                />
              </div>
            ))}
          </div>
        </section>

        <div className="mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12"
          >
            <div className="hidden md:block h-[2px] bg-white/10 flex-grow mt-2"></div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-title font-black text-white tracking-tight">
              {t('team.aboutBlock.title')}
            </h2>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-3xl font-body text-white/60 md:text-lg font-medium leading-relaxed space-y-6"
          >
            <p>
              {t('team.aboutBlock.p1')}
            </p>
            <p>
              {t('team.aboutBlock.p2')}
            </p>
            <p className="pb-12">
              {t('team.aboutBlock.p3')}
            </p>
          </motion.div>
        </div>

        {/* Timeline Section */}
        <div className="relative z-10 border-t border-purple-500/20 pt-12 mt-12">
          <Timeline />
        </div>
      </main>
    </Layout>
  );
};

export default AboutUs;
