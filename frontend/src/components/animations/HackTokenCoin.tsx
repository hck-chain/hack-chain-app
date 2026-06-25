import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// ── Texture builders ──────────────────────────────────────────────────────────

function buildFace(): THREE.CanvasTexture {
  const S  = 1024;
  const cx = S / 2, cy = S / 2, R = S / 2;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const c  = cv.getContext('2d')!;

  c.save();
  c.beginPath();
  c.arc(cx, cy, R, 0, Math.PI * 2);
  c.clip();

  // Base — dark, slightly cool
  const base = c.createRadialGradient(cx, cy - 80, 0, cx, cy, R);
  base.addColorStop(0,   '#161a22');
  base.addColorStop(0.6, '#0c0e14');
  base.addColorStop(1,   '#060709');
  c.fillStyle = base;
  c.fillRect(0, 0, S, S);

  // Outer rim — silver gradient
  const rim = c.createLinearGradient(0, 0, S, S);
  rim.addColorStop(0,    '#f0f0f0');
  rim.addColorStop(0.25, '#909090');
  rim.addColorStop(0.5,  '#e8e8e8');
  rim.addColorStop(0.75, '#707070');
  rim.addColorStop(1,    '#e8e8e8');
  c.strokeStyle = rim;
  c.lineWidth   = 8;
  c.beginPath();
  c.arc(cx, cy, R - 18, 0, Math.PI * 2);
  c.stroke();

  // Inner thin ring
  c.strokeStyle = 'rgba(180,180,200,0.2)';
  c.lineWidth   = 1.2;
  c.beginPath();
  c.arc(cx, cy, R - 80, 0, Math.PI * 2);
  c.stroke();

  // Tick marks — silver
  const TICKS = 72;
  for (let i = 0; i < TICKS; i++) {
    const angle   = (i / TICKS) * Math.PI * 2;
    const isMajor = i % 6 === 0;
    const innerR  = isMajor ? R - 58 : R - 46;
    c.strokeStyle = isMajor
      ? 'rgba(220,220,240,0.8)'
      : 'rgba(160,160,180,0.35)';
    c.lineWidth = isMajor ? 2.2 : 1.1;
    c.beginPath();
    c.moveTo(cx + Math.cos(angle) * innerR,   cy + Math.sin(angle) * innerR);
    c.lineTo(cx + Math.cos(angle) * (R - 22), cy + Math.sin(angle) * (R - 22));
    c.stroke();
  }

  // Top-left specular sheen — gives the concave dish look
  const sheen = c.createRadialGradient(cx - 160, cy - 180, 0, cx, cy, R - 40);
  sheen.addColorStop(0,   'rgba(255,255,255,0.1)');
  sheen.addColorStop(0.35,'rgba(200,210,255,0.04)');
  sheen.addColorStop(1,   'rgba(200,210,255,0)');
  c.fillStyle = sheen;
  c.fillRect(0, 0, S, S);

  // $HACK — bright white/silver with very subtle purple glow
  c.save();
  c.shadowColor  = 'rgba(180,140,255,0.5)';
  c.shadowBlur   = 30;
  c.fillStyle    = '#f0f0f8';
  c.font         = `bold ${S * 0.165}px ui-monospace,"SF Mono",monospace`;
  c.textAlign    = 'center';
  c.textBaseline = 'middle';
  c.fillText('$HACK', cx, cy - 16);
  c.restore();

  // Sub-label — muted silver
  c.save();
  c.fillStyle = 'rgba(160,165,190,0.65)';
  c.font      = `bold ${S * 0.037}px ui-monospace,monospace`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('ERC-20  ·  POLYGON', cx, cy + S * 0.098);
  c.restore();

  c.restore();
  return new THREE.CanvasTexture(cv);
}

