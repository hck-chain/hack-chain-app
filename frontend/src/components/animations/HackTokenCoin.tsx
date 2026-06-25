import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// ── Texture builders ──────────────────────────────────────────────────────────

function buildFace(): THREE.CanvasTexture {
  const S   = 1024;
  const cx  = S / 2, cy = S / 2, R = S / 2;
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = S;
  const ctx = cvs.getContext('2d')!;

  // Circular clip — everything stays inside the coin face
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();

  // Base: very dark charcoal, slight warm tint at center
  const base = ctx.createRadialGradient(cx, cy - 60, 0, cx, cy, R);
  base.addColorStop(0,   '#1c1410');
  base.addColorStop(0.6, '#0e0a08');
  base.addColorStop(1,   '#050304');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);

  // Micro hex-grid background pattern
  const hx = 42;
  ctx.save();
  ctx.globalAlpha = 0.045;
  ctx.strokeStyle = '#d4a017';
  ctx.lineWidth   = 0.8;
  for (let row = -1; row < S / (hx * 1.5) + 2; row++) {
    for (let col = -1; col < S / (hx * 1.73) + 2; col++) {
      const px = col * hx * 1.732 + (row % 2) * hx * 0.866;
      const py = row * hx * 1.5;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a  = (i / 6) * Math.PI * 2 - Math.PI / 6;
        const x2 = px + Math.cos(a) * hx * 0.5;
        const y2 = py + Math.sin(a) * hx * 0.5;
        i === 0 ? ctx.moveTo(x2, y2) : ctx.lineTo(x2, y2);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();

  // Outer rim — brushed gold
  const rimGrad = ctx.createLinearGradient(0, 0, S, S);
  rimGrad.addColorStop(0,    '#f5c842');
  rimGrad.addColorStop(0.25, '#c9972a');
  rimGrad.addColorStop(0.5,  '#f5c842');
  rimGrad.addColorStop(0.75, '#a07820');
  rimGrad.addColorStop(1,    '#f5c842');
  ctx.strokeStyle = rimGrad;
  ctx.lineWidth   = 9;
  ctx.beginPath();
  ctx.arc(cx, cy, R - 18, 0, Math.PI * 2);
  ctx.stroke();

  // Inner rim — thinner, darker gold
  ctx.strokeStyle = 'rgba(201,151,42,0.35)';
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R - 80, 0, Math.PI * 2);
  ctx.stroke();

  // Tick marks (like a watch dial)
  const TICKS = 72;
  for (let i = 0; i < TICKS; i++) {
    const angle   = (i / TICKS) * Math.PI * 2;
    const isMajor = i % 6 === 0;
    const innerR  = isMajor ? R - 60 : R - 48;
    ctx.strokeStyle = isMajor
      ? 'rgba(245,200,66,0.85)'
      : 'rgba(201,151,42,0.4)';
    ctx.lineWidth = isMajor ? 2.5 : 1.2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * innerR,    cy + Math.sin(angle) * innerR);
    ctx.lineTo(cx + Math.cos(angle) * (R - 22),  cy + Math.sin(angle) * (R - 22));
    ctx.stroke();
  }

  // Cardinal diamonds
  [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5].forEach(angle => {
    const dr = R - 70;
    const x  = cx + Math.cos(angle) * dr;
    const y  = cy + Math.sin(angle) * dr;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = 'rgba(245,200,66,0.75)';
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(3, 0);
    ctx.lineTo(0, 5);
    ctx.lineTo(-3, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  // Top-left specular sheen (simulates concave dish reflection)
  const sheen = ctx.createRadialGradient(cx - 140, cy - 160, 0, cx, cy, R - 60);
  sheen.addColorStop(0,   'rgba(255,235,140,0.12)');
  sheen.addColorStop(0.4, 'rgba(255,210,80,0.04)');
  sheen.addColorStop(1,   'rgba(255,210,80,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, S, S);

  // $HACK — main engraved gold text
  ctx.save();
  ctx.shadowColor  = 'rgba(245,197,24,0.55)';
  ctx.shadowBlur   = 36;
  ctx.fillStyle    = '#f5c518';
  ctx.font         = `bold ${S * 0.165}px ui-monospace,"SF Mono",monospace`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$HACK', cx, cy - 16);
  ctx.restore();

  // Sub-label
  ctx.save();
  ctx.shadowColor = 'rgba(201,151,42,0.5)';
  ctx.shadowBlur  = 10;
  ctx.fillStyle   = 'rgba(210,165,50,0.72)';
  ctx.font        = `bold ${S * 0.038}px ui-monospace,monospace`;
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ERC-20  ·  POLYGON', cx, cy + S * 0.098);
  ctx.restore();

  ctx.restore(); // end circular clip
  return new THREE.CanvasTexture(cvs);
}

function buildBack(): THREE.CanvasTexture {
  const S   = 1024;
  const cx  = S / 2, cy = S / 2, R = S / 2;
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = S;
  const ctx = cvs.getContext('2d')!;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();

  // Same dark base
  const base = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
  base.addColorStop(0,   '#1a1108');
  base.addColorStop(1,   '#050304');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);

  // Outer rim — match front
  const rimGrad = ctx.createLinearGradient(0, S, S, 0);
  rimGrad.addColorStop(0,    '#f5c842');
  rimGrad.addColorStop(0.5,  '#c9972a');
  rimGrad.addColorStop(1,    '#f5c842');
  ctx.strokeStyle = rimGrad;
  ctx.lineWidth   = 9;
  ctx.beginPath();
  ctx.arc(cx, cy, R - 18, 0, Math.PI * 2);
  ctx.stroke();

  // Large hexagon — HackChain motif
  const hexR = 190;
  ctx.strokeStyle = 'rgba(201,151,42,0.5)';
  ctx.lineWidth   = 4;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a  = (i / 6) * Math.PI * 2 - Math.PI / 6;
    const x  = cx + Math.cos(a) * hexR;
    const y  = cy + Math.sin(a) * hexR;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  // Inner hexagon
  ctx.strokeStyle = 'rgba(201,151,42,0.2)';
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a  = (i / 6) * Math.PI * 2 - Math.PI / 6;
    const x  = cx + Math.cos(a) * (hexR * 0.65);
    const y  = cy + Math.sin(a) * (hexR * 0.65);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  // HC monogram
  ctx.save();
  ctx.shadowColor  = 'rgba(245,197,24,0.5)';
  ctx.shadowBlur   = 28;
  ctx.fillStyle    = '#d4a017';
  ctx.font         = `bold ${S * 0.18}px ui-monospace,"SF Mono",monospace`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('HC', cx, cy);
  ctx.restore();

  ctx.restore();
  return new THREE.CanvasTexture(cvs);
}

function buildEdge(): THREE.CanvasTexture {
  const W = 256, H = 64;
  const cvs = document.createElement('canvas');
  cvs.width = W; cvs.height = H;
  const ctx = cvs.getContext('2d')!;

  // Brushed gold gradient — bright at center, dark at edges (bevel)
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0,    '#3d2800');
  g.addColorStop(0.1,  '#8b6010');
  g.addColorStop(0.3,  '#d4a017');
  g.addColorStop(0.5,  '#f5c842');
  g.addColorStop(0.7,  '#d4a017');
  g.addColorStop(0.9,  '#8b6010');
  g.addColorStop(1,    '#3d2800');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Reeding — fine vertical lines like a real coin edge
  for (let x = 0; x < W; x += 3.5) {
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(x, 0, 1.5, H);
  }

  // Center highlight line
  ctx.fillStyle = 'rgba(255,240,160,0.25)';
  ctx.fillRect(0, H / 2 - 1, W, 2);

  return new THREE.CanvasTexture(cvs);
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HackTokenCoin() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth  || 400;
    const H = el.clientHeight || 400;

    // Scene
    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(38, W / H, 0.1, 50);
    camera.position.set(0, 0, 5.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping     = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    el.appendChild(renderer.domElement);

    // ── Textures
    const faceT = buildFace();
    const backT  = buildBack();
    const edgeT  = buildEdge();

    // ── Materials — MeshPhysicalMaterial for clearcoat shine
    const faceMat = new THREE.MeshPhysicalMaterial({
      map:        faceT,
      metalness:  0.72,
      roughness:  0.22,
      clearcoat:  0.85,
      clearcoatRoughness: 0.12,
    });
    const backMat = new THREE.MeshPhysicalMaterial({
      map:        backT,
      metalness:  0.72,
      roughness:  0.22,
      clearcoat:  0.85,
      clearcoatRoughness: 0.12,
    });
    const edgeMat = new THREE.MeshPhysicalMaterial({
      map:        edgeT,
      metalness:  0.95,
      roughness:  0.08,
      clearcoat:  1.0,
      clearcoatRoughness: 0.05,
    });

    // ── Coin geometry — standing upright (rotation.x = PI/2 makes face toward camera)
    const coinGeo = new THREE.CylinderGeometry(1.72, 1.72, 0.13, 96, 1, false);
    // CylinderGeometry groups: 0=side(edge), 1=top, 2=bottom
    const coin    = new THREE.Mesh(coinGeo, [edgeMat, faceMat, backMat]);
    coin.rotation.x = Math.PI / 2; // stand upright, face toward viewer
    scene.add(coin);

    // ── Thin orbit ring
    const ringGeo = new THREE.TorusGeometry(2.42, 0.009, 16, 160);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xd4a017,
      transparent: true,
      opacity: 0.22,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // Second tilted ring
    const ring2Geo = new THREE.TorusGeometry(2.78, 0.006, 16, 160);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0x8b5e0a,
      transparent: true,
      opacity: 0.15,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 2.4;
    ring2.rotation.z = Math.PI / 7;
    scene.add(ring2);

    // ── Lighting
    // Warm golden key — top left
    const keyLight = new THREE.PointLight(0xffd060, 5.5, 14);
    keyLight.position.set(3.5, 3.5, 4);
    scene.add(keyLight);

    // Cool blue-white fill — right
    const fillLight = new THREE.PointLight(0xc8deff, 2.2, 12);
    fillLight.position.set(-4, -1, 3);
    scene.add(fillLight);

    // Amber under-bounce
    const bounceLight = new THREE.PointLight(0xff9a20, 1.2, 8);
    bounceLight.position.set(0, -4, 2);
    scene.add(bounceLight);

    // Soft ambient
    scene.add(new THREE.AmbientLight(0x2a1800, 0.9));

    // ── Interaction state
    let isDragging   = false;
    let prevX        = 0;
    let prevY        = 0;
    let velX         = 0;
    let velY         = 0;
    let targetRotY   = 0;
    let targetRotX   = Math.PI / 2;
    let currentRotY  = 0;
    let currentRotX  = Math.PI / 2;
    let idleTimer    = 0;

    const onDown = (clientX: number, clientY: number) => {
      isDragging = true;
      idleTimer  = 0;
      prevX      = clientX;
      prevY      = clientY;
      velX = velY = 0;
      renderer.domElement.style.cursor = 'grabbing';
    };
    const onMove = (clientX: number, clientY: number) => {
      if (!isDragging) return;
      const dx = clientX - prevX;
      const dy = clientY - prevY;
      velX       = dx * 0.012;
      velY       = dy * 0.006;
      targetRotY += dx * 0.012;
      targetRotX += dy * 0.006;
      // Clamp vertical tilt so it doesn't flip too far
      targetRotX = Math.max(Math.PI / 2 - 0.6, Math.min(Math.PI / 2 + 0.6, targetRotX));
      prevX = clientX;
      prevY = clientY;
    };
    const onUp = () => {
      isDragging = false;
      renderer.domElement.style.cursor = 'grab';
    };

    // Mouse
    renderer.domElement.style.cursor = 'grab';
    const onMouseDown = (e: MouseEvent) => onDown(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const onMouseUp   = () => onUp();
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);

    // Touch
    const onTouchStart = (e: TouchEvent) => { e.preventDefault(); onDown(e.touches[0].clientX, e.touches[0].clientY); };
    const onTouchMove  = (e: TouchEvent) => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); };
    const onTouchEnd   = () => onUp();
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
    renderer.domElement.addEventListener('touchmove',  onTouchMove,  { passive: false });
    renderer.domElement.addEventListener('touchend',   onTouchEnd);

    // ── Animation loop
    let raf: number;
    let t   = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      t  += 0.012;

      if (!isDragging) {
        // Apply momentum + decay
        velX *= 0.94;
        velY *= 0.94;
        targetRotY += velX;
        targetRotX += velY;

        // After momentum fades, drift back to upright tilt
        idleTimer += 0.012;
        const snapStr = Math.min(0.012, idleTimer * 0.0004);
        targetRotX += (Math.PI / 2 - targetRotX) * snapStr;

        // Auto-rotate slowly
        targetRotY += 0.006;
      }

      // Lerp to target
      currentRotY += (targetRotY - currentRotY) * 0.1;
      currentRotX += (targetRotX - currentRotX) * 0.1;

      coin.rotation.y = currentRotY;
      coin.rotation.x = currentRotX;

      // Subtle float
      coin.position.y = Math.sin(t * 0.7) * 0.07;

      // Rings drift
      ring.rotation.z  += 0.0025;
      ring2.rotation.z -= 0.0015;

      // Key light shimmer (warm pulse)
      keyLight.intensity = 5.5 + Math.sin(t * 1.6) * 0.7;

      renderer.render(scene, camera);
    };
    tick();

    // ── Resize
    const onResize = () => {
      if (!el) return;
      const nw = el.clientWidth;
      const nh = el.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    // ── Cleanup
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize',    onResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
      renderer.domElement.removeEventListener('mousedown',  onMouseDown);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      renderer.domElement.removeEventListener('touchmove',  onTouchMove);
      renderer.domElement.removeEventListener('touchend',   onTouchEnd);
      renderer.dispose();
      [coinGeo, ringGeo, ring2Geo].forEach(g => g.dispose());
      [faceT, backT, edgeT].forEach(tx => tx.dispose());
      [faceMat, backMat, edgeMat, ringMat, ring2Mat].forEach(m => m.dispose());
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
