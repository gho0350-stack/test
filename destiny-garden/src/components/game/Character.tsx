'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

export interface LookProps {
  skin: string; hair: string; robe: string; trim: string;
  style: 'bun' | 'hat' | 'braid' | 'sage' | 'merchant' | 'guardian' | 'guide';
  scale?: number;
}

/** 귀엽고 둥근 로우폴리 인간형 아바타 (GLB 교체 가능: 이 컴포넌트만 바꾸면 됨) */
export function Character({ look, walkRef, idle = true }: { look: LookProps; walkRef?: { current: number }; idle?: boolean }) {
  const root = useRef<Group>(null), armL = useRef<Group>(null), armR = useRef<Group>(null), legL = useRef<Group>(null), legR = useRef<Group>(null), body = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime, w = walkRef?.current ?? 0;
    const swing = Math.sin(t * 11) * 0.7 * w;
    if (armL.current) armL.current.rotation.x = swing + Math.sin(t * 1.6) * 0.04 * (1 - w);
    if (armR.current) armR.current.rotation.x = -swing + Math.sin(t * 1.6 + 1) * 0.04 * (1 - w);
    if (legL.current) legL.current.rotation.x = -swing;
    if (legR.current) legR.current.rotation.x = swing;
    if (body.current) body.current.position.y = Math.abs(Math.sin(t * 11)) * 0.08 * w + (idle ? Math.sin(t * 2) * 0.015 * (1 - w) : 0);
  });
  const { skin, hair, robe, trim, style } = look;
  const sage = style === 'sage', merchant = style === 'merchant', guardian = style === 'guardian', guide = style === 'guide';
  const hairColor = sage ? '#f4f1ea' : hair;
  return (
    <group ref={root} scale={look.scale ?? 1}>
      {/* 그림자 */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}><circleGeometry args={[0.5, 16]} /><meshBasicMaterial color="#000" transparent opacity={0.28} /></mesh>
      <group ref={body}>
        {/* 다리/신발 */}
        <group ref={legL} position={[-0.13, 0.32, 0]}><mesh position={[0, -0.14, 0.03]}><boxGeometry args={[0.15, 0.16, 0.26]} /><meshStandardMaterial color="#f4ead6" flatShading /></mesh></group>
        <group ref={legR} position={[0.13, 0.32, 0]}><mesh position={[0, -0.14, 0.03]}><boxGeometry args={[0.15, 0.16, 0.26]} /><meshStandardMaterial color="#f4ead6" flatShading /></mesh></group>
        {/* 치마/도포 */}
        <mesh position={[0, 0.62, 0]}><cylinderGeometry args={[0.22, 0.44, 0.62, 10]} /><meshStandardMaterial color={robe} flatShading /></mesh>
        <mesh position={[0, 0.34, 0]}><torusGeometry args={[0.43, 0.025, 6, 16]} /><meshStandardMaterial color={trim} emissive={trim} emissiveIntensity={0.25} /></mesh>
        {/* 저고리 */}
        <mesh position={[0, 1.04, 0]}><cylinderGeometry args={[0.2, 0.25, 0.4, 10]} /><meshStandardMaterial color={guide ? '#bfe9f5' : merchant ? '#e8c46a' : '#fff4de'} flatShading /></mesh>
        <mesh position={[0, 0.93, 0.01]}><torusGeometry args={[0.235, 0.03, 6, 14]} /><meshStandardMaterial color={trim} emissive={trim} emissiveIntensity={0.35} /></mesh>
        <mesh position={[0, 1.07, 0.2]} rotation-z={0.5}><boxGeometry args={[0.04, 0.34, 0.03]} /><meshStandardMaterial color={robe} /></mesh>
        <mesh position={[0, 1.07, 0.2]} rotation-z={-0.5}><boxGeometry args={[0.04, 0.34, 0.03]} /><meshStandardMaterial color={robe} /></mesh>
        {/* 팔 */}
        <group ref={armL} position={[-0.27, 1.2, 0]}><mesh position={[-0.03, -0.17, 0]}><capsuleGeometry args={[0.07, 0.22, 4, 8]} /><meshStandardMaterial color={guide ? '#bfe9f5' : '#fff4de'} flatShading /></mesh><mesh position={[-0.03, -0.38, 0]}><sphereGeometry args={[0.065, 8, 8]} /><meshStandardMaterial color={skin} /></mesh></group>
        <group ref={armR} position={[0.27, 1.2, 0]}>
          <mesh position={[0.03, -0.17, 0]}><capsuleGeometry args={[0.07, 0.22, 4, 8]} /><meshStandardMaterial color={guide ? '#bfe9f5' : '#fff4de'} flatShading /></mesh><mesh position={[0.03, -0.38, 0]}><sphereGeometry args={[0.065, 8, 8]} /><meshStandardMaterial color={skin} /></mesh>
          {sage && <group position={[0.05, -0.38, 0.08]}><mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.02, 0.025, 1.7, 6]} /><meshStandardMaterial color="#6b4a2a" /></mesh><mesh position={[0, 1.1, 0]}><sphereGeometry args={[0.1, 10, 10]} /><meshStandardMaterial color="#ffe7a1" emissive="#ffd062" emissiveIntensity={2} toneMapped={false} /></mesh></group>}
          {merchant && <mesh position={[0.1, -0.38, 0.05]}><cylinderGeometry args={[0.1, 0.1, 0.03, 12]} /><meshStandardMaterial color="#ffd86b" emissive="#ffb300" emissiveIntensity={0.6} /></mesh>}
        </group>
        {/* 머리 */}
        <mesh position={[0, 1.58, 0]}><sphereGeometry args={[0.36, 16, 14]} /><meshStandardMaterial color={skin} flatShading /></mesh>
        <mesh position={[-0.13, 1.57, 0.31]}><sphereGeometry args={[0.04, 8, 8]} /><meshBasicMaterial color="#2a1a1a" /></mesh>
        <mesh position={[0.13, 1.57, 0.31]}><sphereGeometry args={[0.04, 8, 8]} /><meshBasicMaterial color="#2a1a1a" /></mesh>
        <mesh position={[-0.22, 1.49, 0.27]}><sphereGeometry args={[0.05, 8, 8]} /><meshBasicMaterial color="#ff9aa8" transparent opacity={0.6} /></mesh>
        <mesh position={[0.22, 1.49, 0.27]}><sphereGeometry args={[0.05, 8, 8]} /><meshBasicMaterial color="#ff9aa8" transparent opacity={0.6} /></mesh>
        <mesh position={[0, 1.47, 0.34]} scale={[1, 0.5, 0.5]}><sphereGeometry args={[0.03, 8, 8]} /><meshBasicMaterial color="#c9605a" /></mesh>
        {/* 머리카락 */}
        <mesh position={[0, 1.6, -0.03]} rotation-x={-0.5}><sphereGeometry args={[0.385, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} /><meshStandardMaterial color={hairColor} flatShading /></mesh>
        <mesh position={[0, 1.55, -0.16]}><sphereGeometry args={[0.36, 14, 12]} /><meshStandardMaterial color={hairColor} flatShading /></mesh>
        {(style === 'bun' || guardian) && <><mesh position={[0, 1.99, -0.05]}><sphereGeometry args={[0.16, 10, 10]} /><meshStandardMaterial color={hairColor} flatShading /></mesh><mesh position={[0.1, 1.98, 0.02]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color="#ffc2de" emissive="#ff9ec8" emissiveIntensity={0.5} /></mesh></>}
        {style === 'braid' && <><mesh position={[0, 1.2, -0.34]}><capsuleGeometry args={[0.07, 0.5, 4, 8]} /><meshStandardMaterial color={hairColor} flatShading /></mesh><mesh position={[0, 0.9, -0.34]}><boxGeometry args={[0.2, 0.1, 0.04]} /><meshStandardMaterial color="#e84a7f" emissive="#e84a7f" emissiveIntensity={0.3} /></mesh><mesh position={[-0.25, 1.9, 0.0]}><sphereGeometry args={[0.1, 8, 8]} /><meshStandardMaterial color="#ffd0e3" /></mesh></>}
        {style === 'hat' && <group position={[0, 1.93, 0]}><mesh position={[0, 0.0, 0]}><cylinderGeometry args={[0.34, 0.34, 0.04, 14]} /><meshStandardMaterial color="#0e0e12" transparent opacity={0.92} /></mesh><mesh position={[0, 0.13, 0]}><cylinderGeometry args={[0.15, 0.2, 0.24, 10]} /><meshStandardMaterial color="#0e0e12" /></mesh></group>}
        {sage && <><mesh position={[0, 1.36, 0.26]} scale={[1, 1.5, 0.5]}><sphereGeometry args={[0.2, 10, 10]} /><meshStandardMaterial color="#f7f4ee" flatShading /></mesh><group position={[0, 1.93, 0]}><mesh><cylinderGeometry args={[0.3, 0.34, 0.14, 10]} /><meshStandardMaterial color="#4b2f8a" /></mesh><mesh position={[0, 0.12, 0]}><sphereGeometry args={[0.09, 8, 8]} /><meshStandardMaterial color="#f5c451" emissive="#f5c451" emissiveIntensity={0.6} /></mesh></group></>}
        {merchant && <group position={[0, 1.93, 0]}><mesh><cylinderGeometry args={[0.32, 0.34, 0.1, 12]} /><meshStandardMaterial color="#6b3a12" /></mesh><mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.2, 0.24, 0.18, 12]} /><meshStandardMaterial color="#8a5a1f" /></mesh></group>}
        {guide && <group position={[0, 1.55, 0]}><mesh position={[0, 0.26, 0]}><coneGeometry args={[0.5, 0.7, 10, 1, true]} /><meshStandardMaterial color="#2e6f8e" side={2} flatShading /></mesh><mesh position={[0.5, 0.6, 0.2]}><sphereGeometry args={[0.1, 10, 10]} /><meshStandardMaterial color="#baf0ff" emissive="#7fe0ff" emissiveIntensity={2.5} toneMapped={false} /></mesh></group>}
      </group>
    </group>
  );
}
