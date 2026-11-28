'use client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Stars } from '@react-three/drei';
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Character } from './Character';
import { useGame } from '@/lib/client/store';
import { AVATARS, BUILDINGS, NPCS, OBSTACLES, RADIUS, nearest, resolve, interactWith } from '@/lib/game/world';
import { Interior } from './Interior3D';
import { CameraControls } from './CameraControls';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { Shadowed } from './Shadowed';
import { groundTex, stoneTex, roofTex } from '@/lib/client/textures';
import { PbrMaterial } from './Pbr';
import { cam, camRelative, resetCam } from '@/lib/client/camera';

// ───────── 공용 ─────────
let glowTex: THREE.Texture | null = null;
function glowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d')!; const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,230,160,1)'); gr.addColorStop(0.35, 'rgba(255,200,110,0.45)'); gr.addColorStop(1, 'rgba(255,200,110,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  glowTex = new THREE.CanvasTexture(c); return glowTex;
}
function Glow({ position, size = 1.6, color = '#ffd98a', opacity = 0.9 }: { position: [number, number, number]; size?: number; color?: string; opacity?: number }) {
  return <sprite position={position} scale={[size, size, 1]}><spriteMaterial map={glowTexture()} color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>;
}
const WOOD = '#6e4a2e', WOOD_D = '#4a3020', ROOF = '#2e3560', ROOF2 = '#4a527f', STONE = '#8d8aa0', CREAM = '#f3e3c3';
const Mat = ({ c, e, ei = 1 }: { c: string; e?: string; ei?: number }) => <meshStandardMaterial color={c} emissive={e} emissiveIntensity={e ? ei : 0} flatShading />;

