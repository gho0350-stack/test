/** 카메라 궤도 상태 (React 상태가 아닌 mutable 객체: 프레임마다 읽음) */
export const cam = { yaw: 0, pitch: 0.75, dist: 16, minDist: 6, maxDist: 34, userZoomed: false };
export function resetCam(mode: 'garden' | 'room', aspect: number) {
  const k = aspect < 0.9 ? 1 + (0.9 - aspect) * 1.6 : 1;
  cam.yaw = 0; cam.userZoomed = false;
  if (mode === 'garden') { cam.pitch = 0.72; cam.dist = 16 * (aspect < 0.9 ? 1 + (0.9 - aspect) * 1.1 : 1); cam.minDist = 6; cam.maxDist = 36; }
  else { cam.pitch = 0.82; cam.dist = 12.8 * k * (aspect < 0.9 ? 1.25 : 1); cam.minDist = 5; cam.maxDist = 40; }
}
export const clampCam = () => { cam.pitch = Math.max(0.28, Math.min(1.32, cam.pitch)); cam.dist = Math.max(cam.minDist, Math.min(cam.maxDist, cam.dist)); };
/** 입력(오른쪽=+x, 앞=-z)을 카메라 방향 기준 월드 방향으로 변환 */
export const camRelative = (ix: number, iz: number): [number, number] => { const c = Math.cos(cam.yaw), s = Math.sin(cam.yaw); return [ix * c + iz * s, -ix * s + iz * c]; };
