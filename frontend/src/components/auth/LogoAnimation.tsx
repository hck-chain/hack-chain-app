import { useEffect, useRef } from 'react';
import anime from 'animejs';
import hackChainLogo from '/images/logoHackchain.png';

export function LogoAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const particlesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !glowRef.current || !particlesContainerRef.current) return;

    // Create sophisticated animation timeline
    const timeline = anime.timeline({
      loop: true,
      easing: 'easeInOutQuad',
    });

    // Generate random particles
    const particles = particlesContainerRef.current.querySelectorAll('.particle');
    const particleData = Array.from(particles).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 2000 + Math.random() * 2000,
      delay: Math.random() * 1000,
    }));

    // Phase 1: Glow expands and pulses
    timeline.add({
      targets: glowRef.current,
      scale: [1, 1.3],
      opacity: [0.3, 0.6],
      duration: 1500,
      easing: 'easeOutQuad',
    })
    // Phase 2: Logo "explodes" outward with scale
    .add({
      targets: containerRef.current,
      scale: [1, 1.05],
      translateY: [-5, 5],
      rotate: [0, 2],
      duration: 1200,
      easing: 'easeInOutCubic',
    }, '-=500')
    // Phase 3: Logo contracts back with slight overshoot
    .add({
      targets: containerRef.current,
      scale: [1.05, 0.97],
      translateY: [5, -3],
      rotate: [2, -1],
      duration: 1000,
      easing: 'easeInOutBack',
    })
    // Phase 4: Settle with subtle rotation
    .add({
      targets: containerRef.current,
      scale: [0.97, 1],
      translateY: [-3, 0],
      rotate: [-1, 0],
      duration: 800,
      easing: 'easeOutElastic(1, .5)',
    })
    // Phase 5: Glow contracts
    .add({
      targets: glowRef.current,
      scale: [1.3, 1],
      opacity: [0.6, 0.3],
      duration: 1500,
      easing: 'easeInQuad',
    }, '-=800');

    // Animate particles with individual timelines
    particleData.forEach((data, i) => {
      anime({
        targets: particles[i],
        translateY: [
          { value: -30, duration: data.duration },
          { value: 0, duration: data.duration },
        ],
        opacity: [
          { value: 0, duration: 100 },
          { value: 0.8, duration: 200, delay: data.delay },
          { value: 0.3, duration: data.duration - 300 },
          { value: 0, duration: 100 },
        ],
        scale: [
          { value: 0.5, duration: 100 },
          { value: 1.5, duration: 200, delay: data.delay },
          { value: 0.5, duration: data.duration - 300 },
        ],
        easing: 'easeInOutSine',
        loop: true,
        delay: data.delay,
      });
    });

    return () => {
      timeline.pause();
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Multi-layered ambient glow */}
      <div 
        ref={glowRef}
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.25) 0%, rgba(139, 92, 246, 0.1) 40%, transparent 70%)',
          transform: 'scale(1)',
          opacity: 0.3,
          filter: 'blur(40px)',
        }}
      />
      
      {/* Secondary glow layer */}
      <div 
        className="absolute w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(236, 72, 153, 0.15) 0%, transparent 60%)',
          filter: 'blur(60px)',
          animation: 'pulse-glow 4s ease-in-out infinite',
        }}
      />

      {/* Floating particles */}
      <div 
        ref={particlesContainerRef}
        className="absolute inset-0 overflow-hidden rounded-full"
      >
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle absolute rounded-full"
            style={{
              left: `${10 + (i * 4.5) % 80}%`,
              top: `${15 + (i * 7) % 70}%`,
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              background: i % 3 === 0 
                ? 'rgba(168, 85, 247, 0.8)' 
                : i % 3 === 1 
                  ? 'rgba(139, 92, 246, 0.8)' 
                  : 'rgba(236, 72, 153, 0.8)',
              boxShadow: `0 0 ${4 + (i % 4)}px rgba(${168 + (i * 5)}, ${85 - (i * 3)}, ${247 - (i * 2)}, 0.6)`,
            }}
          />
        ))}
      </div>

      {/* Animated ring 1 */}
      <div 
        className="absolute w-80 h-80 rounded-full border border-purple-500/20"
        style={{
          animation: 'ring-rotate 12s linear infinite',
        }}
      />

      {/* Animated ring 2 */}
      <div 
        className="absolute w-96 h-96 rounded-full border border-pink-500/10"
        style={{
          animation: 'ring-rotate 18s linear infinite reverse',
        }}
      />

      {/* Logo container with sophisticated animation */}
      <div 
        ref={containerRef}
        className="relative z-10"
        style={{
          filter: 'drop-shadow(0 0 30px rgba(168, 85, 247, 0.4)) drop-shadow(0 0 60px rgba(139, 92, 246, 0.2))',
        }}
      >
        <img
          src={hackChainLogo}
          alt="HackChain"
          className="w-56 h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 object-contain"
        />
        
        {/* Inner glow effect */}
        <div 
          className="absolute inset-0 -m-8 rounded-full"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
            animation: 'inner-pulse 3s ease-in-out infinite',
          }}
        />
      </div>

      {/* Brand name with gradient */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter">
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]">
            HackChain
          </span>
        </h1>
        <p className="text-sm md:text-base text-slate-400 mt-3 font-light tracking-[0.3em] uppercase">
          Decentralized Credentials
        </p>
        
        {/* Decorative line under brand */}
        <div 
          className="mt-4 mx-auto h-px w-24"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.6), transparent)',
          }}
        />
      </div>

      <style>{`
        @keyframes ring-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        @keyframes inner-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.95); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
