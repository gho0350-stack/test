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
import { cam, camRelative, resetCam } from '@/lib/client/camera';
import { woodTex, plasterTex } from '@/lib/client/textures';
import { RoomProps } from './RoomProps';
import { Shadowed } from './Shadowed';
import { RoomDecor } from './Decor';
import { PbrMaterial } from './Pbr';
import { AVATARS } from '@/lib/game/world';

import { Halo } from './RoomProps';

const FLOOR: Record<string, string> = { library: 'tex_wood_floor', wealth: 'tex_wood_dark', pavilion: 'tex_tatami', time: 'tex_wood_dark' };
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
      <ambientLight intensity={0.9} color="#e8d8ff" />
      <hemisphereLight args={['#fff1dc', '#3a2b5a', 0.55]} />
      <directionalLight position={[4, 11, 7]} intensity={1.5} color={T.light} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-camera-near={1} shadow-camera-far={28} shadow-bias={-0.0004} />
      <pointLight position={[0, 3.4, 0]} intensity={10} distance={13} color={T.light} />
      {/* 바닥/벽 (정면·우측은 열린 단면 구조: 캐릭터가 가려지지 않음, 벽은 단면이라 뒤에서 보면 투명) */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[w, d]} /><PbrMaterial id={FLOOR[id] ?? 'tex_wood_floor'} repeat={[w / 3, d / 3]} tint="#c9b8a8" roughness={0.85} fallback={<meshStandardMaterial map={woodTex(T.floor, [w / 3, d / 3])} roughness={0.75} />} /></mesh>
      <mesh position={[0, 2.2, -d / 2]} receiveShadow><planeGeometry args={[w + 0.4, 4.4]} /><PbrMaterial id="tex_plaster" repeat={[w / 3, 1.6]} tint="#d8c8b0" fallback={<meshStandardMaterial map={plasterTex(T.wall, [w / 3, 1.6])} />} /></mesh>
      <mesh position={[-w / 2, 2.2, 0]} rotation-y={Math.PI / 2} receiveShadow><planeGeometry args={[d, 4.4]} /><PbrMaterial id="tex_plaster" repeat={[d / 3, 1.6]} tint="#d8c8b0" fallback={<meshStandardMaterial map={plasterTex(T.wall, [d / 3, 1.6])} />} /></mesh>
      <mesh position={[0, 0.6, -d / 2 + 0.02]}><planeGeometry args={[w + 0.4, 1.2]} /><meshStandardMaterial map={woodTex('#5a3a22', [w / 2, 0.5])} /></mesh>
      <mesh position={[-w / 2 + 0.02, 0.6, 0]} rotation-y={Math.PI / 2}><planeGeometry args={[d, 1.2]} /><meshStandardMaterial map={woodTex('#5a3a22', [d / 2, 0.5])} /></mesh>
      <mesh position={[0, 1.22, -d / 2 + 0.05]}><boxGeometry args={[w + 0.4, 0.08, 0.1]} /><meshStandardMaterial color={T.accent} emissive={T.accent} emissiveIntensity={0.15} /></mesh>
      {[-3.2, 3.2].map((x) => <group key={x}><mesh position={[x, 2.9, -d / 2 + 0.03]}><planeGeometry args={[1.5, 1.7]} /><meshStandardMaterial color="#1b1550" emissive="#b9c9e6" emissiveIntensity={0.75} toneMapped={false} /></mesh>{[-0.75, 0, 0.75].map((dx) => <mesh key={dx} position={[x + dx, 2.9, -d / 2 + 0.06]}><boxGeometry args={[0.05, 1.7, 0.04]} /><meshStandardMaterial color="#3a2418" /></mesh>)}<mesh position={[x, 2.9, -d / 2 + 0.06]}><boxGeometry args={[1.6, 0.05, 0.04]} /><meshStandardMaterial color="#3a2418" /></mesh><Halo position={[x, 2.9, -d / 2 + 0.6]} size={3.4} color="#cfe0ff" opacity={0.2} /></group>)}
      <RoomProps id={id} w={w} d={d} accent={T.accent} light={T.light} />
      <RoomDecor id={id} />
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
              <Shadowed><Furniture type={o.type} open={isDone || anim[o.id] === 'opening'} /></Shadowed>
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
          <Shadowed><Character look={{ skin: '#f6d6bb', hair: '#3a2a20', robe: sageNpc.color, trim: sageNpc.accent, style: (room.sage.id === 'sage' ? 'sage' : room.sage.id) as any }} /></Shadowed>
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
    resetCam('room', size.width / size.height); camera.position.set(0, 9, 12); return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, [camera]);
  useFrame((_, dt0) => {
    const dt = Math.min(dt0, 0.05); const g = useGame.getState();
    let dx = 0, dz = 0; const k = keys.current;
    if (k.has('w') || k.has('arrowup')) dz -= 1; if (k.has('s') || k.has('arrowdown')) dz += 1; if (k.has('a') || k.has('arrowleft')) dx -= 1; if (k.has('d') || k.has('arrowright')) dx += 1;
    dx += g.joy.x; dz += g.joy.y;
    [dx, dz] = camRelative(dx, dz);
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
    const cp = Math.cos(cam.pitch) * cam.dist; const tx = pos.current.x, tz = pos.current.z - 1.0;
    const want = new THREE.Vector3(tx + Math.sin(cam.yaw) * cp, 1.0 + Math.sin(cam.pitch) * cam.dist, tz + Math.cos(cam.yaw) * cp);
    // 카메라 충돌: 방 안쪽(뒷벽·왼쪽 벽 바깥)으로 나가지 않게 제한
    want.x = Math.max(-room.size.w / 2 + 0.4, Math.min(room.size.w / 2 + 6, want.x)); want.z = Math.max(-room.size.d / 2 + 0.5, want.z); want.y = Math.max(1.6, Math.min(8.5, want.y));
    camera.position.lerp(want, Math.min(1, dt * 6));
    camera.lookAt(tx, 1.3, tz - Math.cos(cam.yaw) * 1.5);
    tick.current += dt;
    if (tick.current > 0.1) {
      tick.current = 0; const n = nearestIn(room, pos.current.x, pos.current.z); const key = n ? n.kind + n.id : '';
      if (key !== last.current) { last.current = key; useGame.setState({ near: n ? { kind: n.kind, id: n.id, label: n.label, action: n.action } : null }); }
      useGame.setState({ roomPlayer: { x: pos.current.x, z: pos.current.z } });
    }
    if (ring.current) { const t = g.target; ring.current.visible = !!t; if (t) { ring.current.position.set(t.x, 0.06, t.z); const s = 1 + Math.sin(performance.now() / 200) * 0.12; ring.current.scale.set(s, s, 1); } }
  });
  return <>
    <group ref={group}><Shadowed><Character look={{ ...look, scale: 1.05 }} walkRef={walk} /></Shadowed></group>
    <mesh ref={ring} rotation-x={-Math.PI / 2} visible={false}><ringGeometry args={[0.3, 0.42, 24]} /><meshBasicMaterial color="#ffe08a" transparent opacity={0.9} /></mesh>
  </>;
}
