import { useEffect, useRef } from 'react';
import * as THREE from 'three';

function buildFaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const cx = 256, cy = 256, r = 256;

  // Base — radial dark-purple gradient
  const base = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  base.addColorStop(0,   '#1e0d4a');
  base.addColorStop(0.6, '#130830');
  base.addColorStop(1,   '#07030f');
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Outer decorative ring
  ctx.strokeStyle = 'rgba(168,85,247,0.55)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, 234, 0, Math.PI * 2);
  ctx.stroke();

  // Tick marks around the ring
  const ticks = 36;
  for (let i = 0; i < ticks; i++) {
    const angle = (i / ticks) * Math.PI * 2;
    const inner = i % 3 === 0 ? 210 : 220;
    ctx.strokeStyle = i % 3 === 0
      ? 'rgba(168,85,247,0.7)'
      : 'rgba(168,85,247,0.3)';
    ctx.lineWidth = i % 3 === 0 ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * 234, cy + Math.sin(angle) * 234);
    ctx.stroke();
  }

  // Inner ring
  ctx.strokeStyle = 'rgba(139,92,246,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, 195, 0, Math.PI * 2);
  ctx.stroke();

  // Subtle radial sheen
  const sheen = ctx.createRadialGradient(cx - 60, cy - 60, 0, cx, cy, 200);
  sheen.addColorStop(0,   'rgba(255,255,255,0.06)');
  sheen.addColorStop(0.5, 'rgba(255,255,255,0.01)');
  sheen.addColorStop(1,   'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.beginPath();
  ctx.arc(cx, cy, 200, 0, Math.PI * 2);
  ctx.fill();

  // $HACK — main label with glow
  ctx.save();
  ctx.shadowColor  = 'rgba(192,132,252,0.9)';
  ctx.shadowBlur   = 28;
  ctx.fillStyle    = '#ffffff';
  ctx.font         = 'bold 88px ui-monospace, monospace';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$HACK', cx, cy - 10);
  ctx.restore();

  // Sub-label
  ctx.save();
  ctx.shadowColor  = 'rgba(168,85,247,0.6)';
  ctx.shadowBlur   = 10;
  ctx.fillStyle    = 'rgba(196,148,255,0.75)';
  ctx.font         = 'bold 24px ui-monospace, monospace';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ERC-20 · POLYGON', cx, cy + 60);
  ctx.restore();

  return new THREE.CanvasTexture(canvas);
}

function buildBackTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const cx = 256, cy = 256;

  const base = ctx.createRadialGradient(cx, cy, 0, cx, cy, 256);
  base.addColorStop(0,   '#1a0b40');
  base.addColorStop(1,   '#07030f');
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.arc(cx, cy, 256, 0, Math.PI * 2);
  ctx.fill();

  // Hexagon outline (HackChain motif)
  const hexR = 110;
  ctx.strokeStyle = 'rgba(168,85,247,0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
    const x = cx + Math.cos(a) * hexR;
    const y = cy + Math.sin(a) * hexR;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  // HC monogram
  ctx.save();
  ctx.shadowColor = 'rgba(168,85,247,0.7)';
  ctx.shadowBlur  = 18;
  ctx.fillStyle   = 'rgba(196,148,255,0.8)';
  ctx.font        = 'bold 80px ui-monospace, monospace';
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('HC', cx, cy);
  ctx.restore();

  ctx.strokeStyle = 'rgba(168,85,247,0.4)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 230, 0, Math.PI * 2);
  ctx.stroke();

  return new THREE.CanvasTexture(canvas);
}

function buildEdgeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0,    '#0d061f');
  grad.addColorStop(0.15, '#5b21b6');
  grad.addColorStop(0.4,  '#a855f7');
  grad.addColorStop(0.5,  '#c084fc');
  grad.addColorStop(0.6,  '#a855f7');
  grad.addColorStop(0.85, '#5b21b6');
  grad.addColorStop(1,    '#0d061f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 64);

  // Reeding lines (like a real coin edge)
  for (let x = 0; x < 128; x += 4) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x, 0, 2, 64);
  }

  return new THREE.CanvasTexture(canvas);
}

