'use client';
import { useEffect, useRef } from 'react';
import type { Group } from 'three';
/** 자식 메시 전체에 그림자 캐스트/리시브 적용 */
export function Shadowed({ children, cast = true, receive = true, position, rotation }: { children: React.ReactNode; cast?: boolean; receive?: boolean; position?: [number, number, number]; rotation?: [number, number, number] }) {
  const ref = useRef<Group>(null);
  useEffect(() => { ref.current?.traverse((o: any) => { if (o.isMesh) { o.castShadow = cast; o.receiveShadow = receive; } }); }, [cast, receive]);
  return <group ref={ref} position={position} rotation={rotation}>{children}</group>;
}
