'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const M = ({ c, e, ei = 1, t }: { c: string; e?: string; ei?: number; t?: boolean }) => <meshStandardMaterial color={c} emissive={e} emissiveIntensity={e ? ei : 0} flatShading transparent={t} />;
const WOOD = '#6e4a2e', DARK = '#4a3020', GOLD = '#f5c451';

/** open: 0(닫힘)~1(열림)으로 부드럽게 보간되는 값을 ref 로 제공 */
function useOpen(open: boolean, speed = 4) {
  const v = useRef(0);
  useFrame((_, dt) => { v.current += ((open ? 1 : 0) - v.current) * Math.min(1, dt * speed); });
  return v;
}
type G = THREE.Group | null;

function Safe({ open }: { open: boolean }) {
  const v = useOpen(open); const door = useRef<G>(null);
  useFrame(() => { if (door.current) door.current.rotation.y = -v.current * 1.9; });
  return <group>
    <mesh position={[0, 0.7, 0]}><boxGeometry args={[1.3, 1.4, 1.0]} /><M c="#3a3f50" /></mesh>
    <mesh position={[0, 0.7, 0.02]}><boxGeometry args={[1.0, 1.1, 0.9]} /><M c="#14161e" /></mesh>
    <mesh position={[0, 0.7, 0.1]}><boxGeometry args={[0.5, 0.5, 0.3]} /><M c="#ffe08a" e="#ffb300" ei={1.4} /></mesh>
    <group ref={door} position={[-0.6, 0.7, 0.52]}><mesh position={[0.6, 0, 0]}><boxGeometry args={[1.2, 1.3, 0.12]} /><M c="#566078" /></mesh><mesh position={[0.9, 0, 0.1]}><cylinderGeometry args={[0.17, 0.17, 0.1, 12]} /><M c={GOLD} e={GOLD} ei={0.5} /></mesh></group>
  </group>;
}
function Chest({ open }: { open: boolean }) {
  const v = useOpen(open); const lid = useRef<G>(null);
  useFrame(() => { if (lid.current) lid.current.rotation.x = -v.current * 1.6; });
  return <group>
    <mesh position={[0, 0.4, 0]}><boxGeometry args={[1.4, 0.8, 0.9]} /><M c={WOOD} /></mesh>
    <mesh position={[0, 0.82, 0]}><boxGeometry args={[1.42, 0.06, 0.92]} /><M c={GOLD} e={GOLD} ei={0.3} /></mesh>
    {open && <mesh position={[0, 0.9, 0]}><boxGeometry args={[1.1, 0.1, 0.6]} /><M c="#ffe9a8" e="#ffd36b" ei={2.2} /></mesh>}
    <group ref={lid} position={[0, 0.85, -0.45]}><mesh position={[0, 0.2, 0.45]}><boxGeometry args={[1.44, 0.4, 0.94]} /><M c="#7e5632" /></mesh><mesh position={[0, 0.2, 0.93]}><boxGeometry args={[0.2, 0.2, 0.06]} /><M c={GOLD} e={GOLD} /></mesh></group>
  </group>;
}
function Drawer({ open }: { open: boolean }) {
  const v = useOpen(open); const dr = useRef<G>(null);
  useFrame(() => { if (dr.current) dr.current.position.z = 0.5 + v.current * 0.6; });
  return <group>
    <mesh position={[0, 0.9, 0]}><boxGeometry args={[1.6, 1.8, 0.9]} /><M c={WOOD} /></mesh>
    {[0.3, 0.9, 1.5].map((y, i) => <mesh key={i} position={[0, y, 0.46]}><boxGeometry args={[1.4, 0.5, 0.04]} /><M c={i === 0 ? '#8a5f38' : '#7a5230'} /></mesh>)}
    <group ref={dr} position={[0, 0.3, 0.5]}><mesh><boxGeometry args={[1.3, 0.42, 0.7]} /><M c="#8a5f38" /></mesh>{open && <mesh position={[0, 0.25, 0]}><boxGeometry args={[0.7, 0.04, 0.5]} /><M c="#ffe9a8" e="#ffd36b" ei={2} /></mesh>}</group>
    <mesh position={[0, 0.9, 0.5]}><sphereGeometry args={[0.08, 8, 8]} /><M c={GOLD} e={GOLD} /></mesh>
  </group>;
}
function Bookshelf({ open }: { open: boolean }) {
  const v = useOpen(open); const bk = useRef<G>(null);
  useFrame(() => { if (bk.current) { bk.current.position.z = v.current * 0.7; bk.current.rotation.x = -v.current * 0.4; } });
  const cols = ['#6f4aa8', '#a8483f', '#3f6fa8', '#c9a13a', '#3fa86f'];
  return <group>
    <mesh position={[0, 1.4, -0.2]}><boxGeometry args={[2.4, 2.8, 0.5]} /><M c={WOOD} /></mesh>
    {[0.5, 1.2, 1.9, 2.5].map((y, r) => cols.map((c, i) => (r === 1 && i === 2) ? null : <mesh key={r + '_' + i} position={[-0.9 + i * 0.45, y, 0.12]}><boxGeometry args={[0.32, 0.55, 0.3]} /><M c={cols[(i + r) % 5]} /></mesh>))}
    <group ref={bk} position={[0.0, 1.2, 0.12]}><mesh><boxGeometry args={[0.32, 0.55, 0.3]} /><M c="#ffd36b" e="#ffb300" ei={0.9} /></mesh></group>
  </group>;
}
function Mirror({ open }: { open: boolean }) {
  const v = useOpen(open, 3); const glow = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => { const m = glow.current?.material as THREE.MeshStandardMaterial | undefined; if (m) m.emissiveIntensity = 0.5 + v.current * 1.8 + Math.sin(clock.elapsedTime * 2) * 0.15; });
  return <group>
    <mesh position={[0, 1.6, 0]}><boxGeometry args={[1.5, 2.3, 0.14]} /><M c="#c9a13a" e="#c9a13a" ei={0.3} /></mesh>
    <mesh ref={glow} position={[0, 1.6, 0.09]}><planeGeometry args={[1.2, 2.0]} /><meshStandardMaterial color="#cfe4ff" emissive="#9ec8ff" emissiveIntensity={0.5} metalness={0.7} roughness={0.15} toneMapped={false} /></mesh>
    <mesh position={[0, 0.2, 0.2]}><boxGeometry args={[1.1, 0.3, 0.4]} /><M c={DARK} /></mesh>
  </group>;
}
function Letter({ open }: { open: boolean }) {
  const v = useOpen(open, 3); const paper = useRef<G>(null);
  useFrame(() => { if (paper.current) { paper.current.position.y = 0.95 + v.current * 0.45; paper.current.rotation.x = -v.current * 0.9; } });
  return <group>
    <mesh position={[0, 0.8, 0]}><boxGeometry args={[2.0, 0.12, 1.1]} /><M c={WOOD} /></mesh>
    {[[-0.9, -0.45], [0.9, -0.45], [-0.9, 0.45], [0.9, 0.45]].map(([x, z], i) => <mesh key={i} position={[x, 0.4, z]}><boxGeometry args={[0.12, 0.8, 0.12]} /><M c={DARK} /></mesh>)}
    <mesh position={[0.5, 0.9, 0.1]}><cylinderGeometry args={[0.08, 0.1, 0.18, 8]} /><M c="#ffb347" e="#ff9d4a" ei={1.5} /></mesh>
    <group ref={paper} position={[-0.1, 0.95, 0]}><mesh><boxGeometry args={[0.8, 0.02, 0.55]} /><M c="#fff6dc" e={open ? '#ffe9a8' : undefined} ei={0.8} /></mesh></group>
  </group>;
}
function Scroll({ open }: { open: boolean }) {
  const v = useOpen(open);
  return <group><mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.5, 0.55, 1.0, 10]} /><M c={WOOD} /></mesh><mesh position={[0, 1.15, 0]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.12, 0.12, 0.9 + v.current * 0.3, 8]} /><M c="#fff1c8" e="#ffd36b" ei={0.5} /></mesh></group>;
}
function Ledger({ open }: { open: boolean }) {
  const v = useOpen(open, 3); const cover = useRef<G>(null);
  useFrame(() => { if (cover.current) cover.current.rotation.z = Math.PI - v.current * Math.PI; });
  return <group>
    <mesh position={[0, 0.8, 0]}><boxGeometry args={[2.0, 0.12, 1.1]} /><M c={WOOD} /></mesh>
    {[[-0.9, -0.45], [0.9, -0.45], [-0.9, 0.45], [0.9, 0.45]].map(([x, z], i) => <mesh key={i} position={[x, 0.4, z]}><boxGeometry args={[0.12, 0.8, 0.12]} /><M c={DARK} /></mesh>)}
    <mesh position={[0, 0.9, 0]}><boxGeometry args={[0.9, 0.08, 0.65]} /><M c="#fff6dc" e={open ? '#ffe9a8' : undefined} ei={0.6} /></mesh>
    <group ref={cover} position={[-0.45, 0.95, 0]}><mesh position={[-0.0, 0.0, 0]}><boxGeometry args={[0.9, 0.06, 0.66]} /><M c="#8a2f2f" /></mesh></group>
  </group>;
}
function Scale({ open }: { open: boolean }) {
  const v = useOpen(open, 3); const beam = useRef<G>(null);
  useFrame(({ clock }) => { if (beam.current) beam.current.rotation.z = Math.sin(clock.elapsedTime * 4) * 0.25 * (1 - v.current) + v.current * 0.0; });
  return <group>
    <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.45, 0.55, 0.4, 10]} /><M c={GOLD} e={GOLD} ei={0.2} /></mesh>
    <mesh position={[0, 1.0, 0]}><cylinderGeometry args={[0.06, 0.06, 1.6, 8]} /><M c={GOLD} e={GOLD} ei={0.2} /></mesh>
    <group ref={beam} position={[0, 1.8, 0]}><mesh><boxGeometry args={[1.8, 0.08, 0.08]} /><M c={GOLD} e={GOLD} ei={0.3} /></mesh>{[-0.85, 0.85].map((x) => <mesh key={x} position={[x, -0.5, 0]}><cylinderGeometry args={[0.35, 0.3, 0.08, 12]} /><M c="#ffe08a" e="#ffb300" ei={0.5} /></mesh>)}</group>
  </group>;
}
function MapWall({ open }: { open: boolean }) {
  const v = useOpen(open, 3);
  return <group>
    <mesh position={[0, 1.8, 0]}><planeGeometry args={[2.0, 1.4]} /><M c="#e8d8a8" e={open ? '#ffe9a8' : '#a89868'} ei={0.4 + v.current * 0.6} /></mesh>
    <mesh position={[0, 1.8, -0.02]}><boxGeometry args={[2.2, 1.6, 0.06]} /><M c={WOOD} /></mesh>
    <mesh position={[-0.4, 1.9, 0.02]}><circleGeometry args={[0.12, 8]} /><M c="#c0392b" e="#c0392b" /></mesh>
  </group>;
}
function Mailbox({ open }: { open: boolean }) {
  const v = useOpen(open); const flap = useRef<G>(null);
  useFrame(() => { if (flap.current) flap.current.rotation.x = -v.current * 1.4; });
  return <group>
    <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.12, 1.0, 0.12]} /><M c={DARK} /></mesh>
    <mesh position={[0, 1.2, 0]}><boxGeometry args={[0.9, 0.7, 0.6]} /><M c="#a8402f" /></mesh>
    <group ref={flap} position={[0, 1.2, 0.3]}><mesh position={[0, -0.2, 0.02]}><boxGeometry args={[0.8, 0.4, 0.04]} /><M c="#c0594a" /></mesh></group>
    {open && <mesh position={[0, 1.6, 0.1]}><boxGeometry args={[0.5, 0.04, 0.35]} /><M c="#fff6dc" e="#ffe9a8" ei={1.2} /></mesh>}
  </group>;
}
function Tree({ open }: { open: boolean }) {
  const v = useOpen(open, 2); const crown = useRef<G>(null);
  useFrame(({ clock }) => { if (crown.current) crown.current.scale.setScalar(1 + v.current * 0.12 + Math.sin(clock.elapsedTime) * 0.02); });
  return <group>
    <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.2, 0.35, 2.4, 6]} /><M c="#5a3a2a" /></mesh>
    <group ref={crown} position={[0, 2.8, 0]}>{[[0, 0, 0, 1.3], [0.9, -0.3, 0.2, 0.85], [-0.9, -0.2, -0.1, 0.9]].map(([x, y, z, r], i) => <mesh key={i} position={[x, y, z]}><icosahedronGeometry args={[r, 0]} /><M c={['#ff9fd0', '#e684d8', '#ffb7dd'][i]} e="#ff7ac0" ei={0.3 + v.current * 0.8} /></mesh>)}</group>
    {[-0.7, 0, 0.7].map((x, i) => <mesh key={i} position={[x, 2.0 - i * 0.1, 0.9]}><boxGeometry args={[0.04, 0.5 + i * 0.1, 0.04]} /><M c="#e84a4a" e="#e84a4a" ei={0.8} /></mesh>)}
  </group>;
}
function Thread({ open }: { open: boolean }) {
  const v = useOpen(open, 3);
  return <group>
    <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.4, 0.45, 0.6, 10]} /><M c="#caa77a" /></mesh>
    <mesh position={[0, 0.7, 0]} rotation-x={Math.PI / 2}><torusGeometry args={[0.28, 0.05, 6, 16]} /><M c="#e82f4a" e="#e82f4a" ei={0.6 + v.current} /></mesh>
    <mesh position={[0.6 + v.current * 0.6, 0.7, 0.2]}><boxGeometry args={[0.6 + v.current * 1.2, 0.04, 0.04]} /><M c="#e82f4a" e="#e82f4a" ei={0.8} /></mesh>
  </group>;
}
function Chairs({ open }: { open: boolean }) {
  const v = useOpen(open);
  return <group>{[-0.8, 0.8].map((x) => <group key={x} position={[x, 0, 0]}><mesh position={[0, 0.45, 0]}><boxGeometry args={[0.8, 0.1, 0.8]} /><M c="#a8402f" /></mesh><mesh position={[0, 0.9, -0.38]}><boxGeometry args={[0.8, 0.9, 0.08]} /><M c="#a8402f" /></mesh>{[[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].map(([a, b], i) => <mesh key={i} position={[a, 0.2, b]}><boxGeometry args={[0.08, 0.4, 0.08]} /><M c={DARK} /></mesh>)}</group>)}
    <mesh position={[0, 1.6 + v.current * 0.2, 0]}><sphereGeometry args={[0.12, 8, 8]} /><M c="#ffc2de" e="#ff9ec8" ei={1.5} /></mesh></group>;
}
function Hourglass({ open }: { open: boolean }) {
  const v = useOpen(open, 2.2); const g = useRef<G>(null);
  useFrame(() => { if (g.current) g.current.rotation.z = v.current * Math.PI; });
  return <group>
    <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.5, 0.6, 0.6, 10]} /><M c={WOOD} /></mesh>
    <group ref={g} position={[0, 1.4, 0]}>
      <mesh position={[0, 0.5, 0]}><coneGeometry args={[0.5, 0.9, 10]} /><M c="#cfe4ff" t /></mesh><mesh position={[0, -0.5, 0]} rotation-x={Math.PI}><coneGeometry args={[0.5, 0.9, 10]} /><M c="#cfe4ff" t /></mesh>
      <mesh position={[0, -0.55, 0]} rotation-x={Math.PI}><coneGeometry args={[0.38, 0.6, 10]} /><M c="#ffd36b" e="#ffb300" ei={1} /></mesh>
      {[0.95, -0.95].map((y) => <mesh key={y} position={[0, y, 0]}><cylinderGeometry args={[0.6, 0.6, 0.1, 10]} /><M c={GOLD} e={GOLD} ei={0.3} /></mesh>)}
    </group>
  </group>;
}
function Clock({ open }: { open: boolean }) {
  const v = useOpen(open, 2.5); const h = useRef<G>(null);
  useFrame(() => { if (h.current) h.current.rotation.z = -v.current * Math.PI * 4; });
  return <group>
    <mesh position={[0, 1.2, 0]}><boxGeometry args={[1.0, 2.4, 0.6]} /><M c={WOOD} /></mesh>
    <mesh position={[0, 1.9, 0.32]}><circleGeometry args={[0.45, 20]} /><M c="#fff1c8" e="#ffd36b" ei={0.9} /></mesh>
    <group ref={h} position={[0, 1.9, 0.34]}><mesh position={[0, 0.2, 0]}><boxGeometry args={[0.05, 0.4, 0.02]} /><M c="#3a2400" /></mesh></group>
    <mesh position={[0, 0.8, 0.32]}><boxGeometry args={[0.6, 0.9, 0.04]} /><M c="#2a1a10" /></mesh>
  </group>;
}
function Starmap({ open }: { open: boolean }) {
  const v = useOpen(open, 2);
  return <group>
    <mesh position={[0, 0.7, 0]}><cylinderGeometry args={[0.15, 0.2, 1.4, 8]} /><M c={DARK} /></mesh>
    <mesh position={[0, 1.55, 0]} rotation-x={-0.5}><cylinderGeometry args={[1.0, 1.0, 0.1, 18]} /><M c="#1a1f4a" e="#3f3f9a" ei={0.6 + v.current} /></mesh>
    {[[-0.4, 1.7, 0.3], [0.3, 1.6, 0.1], [0.5, 1.75, 0.5], [-0.1, 1.5, 0.6]].map(([x, y, z], i) => <mesh key={i} position={[x, y + 0.1, z]}><sphereGeometry args={[0.06, 6, 6]} /><meshBasicMaterial color="#fff6c8" toneMapped={false} /></mesh>)}
  </group>;
}
function Sealedbook({ open }: { open: boolean }) {
  const v = useOpen(open, 2.5); const cov = useRef<G>(null);
  useFrame(() => { if (cov.current) cov.current.rotation.z = Math.PI - v.current * Math.PI; });
  return <group>
    <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.5, 0.6, 1.0, 8]} /><M c="#4a3a6a" /></mesh>
    <mesh position={[0, 1.05, 0]}><boxGeometry args={[1.0, 0.1, 0.7]} /><M c="#fff6dc" e={open ? '#cfa9ff' : undefined} ei={0.9} /></mesh>
    <group ref={cov} position={[-0.5, 1.1, 0]}><mesh position={[0, 0, 0]}><boxGeometry args={[1.0, 0.08, 0.72]} /><M c="#5a2f8a" e="#8a5fe0" ei={0.5} /></mesh></group>
    <mesh position={[0, 1.15, 0]} rotation-x={Math.PI / 2}><torusGeometry args={[0.35, 0.025, 6, 20]} /><M c="#cfa9ff" e="#b58bff" ei={open ? 0.2 : 1.6} /></mesh>
  </group>;
}
function Candle({ open }: { open: boolean }) {
  return <group><mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.45, 0.5, 1.8, 8]} /><M c={WOOD} /></mesh><mesh position={[0, 1.95, 0]}><cylinderGeometry args={[0.08, 0.1, 0.4, 8]} /><M c="#fff6dc" /></mesh><mesh position={[0, 2.25 + (open ? 0.04 : 0), 0]}><sphereGeometry args={[open ? 0.14 : 0.07, 8, 8]} /><meshBasicMaterial color={open ? '#ffd36b' : '#caa'} toneMapped={false} /></mesh></group>;
}

const MAPPING: Record<string, (p: { open: boolean }) => React.JSX.Element> = { safe: Safe, chest: Chest, drawer: Drawer, bookshelf: Bookshelf, mirror: Mirror, letter: Letter, scroll: Scroll, ledger: Ledger, scale: Scale, map: MapWall, mailbox: Mailbox, tree: Tree, thread: Thread, chairs: Chairs, hourglass: Hourglass, clock: Clock, starmap: Starmap, sealedbook: Sealedbook, candle: Candle };
export function Furniture({ type, open }: { type: string; open: boolean }) {
  const C = MAPPING[type] ?? Chest; return <C open={open} />;
}
