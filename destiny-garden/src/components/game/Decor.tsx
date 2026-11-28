'use client';
import { Suspense, useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useRegistry } from '@/lib/client/assets';
import layouts from '@data/room-layouts.json';
import { decorCols } from '@/lib/game/world';

function Model({ url, position, rotation = 0, scale = 1 }: { url: string; position: [number, number, number]; rotation?: number; scale?: number }) {
  const { scene } = useGLTF(url);
  const obj = useMemo(() => { const c = scene.clone(true); c.traverse((o: any) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return c; }, [scene]);
  return <primitive object={obj} position={position} rotation-y={rotation} scale={scale} />;
}
/** 방 장식: room-layouts.json + 레지스트리에 준비된 GLB 만 로드(입장 시 해당 방 것만). */
export function RoomDecor({ id }: { id: string }) {
  const reg = useRegistry();
  const list = ((layouts as any)[id] ?? []) as { asset_id: string; position: [number, number]; rotation?: number; scale?: number }[];
  useEffect(() => {
    if (!reg) return;
    for (const d of list) { const m = reg.models[d.asset_id]; if (m) useGLTF.preload(m.path); }
    decorCols[id] = list.filter((d) => reg.models[d.asset_id]).map((d: any) => [d.position[0], d.position[1], d.radius ?? 0.6] as [number, number, number]);
    return () => { delete decorCols[id]; };
  }, [reg, list, id]);
  if (!reg) return null;
  return <>{list.map((d, i) => { const m = reg.models[d.asset_id]; if (!m) return null; return <Suspense key={i} fallback={null}><Model url={m.path} position={[d.position[0], 0, d.position[1]]} rotation={d.rotation} scale={d.scale} /></Suspense>; })}</>;
}
/** 파이프라인으로 준비된 데코 모델 개수 (충돌 반영 등에 사용) */
export const readyDecorIds = (reg: { models: Record<string, unknown> } | null, id: string) => (reg ? ((layouts as any)[id] ?? []).filter((d: any) => reg.models[d.asset_id]) : []);
void THREE;
