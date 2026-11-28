/** 카메라 궤도 상태 (React 상태가 아닌 mutable 객체: 프레임마다 읽음) */
export const cam = { yaw: 0, pitch: 0.4, dist: 11, minDist: 6, maxDist: 34, userZoomed: false };
export function resetCam(mode: 'garden' | 'room', aspect: number) {
  const k = aspect < 0.9 ? 1 + (0.9 - aspect) * 1.6 : 1;
  cam.yaw = 0; cam.userZoomed = false;
  // 3인칭: 캐릭터 뒤에서 낮은 각도로 공간을 바라본다 (드래그로 회전, 휠/핀치로 거리 조절)
  if (mode === 'garden') { cam.pitch = 0.36; cam.dist = 10.5 * (aspect < 0.9 ? 1 + (0.9 - aspect) * 0.9 : 1); cam.minDist = 4; cam.maxDist = 34; }
  else { cam.pitch = 0.5; cam.dist = 9.2 * k; cam.minDist = 3.5; cam.maxDist = 30; }
}
export const clampCam = () => { cam.pitch = Math.max(0.12, Math.min(1.3, cam.pitch)); cam.dist = Math.max(cam.minDist, Math.min(cam.maxDist, cam.dist)); };
/** 입력(오른쪽=+x, 앞=-z)을 카메라 방향 기준 월드 방향으로 변환 */
export const camRelative = (ix: number, iz: number): [number, number] => { const c = Math.cos(cam.yaw), s = Math.sin(cam.yaw); return [ix * c + iz * s, -ix * s + iz * c]; };
