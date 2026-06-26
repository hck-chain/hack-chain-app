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

  // 1. Base — Deep violet, neon purple, indigo gradient (Balanced)
  const base = c.createRadialGradient(cx, cy, 0, cx, cy, R);
  base.addColorStop(0,   '#310d54'); // Darker violet center
  base.addColorStop(0.5, '#1b0638'); // Mid indigo
  base.addColorStop(1,   '#0d031c'); // Dark edge
  c.fillStyle = base;
  c.fillRect(0, 0, S, S);

  // 2. Sophisticated digital circuit board
  c.lineWidth = 2;
  c.lineJoin = 'round';
  const drawCircuit = (startX: number, startY: number, angle: number, color: string) => {
    c.strokeStyle = color;
    c.beginPath();
    c.moveTo(startX, startY);
    let x = startX + Math.cos(angle) * 80;
    let y = startY + Math.sin(angle) * 80;
    c.lineTo(x, y);
    // Bend 45 degrees
    const turn = angle + (Math.random() > 0.5 ? Math.PI / 4 : -Math.PI / 4);
    x += Math.cos(turn) * 120;
    y += Math.sin(turn) * 120;
    c.lineTo(x, y);
    // End node
    c.stroke();
    c.beginPath();
    c.arc(x, y, 4, 0, Math.PI * 2);
    c.fillStyle = color;
    c.fill();
  };

  // Copper traces & Neon schematic lines
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const color = i % 3 === 0 ? 'rgba(0, 243, 255, 0.6)' : 'rgba(184, 115, 51, 0.4)'; // Neon Cyan & Copper
    const startDist = 180 + Math.random() * 40;
    drawCircuit(cx + Math.cos(angle) * startDist, cy + Math.sin(angle) * startDist, angle, color);
  }

  // 3. Central CPU chip background
  c.fillStyle = '#0f111a';
  c.strokeStyle = '#2d334a';
  c.lineWidth = 4;
  c.shadowColor = 'rgba(0, 243, 255, 0.3)';
  c.shadowBlur = 20;
  c.fillRect(cx - 160, cy - 160, 320, 320);
  c.strokeRect(cx - 160, cy - 160, 320, 320);
  c.shadowBlur = 0;

  // Inner CPU details
  c.strokeStyle = 'rgba(184, 115, 51, 0.5)'; // Copper pins
  c.lineWidth = 3;
  for (let i = -140; i <= 140; i += 20) {
    // Top & Bottom pins
    c.beginPath(); c.moveTo(cx + i, cy - 160); c.lineTo(cx + i, cy - 180); c.stroke();
    c.beginPath(); c.moveTo(cx + i, cy + 160); c.lineTo(cx + i, cy + 180); c.stroke();
    // Left & Right pins
    c.beginPath(); c.moveTo(cx - 160, cy + i); c.lineTo(cx - 180, cy + i); c.stroke();
    c.beginPath(); c.moveTo(cx + 160, cy + i); c.lineTo(cx + 180, cy + i); c.stroke();
  }

  // 4. Glowing Ring Gauges (HACK VALUE & NETWORK LOAD)
  const drawGauge = (radius: number, start: number, end: number, color: string, glowColor: string, segments: number) => {
    c.strokeStyle = 'rgba(40, 40, 60, 0.5)'; // background track
    c.lineWidth = 14;
    c.beginPath();
    c.arc(cx, cy, radius, start, end);
    c.stroke();

    c.shadowColor = glowColor;
    c.shadowBlur = 15;
    c.strokeStyle = color;
    c.lineWidth = 10;
    // segmented active arc
    const step = (end - start) / segments;
    for (let i = 0; i < segments * 0.75; i++) { // 75% full
      c.beginPath();
      c.arc(cx, cy, radius, start + i * step + 0.02, start + (i + 1) * step - 0.02);
      c.stroke();
    }
    c.shadowBlur = 0;
  };

  // Top-Right: Network Load (Neon Purple)
  drawGauge(R - 120, -Math.PI / 2 + 0.2, Math.PI / 2 - 0.2, '#b026ff', 'rgba(176, 38, 255, 0.8)', 20);
  // Bottom-Left: Hack Value (Neon Blue)
  drawGauge(R - 120, Math.PI / 2 + 0.2, Math.PI * 1.5 - 0.2, '#00f3ff', 'rgba(0, 243, 255, 0.8)', 20);

  // 5. Outer rim — Brushed steel finish
  const rim = c.createLinearGradient(0, 0, S, S);
  rim.addColorStop(0,    '#d0d0d0');
  rim.addColorStop(0.25, '#505050');
  rim.addColorStop(0.5,  '#b0b0b0');
  rim.addColorStop(0.75, '#404040');
  rim.addColorStop(1,    '#c0c0c0');
  c.strokeStyle = rim;
  c.lineWidth   = 16;
  c.beginPath();
  c.arc(cx, cy, R - 18, 0, Math.PI * 2);
  c.stroke();

  // 6. Typography


  // $HACK Logo
  c.save();
  c.fillStyle = '#ffffff';
  c.shadowColor = 'rgba(176, 38, 255, 0.9)'; // Neon purple glow
  c.shadowBlur = 25;
  c.font = `bold ${S * 0.16}px ui-monospace,"SF Mono",monospace`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('$HACK', cx, cy + 15);
  c.restore();

  // Gauge Labels
  c.save();
  c.fillStyle = 'rgba(255, 255, 255, 0.8)';
  c.font = `bold ${S * 0.025}px ui-monospace,"SF Mono",monospace`;
  c.textBaseline = 'middle';
  // HACK VALUE label
  c.textAlign = 'right';
  c.fillText('HACK VALUE  [|||||  ]', cx - 220, cy + 280);
  // NETWORK LOAD label
  c.textAlign = 'left';
  c.fillText('[|||||||]  NETWORK LOAD', cx + 220, cy - 280);
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

  // Base — Cyberpunk dark server rack feel
  const base = c.createRadialGradient(cx, cy, 0, cx, cy, R);
  base.addColorStop(0, '#150824');
  base.addColorStop(1, '#05020a');
  c.fillStyle = base;
  c.fillRect(0, 0, S, S);

  // Background Grid / Server racks hint
  c.strokeStyle = 'rgba(0, 243, 255, 0.05)';
  c.lineWidth = 2;
  for (let i = 0; i < S; i += 40) {
    c.beginPath(); c.moveTo(0, i); c.lineTo(S, i); c.stroke();
    c.beginPath(); c.moveTo(i, 0); c.lineTo(i, S); c.stroke();
  }

  // Outer rim — match front
  const rim = c.createLinearGradient(0, S, S, 0);
  rim.addColorStop(0,   '#d0d0d0');
  rim.addColorStop(0.5, '#505050');
  rim.addColorStop(1,   '#d0d0d0');
  c.strokeStyle = rim;
  c.lineWidth   = 16;
  c.beginPath();
  c.arc(cx, cy, R - 18, 0, Math.PI * 2);
  c.stroke();

  // Cyber Hexagon Network
  const hexR = 240;
  c.strokeStyle = 'rgba(176, 38, 255, 0.5)'; // Neon Purple
  c.shadowColor = 'rgba(176, 38, 255, 0.8)';
  c.shadowBlur = 15;
  c.lineWidth   = 4;
  c.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
    const px = cx + Math.cos(a) * hexR;
    const py = cy + Math.sin(a) * hexR;
    i === 0 ? c.moveTo(px, py) : c.lineTo(px, py);
  }
  c.closePath();
  c.stroke();

  // Nodes at vertices
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
    c.beginPath();
    c.arc(cx + Math.cos(a) * hexR, cy + Math.sin(a) * hexR, 12, 0, Math.PI * 2);
    c.fillStyle = '#00f3ff';
    c.shadowColor = '#00f3ff';
    c.fill();
  }

  // HC monogram — Tech style
  c.save();
  c.shadowColor  = 'rgba(0, 243, 255, 0.6)';
  c.shadowBlur   = 20;
  c.fillStyle    = '#ffffff';
  c.font         = `bold ${S * 0.22}px ui-monospace,"SF Mono",monospace`;
  c.textAlign    = 'center';
  c.textBaseline = 'middle';
  c.fillText('HC', cx, cy);
  c.restore();

  // Data flow lines
  c.strokeStyle = 'rgba(0, 243, 255, 0.3)';
  c.lineWidth = 2;
  c.shadowBlur = 0;
  for(let i=0; i<6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
    c.beginPath();
    c.moveTo(cx + Math.cos(a) * 120, cy + Math.sin(a) * 120);
    c.lineTo(cx + Math.cos(a) * hexR, cy + Math.sin(a) * hexR);
    c.stroke();
  }

  c.restore();
  return new THREE.CanvasTexture(cv);
}

