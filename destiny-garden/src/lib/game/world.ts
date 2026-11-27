import maps from '@data/game_maps.json';
import buildings from '@data/game_buildings.json';
import npcs from '@data/game_npcs.json';
import rooms from '@data/rooms.json';

export const MAP = maps[0];
export const RADIUS = MAP.size.radius;
export const BUILDINGS = buildings;
export const NPCS = npcs;
export const ROOMS = rooms;
export const roomOf = (id: string) => rooms.find((r) => r.id === id);
export const isRoomBuilding = (id: string) => rooms.some((r) => r.id === id);
/** 충돌 원 [x, z, r] */
export const OBSTACLES: [number, number, number][] = [
  [-7.6, -1, 3.2], [0, -12, 3.6], [7.8, -3.5, 2.5], [9.2, 6.2, 2.4], [-9, 7, 3.4], [-8.5, -10, 2.6], [13, -9, 1.0], [-14, -8, 0.9], [-15, 1, 0.9], [15, 9, 0.9], [-14, 11, 0.9], [13, 12, 0.9], [15, 1, 0.9],
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

export function interactWith(kind: 'building' | 'npc', id: string, store: { player: { x: number; z: number }; open: (p: any) => void; set: (s: any) => void }) {
  const t = kind === 'building' ? BUILDINGS.find((b) => b.id === id)!.door : NPCS.find((n) => n.id === id)!.pos;
  const { player } = store;
  const d = Math.hypot(player.x - t.x, player.z - t.z);
  if (d <= (kind === 'building' ? INTERACT.building : INTERACT.npc)) { store.open({ type: kind, id }); store.set({ target: null, pending: null }); }
  else { const [x, z] = kind === 'npc' ? resolve(t.x + (player.x > t.x ? 1.5 : -1.5), t.z + (player.z > t.z ? 1.5 : -1.5), 0.2) : [t.x, t.z]; store.set({ target: { x, z }, pending: { kind, id, x: t.x, z: t.z } }); }
}

/** 실내: 벽/가구 충돌 */
export function resolveIn(room: (typeof rooms)[number], x: number, z: number, r = 0.4): [number, number] {
  const hw = room.size.w / 2 - 0.7, hd = room.size.d / 2 - 0.6;
  x = Math.max(-hw, Math.min(hw, x)); z = Math.max(-hd + 0.4, Math.min(hd, z));
  const cols: [number, number, number][] = [...(room.objects as any[]).map((o) => [o.pos.x, o.pos.z, o.type === 'chairs' ? 0.9 : o.type === 'mirror' || o.type === 'map' ? 0.5 : 0.8] as [number, number, number]), [room.sage.pos.x, room.sage.pos.z, 0.6]];
  for (const [ox, oz, or] of cols) { const dx = x - ox, dz = z - oz, dd = Math.hypot(dx, dz), min = or + r; if (dd < min && dd > 0.0001) { x = ox + (dx / dd) * min; z = oz + (dz / dd) * min; } }
  return [x, z];
}
export function nearestIn(room: (typeof rooms)[number], px: number, pz: number) {
  let best: { kind: 'object' | 'sage'; id: string; label: string; action: string; d: number } | null = null;
  for (const o of room.objects as any[]) { const d = Math.hypot(px - o.pos.x, pz - o.pos.z); if (d < 2.2 && (!best || d < best.d)) best = { kind: 'object', id: o.id, label: o.name, action: o.action, d }; }
  const sd = Math.hypot(px - room.sage.pos.x, pz - room.sage.pos.z);
  if (sd < 2.3 && (!best || sd < best.d)) best = { kind: 'sage', id: room.sage.id, label: (npcs.find((n) => n.id === room.sage.id) as any)?.name ?? '현자', action: '말 걸기', d: sd };
  return best;
}

export function nearest(px: number, pz: number) {
  let best: { kind: 'building'; id: string; label: string; d: number } | null = null;
  for (const b of BUILDINGS) { const d = Math.hypot(px - b.door.x, pz - b.door.z); if (d < INTERACT.building && (!best || d < best.d)) best = { kind: 'building', id: b.id, label: b.name, d }; }
  return best;
}

export const AVATARS = [
  { id: 0, name: '연보라 한복', desc: '단정한 쪽머리의 탐험가', skin: '#ffd9bf', hair: '#2b1a14', robe: '#b9a2e8', trim: '#f5c451', style: 'bun' as const },
  { id: 1, name: '남색 도포', desc: '갓을 쓴 점잖은 탐험가', skin: '#f6d0b0', hair: '#17141c', robe: '#2f3f8f', trim: '#f5c451', style: 'hat' as const },
  { id: 2, name: '분홍 저고리', desc: '댕기머리의 활발한 탐험가', skin: '#ffdcc7', hair: '#3a2018', robe: '#f3a6c7', trim: '#fff3d6', style: 'braid' as const },
];
