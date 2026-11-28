'use client';
import * as THREE from 'three';
import { Shadowed } from './Shadowed';
import { rugTex, starTex, woodTex } from '@/lib/client/textures';
import { useRegistry } from '@/lib/client/assets';

const M = ({ c, e, ei = 1, t, o }: { c: string; e?: string; ei?: number; t?: boolean; o?: number }) => <meshStandardMaterial color={c} emissive={e} emissiveIntensity={e ? ei : 0} flatShading transparent={t} opacity={o} />;
let gtex: THREE.Texture | null = null;
function glow() { if (gtex) return gtex; const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!; const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,230,160,1)'); r.addColorStop(0.4, 'rgba(255,200,110,0.4)'); r.addColorStop(1, 'rgba(255,200,110,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); gtex = new THREE.CanvasTexture(c); return gtex; }
export const Halo = ({ position, size = 1.6, color = '#ffd98a', opacity = 0.9 }: { position: [number, number, number]; size?: number; color?: string; opacity?: number }) =>
  <sprite position={position} scale={[size, size, 1]}><spriteMaterial map={glow()} color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>;

const Lantern = ({ p, c = '#ffb347' }: { p: [number, number, number]; c?: string }) => <group position={p}><mesh><cylinderGeometry args={[0.16, 0.16, 0.4, 8]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={2} toneMapped={false} /></mesh><mesh position={[0, 0.26, 0]}><coneGeometry args={[0.2, 0.14, 8]} /><M c="#3a2a20" /></mesh><Halo position={[0, 0, 0]} size={1.8} /></group>;
const Cushion = ({ p, c = '#2a2a3a' }: { p: [number, number, number]; c?: string }) => <mesh position={p}><boxGeometry args={[0.9, 0.12, 0.9]} /><M c={c} /></mesh>;
const BookStack = ({ p }: { p: [number, number, number] }) => <group position={p}>{['#a8483f', '#3f6fa8', '#c9a13a', '#6f4aa8'].map((c, i) => <mesh key={i} position={[(i % 2) * 0.04, 0.07 + i * 0.13, 0]} rotation-y={i * 0.5}><boxGeometry args={[0.5 - i * 0.03, 0.12, 0.36]} /><M c={c} /></mesh>)}</group>;
const Plant = ({ p, c = '#3f8a4f' }: { p: [number, number, number]; c?: string }) => <group position={p}><mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.28, 0.2, 0.5, 8]} /><M c="#8a5a3a" /></mesh>{[0, 1, 2, 3, 4].map((i) => <mesh key={i} position={[Math.cos(i * 1.3) * 0.18, 0.8 + (i % 2) * 0.15, Math.sin(i * 1.3) * 0.18]} rotation={[0.3 * Math.cos(i), 0, 0.3 * Math.sin(i)]}><coneGeometry args={[0.14, 0.7, 5]} /><M c={c} /></mesh>)}</group>;
const Banner = ({ p, c }: { p: [number, number, number]; c: string }) => <group position={p}><mesh position={[0, 1.3, 0]}><boxGeometry args={[0.7, 2.4, 0.04]} /><M c={c} e={c} ei={0.15} /></mesh><mesh position={[0, 0.1, 0]}><coneGeometry args={[0.35, 0.3, 3]} /><M c="#f5c451" e="#f5c451" ei={0.4} /></mesh><mesh position={[0, 2.55, 0]}><boxGeometry args={[0.9, 0.06, 0.08]} /><M c="#6e4a2e" /></mesh></group>;
const Coins = ({ p }: { p: [number, number, number] }) => <group position={p}>{Array.from({ length: 9 }, (_, i) => <mesh key={i} position={[Math.cos(i * 2.1) * (0.12 + (i % 3) * 0.08), 0.03 + Math.floor(i / 3) * 0.05, Math.sin(i * 2.1) * (0.12 + (i % 3) * 0.08)]} rotation-x={0.2 * (i % 3)}><cylinderGeometry args={[0.1, 0.1, 0.025, 12]} /><meshStandardMaterial color="#ffd86b" emissive="#ffb300" emissiveIntensity={0.7} metalness={0.8} roughness={0.3} /></mesh>)}<Halo position={[0, 0.2, 0]} size={1.2} /></group>;
const Chandelier = ({ p, c }: { p: [number, number, number]; c: string }) => <group position={p}><mesh rotation-x={Math.PI / 2}><torusGeometry args={[0.8, 0.05, 6, 20]} /><M c="#c9a13a" e="#c9a13a" ei={0.3} /></mesh>{[0, 1, 2, 3, 4, 5].map((i) => <group key={i} position={[Math.cos(i * 1.047) * 0.8, 0.1, Math.sin(i * 1.047) * 0.8]}><mesh><cylinderGeometry args={[0.05, 0.05, 0.25, 6]} /><M c="#fff6dc" /></mesh><mesh position={[0, 0.2, 0]}><sphereGeometry args={[0.08, 6, 6]} /><meshBasicMaterial color={c} toneMapped={false} /></mesh><Halo position={[0, 0.2, 0]} size={1.1} color={c} /></group>)}</group>;

