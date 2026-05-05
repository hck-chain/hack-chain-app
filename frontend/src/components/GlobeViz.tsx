import { useEffect, useRef, useState, useMemo } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';

interface CityNode {
  lat: number;
  lng: number;
  name: string;
  size: number;
}

interface ArcLink {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: [string, string];
}

const CITIES: CityNode[] = [
  { lat: 37.7749, lng: -122.4194, name: 'San Francisco', size: 0.6 },
  { lat: 40.7128, lng: -74.0060, name: 'New York', size: 0.7 },
  { lat: 51.5074, lng: -0.1278, name: 'London', size: 0.7 },
  { lat: 52.5200, lng: 13.4050, name: 'Berlin', size: 0.5 },
  { lat: 35.6762, lng: 139.6503, name: 'Tokyo', size: 0.7 },
  { lat: 1.3521, lng: 103.8198, name: 'Singapore', size: 0.5 },
  { lat: -23.5505, lng: -46.6333, name: 'São Paulo', size: 0.5 },
  { lat: 25.2048, lng: 55.2708, name: 'Dubai', size: 0.5 },
  { lat: 19.4326, lng: -99.1332, name: 'CDMX', size: 0.5 },
  { lat: 48.8566, lng: 2.3522, name: 'Paris', size: 0.5 },
  { lat: -33.8688, lng: 151.2093, name: 'Sydney', size: 0.5 },
];

const PURPLE = '#9b59f5';
const MAGENTA = '#e040fb';
const LIME = '#66ff22';
const CYAN = '#22d3ee';

const ARCS: ArcLink[] = [
  { startLat: 37.7749, startLng: -122.4194, endLat: 51.5074, endLng: -0.1278, color: [PURPLE, MAGENTA] },
  { startLat: 51.5074, startLng: -0.1278, endLat: 52.5200, endLng: 13.4050, color: [MAGENTA, PURPLE] },
  { startLat: 52.5200, startLng: 13.4050, endLat: 35.6762, endLng: 139.6503, color: [PURPLE, CYAN] },
  { startLat: 35.6762, startLng: 139.6503, endLat: 1.3521, endLng: 103.8198, color: [CYAN, LIME] },
  { startLat: 1.3521, startLng: 103.8198, endLat: 25.2048, endLng: 55.2708, color: [LIME, PURPLE] },
  { startLat: 25.2048, startLng: 55.2708, endLat: 40.7128, endLng: -74.0060, color: [PURPLE, MAGENTA] },
  { startLat: 40.7128, startLng: -74.0060, endLat: 19.4326, endLng: -99.1332, color: [MAGENTA, LIME] },
  { startLat: 19.4326, startLng: -99.1332, endLat: -23.5505, endLng: -46.6333, color: [LIME, CYAN] },
  { startLat: -23.5505, startLng: -46.6333, endLat: 37.7749, endLng: -122.4194, color: [CYAN, PURPLE] },
  { startLat: 37.7749, startLng: -122.4194, endLat: 35.6762, endLng: 139.6503, color: [PURPLE, LIME] },
  { startLat: 51.5074, startLng: -0.1278, endLat: 1.3521, endLng: 103.8198, color: [MAGENTA, CYAN] },
  { startLat: 40.7128, startLng: -74.0060, endLat: 48.8566, endLng: 2.3522, color: [PURPLE, MAGENTA] },
  { startLat: 35.6762, startLng: 139.6503, endLat: -33.8688, endLng: 151.2093, color: [CYAN, LIME] },
  { startLat: 25.2048, startLng: 55.2708, endLat: 48.8566, endLng: 2.3522, color: [LIME, PURPLE] },
];

