'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { Character } from './Character';
import { AVATARS } from '@/lib/game/world';

function Spin({ id }: { id: number }) {
  const g = useRef<Group>(null);
  useFrame((_, dt) => { if (g.current) g.current.rotation.y += dt * 0.7; });
  return <group ref={g} position={[0, -1.15, 0]} scale={1.15}><Character look={AVATARS[id]} /></group>;
}
export default function Preview3D({ id }: { id: number }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ fov: 38, position: [0, 0.6, 5.2] }}>
      <ambientLight intensity={1.4} color="#d8ccff" /><directionalLight position={[3, 5, 4]} intensity={1.6} color="#fff0d6" />
      <Spin id={id} />
    </Canvas>
  );
}