function buildBack(): THREE.CanvasTexture {
  const S  = 1024;
  const cx = S / 2, cy = S / 2, R = S / 2;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const c  = cv.getContext('2d')!;

  c.save();
  c.beginPath();
  c.arc(cx, cy, R, 0, Math.PI * 2);
  c.clip();

  const base = c.createRadialGradient(cx, cy, 0, cx, cy, R);
  base.addColorStop(0, '#12141c');
  base.addColorStop(1, '#060709');
  c.fillStyle = base;
  c.fillRect(0, 0, S, S);

  // Outer rim — match front
  const rim = c.createLinearGradient(0, S, S, 0);
  rim.addColorStop(0,   '#e8e8e8');
  rim.addColorStop(0.5, '#909090');
  rim.addColorStop(1,   '#e8e8e8');
  c.strokeStyle = rim;
  c.lineWidth   = 8;
  c.beginPath();
  c.arc(cx, cy, R - 18, 0, Math.PI * 2);
  c.stroke();

  // Hexagon — HackChain motif, silver
  const hexR = 185;
  c.strokeStyle = 'rgba(180,180,210,0.4)';
  c.lineWidth   = 3.5;
  c.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
    i === 0
      ? c.moveTo(cx + Math.cos(a) * hexR, cy + Math.sin(a) * hexR)
      : c.lineTo(cx + Math.cos(a) * hexR, cy + Math.sin(a) * hexR);
  }
  c.closePath();
  c.stroke();

  // Inner hexagon
  c.strokeStyle = 'rgba(150,150,180,0.18)';
  c.lineWidth   = 1.5;
  c.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
    i === 0
      ? c.moveTo(cx + Math.cos(a) * hexR * 0.62, cy + Math.sin(a) * hexR * 0.62)
      : c.lineTo(cx + Math.cos(a) * hexR * 0.62, cy + Math.sin(a) * hexR * 0.62);
  }
  c.closePath();
  c.stroke();

  // HC monogram — silver
  c.save();
  c.shadowColor  = 'rgba(180,140,255,0.4)';
  c.shadowBlur   = 24;
  c.fillStyle    = 'rgba(200,205,230,0.75)';
  c.font         = `bold ${S * 0.18}px ui-monospace,"SF Mono",monospace`;
  c.textAlign    = 'center';
  c.textBaseline = 'middle';
  c.fillText('HC', cx, cy);
  c.restore();

  c.restore();
  return new THREE.CanvasTexture(cv);
}