export function RoomProps({ id, w, d, accent, light }: { id: string; w: number; d: number; accent: string; light: string }) {
  const hw = w / 2, hd = d / 2;
  const reg = useRegistry(); const has = (k: string) => !!reg?.models[k]; // 실제 모델이 준비되면 같은 자리의 절차적 소품은 숨긴다
  const rug = rugTex(id === 'time' ? '#3b3f78' : id === 'pavilion' ? '#a8402f' : id === 'wealth' ? '#7a2a2a' : '#5a2f8a', accent);
  return (
    <group>
      {/* 중앙 러그 */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.015, 0.2]} receiveShadow><planeGeometry args={[4.6, 4.6]} /><meshStandardMaterial map={rug} /></mesh>
      {/* 천장 들보(좌/뒤): 위에서 보이는 서까래 느낌 */}
      {[-3, 0, 3].map((x) => <mesh key={x} position={[x, 4.2, -hd + 0.3]}><boxGeometry args={[0.35, 0.35, 0.6]} /><M c="#4a3020" /></mesh>)}
      {[-2.5, 0.5, 3.5].map((z) => <mesh key={z} position={[-hw + 0.3, 4.2, z]}><boxGeometry args={[0.6, 0.35, 0.35]} /><M c="#4a3020" /></mesh>)}
      <mesh position={[0, 4.35, -hd + 0.3]}><boxGeometry args={[w, 0.25, 0.4]} /><M c="#3a2418" /></mesh>
      <mesh position={[-hw + 0.3, 4.35, 0]}><boxGeometry args={[0.4, 0.25, d]} /><M c="#3a2418" /></mesh>
      {/* 기둥 */}
      {[[-hw + 0.3, -hd + 0.3], [hw - 0.3, -hd + 0.3]].map(([x, z], i) => <Shadowed key={i}><mesh position={[x, 2.2, z]}><cylinderGeometry args={[0.22, 0.26, 4.4, 10]} /><M c="#8a2f2a" /></mesh><mesh position={[x, 0.15, z]}><cylinderGeometry args={[0.34, 0.38, 0.3, 10]} /><M c="#9a96ad" /></mesh></Shadowed>)}
      {!has('model_lantern') && <><Lantern p={[-hw + 0.9, 3.0, -hd + 0.8]} /><Lantern p={[hw - 0.9, 3.0, -hd + 0.8]} /></>}
      {/* 공간별 소품 */}
      {id === 'library' && <Shadowed>
        {!has('model_shelf') && [-4.6, 5.0].map((x) => <group key={x} position={[x, 0, -hd + 0.5]}><mesh position={[0, 1.4, 0]}><boxGeometry args={[1.3, 2.8, 0.5]} /><M c="#6e4a2e" /></mesh>{[0.5, 1.2, 1.9, 2.5].map((y, r) => ['#6f4aa8', '#a8483f', '#3f6fa8', '#c9a13a'].map((c, i) => <mesh key={r + c} position={[-0.45 + i * 0.3, y, 0.3]}><boxGeometry args={[0.22, 0.5, 0.26]} /><M c={c} /></mesh>))}</group>)}
        <BookStack p={[2.2, 0.8, -0.4]} /><BookStack p={[-2.4, 0, -1.2]} /><Plant p={[hw - 0.9, 0, 2.6]} /><Cushion p={[-1.6, 0.07, 2.0]} c="#5a2f8a" /><Cushion p={[1.6, 0.07, 2.2]} c="#5a2f8a" />
        <mesh position={[3.2, 0.9, 2.8]}><sphereGeometry args={[0.45, 14, 14]} /><meshStandardMaterial color="#3f6fa8" metalness={0.4} roughness={0.4} /></mesh><mesh position={[3.2, 0.35, 2.8]}><cylinderGeometry args={[0.1, 0.3, 0.7, 8]} /><M c="#c9a13a" /></mesh>
        <Chandelier p={[0, 3.6, 0.4]} c={light} />
      </Shadowed>}
      {id === 'wealth' && <Shadowed>
        <Banner p={[-hw + 0.9, 0, -hd + 0.3]} c="#a8201f" /><Banner p={[hw - 0.9, 0, -hd + 0.3]} c="#a8201f" />
        <Coins p={[-2.2, 0, 1.6]} /><Coins p={[2.4, 0, -1.6]} /><Coins p={[-1.0, 0.8, -0.6]} />
        {!has('model_crate') && [[-4.8, -1.6], [-4.8, -0.6], [-5.0, 2.6]].map(([x, z], i) => <mesh key={i} position={[x, 0.4, z]}><boxGeometry args={[0.8, 0.8, 0.8]} /><M c="#8a5f38" /></mesh>)}
        <Plant p={[hw - 0.9, 0, 3]} c="#3f8a6a" /><Chandelier p={[0, 3.6, 0.4]} c={light} />
      </Shadowed>}
      {id === 'pavilion' && <Shadowed>
        {[-3.5, 0, 3.5].map((x, i) => <group key={i} position={[x, 3.4, -hd + 0.7]}><mesh><sphereGeometry args={[0.38, 10, 10]} /><meshStandardMaterial color="#ffc2de" emissive="#ff8ac0" emissiveIntensity={1.6} toneMapped={false} /></mesh><Halo position={[0, 0, 0]} size={2} color="#ff9ec8" /></group>)}
        {[[-hw + 0.8, 2.0], [-hw + 0.9, -1.2]].map(([x, z], i) => <group key={i} position={[x, 0, z]}><mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.1, 0.16, 2.4, 6]} /><M c="#5a3a2a" /></mesh>{[[0, 2.6, 0, 0.9], [0.7, 2.3, 0.2, 0.6], [-0.4, 2.2, -0.3, 0.55]].map(([a, b, c, r], k) => <mesh key={k} position={[a, b, c]}><icosahedronGeometry args={[r, 0]} /><M c={['#ff9fd0', '#e684d8', '#ffb7dd'][k]} e="#ff7ac0" ei={0.3} /></mesh>)}</group>)}
        <Cushion p={[-1.8, 0.07, 2.0]} c="#c0568a" /><Cushion p={[1.6, 0.07, 2.4]} c="#c0568a" /><Plant p={[hw - 0.9, 0, 2.4]} c="#e86aa0" />
      </Shadowed>}
      {id === 'time' && <Shadowed>
        <mesh position={[3.5, 2.6, -hd + 0.18]}><planeGeometry args={[3.2, 2.2]} /><meshStandardMaterial map={starTex()} emissive="#3f3f9a" emissiveIntensity={0.5} /></mesh>
        {[[-2.6, 2.8], [2.6, 3.4]].map(([x, y], i) => <group key={i} position={[x, y, -hd + 0.25]} rotation-z={i}><mesh rotation-x={Math.PI / 2}><torusGeometry args={[0.6, 0.1, 6, 16]} /><M c="#c9a13a" e="#c9a13a" ei={0.3} /></mesh>{[0, 1, 2, 3].map((k) => <mesh key={k} rotation-z={k * 0.785}><boxGeometry args={[1.2, 0.08, 0.08]} /><M c="#c9a13a" /></mesh>)}</group>)}
        <group position={[hw - 1.4, 0, 2.2]}><mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.05, 0.3, 1.8, 6]} /><M c={'#6e4a2e'} /></mesh><mesh position={[0.3, 1.9, -0.3]} rotation-z={-0.9} rotation-y={0.6}><cylinderGeometry args={[0.12, 0.2, 1.6, 10]} /><M c="#c9a13a" e="#c9a13a" ei={0.2} /></mesh></group>
        <Cushion p={[-1.8, 0.07, 2.1]} c="#3b3f78" /><Cushion p={[1.8, 0.07, 2.4]} c="#3b3f78" /><Chandelier p={[0, 3.6, 0.4]} c="#cfa9ff" />
      </Shadowed>}
    </group>
  );
}
void woodTex;
