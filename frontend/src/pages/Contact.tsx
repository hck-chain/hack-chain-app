import { useTranslation } from 'react-i18next';
import { Mail, User, Award, Building, Info, Handshake, LifeBuoy, ShieldAlert, Send } from 'lucide-react';
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
      icon: (
        <div className="bg-pink-400 rounded-md p-1 flex items-center justify-center shadow-[0_0_10px_rgba(236,72,153,0.4)]">
          <img src="/icons/talentExperience.avif" alt="Talent" className="w-5 h-5 object-contain" />
        </div>
      ),
      faqIndex: 2,
      color: 'text-pink-400',
      border: 'border-pink-500/40',
      activeBg: 'bg-pink-500/10',
    },
    {
      key: 'educator',
      label: t('contact.roleEducator'),
      icon: (
        <div className="bg-blue-400 rounded-md p-1 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.4)]">
          <img src="/icons/educatorExperience.avif" alt="Educator" className="w-5 h-5 object-contain" />
        </div>
      ),
      faqIndex: 3,
      color: 'text-blue-400',
      border: 'border-blue-500/40',
      activeBg: 'bg-blue-500/10',
    },
    {
      key: 'recruiter',
      label: t('contact.roleRecruiter'),
      icon: (
        <div className="bg-green-400 rounded-md p-1 flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.4)]">
          <img src="/icons/recruiterExperience.avif" alt="Recruiter" className="w-5 h-5 object-contain" />
        </div>
      ),
      faqIndex: 4,
      color: 'text-green-400',
      border: 'border-green-500/40',
      activeBg: 'bg-green-500/10',
    },
  ];

  const activeRoleData = roles.find(r => r.key === activeRole)!;
  const activeFaq = faqItems[activeRoleData.faqIndex];

  return (
    <div className="relative min-h-screen flex flex-col bg-[#0B0B0F] font-body overflow-x-hidden">
      <BackgroundAnimation />
      <Navbar />

      <main className="flex-1 z-10 w-full max-w-4xl mx-auto px-4 pt-28 sm:pt-36 pb-24">

        {/* Page header */}
        <section
          className="mb-16 animate-in fade-in slide-in-from-bottom-6 duration-700"
          style={{ animationDelay: '0ms', animationFillMode: 'both' }}
        >
          <h1 className="text-5xl md:text-6xl font-title font-black text-white mb-4 tracking-tight">
            {t('contact.title')}{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 drop-shadow-[0_0_28px_rgba(168,85,247,0.55)]">{t('contact.titleHighlight')}</span>
          </h1>
          <p className="text-white/60 font-body text-lg font-medium max-w-lg">
            {t('contact.subtitle')}
          </p>
        </section>

        {/* General questions */}
        <section
          className="mb-20 animate-in fade-in slide-in-from-bottom-6 duration-700"
          style={{ animationDelay: '150ms', animationFillMode: 'both' }}
        >
          <p className="text-xs font-title font-bold tracking-[0.22em] uppercase text-white/35 mb-10">
            {t('contact.generalLabel')}
          </p>

          <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 items-start">
            {[faqItems[0], faqItems[1]].map((item, i) => (
              <div key={i} className="flex flex-col gap-3 self-start">
                <h2 className="font-title font-bold text-white text-xl leading-snug">
                  {item.question}
                </h2>
                <p className="text-white/60 font-body text-base leading-relaxed font-medium">
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
          <p className="text-xs font-title font-bold tracking-[0.22em] uppercase text-white/35 mb-6">
            {t('contact.rolesLabel')}
          </p>

          <div className="flex gap-2 mb-8 flex-wrap">
            {roles.map(role => (
              <button
                key={role.key}
                onClick={() => setActiveRole(role.key)}
                className={`flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full border font-body text-xs sm:text-sm font-semibold transition-all duration-200
                  ${activeRole === role.key
                    ? `${role.activeBg} ${role.border} ${role.color}`
                    : 'border-white/10 text-white/60 hover:border-white/20 hover:text-white bg-transparent'
                  }`}
              >
                {role.icon}
                {role.label}
              </button>
            ))}
          </div>

          <div className={`rounded-2xl border p-8 transition-all duration-300 glass hover:glass-hover ${activeRoleData.border}`}>
            <p className={`text-xs font-title font-bold tracking-[0.22em] uppercase mb-4 ${activeRoleData.color}`}>
              {activeRoleData.label}
            </p>
            <h3 className="font-title font-bold text-white text-2xl md:text-3xl mb-4 leading-snug">
              {activeFaq.question}
            </h3>
            <p className="text-white/60 font-body text-base leading-relaxed font-medium">
              {activeFaq.answer}
            </p>
          </div>
        </section>

        {/* Contact Directory */}
        <div className="relative flex items-center mb-16">
          <div className="flex-1 h-px bg-white/10" />
          <span className="mx-5 text-xs font-title tracking-[0.22em] font-bold uppercase text-white/35">
            {t('contact.directoryTitle')}
          </span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { key: 'contacto', icon: <Info className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', hover: 'hover:border-blue-500/50' },
            { key: 'colaboraciones', icon: <Handshake className="w-5 h-5" />, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', hover: 'hover:border-pink-500/50' },
            { key: 'soporte', icon: <LifeBuoy className="w-5 h-5" />, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', hover: 'hover:border-orange-500/50' },
            { key: 'talentos', icon: <User className="w-5 h-5" />, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', hover: 'hover:border-purple-500/50' },
            { key: 'educadores', icon: <Award className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', hover: 'hover:border-emerald-500/50' },
            { key: 'reclutadores', icon: <Building className="w-5 h-5" />, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', hover: 'hover:border-cyan-500/50' },
            { key: 'bugbounty', icon: <ShieldAlert className="w-5 h-5" />, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', hover: 'hover:border-red-500/50' }
          ].map((item, i) => {
            const email = t(`contact.directory.${item.key}.email`);
            const desc = t(`contact.directory.${item.key}.desc`);
            const subject = encodeURIComponent(t(`contact.directory.${item.key}.subject`));
            const body = encodeURIComponent(t(`contact.directory.${item.key}.body`));
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`;

            return (
            <div 
              key={i} 
              className={`relative flex flex-col p-5 rounded-2xl border ${item.border} ${item.bg} backdrop-blur-sm transition-all duration-300 group overflow-hidden`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-[#0B0B0F]/50 ${item.color}`}>
                  {item.icon}
                </div>
              </div>
              <h4 className={`font-title font-bold text-[15px] mb-2 truncate transition-colors duration-300 group-hover:text-white/30 text-white`} title={email}>
                {email}
              </h4>
              <p className="text-white/60 font-body font-medium text-xs leading-relaxed mt-auto transition-colors duration-300 group-hover:text-white/20">
                {desc}
              </p>

              {/* Hover Overlay Button */}
              <div className="absolute inset-0 bg-[#0B0B0F]/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                <a 
                  href={gmailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border ${item.border} ${item.color} ${item.hover} hover:bg-white/10 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0`}
                >
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-semibold font-title tracking-wide">{t('contact.openInGmail', 'Abrir en Gmail')}</span>
                </a>
              </div>
            </div>
            );
          })}
        </section>


      </main>

      <Footer />
    </div>
  );
};

export default Contact;
