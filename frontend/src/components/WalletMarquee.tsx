import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const ROW_A = [
  { src: '/icons/metamask.svg', name: 'MetaMask' },
  { src: '/icons/coinbase.svg', name: 'Coinbase Wallet' },
  { src: '/icons/rainbow.svg',  name: 'Rainbow' },
  { src: '/icons/phantom.svg',  name: 'Phantom' },
  { src: '/icons/safe.svg',     name: 'Safe' },
  { src: '/icons/argent.svg',   name: 'Argent' },
];

const ROW_B = [
  { src: '/icons/trust.svg',  name: 'Trust Wallet' },
  { src: '/icons/ledger.svg', name: 'Ledger Live' },
  { src: '/icons/okx.svg',    name: 'OKX Wallet' },
  { src: '/icons/brave.svg',  name: 'Brave Wallet' },
  { src: '/icons/metamask.svg', name: 'MetaMask' },
  { src: '/icons/rainbow.svg',  name: 'Rainbow' },
];

type Wallet = { src: string; name: string };

const Tile = ({ wallet }: { wallet: Wallet }) => (
  <div className="shrink-0 flex flex-col items-center gap-3 group">
    <div className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-[1.5rem] overflow-hidden border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.45)] group-hover:border-white/25 group-hover:-translate-y-1.5 group-hover:scale-[1.06] transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-fuchsia-500/0 to-pink-500/0 group-hover:from-purple-500/15 group-hover:via-fuchsia-500/10 group-hover:to-pink-500/15 transition-all duration-300" />
      <img
        src={wallet.src}
        alt={wallet.name}
        loading="lazy"
        className="relative w-full h-full object-contain p-3"
      />
    </div>
    <span className="font-body text-[11px] sm:text-xs text-white/35 group-hover:text-white/80 transition-colors duration-300 whitespace-nowrap font-medium tracking-wide">
      {wallet.name}
    </span>
  </div>
);

const Row = ({
  items,
  animationClass,
  gap = 'gap-8 sm:gap-12',
}: {
  items: Wallet[];
  animationClass: string;
  gap?: string;
}) => {
  const tripled = [...items, ...items, ...items];
  return (
    <div className={`flex w-max ${gap} ${animationClass}`}>
      {tripled.map((w, i) => (
        <Tile key={`${w.name}-${i}`} wallet={w} />
      ))}
    </div>
  );
};

const WalletMarquee = () => {
  const { t } = useTranslation();

  return (
    <section className="pt-20 pb-24 md:pt-28 md:pb-32 relative">

      {/* Section divider line */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14 md:mb-20">
        <div className="flex items-center gap-6 mb-12">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <span className="font-title text-[10px] uppercase tracking-[0.32em] text-white/30 font-bold select-none shrink-0">
            {t('marquee.eyebrow')}
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>

        {/* Heading block */}
        <motion.div
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        >
          <h2 className="font-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6 max-w-4xl">
            {t('marquee.title1')}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 drop-shadow-[0_0_28px_rgba(168,85,247,0.45)]">
              {t('marquee.title2')}
            </span>
          </h2>

          <p className="font-body text-base sm:text-lg md:text-xl text-white/55 max-w-2xl leading-relaxed font-medium mb-10">
            {t('marquee.subtitle')}
          </p>

          {/* Stats inline — separated by glowing dots */}
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 font-body text-sm md:text-base text-white/70 font-semibold">
            <span>{t('marquee.stat1')}</span>
            <span aria-hidden className="w-1 h-1 rounded-full bg-fuchsia-400/70 shadow-[0_0_8px_rgba(232,121,249,0.7)]" />
            <span>{t('marquee.stat2')}</span>
            <span aria-hidden className="w-1 h-1 rounded-full bg-fuchsia-400/70 shadow-[0_0_8px_rgba(232,121,249,0.7)]" />
            <span>{t('marquee.stat3')}</span>
          </div>
        </motion.div>
      </div>

      {/* Full-bleed marquee — outside max-w container so it goes edge to edge */}
      <div className="relative overflow-hidden">
        {/* Fade edges */}
        <div className="absolute inset-y-0 left-0 w-24 sm:w-40 z-10 pointer-events-none bg-gradient-to-r from-[#050508] via-[#050508]/90 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-24 sm:w-40 z-10 pointer-events-none bg-gradient-to-l from-[#050508] via-[#050508]/90 to-transparent" />

        <div className="space-y-8">
          <Row items={ROW_A} animationClass="animate-marquee-slow" />
          <Row items={ROW_B} animationClass="animate-marquee-reverse" />
        </div>
      </div>
    </section>
  );
};

export default WalletMarquee;
