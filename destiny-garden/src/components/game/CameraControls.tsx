'use client';
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { cam, clampCam } from '@/lib/client/camera';

/** 드래그로 둘러보기, 휠/핀치로 확대·축소. 짧은 탭은 바닥 클릭 이동으로 전달된다. */
export function CameraControls() {
  const el = useThree((s) => s.gl.domElement);
  useEffect(() => {
    const pts = new Map<number, { x: number; y: number }>();
    let moved = 0, pinch = 0;
    const down = (e: PointerEvent) => { pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = 0; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); } };
    const move = (e: PointerEvent) => {
      const p = pts.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch) { cam.dist *= pinch / d; cam.userZoomed = true; clampCam(); } pinch = d; return; }
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 8) { cam.yaw -= dx * 0.006; cam.pitch += dy * 0.004; clampCam(); }
    };
    const up = (e: PointerEvent) => { pts.delete(e.pointerId); pinch = 0; };
    const wheel = (e: WheelEvent) => { e.preventDefault(); cam.dist *= Math.exp(e.deltaY * 0.0012); cam.userZoomed = true; clampCam(); };
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up);
    el.addEventListener('wheel', wheel, { passive: false });
    return () => { el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); el.removeEventListener('pointerleave', up); el.removeEventListener('wheel', wheel); };
  }, [el]);
  return null;
}
