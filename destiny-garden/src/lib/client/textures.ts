'use client';
import * as THREE from 'three';

/** 코드로 그리는 절차적 텍스처(저작권 이슈 없음). 캔버스 → CanvasTexture, 한 번만 생성해 캐시 */
const cache = new Map<string, THREE.CanvasTexture>();
function make(key: string, size: number, draw: (g: CanvasRenderingContext2D, s: number) => void, repeat?: [number, number]) {
  const k = key + (repeat ?? ''); const hit = cache.get(k); if (hit) return hit;
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d')!; draw(g, size);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; t.colorSpace = THREE.SRGBColorSpace; if (repeat) t.repeat.set(repeat[0], repeat[1]);
  cache.set(k, t); return t;
}
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const shade = (hex: string, f: number) => { const n = parseInt(hex.slice(1), 16); const r = Math.max(0, Math.min(255, ((n >> 16) & 255) * f)), g = Math.max(0, Math.min(255, ((n >> 8) & 255) * f)), b = Math.max(0, Math.min(255, (n & 255) * f)); return `rgb(${r | 0},${g | 0},${b | 0})`; };

/** 마루판: 판자·나뭇결·옹이 */
export const woodTex = (base: string, repeat: [number, number]) => make('wood' + base, 512, (g, s) => {
  const planks = 6, w = s / planks;
  for (let i = 0; i < planks; i++) {
    g.fillStyle = shade(base, 0.85 + rnd() * 0.3); g.fillRect(i * w, 0, w, s);
    for (let l = 0; l < 26; l++) { g.strokeStyle = `rgba(0,0,0,${0.04 + rnd() * 0.08})`; g.lineWidth = 1 + rnd() * 1.5; g.beginPath(); const x = i * w + rnd() * w; g.moveTo(x, 0); g.bezierCurveTo(x + rnd() * 8 - 4, s * 0.3, x + rnd() * 8 - 4, s * 0.6, x + rnd() * 6 - 3, s); g.stroke(); }
    if (rnd() > 0.5) { const kx = i * w + w * (0.3 + rnd() * 0.4), ky = rnd() * s; g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2; g.beginPath(); g.ellipse(kx, ky, 5, 9, 0, 0, 7); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(i * w, 0, 2, s); g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(i * w + 2, 0, 1, s);
    const cut = rnd() * s; g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(i * w, cut, w, 2);
  }
}, repeat);

/** 돌판: 불규칙한 판석 + 이끼 */
export const stoneTex = (base: string, repeat: [number, number]) => make('stone' + base, 512, (g, s) => {
  g.fillStyle = shade(base, 0.7); g.fillRect(0, 0, s, s);
  const n = 4, w = s / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    g.fillStyle = shade(base, 0.85 + rnd() * 0.3); g.fillRect(x * w + 4, y * w + 4, w - 8, w - 8);
    for (let i = 0; i < 180; i++) { g.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '0,0,0'},${rnd() * 0.07})`; g.fillRect(x * w + 4 + rnd() * (w - 8), y * w + 4 + rnd() * (w - 8), 2 + rnd() * 4, 2 + rnd() * 4); }
    if (rnd() > 0.7) { g.strokeStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.moveTo(x * w + rnd() * w, y * w + 6); g.lineTo(x * w + rnd() * w, y * w + w - 6); g.stroke(); }
  }
}, repeat);

/** 벽(회벽): 미세한 얼룩 */
export const plasterTex = (base: string, repeat: [number, number]) => make('plaster' + base, 256, (g, s) => {
  g.fillStyle = base; g.fillRect(0, 0, s, s);
  for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '0,0,0'},${rnd() * 0.05})`; const r = 1 + rnd() * 5; g.beginPath(); g.arc(rnd() * s, rnd() * s, r, 0, 7); g.fill(); }
}, repeat);

/** 전통 문양 러그 */
export const rugTex = (base: string, accent: string) => make('rug' + base + accent, 512, (g, s) => {
  g.fillStyle = shade(base, 0.8); g.fillRect(0, 0, s, s);
  g.strokeStyle = accent; g.lineWidth = 10; g.strokeRect(24, 24, s - 48, s - 48); g.lineWidth = 3; g.strokeRect(46, 46, s - 92, s - 92);
  g.fillStyle = shade(base, 1.05); g.fillRect(60, 60, s - 120, s - 120);
  g.strokeStyle = accent; g.lineWidth = 3;
  for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(s / 2, s / 2, 40 + i * 42, 0, 7); g.stroke(); }
  for (let a = 0; a < 8; a++) { g.save(); g.translate(s / 2, s / 2); g.rotate((a * Math.PI) / 4); g.fillStyle = accent; g.beginPath(); g.ellipse(0, -118, 10, 28, 0, 0, 7); g.fill(); g.restore(); }
  for (let i = 0; i < 2200; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.05})`; g.fillRect(rnd() * s, rnd() * s, 2, 2); }
});

/** 기와 지붕 */
export const roofTex = (base: string, repeat: [number, number]) => make('roof' + base, 256, (g, s) => {
  g.fillStyle = shade(base, 0.7); g.fillRect(0, 0, s, s);
  const n = 8, w = s / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { g.fillStyle = shade(base, 0.8 + rnd() * 0.35); g.beginPath(); g.moveTo(x * w + 2, y * w); g.lineTo(x * w + w - 2, y * w); g.lineTo(x * w + w / 2, y * w + w); g.closePath(); g.fill(); }
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,255,255,${rnd() * 0.04})`; g.fillRect(rnd() * s, rnd() * s, 2, 2); }
}, repeat);

/** 잔디/이끼 땅 */
export const groundTex = (base: string, repeat: [number, number]) => make('ground' + base, 512, (g, s) => {
  g.fillStyle = base; g.fillRect(0, 0, s, s);
  for (let i = 0; i < 5000; i++) { const f = 0.7 + rnd() * 0.6; g.fillStyle = shade(base, f); g.globalAlpha = 0.5; g.fillRect(rnd() * s, rnd() * s, 2 + rnd() * 6, 2 + rnd() * 3); }
  g.globalAlpha = 1;
}, repeat);

/** 별이 있는 어두운 패널 */
export const starTex = () => make('star', 256, (g, s) => {
  const gr = g.createLinearGradient(0, 0, 0, s); gr.addColorStop(0, '#0e0a2a'); gr.addColorStop(1, '#2a1f6a'); g.fillStyle = gr; g.fillRect(0, 0, s, s);
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,246,200,${0.3 + rnd() * 0.7})`; g.beginPath(); g.arc(rnd() * s, rnd() * s, 0.6 + rnd() * 1.6, 0, 7); g.fill(); }
});