function Hover({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <group onClick={(e) => { e.stopPropagation(); onClick(); }} onPointerOver={() => (document.body.style.cursor = 'pointer')} onPointerOut={() => (document.body.style.cursor = '')}>{children}</group>;
}

function Label({ y, icon, text, sub, onClick, quest }: { y: number; icon: string; text: string; sub?: string; onClick: () => void; quest?: boolean }) {
  return (
    <Html position={[0, y, 0]} center zIndexRange={[8, 0]} style={{ pointerEvents: 'auto' }}>
      <button className="world-label" onClick={onClick}>{quest && <span className="qmark">!</span>}<span>{icon}</span> {text}{sub && <small>{sub}</small>}</button>
    </Html>
  );
}

// ───────── 건물 ─────────
function Roof({ w, d, h = 1.7, y, color = ROOF, segs = 4, rot = Math.PI / 4 }: { w: number; d: number; h?: number; y: number; color?: string; segs?: number; rot?: number }) {
  const r = Math.hypot(w, d) / 2;
  return (
    <group position={[0, y, 0]}>
      <mesh rotation-y={rot} scale={[w / (r * 1.41), 1, d / (r * 1.41)]} position={[0, h / 2, 0]}><coneGeometry args={[r * 1.02, h, segs]} /><PbrMaterial id="tex_roof_tile" repeat={[4, 3]} tint="#8a8fb0" fallback={<meshStandardMaterial map={roofTex(color, [4, 3])} color="#fff" flatShading />} /></mesh>
      <mesh rotation-y={rot} scale={[w / (r * 1.41), 1, d / (r * 1.41)]} position={[0, -0.04, 0]}><coneGeometry args={[r * 1.12, 0.24, segs]} /><Mat c={ROOF2} /></mesh>
      <mesh position={[0, h + 0.1, 0]}><coneGeometry args={[0.12, 0.34, 6]} /><Mat c="#f5c451" e="#f5c451" ei={0.6} /></mesh>
    </group>
  );
}
function Windows({ w, z, n, y = 1.2, h = 1.2 }: { w: number; z: number; n: number; y?: number; h?: number }) {
  const gap = w / n;
  return <>{Array.from({ length: n }, (_, i) => {
    const x = -w / 2 + gap * (i + 0.5);
    return <group key={i} position={[x, y, z]}>
      <mesh><planeGeometry args={[gap * 0.78, h]} /><meshStandardMaterial color="#ffcf7a" emissive="#ffb347" emissiveIntensity={1.6} toneMapped={false} /></mesh>
      <mesh position={[0, 0, 0.01]}><boxGeometry args={[0.05, h, 0.03]} /><Mat c={WOOD_D} /></mesh>
      <mesh position={[0, 0, 0.01]}><boxGeometry args={[gap * 0.8, 0.05, 0.03]} /><Mat c={WOOD_D} /></mesh>
    </group>;
  })}</>;
}
function HangingLantern({ position }: { position: [number, number, number] }) {
  return <group position={position}><mesh><cylinderGeometry args={[0.14, 0.14, 0.34, 8]} /><meshStandardMaterial color="#ff9d4a" emissive="#ff7a1a" emissiveIntensity={1.6} toneMapped={false} /></mesh><Glow position={[0, 0, 0]} size={1.4} /></group>;
}
function Pillars({ pts, h = 2.2, color = WOOD }: { pts: [number, number][]; h?: number; color?: string }) {
  return <>{pts.map(([x, z], i) => <mesh key={i} position={[x, 0.3 + h / 2, z]}><cylinderGeometry args={[0.11, 0.13, h, 8]} /><Mat c={color} /></mesh>)}</>;
}

function Library() {
  const w = 5.4, d = 4;
  return <group>
    <mesh position={[0, 0.17, 0]}><boxGeometry args={[w + 1.2, 0.34, d + 1.2]} /><Mat c={STONE} /></mesh>
    <mesh position={[0, 1.4, 0]}><boxGeometry args={[w - 0.3, 2.2, d - 0.3]} /><Mat c={CREAM} /></mesh>
    <Pillars pts={[[-w / 2, d / 2], [w / 2, d / 2], [-w / 2, -d / 2], [w / 2, -d / 2], [0, d / 2]]} />
    <Windows w={w - 0.8} z={d / 2 - 0.12} n={3} />
    <Windows w={w - 0.8} z={-d / 2 + 0.12} n={3} />
    {/* 책장 */}
    {[-1.6, -0.55, 0.55, 1.6].map((x, i) => <mesh key={i} position={[x, 1.3, d / 2 - 0.35]}><boxGeometry args={[0.7, 1.0, 0.3]} /><Mat c={['#6f4aa8', '#a8483f', '#3f6fa8', '#c9a13a'][i]} /></mesh>)}
    <Roof w={w + 1.6} d={d + 1.6} y={2.5} h={1.9} />
    <HangingLantern position={[-w / 2, 2.3, d / 2 + 0.5]} /><HangingLantern position={[w / 2, 2.3, d / 2 + 0.5]} />
    <mesh position={[0, 2.2, d / 2 + 0.35]}><boxGeometry args={[1.5, 0.5, 0.08]} /><Mat c={WOOD_D} e="#f5c451" ei={0.1} /></mesh>
    {[0, 1, 2].map((i) => <mesh key={i} position={[0, 0.06 + i * 0.1, d / 2 + 1.0 + (2 - i) * 0.3]}><boxGeometry args={[2.2, 0.12, 0.3]} /><Mat c={STONE} /></mesh>)}
  </group>;
}
function Temple() {
  const w = 5.2, d = 4;
  return <group>
    {[0, 1, 2, 3, 4].map((i) => <mesh key={i} position={[0, 0.15 + i * 0.3, 4.2 - i * 0.55]}><boxGeometry args={[2.6, 0.3, 0.7]} /><Mat c={STONE} /></mesh>)}
    <mesh position={[0, 0.9, 0]}><boxGeometry args={[w + 1.4, 1.8, d + 1.4]} /><Mat c="#7d7a96" /></mesh>
    <mesh position={[0, 2.9, 0]}><boxGeometry args={[w - 0.4, 2.2, d - 0.4]} /><Mat c="#d96b4a" /></mesh>
    <Windows w={w - 1} z={d / 2 - 0.1} n={3} y={2.9} />
    <mesh position={[0, 2.9, d / 2 - 0.08]}><boxGeometry args={[1.3, 1.9, 0.06]} /><meshStandardMaterial color="#ffd36b" emissive="#ffb300" emissiveIntensity={1.2} toneMapped={false} /></mesh>
    <Roof w={w + 1.8} d={d + 1.8} y={4.0} h={1.5} />
    <mesh position={[0, 5.9, 0]}><boxGeometry args={[w - 1.4, 1.3, d - 1.4]} /><Mat c="#d96b4a" /></mesh>
    <Roof w={w - 0.2} d={d - 0.2} y={6.5} h={1.6} />
    {[-1, 1].map((s) => <group key={s} position={[s * 2.9, 2.9, d / 2 + 0.6]}><mesh><boxGeometry args={[0.5, 1.8, 0.05]} /><meshStandardMaterial color="#f5c451" emissive="#f5c451" emissiveIntensity={0.7} /></mesh></group>)}
    {[-1.3, 1.3].map((x) => <HangingLantern key={x} position={[x, 3.8, d / 2 + 0.8]} />)}
    <mesh position={[0, 4.0, d / 2 + 0.9]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.42, 0.42, 0.08, 16]} /><meshStandardMaterial color="#ffd86b" emissive="#ffb300" emissiveIntensity={1} toneMapped={false} /></mesh>
  </group>;
}
function Pavilion() {
  const R = 2.0;
  const pts = Array.from({ length: 6 }, (_, i) => [Math.cos((i / 6) * Math.PI * 2) * R, Math.sin((i / 6) * Math.PI * 2) * R] as [number, number]);
  return <group>
    <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[R + 0.8, R + 0.9, 0.4, 6]} /><Mat c="#9a96ad" /></mesh>
    <mesh position={[0, 0.45, 0]}><cylinderGeometry args={[R + 0.3, R + 0.3, 0.1, 6]} /><Mat c="#a97b4f" /></mesh>
    <Pillars pts={pts} h={2.4} color="#a8402f" />
    {pts.map(([x, z], i) => i % 2 === 0 && <mesh key={i} position={[x * 0.97, 2.0, z * 0.97]} rotation-y={-Math.atan2(z, x) + Math.PI / 2}><planeGeometry args={[1.5, 1.7]} /><meshStandardMaterial color="#f7e9ff" transparent opacity={0.55} side={2} emissive="#d8b8ff" emissiveIntensity={0.25} /></mesh>)}
    <mesh position={[0, 2.85, 0]}><cylinderGeometry args={[R + 0.15, R + 0.15, 0.2, 6]} /><Mat c="#a8402f" /></mesh>
    <group position={[0, 2.95, 0]}><mesh position={[0, 0.85, 0]}><coneGeometry args={[R + 1.5, 1.8, 6]} /><Mat c={ROOF} /></mesh><mesh position={[0, 0.0, 0]}><coneGeometry args={[R + 1.65, 0.25, 6]} /><Mat c={ROOF2} /></mesh><mesh position={[0, 1.85, 0]}><coneGeometry args={[0.1, 0.4, 6]} /><Mat c="#f5c451" e="#f5c451" /></mesh></group>
    <HangingLantern position={[0, 2.6, 0]} />
    <mesh position={[0, 0.7, 0]}><cylinderGeometry args={[0.6, 0.6, 0.45, 12]} /><Mat c="#caa77a" /></mesh>
  </group>;
}
function TarotTent() {
  return <group>
    <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[2.6, 2.7, 0.2, 10]} /><Mat c="#59407a" /></mesh>
    <mesh position={[0, 1.5, 0]}><coneGeometry args={[2.4, 3.2, 8, 1, true]} /><meshStandardMaterial color="#6b3fb5" side={2} flatShading emissive="#3a1e7a" emissiveIntensity={0.35} /></mesh>
    <mesh position={[0, 3.2, 0]}><sphereGeometry args={[0.16, 8, 8]} /><Mat c="#f5c451" e="#f5c451" /></mesh>
    <mesh position={[0, 0.95, 0]}><boxGeometry args={[1.6, 0.14, 0.9]} /><Mat c="#3a2a5c" /></mesh>
    {[-0.6, 0.6].map((x) => <mesh key={x} position={[x, 0.5, 0]}><boxGeometry args={[0.1, 0.9, 0.1]} /><Mat c={WOOD_D} /></mesh>)}
    {[-0.5, -0.17, 0.17, 0.5].map((x, i) => <mesh key={i} position={[x, 1.05, 0.0]} rotation-y={(i - 1.5) * 0.15}><boxGeometry args={[0.26, 0.02, 0.4]} /><Mat c={['#ffe9a8', '#f5c451', '#ffd0e8', '#bfe0ff'][i]} /></mesh>)}
    <mesh position={[0, 1.35, 0]}><sphereGeometry args={[0.22, 14, 14]} /><meshStandardMaterial color="#cfa9ff" emissive="#a67cff" emissiveIntensity={1.8} toneMapped={false} /></mesh>
    <Glow position={[0, 1.4, 0]} size={2.6} color="#b58bff" />
    <HangingLantern position={[-1.8, 2.2, 1.6]} /><HangingLantern position={[1.8, 2.2, 1.6]} />
  </group>;
}

