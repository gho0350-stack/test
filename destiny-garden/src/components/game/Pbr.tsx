'use client';
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { useRegistry } from '@/lib/client/assets';

const loader = new THREE.TextureLoader(); const cache = new Map<string, Promise<THREE.Texture>>();
function load(url: string, srgb: boolean, repeat: [number, number]) {
  const k = url + repeat.join(',');
  if (!cache.has(k)) cache.set(k, new Promise((res) => loader.load(url, (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); t.anisotropy = 4; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; res(t); }, undefined, () => res(null as any))));
  return cache.get(k)!;
}
/** 파이프라인이 수집한 PBR 텍스처(기본색·노멀·거칠기)가 있으면 사용하고, 없으면 fallback 재질을 그린다. */
export function PbrMaterial({ id, repeat, fallback, tint = '#ffffff', roughness = 1 }: { id: string; repeat: [number, number]; fallback: React.ReactNode; tint?: string; roughness?: number }) {
  const reg = useRegistry(); const set = reg?.textures[id];
  const [tex, setTex] = useState<{ map?: THREE.Texture; normalMap?: THREE.Texture; roughnessMap?: THREE.Texture } | null>(null);
  const key = set ? JSON.stringify(set) + repeat.join(',') : '';
  useEffect(() => {
    if (!set?.diff) { setTex(null); return; }
    let alive = true;
    Promise.all([load(set.diff, true, repeat), set.nor ? load(set.nor, false, repeat) : Promise.resolve(undefined), set.rough ? load(set.rough, false, repeat) : Promise.resolve(undefined)])
      .then(([map, normalMap, roughnessMap]) => { if (alive && map) setTex({ map, normalMap: normalMap || undefined, roughnessMap: roughnessMap || undefined }); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  if (!tex) return <>{fallback}</>;
  return <meshStandardMaterial map={tex.map} normalMap={tex.normalMap} roughnessMap={tex.roughnessMap} color={tint} roughness={roughness} />;
}
