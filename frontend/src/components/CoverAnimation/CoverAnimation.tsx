import { useEffect, useRef } from 'react';
// @ts-ignore
import anime from 'animejs/lib/anime.es.js';

export function CoverAnimation() {
  const particlesRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (particlesRef.current) {
      const wrap = particlesRef.current;
      wrap.innerHTML = '';
      const frag = document.createDocumentFragment();
      const colors = [
        'rgba(168,85,247,0.45)',
        'rgba(99,102,241,0.35)',
        'rgba(59,130,246,0.30)',
        'rgba(168,85,247,0.20)',
      ];
      for (let i = 0; i < 40; i++) {
        const el = document.createElement('div');
        el.style.position = 'absolute';
        el.style.borderRadius = '50%';
        const size = Math.random() * 4 + 1.5;
        const color = colors[Math.floor(Math.random() * colors.length)];
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.background = color;
        el.style.boxShadow = `0 0 ${size * 3}px ${color}`;
        el.style.left = `${Math.random() * 100}%`;
        el.style.top = `${Math.random() * 100}%`;
        frag.appendChild(el);
      }
      wrap.appendChild(frag);
      const dots = wrap.querySelectorAll('div');
      anime({
        targets: dots,
        translateX: () => anime.random(-25, 25),
        translateY: () => anime.random(-25, 25),
        scale: () => anime.random(0.4, 1.4),
        opacity: [{ value: () => anime.random(0.15, 0.55) }, { value: () => anime.random(0.15, 0.55) }],
        easing: 'easeInOutSine',
        duration: () => anime.random(3500, 6000),
        delay: anime.stagger(60),
        direction: 'alternate',
        loop: true,
      });
      return () => { anime.remove(dots); };
    }
  }, []);

  useEffect(() => {
    if (svgRef.current) {
      anime({
        targets: svgRef.current.querySelectorAll('.cover-ring'),
        strokeDashoffset: [anime.setDashoffset, 0],
        easing: 'linear',
        duration: (_el: Element, i: number) => 14000 - i * 2500,
        direction: 'normal',
        loop: true,
      });
    }
  }, []);

  return (
    <>
      <div ref={particlesRef} className="absolute inset-0 overflow-hidden pointer-events-none" />
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
        viewBox="0 0 600 220"
        preserveAspectRatio="xMidYMid slice"
      >
        <circle className="cover-ring" cx="300" cy="110" r="95"
          fill="none" stroke="rgba(168,85,247,0.7)" strokeWidth="1"
          strokeDasharray="50 100" />
        <circle className="cover-ring" cx="300" cy="110" r="140"
          fill="none" stroke="rgba(99,102,241,0.6)" strokeWidth="0.8"
          strokeDasharray="70 130" />
        <circle className="cover-ring" cx="300" cy="110" r="185"
          fill="none" stroke="rgba(59,130,246,0.5)" strokeWidth="0.6"
          strokeDasharray="30 90" />
      </svg>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
    </>
  );
}