export default function HackTokenCoin() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const w = el.clientWidth  || 360;
    const h = el.clientHeight || 360;

    // ── Scene ────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 50);
    camera.position.set(0, 0.6, 5.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // ── Coin ─────────────────────────────────────────────────────────────────
    const coinGeo  = new THREE.CylinderGeometry(1.7, 1.7, 0.14, 80, 1, false);
    const faceT    = buildFaceTexture();
    const backT    = buildBackTexture();
    const edgeT    = buildEdgeTexture();

    const faceMat  = new THREE.MeshStandardMaterial({ map: faceT, metalness: 0.75, roughness: 0.25 });
    const backMat  = new THREE.MeshStandardMaterial({ map: backT, metalness: 0.75, roughness: 0.25 });
    const edgeMat  = new THREE.MeshStandardMaterial({ map: edgeT, metalness: 0.9,  roughness: 0.1  });

    // CylinderGeometry groups: 0=side, 1=top, 2=bottom
    const coin = new THREE.Mesh(coinGeo, [edgeMat, faceMat, backMat]);
    coin.rotation.x = 0.38; // tilt toward viewer
    scene.add(coin);

    // ── Orbit rings ───────────────────────────────────────────────────────────
    const ring1Geo = new THREE.TorusGeometry(2.5,  0.013, 16, 120);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.35 });
    const ring1    = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 2.3;
    scene.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(3.05, 0.008, 16, 120);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.2 });
    const ring2    = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 2.6;
    ring2.rotation.z = Math.PI / 5;
    scene.add(ring2);

    // ── Orbiting particles ────────────────────────────────────────────────────
    const dotGeo = new THREE.SphereGeometry(0.055, 12, 12);
    const dots   = [
      { mat: new THREE.MeshBasicMaterial({ color: 0xe879f9 }), speed: 1.0, radius: 2.5, phase: 0 },
      { mat: new THREE.MeshBasicMaterial({ color: 0x818cf8 }), speed: 0.7, radius: 3.0, phase: 2.1 },
      { mat: new THREE.MeshBasicMaterial({ color: 0x34d399 }), speed: 1.3, radius: 2.2, phase: 4.2 },
    ].map(({ mat, speed, radius, phase }) => {
      const mesh = new THREE.Mesh(dotGeo, mat);
      scene.add(mesh);
      return { mesh, speed, radius, phase };
    });

    // ── Lighting ──────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x4c1d95, 0.6));

    const keyLight = new THREE.PointLight(0xffffff, 4, 14);
    keyLight.position.set(3.5, 3, 4);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0xa855f7, 2.5, 10);
    fillLight.position.set(-3, -1, 3);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x6d28d9, 1.5, 8);
    rimLight.position.set(0, 0, -4);
    scene.add(rimLight);

    // ── Animation loop ────────────────────────────────────────────────────────
    let raf: number;
    let t = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      t += 0.01;

      coin.rotation.y  += 0.007;
      coin.position.y   = Math.sin(t * 0.75) * 0.09;

      ring1.rotation.z += 0.002;
      ring2.rotation.z -= 0.001;

      dots.forEach(({ mesh, speed, radius, phase }) => {
        const a = t * speed + phase;
        mesh.position.x = Math.cos(a) * radius;
        mesh.position.z = Math.sin(a) * radius * 0.4;
        mesh.position.y = Math.sin(a * 2) * 0.25;
      });

      keyLight.intensity = 4 + Math.sin(t * 1.8) * 0.6;

      renderer.render(scene, camera);
    };
    tick();

    // ── Resize ────────────────────────────────────────────────────────────────
    const onResize = () => {
      if (!el) return;
      const nw = el.clientWidth;
      const nh = el.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      [coinGeo, ring1Geo, ring2Geo, dotGeo].forEach(g => g.dispose());
      [faceT, backT, edgeT].forEach(t => t.dispose());
      [faceMat, backMat, edgeMat, ring1Mat, ring2Mat, ...dots.map(d => d.mat)].forEach(m => m.dispose());
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
}