function buildEdge(): THREE.CanvasTexture {
  const W = 256, H = 64;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c  = cv.getContext('2d')!;

  // Brushed steel edge — dark cyber tones
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0,    '#0c0514');
  g.addColorStop(0.2,  '#4a4a5a');
  g.addColorStop(0.5,  '#808090');
  g.addColorStop(0.8,  '#4a4a5a');
  g.addColorStop(1,    '#0c0514');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);

  // Deep reeding lines
  for (let x = 0; x < W; x += 4) {
    c.fillStyle = 'rgba(0,0,0,0.4)';
    c.fillRect(x, 0, 2, H);
  }

  // Glowing center ring (cyan)
  c.fillStyle = 'rgba(0, 243, 255, 0.3)';
  c.shadowColor = '#00f3ff';
  c.shadowBlur = 5;
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
    // Mobile optimization: restrict pixel ratio on small screens to save battery/GPU
    const isMobile = window.innerWidth < 768;
    renderer.setPixelRatio(isMobile ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    el.appendChild(renderer.domElement);

    // Textures
    const faceT = buildFace();
    
    const backT  = buildBack();
    backT.center.set(0.5, 0.5);
    backT.repeat.x = -1; // Fix mirrored text on the back face

    const edgeT  = buildEdge();

    // Materials — High gloss metallic for the cyberpunk feel
    // Balanced metalness and roughness
    const sharedProps = { metalness: 0.6, roughness: 0.35, clearcoat: 0.5, clearcoatRoughness: 0.2 };
    const faceMat = new THREE.MeshPhysicalMaterial({ map: faceT, ...sharedProps });
    const backMat = new THREE.MeshPhysicalMaterial({ map: backT, ...sharedProps });
    const edgeMat = new THREE.MeshPhysicalMaterial({
      map: edgeT,
      metalness: 0.85,
      roughness: 0.15,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
    });

    // Coin — reduced segments for mobile optimization (64 instead of 96)
    const coinGeo = new THREE.CylinderGeometry(1.72, 1.72, 0.13, isMobile ? 48 : 64, 1, false);
    const coin    = new THREE.Mesh(coinGeo, [edgeMat, faceMat, backMat]);
    coin.rotation.x = Math.PI / 2;
    coin.rotation.y = Math.PI / 2; // Rotate 90 degrees so the text is horizontal
    
    const coinGroup = new THREE.Group();
    coinGroup.add(coin);
    scene.add(coinGroup);

    // Lighting — Cyberpunk Palette
    // Base dark ambiance (slightly lower)
    scene.add(new THREE.AmbientLight(0x2b154a, 2.0));

    // Front Light — Subtly illuminate the face
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.2); // Lowered again to remove any lingering washout
    frontLight.position.set(0, 0, 5);
    scene.add(frontLight);

    // Key Light — Neon Cyan (Top Left)
    const keyLight = new THREE.PointLight(0x00f3ff, 3.5, 15);
    keyLight.position.set(3.5, 3.5, 4.5);
    scene.add(keyLight);

    // Fill Light — Neon Purple (Bottom Right)
    const fillLight = new THREE.PointLight(0xb026ff, 5.0, 15);
    fillLight.position.set(-4, -2, 3);
    scene.add(fillLight);

    // Rim Light — Deep Indigo (Back)
    const rimLight = new THREE.PointLight(0x4a00e0, 4.0, 10);
    rimLight.position.set(0, 0, -4);
    scene.add(rimLight);

    // ── Interaction
    let isDragging  = false;
    let prevX       = 0;
    let prevY       = 0;
    let velX        = 0;
    let velY        = 0;
    let targetRotY  = 0;
    let targetRotX  = 0;
    let currentRotY = 0;
    let currentRotX = 0;
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
      targetRotX  = Math.max(-0.55, Math.min(0.55, targetRotX + velY));
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
        targetRotX += (0 - targetRotX) * snap;
        targetRotY += 0.002; // Reduced default rotation speed
      }

      currentRotY += (targetRotY - currentRotY) * 0.1;
      currentRotX += (targetRotX - currentRotX) * 0.1;
      coinGroup.rotation.y = currentRotY;
      coinGroup.rotation.x = currentRotX;

      // Pulse the key light to simulate a glowing/breathing dashboard
      keyLight.intensity = 5.0 + Math.sin(t * 2.0) * 0.8;
      fillLight.intensity = 4.0 + Math.cos(t * 1.5) * 0.6;

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
