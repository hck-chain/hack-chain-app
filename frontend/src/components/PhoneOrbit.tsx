import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { walletConnectProjectId } from '@/config/walletConfig';
import { radius } from '@reown/appkit/networks';

const INNER_RADIUS = 215;
const OUTER_RADIUS = 332;

const FALLBACK_INNER_ICONS = [
  { src: '/icons/metamask.svg', name: 'MetaMask', sz: 48 },
  { src: '/icons/rainbow.svg', name: 'Rainbow', sz: 44 },
  { src: '/icons/phantom.svg', name: 'Phantom', sz: 44 },
  { src: '/icons/coinbase.svg', name: 'Coinbase', sz: 48 },
  { src: '/icons/trust.svg', name: 'Trust', sz: 44 },
  { src: '/icons/ledger.svg', name: 'Ledger', sz: 44 },
];

const FALLBACK_OUTER_ICONS = [
  { src: '/icons/safe.svg', name: 'Safe', sz: 36 },
  { src: '/icons/argent.svg', name: 'Argent', sz: 36 },
  { src: '/icons/okx.svg', name: 'OKX', sz: 34 },
  { src: '/icons/brave.svg', name: 'Brave', sz: 34 },
];

type WalletIcon = { src: string; name: string; sz?: number };

type WalletConnectWallet = {
  name?: string;
  image_url?: {
    sm?: string;
    md?: string;
    lg?: string;
  };
};

type WalletConnectResponse = {
  listings?: Record<string, WalletConnectWallet>;
};

interface OrbitRingProps {
  icons: WalletIcon[];
  radius: number;
  baseOffset?: number;
  defaultSize: number;
}

// Icons are positioned using CSS custom property --rot set on the parent container.
// Each icon transform: rotate(baseAngle + --rot) translateX(radius) rotate(-baseAngle - --rot)
// The counter-rotation keeps icons upright as the ring spins.
const OrbitRing = ({ icons, radius, baseOffset = 0, defaultSize }: OrbitRingProps) => {
  const count = icons.length;
  return (
    <>
      {icons.map((icon, i) => {
        const baseDeg = (360 / count) * i + baseOffset;
        const iconSize = icon.sz ?? defaultSize;
        const tileSize = iconSize;
        return (
          <div
            key={icon.name}
            aria-hidden
            className="absolute"
            style={{
              width: tileSize,
              height: tileSize,
              left: '50%',
              top: '50%',
              marginLeft: -tileSize / 2,
              marginTop: -tileSize / 2,
              transform: `rotate(calc(var(--rot, 0deg) + ${baseDeg}deg)) translateX(${radius}px) rotate(calc(-1 * var(--rot, 0deg) - ${baseDeg}deg))`,
              willChange: 'transform',
            }}
          >
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
              <img
                src={icon.src}
                alt={icon.name}
                loading="lazy"
                className="object-contain rounded-full"
                style={{ width: iconSize, height: iconSize }}
              />
            </div>
          </div>
        );
      })}
    </>
  );
};

