import { useTranslation } from 'react-i18next';

/* ─────────────────────────────────────────────────────────────────────────────
   Placeholder "screenshots" — pure CSS mockups of each HackChain screen.
   Replace the <PlaceholderXxx /> components with:
     <img src="/screenshots/xxx.webp" className="w-full h-full object-cover object-top" />
   or:
     <video autoPlay muted loop playsInline src="/clips/xxx.webm" className="w-full h-full object-cover" />
   ──────────────────────────────────────────────────────────────────────────── */

const FakeNav = ({ accent }: { accent: string }) => (
  <div className="h-8 bg-black/40 flex items-center px-3 gap-3 border-b border-white/5 shrink-0">
    <div className={`w-2 h-2 rounded-full ${accent}`} />
    <div className="h-1.5 w-16 rounded bg-white/10" />
    <div className="flex-1" />
    <div className="h-1.5 w-8 rounded bg-white/10" />
    <div className="h-1.5 w-8 rounded bg-white/10" />
  </div>
);

const PlaceholderTalent = () => (
  <div className="w-full h-full bg-gradient-to-br from-[#0d0d1a] to-[#120d1f] flex flex-col">
    <FakeNav accent="bg-purple-500" />
    <div className="p-3 flex flex-col gap-2 overflow-hidden">
      <div className="flex gap-2 items-center">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shrink-0" />
        <div className="flex flex-col gap-1">
          <div className="h-2 w-24 rounded bg-white/30" />
          <div className="h-1.5 w-16 rounded bg-purple-400/40" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-1">
        {['Skills', 'Certs', 'Score', 'Jobs'].map((l) => (
          <div key={l} className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-2">
            <div className="h-1.5 w-10 rounded bg-purple-400/50 mb-1" />
            <div className="h-3 w-14 rounded bg-white/20" />
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-white/5 border border-white/10 p-2 space-y-1.5 mt-1">
        {[80, 60, 90, 70].map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-1.5 w-12 rounded bg-white/10" />
            <div className="flex-1 h-1.5 rounded-full bg-white/5">
              <div className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${w}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PlaceholderCertificate = () => (
  <div className="w-full h-full bg-gradient-to-br from-[#0d0f0a] to-[#0a0d1a] flex flex-col">
    <FakeNav accent="bg-yellow-400" />
    <div className="p-3 flex flex-col gap-2">
      <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-3 flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
          <div className="w-5 h-5 rounded border-2 border-white/80" />
        </div>
        <div className="h-2 w-32 rounded bg-yellow-400/60" />
        <div className="h-1.5 w-20 rounded bg-white/20" />
        <div className="flex gap-1 mt-1">
          {[1,2,3].map(i => <div key={i} className="h-1.5 w-10 rounded bg-yellow-400/20" />)}
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 rounded-lg bg-white/5 border border-white/10 p-2">
          <div className="h-1.5 w-12 rounded bg-white/15 mb-1" />
          <div className="h-2 w-16 rounded bg-yellow-400/40" />
        </div>
        <div className="flex-1 rounded-lg bg-white/5 border border-white/10 p-2">
          <div className="h-1.5 w-12 rounded bg-white/15 mb-1" />
          <div className="h-2 w-14 rounded bg-green-400/40" />
        </div>
      </div>
    </div>
  </div>
);

const PlaceholderEducator = () => (
  <div className="w-full h-full bg-gradient-to-br from-[#080d1a] to-[#0d0818] flex flex-col">
    <FakeNav accent="bg-blue-400" />
    <div className="p-3 flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 shrink-0" />
        <div className="flex flex-col gap-1">
          <div className="h-2 w-20 rounded bg-white/30" />
          <div className="h-1.5 w-28 rounded bg-blue-400/40" />
        </div>
      </div>
      <div className="space-y-1.5">
        {['Advanced Solidity', 'Web3 Basics', 'DeFi Protocols'].map((c, i) => (
          <div key={c} className="rounded-lg bg-blue-500/8 border border-blue-500/20 p-2 flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-500/30 shrink-0" />
            <div className="flex-1">
              <div className="h-1.5 rounded bg-white/20 mb-1" style={{ width: `${[70, 55, 80][i]}%` }} />
              <div className="h-1 rounded bg-blue-400/30 w-12" />
            </div>
            <div className="w-5 h-5 rounded-full bg-blue-400/20 border border-blue-400/30" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PlaceholderRecruiter = () => (
  <div className="w-full h-full bg-gradient-to-br from-[#090d0a] to-[#080f10] flex flex-col">
    <FakeNav accent="bg-emerald-400" />
    <div className="p-3 flex flex-col gap-2">
      <div className="h-6 rounded-lg bg-white/5 border border-white/10 flex items-center px-2 gap-1">
        <div className="w-3 h-3 rounded-full bg-white/10" />
        <div className="h-1.5 w-20 rounded bg-white/10" />
      </div>
      <div className="space-y-1.5">
        {[85, 92, 78].map((score, i) => (
          <div key={i} className="rounded-lg bg-emerald-500/8 border border-emerald-500/20 p-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shrink-0" />
            <div className="flex-1">
              <div className="h-1.5 rounded bg-white/25 mb-1 w-24" />
              <div className="h-1 rounded bg-emerald-400/40 w-16" />
            </div>
            <div className="text-[8px] font-bold text-emerald-400 bg-emerald-400/10 rounded px-1 py-0.5">
              {score}%
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PlaceholderRegister = () => (
  <div className="w-full h-full bg-gradient-to-br from-[#0a080f] to-[#0d0a18] flex flex-col items-center justify-center gap-2 px-3">
    <div className="h-2 w-32 rounded bg-white/30 mb-1" />
    <div className="h-1.5 w-24 rounded bg-white/15" />
    <div className="w-full grid grid-cols-3 gap-1.5 mt-2">
      {[
        { c: 'from-pink-500/30 to-rose-500/20', b: 'border-pink-500/30' },
        { c: 'from-blue-500/30 to-cyan-500/20', b: 'border-blue-500/30' },
        { c: 'from-emerald-500/30 to-teal-500/20', b: 'border-emerald-500/30' },
      ].map((s, i) => (
        <div key={i} className={`rounded-lg bg-gradient-to-b ${s.c} border ${s.b} p-2 flex flex-col items-center gap-1.5`}>
          <div className="w-6 h-6 rounded-lg bg-white/20" />
          <div className="h-1.5 w-10 rounded bg-white/25" />
          <div className="h-1 w-8 rounded bg-white/10" />
        </div>
      ))}
    </div>
  </div>
);

const PlaceholderProfile = () => (
  <div className="w-full h-full bg-gradient-to-br from-[#0d0d1a] to-[#100a1f] flex flex-col">
    <FakeNav accent="bg-violet-400" />
    <div className="h-14 bg-gradient-to-r from-purple-600/40 to-pink-600/30 shrink-0 relative">
      <div className="absolute bottom-0 left-3 translate-y-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 border-2 border-[#0d0d1a]" />
    </div>
    <div className="p-3 pt-6 flex flex-col gap-2">
      <div className="h-2 w-20 rounded bg-white/30" />
      <div className="h-1.5 w-32 rounded bg-purple-400/40" />
      <div className="flex gap-1.5 flex-wrap mt-1">
        {['Solidity','React','Web3','DeFi'].map(t => (
          <div key={t} className="rounded-full bg-purple-500/15 border border-purple-500/25 px-2 py-0.5">
            <div className="h-1 w-8 rounded bg-purple-300/40" />
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-white/5 border border-white/10 p-2 flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-yellow-400/20 border border-yellow-400/30 shrink-0" />
        <div className="flex-1">
          <div className="h-1.5 rounded bg-white/20 w-24 mb-0.5" />
          <div className="h-1 rounded bg-yellow-400/30 w-16" />
        </div>
      </div>
    </div>
  </div>
);

/* ── Data ──────────────────────────────────────────────────────────────────── */
const SCREENS = [
  { id: 'talent',      label: 'Talent Dashboard',     sub: 'Verified skills & scores',       Component: PlaceholderTalent },
  { id: 'certificate', label: 'NFT Certificate',       sub: 'On-chain proof of achievement',  Component: PlaceholderCertificate },
  { id: 'educator',    label: 'Educator Dashboard',    sub: 'Publish & manage courses',       Component: PlaceholderEducator },
  { id: 'recruiter',   label: 'Recruiter View',        sub: 'Find verified candidates',       Component: PlaceholderRecruiter },
  { id: 'register',    label: 'Choose Your Role',      sub: 'Start your Web3 journey',       Component: PlaceholderRegister },
  { id: 'profile',     label: 'Public Profile',        sub: 'Share your verifiable identity', Component: PlaceholderProfile },
];

// Duplicate for seamless loop
const ITEMS = [...SCREENS, ...SCREENS];

/* ── Browser Frame ─────────────────────────────────────────────────────────── */
const BrowserFrame = ({ label, sub, Component }: { label: string; sub: string; Component: React.FC }) => (
  <div className="shrink-0 w-[280px] sm:w-[300px] flex flex-col items-center gap-3">
    {/* Window chrome */}
    <div className="w-full rounded-xl overflow-hidden border border-white/10 shadow-[0_0_32px_rgba(0,0,0,0.6)] bg-[#0d0d12]">
      {/* Title bar */}
      <div className="h-8 bg-[#0a0a0f] flex items-center px-3 gap-2 border-b border-white/5 shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/75" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/75" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/75" />
        <div className="flex-1 mx-2 h-4 rounded bg-white/5 flex items-center px-2">
          <span className="text-[9px] text-white/25 select-none">hackchain.app</span>
        </div>
      </div>
      {/* Screen content */}
      <div className="h-[200px] overflow-hidden">
        <Component />
      </div>
    </div>
    {/* Label */}
    <div className="text-center">
      <p className="text-sm font-semibold text-white/80 font-title">{label}</p>
      <p className="text-xs text-white/35 font-body mt-0.5">{sub}</p>
    </div>
  </div>
);

/* ── Marquee ───────────────────────────────────────────────────────────────── */
const ScreenMarquee = () => {
  const { t } = useTranslation();

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Section label */}
      <p className="font-title text-xs uppercase tracking-[0.22em] text-white/30 text-center mb-10 font-bold select-none">
        {t('marquee.label', 'Everything you need, in one platform')}
      </p>

      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-24 z-10 pointer-events-none bg-gradient-to-r from-[#050508] to-transparent" />
      <div className="absolute inset-y-0 right-0 w-24 z-10 pointer-events-none bg-gradient-to-l from-[#050508] to-transparent" />

      {/* Track */}
      <div className="group flex gap-6 w-max animate-marquee hover:[animation-play-state:paused]">
        {ITEMS.map((screen, i) => (
          <BrowserFrame
            key={`${screen.id}-${i}`}
            label={screen.label}
            sub={screen.sub}
            Component={screen.Component}
          />
        ))}
      </div>
    </section>
  );
};

export default ScreenMarquee;