function TimeRoom() {
  return <group>
    <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[2.7, 2.9, 0.4, 10]} /><Mat c={STONE} /></mesh>
    <mesh position={[0, 2.3, 0]}><cylinderGeometry args={[1.9, 2.1, 3.8, 10]} /><Mat c="#3b3f78" /></mesh>
    <mesh position={[0, 2.8, 2.07]}><circleGeometry args={[0.85, 20]} /><meshStandardMaterial color="#fff1c8" emissive="#ffd36b" emissiveIntensity={1.3} toneMapped={false} /></mesh>
    <mesh position={[0, 2.8, 2.09]} rotation-z={0.6}><boxGeometry args={[0.07, 0.6, 0.03]} /><Mat c="#3a2400" /></mesh>
    <mesh position={[0, 2.8, 2.09]} rotation-z={-1.2}><boxGeometry args={[0.07, 0.45, 0.03]} /><Mat c="#3a2400" /></mesh>
    {[0, 1, 2, 3].map((i) => <mesh key={i} position={[Math.cos(i * 1.57 + 0.78) * 1.95, 1.2, Math.sin(i * 1.57 + 0.78) * 1.95]}><boxGeometry args={[0.35, 0.8, 0.12]} /><meshStandardMaterial color="#ffcf7a" emissive="#ffb347" emissiveIntensity={1.4} toneMapped={false} /></mesh>)}
    <mesh position={[0, 5.2, 0]}><coneGeometry args={[2.5, 2.2, 10]} /><Mat c="#5a2f8a" /></mesh>
    <mesh position={[0, 6.5, 0]}><sphereGeometry args={[0.22, 10, 10]} /><meshStandardMaterial color="#cfa9ff" emissive="#a67cff" emissiveIntensity={2} toneMapped={false} /></mesh>
    <Glow position={[0, 6.5, 0]} size={3} color="#b58bff" />
    <Glow position={[0, 2.8, 2.5]} size={3.2} color="#ffd36b" opacity={0.5} />
  </group>;
}
function SageHouse() {
  const w = 3.8, d = 3.2;
  return <group>
    <mesh position={[0, 0.17, 0]}><boxGeometry args={[w + 1, 0.34, d + 1]} /><Mat c={STONE} /></mesh>
    <mesh position={[0, 1.3, 0]}><boxGeometry args={[w - 0.3, 2.0, d - 0.3]} /><Mat c="#e9d7b5" /></mesh>
    <Pillars pts={[[-w / 2, d / 2], [w / 2, d / 2], [-w / 2, -d / 2], [w / 2, -d / 2]]} h={2.0} />
    <Windows w={w - 1} z={d / 2 - 0.12} n={2} y={1.2} h={1.0} />
    <mesh position={[0, 1.0, d / 2 - 0.08]}><boxGeometry args={[0.9, 1.5, 0.05]} /><meshStandardMaterial color="#8a5fe0" emissive="#6b3fb5" emissiveIntensity={0.8} /></mesh>
    <Roof w={w + 1.4} d={d + 1.4} y={2.3} h={1.7} color="#4b2f8a" />
    <HangingLantern position={[-w / 2, 2.1, d / 2 + 0.5]} /><HangingLantern position={[w / 2, 2.1, d / 2 + 0.5]} />
    <mesh position={[0, 4.4, 0]}><sphereGeometry args={[0.18, 10, 10]} /><meshStandardMaterial color="#ffe7a1" emissive="#ffd062" emissiveIntensity={2} toneMapped={false} /></mesh>
    <Glow position={[0, 4.4, 0]} size={2.4} />
  </group>;
}