const GlobeViz = ({ mobile = false }: { mobile?: boolean }) => {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const reflCanvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState(mobile ? 320 : 480);

  const arcsData = useMemo(() => (mobile ? ARCS.slice(0, 6) : ARCS), [mobile]);
  const pointsData = useMemo(() => CITIES, []);

  // Responsive size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        setSize(Math.min(w, mobile ? 360 : 560));
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [mobile]);

  // Globe controls
  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = mobile ? 0.25 : 0.4;
    controls.enableZoom = false;
    controls.enablePan = false;
    globeRef.current.pointOfView({ lat: 20, lng: 10, altitude: 2.2 });

  }, [mobile]);

  // Real-time canvas reflection — disabled on mobile (GPU-CPU pixel readback is
  // too expensive on mobile and causes scroll jank).
  useEffect(() => {
    const reflCanvas = reflCanvasRef.current;
    if (!reflCanvas || mobile) return;
    const ctx = reflCanvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    let started = false;

    const draw = () => {
      const src = globeRef.current?.renderer()?.domElement;
      if (!src || src.width === 0) {
        rafId = requestAnimationFrame(draw);
        return;
      }

      const w = src.width;
      const h = src.height;
      // Only reflect the bottom 40% of the globe canvas (the visible globe bottom)
      const reflH = Math.round(h * 0.38);

      if (reflCanvas.width !== w || reflCanvas.height !== reflH) {
        reflCanvas.width = w;
        reflCanvas.height = reflH;
      }

      ctx.clearRect(0, 0, w, reflH);

      try {
        // Flip vertically: translate down by reflH, scale y by -1
        // then draw the source offset so only the bottom of the globe shows
        ctx.save();
        ctx.translate(0, reflH);
        ctx.scale(1, -1);
        // Draw source so its bottom (y = h) aligns with our y = 0 after flip
        ctx.drawImage(src, 0, h - reflH, w, reflH, 0, 0, w, reflH);
        ctx.restore();

        // Gradient mask: opaque at top → transparent at bottom
        const grad = ctx.createLinearGradient(0, 0, 0, reflH);
        grad.addColorStop(0, 'rgba(0,0,0,0.65)');
        grad.addColorStop(0.45, 'rgba(0,0,0,0.28)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, reflH);
        ctx.globalCompositeOperation = 'source-over';

        started = true;
      } catch (_) {
        // Canvas tainted — silently skip
      }

      rafId = requestAnimationFrame(draw);
    };

    // Give the globe ~1s to initialize before starting the loop
    const timer = setTimeout(() => draw(), 1000);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafId);
      void started; // suppress unused warning
    };
  }, []);

  const reflH = Math.round(size * 0.38);

  return (
    <div ref={containerRef} className="w-full flex items-center justify-center relative">
      <Globe
        ref={globeRef}
        width={size}
        height={size}
        backgroundColor="rgba(0,0,0,0)"
        rendererConfig={{ preserveDrawingBuffer: !mobile }}
        onGlobeReady={() => {
          if (mobile && globeRef.current) {
            globeRef.current.renderer().setPixelRatio(Math.min(window.devicePixelRatio, 1));
          }
        }}
        globeImageUrl="/images/earth-dark.jpg"
        atmosphereColor="hsl(263,72%,55%)"
        atmosphereAltitude={0.25}
        arcsData={arcsData}
        arcColor={(arc) => (arc as ArcLink).color}
        arcDashLength={0.35}
        arcDashGap={0.15}
        arcDashAnimateTime={2200}
        arcStroke={0.6}
        arcAltitude={0.18}
        pointsData={pointsData}
        pointColor={() => MAGENTA}
        pointAltitude={0.03}
        pointRadius={(d) => (d as CityNode).size}
        pointsMerge={false}
      />

      {/* Reflection: disabled on mobile to avoid GPU-CPU readback jank */}
      {!mobile && (
        <canvas
          ref={reflCanvasRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: -Math.round(size * 0.26),
            width: size,
            height: reflH,
            pointerEvents: 'none',
            opacity: 0.9,
            display: 'block',
          }}
        />
      )}
    </div>
  );
};

export default GlobeViz;
