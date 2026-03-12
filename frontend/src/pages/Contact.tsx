import { useTranslation } from 'react-i18next';
import { Mail, User, Award, Building } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackgroundAnimation from '@/components/BackgroundAnimation';

interface FaqItem {
  question: string;
  answer: string;
}

type Role = 'talent' | 'educator' | 'recruiter';

const Contact = () => {
  const { t } = useTranslation();
  const faqItems = t('faq.items', { returnObjects: true }) as FaqItem[];

  const [activeRole, setActiveRole] = useState<Role>('talent');

  const openGmail = () => {
    const subject = encodeURIComponent(t('contact.emailSubject'));
    window.open(
      `https://mail.google.com/mail/?view=cm&to=hackchain13@gmail.com&su=${subject}`,
      '_blank'
    );
  };

  const roles: {
    key: Role;
    label: string;
    icon: React.ReactNode;
    faqIndex: number;
    color: string;
    border: string;
    activeBg: string;
  }[] = [
    {
      key: 'talent',
      label: t('contact.roleTalent'),
      icon: <User className="w-5 h-5" />,
      faqIndex: 2,
      color: 'text-purple-400',
      border: 'border-purple-500/40',
      activeBg: 'bg-purple-500/10',
    },
    {
      key: 'educator',
      label: t('contact.roleEducator'),
      icon: <Award className="w-5 h-5" />,
      faqIndex: 3,
      color: 'text-blue-400',
      border: 'border-blue-500/40',
      activeBg: 'bg-blue-500/10',
    },
    {
      key: 'recruiter',
      label: t('contact.roleRecruiter'),
      icon: <Building className="w-5 h-5" />,
      faqIndex: 4,
      color: 'text-cyan-400',
      border: 'border-cyan-500/40',
      activeBg: 'bg-cyan-500/10',
    },
  ];

  const activeRoleData = roles.find(r => r.key === activeRole)!;
  const activeFaq = faqItems[activeRoleData.faqIndex];

  return (
    <div className="relative min-h-screen flex flex-col bg-[#0B0B0F] font-lato overflow-x-hidden">
      <BackgroundAnimation />
      <Navbar />

      <main className="flex-1 z-10 w-full max-w-4xl mx-auto px-4 pt-28 sm:pt-36 pb-24">

        {/* Page header */}
        <section
          className="mb-16 animate-in fade-in slide-in-from-bottom-6 duration-700"
          style={{ animationDelay: '0ms', animationFillMode: 'both' }}
        >
          <h1 className="text-5xl md:text-6xl font-exo font-bold text-white mb-4">
            {t('contact.title')}{' '}
            <span className="gradient-text">{t('contact.titleHighlight')}</span>
          </h1>
          <p className="text-gray-400 text-base max-w-lg">
            {t('contact.subtitle')}
          </p>
        </section>

        {/* General questions */}
        <section
          className="mb-20 animate-in fade-in slide-in-from-bottom-6 duration-700"
          style={{ animationDelay: '150ms', animationFillMode: 'both' }}
        >
          <p className="text-xs font-exo font-semibold tracking-[0.3em] uppercase text-blue-400 mb-10">
            {t('contact.generalLabel')}
          </p>

          <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 items-start">
            {[faqItems[0], faqItems[1]].map((item, i) => (
              <div key={i} className="flex flex-col gap-3 self-start">
                <h2 className="font-exo font-semibold text-white text-lg leading-snug">
                  {item.question}
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Role-based FAQ */}
        <section
          className="mb-20 animate-in fade-in slide-in-from-bottom-6 duration-700"
          style={{ animationDelay: '300ms', animationFillMode: 'both' }}
        >
          <p className="text-xs font-exo font-semibold tracking-[0.3em] uppercase text-blue-400 mb-6">
            {t('contact.rolesLabel')}
          </p>

          <div className="flex gap-2 mb-8 flex-wrap">
            {roles.map(role => (
              <button
                key={role.key}
                onClick={() => setActiveRole(role.key)}
                className={`flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full border font-exo text-xs sm:text-sm font-semibold transition-all duration-200
                  ${activeRole === role.key
                    ? `${role.activeBg} ${role.border} ${role.color}`
                    : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white bg-transparent'
                  }`}
              >
                {role.icon}
                {role.label}
              </button>
            ))}
          </div>

          <div className={`rounded-2xl border p-8 transition-all duration-300 ${activeRoleData.activeBg} ${activeRoleData.border}`}>
            <p className={`text-xs font-exo font-semibold tracking-widest uppercase mb-4 ${activeRoleData.color}`}>
              {activeRoleData.label}
            </p>
            <h3 className="font-exo font-bold text-white text-xl md:text-2xl mb-4 leading-snug">
              {activeFaq.question}
            </h3>
            <p className="text-gray-300 leading-relaxed">
              {activeFaq.answer}
            </p>
          </div>
        </section>

        {/* Contact CTA */}
        <div className="relative flex items-center mb-16">
          <div className="flex-1 h-px bg-white/10" />
          <span className="mx-5 text-xs font-exo tracking-widest uppercase text-gray-500">
            {t('contact.stillQuestions')}
          </span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <section className="text-center">
          <h2 className="font-exo font-bold text-white text-2xl mb-2">
            {t('contact.directTitle')}
          </h2>
          <p className="text-gray-400 text-sm mb-8">
            {t('contact.directSubtitle')}
          </p>
          <Button
            onClick={openGmail}
            className="gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-exo px-8 py-5 text-base tracking-wide transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/25"
          >
            <Mail className="h-5 w-5" />
            {t('contact.sendBtn')}
          </Button>
          <p className="text-gray-600 text-xs mt-4">hackchain13@gmail.com</p>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default Contact;
