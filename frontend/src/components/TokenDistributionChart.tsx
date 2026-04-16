import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useInView } from 'framer-motion';
// @ts-ignore
import anime from 'animejs';
import { DataFlowRings, AnimatedCounter } from './animations/AnimeComponents';

const COLORS = [
  'hsl(263, 70%, 50%)',   // Purple  — Team
  'hsl(217, 91%, 60%)',   // Blue    — Private Sale
  'hsl(280, 68%, 60%)',   // Violet  — Public Presale
  'hsl(199, 89%, 48%)',   // Cyan    — Public Sale
  'hsl(142, 71%, 45%)',   // Green   — Incentives
  'hsl(45, 93%, 47%)',    // Amber   — Treasury
  'hsl(330, 81%, 60%)',   // Pink    — Airdrops
];

const GLOW_COLORS = [
  'rgba(124, 58, 237, 0.6)',
  'rgba(59, 130, 246, 0.6)',
  'rgba(167, 88, 209, 0.6)',
  'rgba(14, 165, 233, 0.6)',
  'rgba(34, 197, 94, 0.6)',
  'rgba(234, 179, 8, 0.6)',
  'rgba(236, 72, 153, 0.6)',
];

// ─── SVG Math helpers ────────────────────────────────────────────────────────

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

const describeArc = (x: number, y: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) => {
  const renderEndAngle = endAngle - startAngle === 360 ? endAngle - 0.001 : endAngle;
  
  const startOut = polarToCartesian(x, y, outerRadius, renderEndAngle);
  const endOut = polarToCartesian(x, y, outerRadius, startAngle);
  const startIn = polarToCartesian(x, y, innerRadius, renderEndAngle);
  const endIn = polarToCartesian(x, y, innerRadius, startAngle);

  const largeArcFlag = renderEndAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M", startOut.x, startOut.y,
    "A", outerRadius, outerRadius, 0, largeArcFlag, 0, endOut.x, endOut.y,
    "L", endIn.x, endIn.y,
    "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startIn.x, startIn.y,
    "Z"
  ].join(" ");
};

