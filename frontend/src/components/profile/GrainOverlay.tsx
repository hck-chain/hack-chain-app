import { P } from './palette';

// Fixed, page-wide grain overlay. Covers Layout's BackgroundAnimation (z -20)
// and applies a micro-noise SVG texture + a single soft accent vignette.
// Both educator profile pages use this component for visual consistency.
export function GrainOverlay() {
  return (
    <>
      <div
        aria-hidden
        className="fixed inset-0 -z-[5] pointer-events-none"
        style={{ backgroundColor: P.bg }}
      />
      <svg
        aria-hidden
        className="fixed inset-0 -z-[4] w-full h-full pointer-events-none"
        style={{ opacity: 0.06, mixBlendMode: 'overlay' }}
      >
        <filter id="profile-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#profile-grain)" />
      </svg>
      <div
        aria-hidden
        className="fixed pointer-events-none -z-[3]"
        style={{
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '900px',
          height: '500px',
          background: `radial-gradient(ellipse at 50% 0%, oklch(0.70 0.16 280 / 0.10) 0%, transparent 65%)`,
        }}
      />
    </>
  );
}
