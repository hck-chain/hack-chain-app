import { useEffect, useRef } from 'react';
// @ts-ignore
import anime from 'animejs/lib/anime.es.js';

interface FormCardParticlesProps {
  color?: string;
  shadowColor?: string;
  count?: number;
}

export const FormCardParticles: React.FC<FormCardParticlesProps> = ({
  color = 'rgba(168, 85, 247, 0.3)',
  shadowColor = 'rgba(168, 85, 247, 0.5)',
  count = 30
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const wrapperEl = containerRef.current;
    wrapperEl.innerHTML = '';

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.classList.add('absolute', 'rounded-full');
      el.style.backgroundColor = color;
      el.style.boxShadow = `0 0 10px ${shadowColor}`;

      const size = Math.random() * 3 + 1;
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
      translateX: () => anime.random(-20, 20),
      translateY: () => anime.random(-20, 20),
      scale: () => anime.random(0.5, 1.2),
      opacity: () => [anime.random(0.1, 0.4), anime.random(0.1, 0.4)],
      easing: 'easeInOutSine',
      duration: () => anime.random(3000, 5000),
      delay: anime.stagger(50),
      direction: 'alternate',
      loop: true
    });

    return () => {
      anime.remove(particles);
    };
  }, [color, shadowColor, count]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none z-0"
    />
  );
};