const PhoneOrbit = () => {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);

  const [innerIcons, setInnerIcons] = useState<WalletIcon[]>(FALLBACK_INNER_ICONS);
  const [outerIcons, setOuterIcons] = useState<WalletIcon[]>(FALLBACK_OUTER_ICONS);

  // Scroll-driven rotation — updates CSS variable directly, zero React re-renders
  useEffect(() => {
    const section = sectionRef.current;
    const orbit = orbitRef.current;
    if (!section || !orbit) return;

    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when section top hits bottom of viewport, 1 when section bottom exits top
      const progress = Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height)));
      orbit.style.setProperty('--rot', `${progress * 360}deg`);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadWalletConnectIcons = async () => {
      try {
        const url = `https://explorer-api.walletconnect.com/v3/wallets?projectId=${walletConnectProjectId}&entries=30&page=1`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) return;
        const data = (await res.json()) as WalletConnectResponse;
        const listings = data.listings ?? {};
        const wallets = Object.values(listings)
          .map((wallet) => {
            const imageUrl = wallet.image_url?.md || wallet.image_url?.sm || wallet.image_url?.lg;
            return imageUrl && wallet.name ? { src: imageUrl, name: wallet.name } : null;
          })
          .filter((wallet): wallet is WalletIcon => Boolean(wallet));

        if (wallets.length < 10) return;

        setInnerIcons(wallets.slice(0, 10));
        setOuterIcons(wallets.slice(10, 24));
      } catch (_error) {
        // Keep fallback icons on failure.
      }
    };

    loadWalletConnectIcons();

    return () => controller.abort();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-36 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #050508 0%, #0a0118 18%, #0d0320 50%, #0a0118 82%, #050508 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section divider */}
        <div className="flex items-center gap-6 mb-14">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <span className="font-title text-[10px] uppercase tracking-[0.32em] text-white/30 font-bold select-none shrink-0">
            {t('marquee.eyebrow')}
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>

        {/* Heading */}
        <motion.div
          className="flex flex-col items-center text-center mb-20 md:mb-28"
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

          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 font-body text-sm md:text-base text-white/70 font-semibold">
            <span>{t('marquee.stat1')}</span>
            <span aria-hidden className="w-1 h-1 rounded-full bg-fuchsia-400/70 shadow-[0_0_8px_rgba(232,121,249,0.7)]" />
            <span>{t('marquee.stat2')}</span>
            <span aria-hidden className="w-1 h-1 rounded-full bg-fuchsia-400/70 shadow-[0_0_8px_rgba(232,121,249,0.7)]" />
            <span>{t('marquee.stat3')}</span>
          </div>
        </motion.div>
      </div>

      {/* Orbit scene — full-bleed, icons + phone centered */}
      <div
        ref={orbitRef}
        className="relative mx-auto"
        style={{ height: 820 }}
        aria-hidden
      >
        {/* Ambient glow behind phone */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 620,
            height: 620,
            background:
              'radial-gradient(ellipse 55% 55% at 50% 50%, rgba(139,92,246,0.22) 0%, rgba(168,85,247,0.07) 55%, transparent 72%)',
          }}
        />

        {/* Outer ring guide — subtle */}
        <div
          className="absolute rounded-full border border-white/[0.04] pointer-events-none"
          style={{
            width: OUTER_RADIUS * 2,
            height: OUTER_RADIUS * 2,
            left: '50%',
            top: '50%',
            marginLeft: -OUTER_RADIUS,
            marginTop: -OUTER_RADIUS,
          }}
        />
        <div
          className="absolute rounded-full border border-white/[0.04] pointer-events-none"
          style={{
            width: INNER_RADIUS * 2,
            height: INNER_RADIUS * 2,
            left: '50%',
            top: '50%',
            marginLeft: -INNER_RADIUS,
            marginTop: -INNER_RADIUS,
          }}
        />

        {/* Horizontal luminous line — passes behind icons and phone */}
        <svg
          className="absolute pointer-events-none"
          style={{ left: 0, top: 0, width: '100%', height: '100%', zIndex: 0 }}
          viewBox="0 0 1200 820"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <defs>
            <linearGradient id="orbitLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="hsl(280 100% 65%)" stopOpacity="0" />
              <stop offset="18%"  stopColor="hsl(280 100% 65%)" stopOpacity="1" />
              <stop offset="50%"  stopColor="hsl(245 80%  65%)" stopOpacity="0.85" />
              <stop offset="82%"  stopColor="hsl(140 100% 50%)" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(140 100% 50%)" stopOpacity="0" />
            </linearGradient>
            <filter id="orbitLineGlow" x="-5%" y="-800%" width="110%" height="1700%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <motion.path
            d="M 0 410 Q 300 370, 600 410 T 1200 410"
            stroke="url(#orbitLineGrad)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            filter="url(#orbitLineGlow)"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 2.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        </svg>

        {/* Orbit rings — positions driven by --rot CSS var */}
        <OrbitRing icons={innerIcons} radius={INNER_RADIUS} defaultSize={58} />
        <OrbitRing icons={outerIcons} radius={OUTER_RADIUS} baseOffset={24} defaultSize={46} />

        {/* iPhone 15 Pro frame */}
        <div
          className="absolute"
          style={{
            width: 300,
            height: 620,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
          }}
        >
          {/* Titanium outer shell */}
          <div
            className="absolute inset-0 rounded-[54px]"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.08) 100%)',
              boxShadow:
                '0 0 0 1px rgba(255,255,255,0.07), 0 0 80px rgba(139,92,246,0.3), 0 40px 100px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.12)',
            }}
          />

          {/* Screen bezel */}
          <div
            className="absolute overflow-hidden bg-black"
            style={{
              inset: 7,
              borderRadius: 47,
            }}
          >
            <img
              src="/images/screen.webp"
              alt="HackChain app screen"
              className="w-full h-full object-contain"
              style={{ objectPosition: '50% 30%' }}
            />
          </div>

          {/* Dynamic island */}
          <div
            className="absolute bg-black rounded-full z-20"
            style={{
              top: 18,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 130,
              height: 37,
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
            }}
          />

          {/* Power button — right side */}
          <div
            className="absolute rounded-r-sm"
            style={{
              right: -4,
              top: 140,
              width: 4,
              height: 79,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.14), rgba(255,255,255,0.08))',
            }}
          />

          {/* Mute switch — left side */}
          <div
            className="absolute rounded-l-sm"
            style={{
              left: -4,
              top: 88,
              width: 4,
              height: 33,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.14), rgba(255,255,255,0.08))',
            }}
          />

          {/* Volume up — left side */}
          <div
            className="absolute rounded-l-sm"
            style={{
              left: -4,
              top: 137,
              width: 4,
              height: 56,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.14), rgba(255,255,255,0.08))',
            }}
          />

          {/* Volume down — left side */}
          <div
            className="absolute rounded-l-sm"
            style={{
              left: -4,
              top: 207,
              width: 4,
              height: 56,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.14), rgba(255,255,255,0.08))',
            }}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 md:mt-32">
        <motion.div
          className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-start"
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-120px' }}
          transition={{ type: 'spring', stiffness: 70, damping: 18 }}
        >
          <div>
            <p className="font-title text-[11px] uppercase tracking-[0.35em] text-white/45 font-bold mb-5">
              {t('educatorDashboard.eyebrow')}
            </p>
            <h3 className="font-title text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.06] text-white mb-6">
              {t('educatorDashboard.title1')}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-purple-400">
                {t('educatorDashboard.title2')}
              </span>
            </h3>
            <p className="font-body text-lg sm:text-xl text-white/60 leading-relaxed mb-4 max-w-2xl">
              {t('educatorDashboard.subtitle')}
            </p>
            <p className="font-body text-base sm:text-lg text-white/50 leading-relaxed mb-8 max-w-2xl">
              {t('educatorDashboard.detail')}
            </p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <img
              src="/images/encuadreDashboard.webp"
              alt="Educator dashboard"
              loading="lazy"
              className="w-full max-w-sm object-contain rounded-2xl"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PhoneOrbit;
