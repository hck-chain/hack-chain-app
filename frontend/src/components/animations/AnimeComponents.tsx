import React, { useEffect, useRef } from 'react';
// @ts-ignore
import anime from 'animejs';
import { useInView } from 'framer-motion';

export const AnimeParticles: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const wrapperEl = containerRef.current;
    wrapperEl.innerHTML = '';
    const numberOfEls = 60;

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < numberOfEls; i++) {
      const el = document.createElement('div');
      el.classList.add('absolute', 'rounded-full', 'bg-purple-500/30', 'shadow-[0_0_10px_rgba(168,85,247,0.5)]');

      const size = Math.random() * 4 + 2;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;

      el.style.left = `${Math.random() * 100}%`;
      el.style.top = `${Math.random() * 100}%`;
      fragment.appendChild(el);
    }

    wrapperEl.appendChild(fragment);

    const particles = wrapperEl.querySelectorAll('div');

    anime({
      targets: particles,
      translateX: () => anime.random(-30, 30),
      translateY: () => anime.random(-30, 30),
      scale: () => anime.random(0.5, 1.2),
      opacity: () => [anime.random(0.2, 0.6), anime.random(0.2, 0.6)],
      easing: 'easeInOutSine',
      duration: () => anime.random(3000, 6000),
      delay: anime.stagger(50),
      direction: 'alternate',
      loop: true
    });

  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none z-0 mix-blend-screen"
    />
  );
};

export const DataFlowRings: React.FC<{ size?: number }> = ({ size = 300 }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Animate the path dashoffset
    anime({
      targets: svgRef.current.querySelectorAll('.data-ring'),
      strokeDashoffset: [anime.setDashoffset, 0],
      easing: 'linear',
      duration: (el, i, l) => 12000 - (i * 2000),
      direction: 'normal',
      loop: true
    });
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
      <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="max-w-full">
        {/* exterior ring*/}
        <circle
          className="data-ring"
          cx={size / 2} cy={size / 2} r={(size / 2) - 10}
          fill="none"
          stroke="rgba(168, 85, 247, 0.4)"
          strokeWidth="1.5"
          strokeDasharray="40 80"
        />
        {/* medium ring */}
        <circle
          className="data-ring"
          cx={size / 2} cy={size / 2} r={(size / 2) - 40}
          fill="none"
          stroke="rgba(59, 130, 246, 0.4)"
          strokeWidth="1.5"
          strokeDasharray="60 120"
        />
      </svg>
    </div>
  );
}

export const AnimatedCounter: React.FC<{ value: number; duration?: number; format?: boolean }> = ({ value, duration = 2500, format = true }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(nodeRef, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView || !nodeRef.current) return;

    const obj = { val: 0 };
    anime({
      targets: obj,
      val: value,
      round: 1,
      easing: 'easeOutExpo',
      duration: duration,
      update: function () {
        if (nodeRef.current) {
          nodeRef.current.innerHTML = format ? obj.val.toLocaleString() : obj.val.toString();
        }
      }
    });
  }, [isInView, value, duration, format]);

  return <span ref={nodeRef}>0</span>;
};
