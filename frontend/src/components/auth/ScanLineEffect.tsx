import { useEffect, useRef } from 'react';
import anime from 'animejs';

export function ScanLineEffect() {
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lineRef.current) return;

    anime({
      targets: lineRef.current,
      translateY: ['-100%', '200%'],
      opacity: [0, 1, 0],
      duration: 2000,
      easing: 'easeInOutQuad',
      loop: true,
      delay: 1000,
    });
  }, []);

  return (
    <div 
      ref={lineRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
    >
      {/* Gradient line */}
      <div 
        className="absolute left-0 right-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.8), rgba(236, 72, 153, 0.8), transparent)',
          top: '0',
          boxShadow: '0 0 20px rgba(168, 85, 247, 0.5), 0 0 40px rgba(168, 85, 247, 0.3)',
        }}
      />
    </div>
  );
}
