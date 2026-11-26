import maps from '@data/game_maps.json';
import buildings from '@data/game_buildings.json';
import npcs from '@data/game_npcs.json';

export const MAP = maps[0];
export const RADIUS = MAP.size.radius;
export const BUILDINGS = buildings;
export const NPCS = npcs;
/** 충돌 원 [x, z, r] */
export const OBSTACLES: [number, number, number][] = [
  [-7.6, -1, 3.2], [0, -12, 3.6], [7.8, -3.5, 2.5], [9.2, 6.2, 2.4], [-9, 7, 3.4], [13, -9, 1.0], [-14, -8, 0.9], [-15, 1, 0.9], [15, 9, 0.9], [-14, 11, 0.9], [13, 12, 0.9], [15, 1, 0.9],
  [-3.2, -8.4, 0.5], [0.5, 1.5, 0.5], [5.2, -6.4, 0.5], [-5.4, 5.6, 0.5],
];
export const INTERACT = { building: 2.6, npc: 2.8 };

export function resolve(x: number, z: number, r = 0.4): [number, number] {
  const d = Math.hypot(x, z);
  if (d > RADIUS - 1) { x = (x / d) * (RADIUS - 1); z = (z / d) * (RADIUS - 1); }
  for (const [ox, oz, or] of OBSTACLES) {
    const dx = x - ox, dz = z - oz, dd = Math.hypot(dx, dz), min = or + r;
    if (dd < min && dd > 0.0001) { x = ox + (dx / dd) * min; z = oz + (dz / dd) * min; }
  }
  return [x, z];
}

export function nearest(px: number, pz: number) {
  let best: { kind: 'building' | 'npc'; id: string; label: string; d: number } | null = null;
  for (const b of BUILDINGS) { const d = Math.hypot(px - b.door.x, pz - b.door.z); if (d < INTERACT.building && (!best || d < best.d)) best = { kind: 'building', id: b.id, label: b.name, d }; }
  for (const n of NPCS) { const d = Math.hypot(px - n.pos.x, pz - n.pos.z); if (d < INTERACT.npc && (!best || d < best.d)) best = { kind: 'npc', id: n.id, label: n.name, d }; }
  return best;
}

export const AVATARS = [
  { id: 0, name: '연보라 한복', desc: '단정한 쪽머리의 탐험가', skin: '#ffd9bf', hair: '#2b1a14', robe: '#b9a2e8', trim: '#f5c451', style: 'bun' as const },
  { id: 1, name: '남색 도포', desc: '갓을 쓴 점잖은 탐험가', skin: '#f6d0b0', hair: '#17141c', robe: '#2f3f8f', trim: '#f5c451', style: 'hat' as const },
  { id: 2, name: '분홍 저고리', desc: '댕기머리의 활발한 탐험가', skin: '#ffdcc7', hair: '#3a2018', robe: '#f3a6c7', trim: '#fff3d6', style: 'braid' as const },
];