const BUILD_PRESET: Record<string, { rot: number; Comp: () => React.JSX.Element; labelY: number; icon: string }> = {
  library: { rot: Math.PI / 2, Comp: Library, labelY: 5.6, icon: '📖' },
  wealth: { rot: 0, Comp: Temple, labelY: 9.4, icon: '🪙' },
  pavilion: { rot: -Math.PI / 2, Comp: Pavilion, labelY: 6.8, icon: '♡' },
  tarot: { rot: -Math.PI / 2, Comp: TarotTent, labelY: 4.6, icon: '🃏' },
  time: { rot: 0.6, Comp: TimeRoom, labelY: 7.9, icon: '⏳' },
};

function Buildings() {
  const interact = useInteract();
  const rooms = useGame((s) => s.state?.rooms);
  return <>{BUILDINGS.map((b) => {
    const p = BUILD_PRESET[b.id]; if (!p) return null;
    const pr = rooms?.find((r) => r.id === b.id);
    const todo = !!pr && !pr.complete;
    return <group key={b.id} position={[b.pos.x, 0, b.pos.z]}>
      <Hover onClick={() => interact('building', b.id)}><Shadowed><group rotation-y={p.rot}><p.Comp /></group></Shadowed></Hover>
      <Label y={p.labelY} icon={p.icon} text={b.name} sub={pr ? `${pr.got}/${pr.required}` : undefined} quest={todo} onClick={() => interact('building', b.id)} />
    </group>;
  })}</>;
}

