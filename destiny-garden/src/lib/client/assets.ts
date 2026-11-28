'use client';
import { useEffect, useState } from 'react';
/** 자동 수집 파이프라인이 만든 public/assets/registry.json (준비된 에셋만 포함). 없으면 빈 레지스트리 → 절차적 대체. */
export interface Registry { textures: Record<string, { diff?: string; nor?: string; rough?: string; ao?: string }>; models: Record<string, { path: string; size_m?: number[]; bytes?: number }> }
let cached: Registry | null = null; let pending: Promise<Registry> | null = null;
export function loadRegistry(): Promise<Registry> {
  if (cached) return Promise.resolve(cached);
  pending ??= fetch('/assets/registry.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : { textures: {}, models: {} })).catch(() => ({ textures: {}, models: {} })).then((j) => (cached = { textures: j.textures ?? {}, models: j.models ?? {} }));
  return pending;
}
export function useRegistry(): Registry | null { const [r, setR] = useState<Registry | null>(cached); useEffect(() => { loadRegistry().then(setR); }, []); return r; }