function buildEdge(): THREE.CanvasTexture {
  const W = 256, H = 64;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c  = cv.getContext('2d')!;

  // Brushed silver bevel — bright center, dark at edges
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0,    '#1a1a22');
  g.addColorStop(0.12, '#707080');
  g.addColorStop(0.3,  '#b0b0c0');
  g.addColorStop(0.5,  '#dcdce8');
  g.addColorStop(0.7,  '#b0b0c0');
  g.addColorStop(0.88, '#707080');
  g.addColorStop(1,    '#1a1a22');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);

  // Reeding lines
  for (let x = 0; x < W; x += 3.5) {
    c.fillStyle = 'rgba(0,0,0,0.2)';
    c.fillRect(x, 0, 1.5, H);
  }

  // Center highlight
  c.fillStyle = 'rgba(255,255,255,0.18)';
  c.fillRect(0, H / 2 - 1, W, 2);

  return new THREE.CanvasTexture(cv);
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HackTokenCoin() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth  || 400;
    const H = el.clientHeight || 400;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 50);
    camera.position.set(0, 0, 5.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    el.appendChild(renderer.domElement);

    // Textures
    const faceT = buildFace();
    const backT  = buildBack();
    const edgeT  = buildEdge();

    // Materials — MeshPhysicalMaterial for clearcoat + metalness
    const sharedProps = { metalness: 0.8, roughness: 0.18, clearcoat: 0.9, clearcoatRoughness: 0.1 };
    const faceMat = new THREE.MeshPhysicalMaterial({ map: faceT, ...sharedProps });
    const backMat = new THREE.MeshPhysicalMaterial({ map: backT, ...sharedProps });
    const edgeMat = new THREE.MeshPhysicalMaterial({
      map: edgeT,
      metalness: 0.95,
      roughness: 0.06,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
    });

    // Coin — standing upright, face toward viewer
    const coinGeo = new THREE.CylinderGeometry(1.72, 1.72, 0.13, 96, 1, false);
    const coin    = new THREE.Mesh(coinGeo, [edgeMat, faceMat, backMat]);
    coin.rotation.x = Math.PI / 2;
    scene.add(coin);

    // Lighting — no warm gold, keep cool/neutral to match site palette
    scene.add(new THREE.AmbientLight(0x1a1a2e, 1.0));

    // White/cool key light — top left
    const keyLight = new THREE.PointLight(0xffffff, 4.5, 14);
    keyLight.position.set(3.5, 3.5, 4.5);
    scene.add(keyLight);

    // Cool blue-white fill — right
    const fillLight = new THREE.PointLight(0xa0c4ff, 2.0, 12);
    fillLight.position.set(-4, -1, 3);
    scene.add(fillLight);

    // Purple atmospheric rim — behind the coin
    const rimLight = new THREE.PointLight(0x9333ea, 1.8, 9);
    rimLight.position.set(0, 0, -4);
    scene.add(rimLight);

    // ── Interaction
    let isDragging  = false;
    let prevX       = 0;
    let prevY       = 0;
    let velX        = 0;
    let velY        = 0;
    let targetRotY  = 0;
    let targetRotX  = Math.PI / 2;
    let currentRotY = 0;
    let currentRotX = Math.PI / 2;
    let idleTimer   = 0;

    const onDown = (cx: number, cy: number) => {
      isDragging = true;
      idleTimer  = 0;
      prevX = cx; prevY = cy;
      velX = velY = 0;
      renderer.domElement.style.cursor = 'grabbing';
    };
    const onMove = (cx: number, cy: number) => {
      if (!isDragging) return;
      velX = (cx - prevX) * 0.013;
      velY = (cy - prevY) * 0.007;
      targetRotY += velX;
      targetRotX  = Math.max(Math.PI / 2 - 0.55, Math.min(Math.PI / 2 + 0.55, targetRotX + velY));
      prevX = cx; prevY = cy;
    };
    const onUp = () => {
      isDragging = false;
      renderer.domElement.style.cursor = 'grab';
    };

    renderer.domElement.style.cursor = 'grab';
    const onMD = (e: MouseEvent) => onDown(e.clientX, e.clientY);
    const onMM = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const onMU = () => onUp();
    renderer.domElement.addEventListener('mousedown', onMD);
    window.addEventListener('mousemove', onMM);
    window.addEventListener('mouseup',   onMU);

    const onTS = (e: TouchEvent) => { e.preventDefault(); onDown(e.touches[0].clientX, e.touches[0].clientY); };
    const onTM = (e: TouchEvent) => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); };
    renderer.domElement.addEventListener('touchstart', onTS, { passive: false });
    renderer.domElement.addEventListener('touchmove',  onTM, { passive: false });
    renderer.domElement.addEventListener('touchend',   onUp);

    // ── Animation loop
    let raf: number;
    let t = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      t  += 0.012;

      if (!isDragging) {
        velX *= 0.93;
        velY *= 0.93;
        targetRotY += velX;
        targetRotX += velY;
        idleTimer  += 0.012;
        const snap  = Math.min(0.014, idleTimer * 0.0005);
        targetRotX += (Math.PI / 2 - targetRotX) * snap;
        targetRotY += 0.005;
      }

      currentRotY += (targetRotY - currentRotY) * 0.1;
      currentRotX += (targetRotX - currentRotX) * 0.1;
      coin.rotation.y = currentRotY;
      coin.rotation.x = currentRotX;
      coin.position.y  = Math.sin(t * 0.7) * 0.07;

      keyLight.intensity = 4.5 + Math.sin(t * 1.5) * 0.6;

      renderer.render(scene, camera);
    };
    tick();

    // ── Resize
    const onResize = () => {
      if (!el) return;
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // ── Cleanup
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize',    onResize);
      window.removeEventListener('mousemove', onMM);
      window.removeEventListener('mouseup',   onMU);
      renderer.domElement.removeEventListener('mousedown',  onMD);
      renderer.domElement.removeEventListener('touchstart', onTS);
      renderer.domElement.removeEventListener('touchmove',  onTM);
      renderer.domElement.removeEventListener('touchend',   onUp);
      renderer.dispose();
      coinGeo.dispose();
      [faceT, backT, edgeT].forEach(tx => tx.dispose());
      [faceMat, backMat, edgeMat].forEach(m => m.dispose());
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-full select-none"
      style={{ touchAction: 'none' }}
    />
  );
}