// ───────── 환경 ─────────
function Ground() {
  const setTarget = useGame((s) => s.setState); void setTarget;
  const patches = useMemo(() => Array.from({ length: 26 }, (_, i) => { const a = i * 2.4, r = 4 + ((i * 7) % 13); return [Math.cos(a) * r, Math.sin(a) * r, 1.2 + (i % 4) * 0.5] as [number, number, number]; }), []);
  return <group>
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]} onPointerDown={(e) => { if (e.delta > 4) return; e.stopPropagation(); const [x, z] = resolve(e.point.x, e.point.z); useGame.setState({ target: { x, z }, pending: null }); }}>
      <circleGeometry args={[RADIUS + 4, 48]} /><meshStandardMaterial map={groundTex('#3d3a5e', [12, 12])} />
    </mesh>
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]}><circleGeometry args={[RADIUS - 0.5, 48]} /><PbrMaterial id="tex_grass" repeat={[9, 9]} tint="#9fb890" fallback={<meshStandardMaterial map={groundTex('#4d6a5c', [9, 9])} />} /></mesh>
    {patches.map(([x, z, r], i) => <mesh key={i} rotation-x={-Math.PI / 2} position={[x, 0.0, z]}><circleGeometry args={[r, 7]} /><meshStandardMaterial color={i % 2 ? '#587068' : '#415b57'} flatShading /></mesh>)}
    {/* 외곽 산 */}
    {Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2, r = RADIUS + 10 + (i % 3) * 4; return <mesh key={i} position={[Math.cos(a) * r, 3 + (i % 4), Math.sin(a) * r]}><coneGeometry args={[7 + (i % 3) * 2, 12 + (i % 4) * 3, 6]} /><meshStandardMaterial color={i % 2 ? '#2a2552' : '#332b63'} flatShading /></mesh>; })}
  </group>;
}
const PATH: [number, number][] = [[0, 12], [0, 9], [0.4, 6], [-0.5, 3], [0, 0], [0, -3], [0.4, -6], [0, -7.9]];
const BRANCH: [number, number][][] = [[[0, 0], [-2, 0.3], [-4.0, 0.4]], [[0.4, -3], [2.5, -2.8], [4.9, -2.8]], [[0.2, 6], [3, 6.1], [6.1, 6.2]], [[-0.5, 3], [-2.5, 4.8], [-4.5, 5.4]], [[0.4, -6], [3.2, -7.4], [6.0, -8.4]], [[0, -6], [-2.6, -7.4], [-5.2, -8.4]]];
function PathStones() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const pts = useMemo(() => {
    const out: [number, number, number, number][] = [];
    const seg = (poly: [number, number][], wd: number) => { for (let i = 0; i < poly.length - 1; i++) { const [x1, z1] = poly[i], [x2, z2] = poly[i + 1]; const len = Math.hypot(x2 - x1, z2 - z1); const n = Math.ceil(len / 0.8); for (let k = 0; k <= n; k++) { const t = k / n; const j = (k * 37 + i * 11) % 7; const nx = -(z2 - z1) / len, nz = (x2 - x1) / len; for (const o of [-0.55, 0, 0.55].slice(wd === 1 ? 1 : 0)) out.push([x1 + (x2 - x1) * t + nx * o + ((j % 3) - 1) * 0.1, z1 + (z2 - z1) * t + nz * o + ((j % 2) - 0.5) * 0.12, 0.42 + (j % 3) * 0.08, j]); } } };
    seg(PATH, 3); BRANCH.forEach((b) => seg(b, 1));
    return out;
  }, []);
  useEffect(() => { const m = ref.current; if (!m) return; const o = new THREE.Object3D(); pts.forEach(([x, z, s, j], i) => { o.position.set(x, 0.03, z); o.rotation.y = j; o.scale.set(s, 1, s); o.updateMatrix(); m.setMatrixAt(i, o.matrix); m.setColorAt(i, new THREE.Color(j % 2 ? '#a7a3bb' : '#8f8ba6')); }); m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }, [pts]);
  return <instancedMesh ref={ref} args={[undefined, undefined, pts.length]}><cylinderGeometry args={[1, 1, 0.08, 7]} /><PbrMaterial id="tex_stone_path" repeat={[1, 1]} fallback={<meshStandardMaterial map={stoneTex('#b6b2cc', [1, 1])} flatShading />} /></instancedMesh>;
}
function Pond() {
  return <group position={[-9, 0, 7]}>
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}><circleGeometry args={[3.3, 24]} /><meshStandardMaterial color="#2b3f86" metalness={0.5} roughness={0.25} emissive="#1a2a6a" emissiveIntensity={0.5} /></mesh>
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}><ringGeometry args={[3.2, 3.7, 24]} /><meshStandardMaterial color="#7f7c93" flatShading /></mesh>
    {[[-1, 0.8], [1.2, -0.6], [0.2, 1.6], [-1.6, -1.1], [1.9, 1.2]].map(([x, z], i) => <group key={i} position={[x, 0.05, z]}><mesh rotation-x={-Math.PI / 2}><circleGeometry args={[0.4, 8]} /><Mat c="#5fae7a" /></mesh><mesh position={[0.1, 0.06, 0]}><sphereGeometry args={[0.1, 8, 6]} /><Mat c="#ff9ad0" e="#ff5fb0" ei={0.6} /></mesh></group>)}
    <Glow position={[0, 0.8, 0]} size={5} color="#9fb4ff" opacity={0.25} />
    {/* 다리 */}
    <group position={[0, 0.0, 3.9]}>
      {Array.from({ length: 9 }, (_, i) => { const x = -2.4 + i * 0.6; const y = 0.25 + Math.sin((i / 8) * Math.PI) * 0.55; return <mesh key={i} position={[x, y, 0]} rotation-z={Math.cos((i / 8) * Math.PI) * -0.25}><boxGeometry args={[0.7, 0.1, 1.1]} /><Mat c={WOOD} /></mesh>; })}
      {[-0.55, 0.55].map((z) => <mesh key={z} position={[0, 0.95, z]}><boxGeometry args={[4.8, 0.06, 0.06]} /><Mat c="#a8402f" /></mesh>)}
    </group>
  </group>;
}
const TREES: [number, number, number][] = [[-14, -8, 1.3], [-15, 1, 1.1], [15, 9, 1.2], [15, 1, 1.15], [13, -9, 1.6], [-4, -15, 1.2], [5, -15, 1.3], [-16, -3, 1], [16, -5, 1], [-14, 11, 1.1], [13, 12, 1]];
function BlossomTrees() {
  return <>{TREES.map(([x, z, s], i) => {
    const pink = ['#ff9fd0', '#e684d8', '#ffb7dd', '#c58cf0'];
    return <Shadowed key={i} position={[x, 0, z]}><group scale={s} rotation-y={i}>
      <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.18, 0.3, 2.4, 6]} /><Mat c="#5a3a2a" /></mesh>
      <mesh position={[0, 3.0, 0]}><icosahedronGeometry args={[1.5, 0]} /><Mat c={pink[i % 4]} e={pink[i % 4]} ei={0.18} /></mesh>
      <mesh position={[1.0, 2.6, 0.4]}><icosahedronGeometry args={[1.0, 0]} /><Mat c={pink[(i + 1) % 4]} e={pink[(i + 1) % 4]} ei={0.18} /></mesh>
      <mesh position={[-0.9, 2.7, -0.3]}><icosahedronGeometry args={[1.1, 0]} /><Mat c={pink[(i + 2) % 4]} e={pink[(i + 2) % 4]} ei={0.18} /></mesh>
      <mesh position={[0.1, 3.9, 0.1]}><icosahedronGeometry args={[0.9, 0]} /><Mat c={pink[(i + 3) % 4]} e={pink[(i + 3) % 4]} ei={0.18} /></mesh>
    </group></Shadowed>;
  })}</>;
}
const LANTERNS: [number, number][] = [[-1.8, 10], [1.8, 10], [-1.8, 4], [1.8, 4], [-1.8, -2.5], [2.2, -5], [-2.0, -6.5], [-3.4, 1.8], [4.4, -1.2], [4.6, 7.6], [-3.4, 6.8], [3.2, 13]];
function Lanterns() {
  return <>{LANTERNS.map(([x, z], i) => <group key={i} position={[x, 0, z]}>
    <mesh position={[0, 0.2, 0]}><boxGeometry args={[0.5, 0.4, 0.5]} /><Mat c={STONE} /></mesh>
    <mesh position={[0, 0.65, 0]}><cylinderGeometry args={[0.1, 0.12, 0.6, 6]} /><Mat c={STONE} /></mesh>
    <mesh position={[0, 1.15, 0]}><boxGeometry args={[0.46, 0.5, 0.46]} /><meshStandardMaterial color="#ffe6a8" emissive="#ffb74a" emissiveIntensity={1.9} toneMapped={false} /></mesh>
    <mesh position={[0, 1.55, 0]}><coneGeometry args={[0.45, 0.32, 4]} /><Mat c="#6a6783" /></mesh>
    <Glow position={[0, 1.2, 0]} size={2.4} />
  </group>)}</>;
}
function Moon() {
  return <group position={[-20, 26, -38]}><mesh><sphereGeometry args={[4.2, 24, 24]} /><meshBasicMaterial color="#fff3d1" toneMapped={false} /></mesh><Glow position={[0, 0, 0.5]} size={26} color="#ffeac0" opacity={0.55} /></group>;
}
function Petals() {
  const N = 140; const ref = useRef<THREE.Points>(null);
  const [pos, seed] = useMemo(() => { const p = new Float32Array(N * 3), s = new Float32Array(N); for (let i = 0; i < N; i++) { p[i * 3] = (Math.random() - 0.5) * 36; p[i * 3 + 1] = Math.random() * 9; p[i * 3 + 2] = (Math.random() - 0.5) * 36; s[i] = Math.random() * 6; } return [p, s]; }, []);
  useFrame(({ clock }, dt) => { const a = ref.current!.geometry.attributes.position as THREE.BufferAttribute; const t = clock.elapsedTime; for (let i = 0; i < N; i++) { let y = a.getY(i) - dt * (0.5 + (seed[i] % 1) * 0.4); if (y < 0.1) y = 9; a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(t + seed[i]) * dt * 0.5); } a.needsUpdate = true; });
  return <points ref={ref}><bufferGeometry><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry><pointsMaterial size={0.28} map={glowTexture()} color="#ffb8e0" transparent opacity={0.9} depthWrite={false} sizeAttenuation /></points>;
}

