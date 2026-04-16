import React, { useEffect, useRef } from 'react';
// @ts-ignore
import anime from 'animejs';

interface TokenData {
  label: string;
  percentage: number;
  color: string;
}

const tokenomicsData: TokenData[] = [
  { label: 'Team', percentage: 10, color: '#6366f1' },           // Indigo
  { label: 'Private Sale', percentage: 5, color: '#8b5cf6' },      // Violet
  { label: 'Public Sale', percentage: 15, color: '#ec4899' },      // Pink
  { label: 'Treasury', percentage: 20, color: '#14b8a6' },         // Teal
  { label: 'Airdrops', percentage: 10, color: '#0ea5e9' },         // Sky Blue
  { label: 'Incentives', percentage: 30, color: '#f59e0b' },       // Amber
  { label: 'Public Presale', percentage: 10, color: '#f43f5e' },   // Rose
];

export const AnimatedDonut: React.FC = () => {
  const pathsRef = useRef<(SVGPathElement | null)[]>([]);

  useEffect(() => {
    // Al montar: los segmentos están separados hacia afuera (efecto pizza cortada explotada)
    // Inicializamos las posiciones desplazándolas en el sentido de su ángulo central.
    pathsRef.current.forEach((el) => {
      if (!el) return;
      const tx = parseFloat(el.getAttribute('data-tx') || '0');
      const ty = parseFloat(el.getAttribute('data-ty') || '0');
      
      // Multiplicador para separar bastante las porciones en la carga inicial (ej: 40px)
      anime.set(el, {
        translateX: tx * 4,
        translateY: ty * 4,
        opacity: 0,
      });
    });

    // "Unirse" suavemente hacia el centro.
    anime({
      targets: pathsRef.current,
      translateX: 0,
      translateY: 0,
      opacity: 1,
      duration: 1500,
      delay: anime.stagger(150),
      easing: 'easeOutElastic(1, .6)',
    });
  }, []);

  const handleMouseEnter = (index: number) => {
    const el = pathsRef.current[index];
    if (!el) return;
    const tx = parseFloat(el.getAttribute('data-tx') || '0');
    const ty = parseFloat(el.getAttribute('data-ty') || '0');

    anime.remove(el);
    // Efecto Hover: se desplaza 10px en su dirección
    anime({
      targets: el,
      translateX: tx,
      translateY: ty,
      duration: 400,
      easing: 'easeOutExpo',
    });
  };

  const handleMouseLeave = (index: number) => {
    const el = pathsRef.current[index];
    if (!el) return;

    anime.remove(el);
    // Regresa a su posición de dona perfecta
    anime({
      targets: el,
      translateX: 0,
      translateY: 0,
      duration: 600,
      easing: 'easeOutElastic(1, .5)',
    });
  };

  // ─── SVG Math helpers ────────────────────────────────────────────────────────
  
  // Convierte coordenadas polares a cartesianas para calcular los puntos del SVG arc
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  // Construye la propiedad `d` de un <path> para formar un segmento de disco (dona)
  const describeArc = (x: number, y: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) => {
    // Para renderizar correctamente SVG paths cuando es exactamente 360 grados, restamos un fraction minúsculo.
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

  // ─── Procesamiento de datos y variables del círculo ────────────────────────
  
  let cumulativeAngle = 0;
  const size = 450;
  const cx = size / 2;
  const cy = size / 2;
  const innerR = 80;
  const outerR = 170;

  const slices = tokenomicsData.map((data) => {
    const sliceAngle = (data.percentage / 100) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + sliceAngle;
    cumulativeAngle += sliceAngle;

    // Ángulo medio del segmento (para calcular hacia dónde explota)
    const midAngle = startAngle + (sliceAngle / 2);
    
    // Distancia pre-calculada a empujar (vector unitario * 10px)
    const offset = 10;
    const midRads = (midAngle - 90) * Math.PI / 180.0;
    const tx = Math.cos(midRads) * offset;
    const ty = Math.sin(midRads) * offset;

    const pathData = describeArc(cx, cy, innerR, outerR, startAngle, endAngle);

    return {
      ...data,
      pathData,
      tx,
      ty,
      midAngle
    };
  });

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-900/50 backdrop-blur-md rounded-2xl relative w-full h-[500px] max-w-lg mx-auto overflow-hidden">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <defs>
          <filter id="slice-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.3" floodColor="#000" />
          </filter>
        </defs>
        
        {slices.map((slice, index) => (
          <g key={slice.label} className="group">
            <path
              // Manejo de refs en SVG limpio
              ref={(el) => { pathsRef.current[index] = el; }}
              d={slice.pathData}
              fill={slice.color}
              // Atributos de datos nativos para leer al animar
              data-tx={slice.tx}
              data-ty={slice.ty}
              stroke="#0f172a"
              strokeWidth="2"
              className="cursor-pointer hover:brightness-110 transition-[filter]"
              filter="url(#slice-shadow)"
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={() => handleMouseLeave(index)}
            />
            
            {/* Etiquetas calculadas sobre las porciones */}
            <text
              x={polarToCartesian(cx, cy, innerR + (outerR - innerR) / 2, slice.midAngle).x}
              y={polarToCartesian(cx, cy, innerR + (outerR - innerR) / 2, slice.midAngle).y + 5}
              fill="white"
              textAnchor="middle"
              className="text-[13px] font-bold pointer-events-none drop-shadow-md"
            >
              {slice.percentage}%
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};
