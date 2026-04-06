import { useMemo } from 'react';

const BackgroundAnimation = () => {
  const dataFlowStyles = useMemo(() => {
    return Array.from({ length: 5 }).map((_, i) => ({
      top: `${20 + i * 15}%`,
      animationDelay: `${i * 2}s`,
      width: '300px',
    }));
  }, []);

  const particleStyles = useMemo(() => {
    return Array.from({ length: 12 }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 4}s`,
      animationDuration: `${2 + Math.random() * 3}s`,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Cyber Grid */}
      <div className="absolute inset-0 cyber-grid opacity-20" />
      
      {/* Data Flow Animation */}
      <div className="absolute top-0 left-0 w-full h-full">
        {dataFlowStyles.map((style, i) => (
          <div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-data-flow opacity-30"
            style={style}
          />
        ))}
      </div>
      
      {/* Floating Particles - Uncommented but subtle */}
      <div className="absolute inset-0">
        {particleStyles.map((style, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full animate-pulse-neon opacity-20"
            style={style}
          />
        ))}
      </div>
    </div>
  );
};

export default BackgroundAnimation;