const TokenDistributionChart = () => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(4); // Start with Incentives (largest)

  const data = useMemo(() => [
    { name: 'team', value: 100_000_000, percentage: 10, translatedName: t('token.chartTeam') },
    { name: 'privateSale', value: 50_000_000, percentage: 5, translatedName: t('token.chartPrivateSale') },
    { name: 'publicPresale', value: 100_000_000, percentage: 10, translatedName: t('token.chartPublicPresale') },
    { name: 'publicSale', value: 150_000_000, percentage: 15, translatedName: t('token.chartPublicSale') },
    { name: 'incentives', value: 300_000_000, percentage: 30, translatedName: t('token.chartIncentives') },
    { name: 'treasury', value: 200_000_000, percentage: 20, translatedName: t('token.chartTreasury') },
    { name: 'airdrops', value: 100_000_000, percentage: 10, translatedName: t('token.chartAirdrops') },
  ], [t]);

  // SVG Chart Calculations
  const size = 450;
  const cx = size / 2;
  const cy = size / 2;
  const innerR = 90;
  const outerR = 170;

  const slices = useMemo(() => {
    let cumulativeAngle = 0;
    return data.map((entry) => {
      const sliceAngle = (entry.percentage / 100) * 360;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + sliceAngle;
      cumulativeAngle += sliceAngle;

      const midAngle = startAngle + (sliceAngle / 2);
      const offset = 10;
      const midRads = (midAngle - 90) * Math.PI / 180.0;
      const tx = Math.cos(midRads) * offset;
      const ty = Math.sin(midRads) * offset;

      const pathData = describeArc(cx, cy, innerR, outerR, startAngle, endAngle);

      return {
        ...entry,
        pathData,
        tx,
        ty,
        midAngle
      };
    });
  }, [data]);

  const pathsRef = useRef<(SVGPathElement | null)[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(chartRef, { once: true, margin: "-100px" });
  const hasAnimatedInitial = useRef(false);

  // 1. Initial explosion animation triggered when scrolling into view
  useEffect(() => {
    if (!isInView || hasAnimatedInitial.current) return;
    
    // Set initial exploded positions
    pathsRef.current.forEach((el) => {
      if (!el) return;
      const tx = parseFloat(el.getAttribute('data-tx') || '0');
      const ty = parseFloat(el.getAttribute('data-ty') || '0');
      anime.set(el, { translateX: tx * 5, translateY: ty * 5, opacity: 0 });
    });

    // Animate falling into place
    anime({
      targets: pathsRef.current,
      translateX: 0,
      translateY: 0,
      opacity: 1,
      duration: 1500,
      delay: anime.stagger(100),
      easing: 'easeOutElastic(1, .6)',
      complete: () => {
        hasAnimatedInitial.current = true; // Mark as done to enable hover syncing
        // Immediately trigger the hover effect for the initially active index
        syncHoverEffect(activeIndex);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView]);

  // Function to sync anime displacement based on activeIndex
  const syncHoverEffect = useCallback((currentIndex: number) => {
    pathsRef.current.forEach((el, index) => {
      if (!el) return;
      const tx = parseFloat(el.getAttribute('data-tx') || '0');
      const ty = parseFloat(el.getAttribute('data-ty') || '0');
      
      anime.remove(el);
      if (index === currentIndex) {
        // Pop out the active one
        anime({
          targets: el,
          translateX: tx * 1.5,
          translateY: ty * 1.5,
          scale: 1.05,
          duration: 400,
          easing: 'easeOutExpo'
        });
      } else {
        // Push others back to center
        anime({
          targets: el,
          translateX: 0,
          translateY: 0,
          scale: 1,
          duration: 600,
          easing: 'easeOutElastic(1, .5)'
        });
      }
    });
  }, []);

  // 2. React to activeIndex changes (from legend hover/click or chart hover)
  useEffect(() => {
    if (!hasAnimatedInitial.current) return;
    syncHoverEffect(activeIndex);
  }, [activeIndex, syncHoverEffect]);

  return (
    <div className="w-full flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
      
      {/* 3D Interactive Donut Container */}
      <motion.div
        ref={chartRef}
        initial={{ opacity: 0, scale: 0.8, rotateX: 40 }}
        whileInView={{ opacity: 1, scale: 1, rotateX: 12 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative w-full max-w-[500px] aspect-square flex-shrink-0 flex items-center justify-center cursor-pointer"
        style={{ perspective: '1000px' }}
      >
        {/* Reflection/shadow under the chart */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-[20%] rounded-[50%] blur-xl opacity-30 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse, ${GLOW_COLORS[activeIndex]}, transparent 70%)`,
            transform: 'translateX(-50%) translateY(40px)',
            transition: 'background 0.5s ease',
          }}
        />

        <div
          className="relative z-10 w-full h-full flex items-center justify-center transition-transform duration-700 ease-out"
          style={{
            transform: 'rotateX(12deg) rotateZ(-2deg)',
            transformStyle: 'preserve-3d',
          }}
        >
          <DataFlowRings size={400} />
          <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="overflow-visible absolute inset-0 m-auto max-w-full">
            <defs>
              <filter id="svg-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="slice-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.5" floodColor="#000" />
              </filter>
            </defs>
            
            {slices.map((slice, index) => {
              const isActive = activeIndex === index;
              return (
                <g key={slice.name} className="group">
                  <path
                    ref={(el) => { pathsRef.current[index] = el; }}
                    d={slice.pathData}
                    fill={COLORS[index]}
                    data-tx={slice.tx}
                    data-ty={slice.ty}
                    stroke="rgba(0, 0, 0, 0.4)"
                    strokeWidth="2"
                    onMouseEnter={() => setActiveIndex(index)}
                    className="transition-all duration-300"
                    style={{
                      transformOrigin: `${cx}px ${cy}px`,
                      filter: isActive ? 'url(#svg-glow)' : 'url(#slice-shadow)',
                    }}
                  />
                  
                  {/* Floating value text centered dynamically on hover */}
                  <text
                    x={polarToCartesian(cx, cy, innerR + (outerR - innerR) / 2, slice.midAngle).x}
                    y={polarToCartesian(cx, cy, innerR + (outerR - innerR) / 2, slice.midAngle).y + 5}
                    fill="white"
                    textAnchor="middle"
                    className={`text-[14px] font-bold pointer-events-none transition-opacity duration-300 ${isActive ? 'opacity-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'opacity-0'}`}
                  >
                    {slice.percentage}%
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </motion.div>

      {/* Interactive Legend */}
      <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.map((entry, index) => (
          <motion.div
            key={entry.name}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
            className={`glass rounded-xl p-4 cursor-pointer transition-all duration-300 group ${
              activeIndex === index
                ? 'ring-1 ring-white/20 scale-[1.02]'
                : 'hover:bg-white/5'
            }`}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => setActiveIndex(index)}
            style={{
              boxShadow: activeIndex === index ? `0 0 20px ${GLOW_COLORS[index]}` : 'none',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0 transition-transform duration-300 group-hover:scale-125"
                style={{
                  backgroundColor: COLORS[index],
                  boxShadow: `0 0 8px ${GLOW_COLORS[index]}`,
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-title text-sm font-semibold text-foreground truncate">
                    {entry.translatedName}
                  </span>
                  <span className="font-title text-sm font-bold gradient-text ml-2">
                    {entry.percentage}%
                  </span>
                </div>
                <p className="font-body text-xs text-muted-foreground mt-0.5">
                  <AnimatedCounter value={entry.value} /> {t('token.chartTokens')}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TokenDistributionChart;
