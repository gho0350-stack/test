'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Character } from './Character';
import { Furniture } from './Furniture';
import { useGame } from '@/lib/client/store';
import { interactNear } from '@/lib/client/interact';
import { roomOf, resolveIn, nearestIn, NPCS } from '@/lib/game/world';
import { AVATARS } from '@/lib/game/world';

let tex: THREE.Texture | null = null;
function glow() { if (tex) return tex; const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!; const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,230,160,1)'); r.addColorStop(0.4, 'rgba(255,200,110,0.4)'); r.addColorStop(1, 'rgba(255,200,110,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); tex = new THREE.CanvasTexture(c); return tex; }
const Halo = ({ position, size = 1.6, color = '#ffd98a', opacity = 0.9 }: { position: [number, number, number]; size?: number; color?: string; opacity?: number }) =>
  <sprite position={position} scale={[size, size, 1]}><spriteMaterial map={glow()} color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>;

export function Interior({ id }: { id: string }) {
  const room = roomOf(id)!;
  const st = useGame((s) => s.state);
  const anim = useGame((s) => s.anim);
  const prog = st?.rooms.find((r) => r.id === id);
  const { w, d } = room.size; const T = room.theme;
  const done = (oid: string) => !!prog?.objects.find((o) => o.id === oid)?.done || anim[oid] === 'open';
  const target = (prog?.objects ?? []).find((o) => o.required && !o.done)?.id;
  const sageNpc: any = NPCS.find((n) => n.id === room.sage.id)!;
  const unlocked = !!prog?.sageUnlocked;
  return (
    <group>
      <color attach="background" args={['#120a24']} />
      <ambientLight intensity={1.25} color="#e8d8ff" />
      <directionalLight position={[3, 9, 6]} intensity={1.3} color={T.light} />
      <pointLight position={[0, 3.2, 0]} intensity={14} distance={13} color={T.light} />
      {/* 바닥/벽 (정면·우측은 열린 단면 구조: 캐릭터가 가려지지 않음) */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}><planeGeometry args={[w, d]} /><meshStandardMaterial color={T.floor} flatShading /></mesh>
      {Array.from({ length: 6 }, (_, i) => <mesh key={i} rotation-x={-Math.PI / 2} position={[0, 0.005, -d / 2 + 0.75 + i * 1.5]}><planeGeometry args={[w, 0.05]} /><meshStandardMaterial color="#00000030" transparent opacity={0.35} /></mesh>)}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0.4]}><circleGeometry args={[2.6, 24]} /><meshStandardMaterial color={T.accent} transparent opacity={0.18} /></mesh>
      <mesh position={[0, 2.2, -d / 2]}><boxGeometry args={[w + 0.4, 4.4, 0.3]} /><meshStandardMaterial color={T.wall} flatShading /></mesh>
      <mesh position={[-w / 2, 2.2, 0]}><boxGeometry args={[0.3, 4.4, d]} /><meshStandardMaterial color={T.wall} flatShading /></mesh>
      <mesh position={[0, 0.25, -d / 2 + 0.2]}><boxGeometry args={[w, 0.5, 0.15]} /><meshStandardMaterial color={T.accent} emissive={T.accent} emissiveIntensity={0.15} /></mesh>
      {[-3.2, 3.2].map((x) => <group key={x}><mesh position={[x, 2.9, -d / 2 + 0.17]}><planeGeometry args={[1.5, 1.7]} /><meshStandardMaterial color="#1b1550" emissive="#4a3fa0" emissiveIntensity={0.6} /></mesh><mesh position={[x, 2.9, -d / 2 + 0.2]}><boxGeometry args={[1.6, 0.06, 0.04]} /><meshStandardMaterial color={T.accent} /></mesh></group>)}
      {/* 출입구 */}
      {[-1.1, 1.1].map((x) => <mesh key={x} position={[x, 1.1, d / 2 - 0.1]}><boxGeometry args={[0.14, 2.2, 0.14]} /><meshStandardMaterial color={T.accent} emissive={T.accent} emissiveIntensity={0.5} /></mesh>)}
      <Halo position={[0, 1.2, d / 2 - 0.2]} size={4} color={T.light} opacity={0.25} />
      {/* 가구/오브젝트 */}
      {(room.objects as any[]).map((o) => {
        const isDone = done(o.id), isTarget = target === o.id, canOpen = o.kind !== 'panel' && !!o.card;
        return (
          <group key={o.id} position={[o.pos.x, 0, o.pos.z]} rotation-y={o.rot ?? 0}>
            <group onClick={(e) => { e.stopPropagation(); const p = useGame.getState().roomPlayer; if (Math.hypot(p.x - o.pos.x, p.z - o.pos.z) < 2.3) interactNear({ kind: 'object', id: o.id }); else useGame.setState({ target: { x: o.pos.x + Math.sin(o.rot ?? 0) * 1.5 + 0.0, z: o.pos.z + Math.cos(o.rot ?? 0) * 1.6 } }); }}
              onPointerOver={() => (document.body.style.cursor = 'pointer')} onPointerOut={() => (document.body.style.cursor = '')}>
              <Furniture type={o.type} open={isDone || anim[o.id] === 'opening'} />
            </group>
            {canOpen && !isDone && <Halo position={[0, 1.6, 0]} size={isTarget ? 2.8 : 1.8} color={isTarget ? '#ffe08a' : '#cfa9ff'} opacity={isTarget ? 0.95 : 0.55} />}
            {isTarget && <mesh position={[0, 3.3, 0]}><coneGeometry args={[0.18, 0.4, 4]} /><meshBasicMaterial color="#ffd36b" toneMapped={false} /></mesh>}
            {!canOpen && o.kind === 'panel' && <Halo position={[0, 1.4, 0]} size={1.4} color="#9fe6ff" opacity={0.45} />}
          </group>
        );
      })}
      {/* 현자 */}
      <group position={[room.sage.pos.x, 0, room.sage.pos.z]} rotation-y={0.5}>
        <group onClick={(e) => { e.stopPropagation(); interactNear({ kind: 'sage', id: room.sage.id }); }}>
          <Character look={{ skin: '#f6d6bb', hair: '#3a2a20', robe: sageNpc.color, trim: sageNpc.accent, style: (room.sage.id === 'sage' ? 'sage' : room.sage.id) as any }} />
          <mesh position={[0, 1.2, 0]} visible={false}><cylinderGeometry args={[0.7, 0.7, 2.6, 6]} /></mesh>
        </group>
        {unlocked && <Halo position={[0, 1.3, 0]} size={3.6} color="#ffe08a" opacity={0.55} />}
        <Html position={[0, 3.0, 0]} center zIndexRange={[7, 0]}><button className="npc-bubble" onClick={() => interactNear({ kind: 'sage', id: room.sage.id })}>{unlocked ? '✨' : '🔒'} {sageNpc.name}</button></Html>
      </group>
      <FloorClick id={id} w={w} d={d} />
      <InteriorPlayer id={id} />
    </group>
  );
}