// ───────── 상호작용 ─────────
function useInteract() {
  return (kind: 'building' | 'npc', id: string) => { const g = useGame.getState(); interactWith(kind, id, { player: g.player, open: g.open, set: (st) => useGame.setState(st) }); };
}

// ───────── 플레이어 ─────────
function Player() {
  const st = useGame((s) => s.state);
  const look = AVATARS[st?.profile?.avatar ?? 0];
  const group = useRef<THREE.Group>(null);
  const walk = useRef(0);
  const pos = useRef(new THREE.Vector3(useGame.getState().player.x, 0, useGame.getState().player.z));
  const yaw = useRef(Math.PI);
  const keys = useRef(new Set<string>());
  const { camera, size } = useThree();
  const lastNear = useRef('');
  const tick = useRef(0);
  const ring = useRef<THREE.Mesh>(null);

  useEffect(() => {
    resetCam('garden', size.width / size.height);
    const [x, z] = resolve(pos.current.x, pos.current.z); pos.current.set(x, 0, z); useGame.setState({ player: { x, z } });
    const typing = () => { const a = document.activeElement as HTMLElement | null; return !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT'); };
    const dn = (e: KeyboardEvent) => { if (typing()) return; const k = e.key.toLowerCase(); if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) { keys.current.add(k); e.preventDefault(); }
      if ((k === 'e' || k === 'enter') && useGame.getState().near && !useGame.getState().panel) { const n = useGame.getState().near!; useGame.getState().open({ type: 'building', id: n.id }); } };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', dn); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, []);

  useFrame((_, dt0) => {
    const dt = Math.min(dt0, 0.05);
    const g = useGame.getState();
    let dx = 0, dz = 0;
    const k = keys.current;
    if (k.has('w') || k.has('arrowup')) dz -= 1; if (k.has('s') || k.has('arrowdown')) dz += 1; if (k.has('a') || k.has('arrowleft')) dx -= 1; if (k.has('d') || k.has('arrowright')) dx += 1;
    dx += g.joy.x; dz += g.joy.y;
    [dx, dz] = camRelative(dx, dz);
    const manual = Math.hypot(dx, dz) > 0.12;
    if (g.panel) { dx = 0; dz = 0; }
    let moving = false;
    if (manual && !g.panel) { if (g.target) useGame.setState({ target: null, pending: null }); const l = Math.hypot(dx, dz); const m = Math.min(1, l); dx = (dx / l) * m; dz = (dz / l) * m; moving = true; }
    else if (g.target && !g.panel) {
      const tx = g.target.x - pos.current.x, tz = g.target.z - pos.current.z, d = Math.hypot(tx, tz);
      const pd = g.pending ? Math.hypot(pos.current.x - g.pending.x, pos.current.z - g.pending.z) : 99;
      if (g.pending && pd < (g.pending.kind === 'building' ? 1.6 : 2.0)) { useGame.setState({ target: null, pending: null }); g.open({ type: g.pending.kind, id: g.pending.id } as any); }
      else if (d < 0.18) { useGame.setState({ target: null }); if (g.pending) { g.open({ type: g.pending.kind, id: g.pending.id } as any); useGame.setState({ pending: null }); } }
      else { dx = tx / d; dz = tz / d; moving = true; }
    }
    if (moving) {
      const sp = 4.4;
      const [nx, nz] = resolve(pos.current.x + dx * sp * dt, pos.current.z + dz * sp * dt);
      const blocked = Math.hypot(nx - pos.current.x, nz - pos.current.z) < sp * dt * 0.15;
      pos.current.set(nx, 0, nz);
      const want = Math.atan2(dx, dz); let diff = want - yaw.current; while (diff > Math.PI) diff -= 2 * Math.PI; while (diff < -Math.PI) diff += 2 * Math.PI; yaw.current += diff * Math.min(1, dt * 12);
      if (blocked && g.target) useGame.setState({ target: null });
    }
    walk.current += ((moving ? 1 : 0) - walk.current) * Math.min(1, dt * 10);
    if (group.current) { group.current.position.copy(pos.current); group.current.rotation.y = yaw.current; }
    // 카메라
    const cp = Math.cos(cam.pitch) * cam.dist;
    const want = new THREE.Vector3(pos.current.x + Math.sin(cam.yaw) * cp, 1 + Math.sin(cam.pitch) * cam.dist, pos.current.z + Math.cos(cam.yaw) * cp);
    want.y = Math.max(1.4, want.y);
    camera.position.lerp(want, Math.min(1, dt * 6));
    camera.lookAt(pos.current.x - Math.sin(cam.yaw) * 2, 1.5, pos.current.z - Math.cos(cam.yaw) * 2);
    // 근접 감지/HUD 동기화 (프레임당 상태 갱신 최소화)
    tick.current += dt;
    if (tick.current > 0.1) {
      tick.current = 0;
      const n = nearest(pos.current.x, pos.current.z); const key = n ? n.kind + n.id : '';
      if (key !== lastNear.current) { lastNear.current = key; useGame.setState({ near: n ? { kind: 'building', id: n.id, label: n.label } : null }); }
      useGame.setState({ player: { x: pos.current.x, z: pos.current.z } });
    }
    if (ring.current) { const t = g.target; ring.current.visible = !!t; if (t) { ring.current.position.set(t.x, 0.06, t.z); const s = 1 + Math.sin(performance.now() / 200) * 0.12; ring.current.scale.set(s, s, 1); } }
  });
  return <>
    <group ref={group}><Shadowed><Character look={{ ...look, scale: 1.05 }} walkRef={walk} /></Shadowed><Glow position={[0, 1.2, 0]} size={3.2} color="#ffe2a0" opacity={0.18} /></group>
    <mesh ref={ring} rotation-x={-Math.PI / 2} visible={false}><ringGeometry args={[0.3, 0.42, 24]} /><meshBasicMaterial color="#ffe08a" transparent opacity={0.9} /></mesh>
  </>;
}

export default function Garden3D() {
  const room = useGame((s) => s.room); const hi = useGame((s) => s.quality) === 'high';
  return (
    <Canvas shadows={hi} dpr={[1, 1.5]} camera={{ fov: 50, position: [0, 9, 20], near: 0.5, far: 160 }} gl={{ antialias: true, powerPreference: 'high-performance' }} style={{ touchAction: 'none' }}>
      <CameraControls />
      {room ? <Interior key={room} id={room} /> : (
        <>
          <color attach="background" args={['#141a30']} />
          <fog attach="fog" args={['#1d2644', 26, 70]} />
          <ambientLight intensity={1.0} color="#c8c0e0" />
          <hemisphereLight args={['#dfe6ff', '#4a3b30', 0.8]} />
          <directionalLight position={[-14, 22, 10]} intensity={1.4} color="#ffe6c4" castShadow={hi} shadow-mapSize={[1536, 1536]} shadow-camera-left={-26} shadow-camera-right={26} shadow-camera-top={26} shadow-camera-bottom={-26} shadow-camera-near={1} shadow-camera-far={70} shadow-bias={-0.0006} />
          <directionalLight position={[10, 8, -8]} intensity={0.5} color="#8a7cff" />
          <Stars radius={90} depth={40} count={1400} factor={5} fade speed={0.6} />
          <Moon /><Ground /><PathStones /><Pond /><BlossomTrees /><Lanterns /><Buildings /><Player /><Petals />
        </>
      )}
      {hi && <EffectComposer multisampling={0}><Bloom intensity={0.45} luminanceThreshold={0.9} luminanceSmoothing={0.2} mipmapBlur /><Vignette eskil={false} offset={0.25} darkness={0.55} /></EffectComposer>}
    </Canvas>
  );
}
void OBSTACLES;
