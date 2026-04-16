import { useEffect, useRef } from 'react';
import anime from 'animejs';

interface WelcomeMessageProps {
  onComplete?: () => void;
}

export function WelcomeMessage({ onComplete }: WelcomeMessageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const timeline = anime.timeline({
      easing: 'easeOutExpo',
    });

    timeline
      .add({
        targets: containerRef.current,
        opacity: [0, 1],
        translateY: [-20, 0],
        duration: 800,
      })
      .add({
        targets: containerRef.current.querySelectorAll('.char'),
        opacity: [0, 1],
        translateX: [-10, 0],
        delay: anime.stagger(30),
        duration: 400,
        complete: () => onComplete?.(),
      });
  }, [onComplete]);

  return (
    <div 
      ref={containerRef}
      className="text-center mb-8 opacity-0"
    >
      <p className="text-base md:text-lg text-slate-300 leading-relaxed">
        <span className="text-purple-400 font-medium">Connect your wallet</span>
        {' '}to verify your identity on the blockchain
      </p>
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span>Secured by Ethereum blockchain</span>
        <span className="text-purple-500">•</span>
        <span>Your keys, your credentials</span>
      </div>
    </div>
  );
}