function FloorClick({ id, w, d }: { id: string; w: number; d: number }) {
  const room = roomOf(id)!;
  return <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} onPointerDown={(e) => { if (e.delta > 4) return; e.stopPropagation(); const [x, z] = resolveIn(room, e.point.x, e.point.z); useGame.setState({ target: { x, z } }); }}>
    <planeGeometry args={[w, d]} /><meshBasicMaterial transparent opacity={0} />
  </mesh>;
}

function InteriorPlayer({ id }: { id: string }) {
  const room = roomOf(id)!;
  const st = useGame((s) => s.state);
  const look = AVATARS[st?.profile?.avatar ?? 0];
  const group = useRef<THREE.Group>(null); const ring = useRef<THREE.Mesh>(null);
  const walk = useRef(0); const yaw = useRef(Math.PI);
  const pos = useRef(new THREE.Vector3(useGame.getState().roomPlayer.x, 0, useGame.getState().roomPlayer.z));
  const keys = useRef(new Set<string>()); const tick = useRef(0); const last = useRef('');
  const { camera, size } = useThree();
  useEffect(() => {
    const typing = () => { const a = document.activeElement as HTMLElement | null; return !!a && ['INPUT', 'TEXTAREA', 'SELECT'].includes(a.tagName); };
    const dn = (e: KeyboardEvent) => { if (typing()) return; const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) { keys.current.add(k); e.preventDefault(); }
      if ((k === 'e' || k === 'enter') && !useGame.getState().panel && !useGame.getState().reveal) { const n = useGame.getState().near; if (n) interactNear(n); } };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', dn); window.addEventListener('keyup', up);
    camera.position.set(0, 9, 12); return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, [camera]);
  useFrame((_, dt0) => {
    const dt = Math.min(dt0, 0.05); const g = useGame.getState();
    let dx = 0, dz = 0; const k = keys.current;
    if (k.has('w') || k.has('arrowup')) dz -= 1; if (k.has('s') || k.has('arrowdown')) dz += 1; if (k.has('a') || k.has('arrowleft')) dx -= 1; if (k.has('d') || k.has('arrowright')) dx += 1;
    dx += g.joy.x; dz += g.joy.y;
    const blocked = !!g.panel || !!g.reveal || !!g.sageUnlock;
    let moving = false;
    if (Math.hypot(dx, dz) > 0.12 && !blocked) { if (g.target) useGame.setState({ target: null }); const l = Math.hypot(dx, dz), m = Math.min(1, l); dx = (dx / l) * m; dz = (dz / l) * m; moving = true; }
    else if (g.target && !blocked) { const tx = g.target.x - pos.current.x, tz = g.target.z - pos.current.z, dd = Math.hypot(tx, tz); if (dd < 0.2) useGame.setState({ target: null }); else { dx = tx / dd; dz = tz / dd; moving = true; } }
    if (moving) {
      const sp = 3.6, step = sp * dt;
      const tryMove = (ang: number) => { const c = Math.cos(ang), sn = Math.sin(ang); const ndx = dx * c - dz * sn, ndz = dx * sn + dz * c; const [nx, nz] = resolveIn(room, pos.current.x + ndx * step, pos.current.z + ndz * step); return { nx, nz, ndx, ndz, moved: Math.hypot(nx - pos.current.x, nz - pos.current.z) }; };
      let best = tryMove(0);
      // 바닥 터치 이동 시 가구에 막히면 비켜서 돌아가기(좌/우 우회 중 목표에 더 가까워지는 쪽)
      if (g.target && !(Math.hypot(dx, dz) > 0.12 && !g.target) && best.moved < step * 0.6) {
        let bestScore = 1e9; let pick = best;
        for (const a of [0.7, -0.7, 1.3, -1.3, 1.9, -1.9]) { const c = tryMove(a); if (c.moved < step * 0.5) continue; const sc = Math.hypot(g.target.x - c.nx, g.target.z - c.nz); if (sc < bestScore) { bestScore = sc; pick = c; } }
        best = pick;
      }
      if (best.moved < step * 0.15 && g.target) useGame.setState({ target: null });
      pos.current.set(best.nx, 0, best.nz);
      const want = Math.atan2(best.ndx, best.ndz); let diff = want - yaw.current; while (diff > Math.PI) diff -= 2 * Math.PI; while (diff < -Math.PI) diff += 2 * Math.PI; yaw.current += diff * Math.min(1, dt * 12);
    }
    walk.current += ((moving ? 1 : 0) - walk.current) * Math.min(1, dt * 10);
    if (group.current) { group.current.position.copy(pos.current); group.current.rotation.y = yaw.current; }
    const asp = size.width / size.height; const k2 = asp < 0.9 ? 1 + (0.9 - asp) * 1.6 : 1; const kx = asp < 0.9 ? 0.7 : 0.35;
    camera.position.lerp(new THREE.Vector3(pos.current.x * kx, 8.6 * k2, pos.current.z * 0.25 + 9.6 * k2), Math.min(1, dt * 5));
    camera.lookAt(pos.current.x * kx, 0.4, -0.6);
    tick.current += dt;
    if (tick.current > 0.1) {
      tick.current = 0; const n = nearestIn(room, pos.current.x, pos.current.z); const key = n ? n.kind + n.id : '';
      if (key !== last.current) { last.current = key; useGame.setState({ near: n ? { kind: n.kind, id: n.id, label: n.label, action: n.action } : null }); }
      useGame.setState({ roomPlayer: { x: pos.current.x, z: pos.current.z } });
    }
    if (ring.current) { const t = g.target; ring.current.visible = !!t; if (t) { ring.current.position.set(t.x, 0.06, t.z); const s = 1 + Math.sin(performance.now() / 200) * 0.12; ring.current.scale.set(s, s, 1); } }
  });
  return <>
    <group ref={group}><Character look={{ ...look, scale: 1.05 }} walkRef={walk} /></group>
    <mesh ref={ring} rotation-x={-Math.PI / 2} visible={false}><ringGeometry args={[0.3, 0.42, 24]} /><meshBasicMaterial color="#ffe08a" transparent opacity={0.9} /></mesh>
  </>;
}
