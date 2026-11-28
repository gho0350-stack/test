#!/usr/bin/env node
// 가공: 텍스처 → webp(리사이즈), 모델 → 최적화·정규화된 .glb. 입력은 assets-lock.json 의 files.
import fs from 'node:fs'; import path from 'node:path';
import sharp from 'sharp';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, getBounds, textureCompress, flatten, join, weld, simplify, quantize } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import { ROOT, PUB, readJson, writeJson, sha256 } from './lib.mjs';

const manifest = readJson(path.join(ROOT, 'assets-manifest.json'), { assets: [] });
const lockFile = path.join(ROOT, 'assets-lock.json'); const lock = readJson(lockFile, {});
const procFile = path.join(ROOT, 'assets-processed.json'); const proc = readJson(procFile, {});
const TS = manifest.target?.texture_size ?? 1024; const MTS = manifest.target?.model_texture_size ?? 1024;
const log = (...a) => console.log('[process]', ...a);
const MAX_MODEL_BYTES = (manifest.target?.max_model_mb ?? 6) * 1024 * 1024; // 모바일 로딩·저장소 한도 보호

async function processTexture(id, files) {
  const outDir = path.join(PUB, 'textures', id); fs.mkdirSync(outDir, { recursive: true }); const out = {};
  for (const [k, f] of Object.entries(files)) {
    if (!['diff', 'nor', 'rough', 'ao'].includes(k)) continue;
    const file = path.join(outDir, `${k}.webp`);
    await sharp(f).resize(TS, TS, { fit: 'cover' }).webp({ quality: k === 'diff' ? 82 : 76 }).toFile(file);
    out[k] = `/assets/textures/${id}/${k}.webp`;
  }
  return { type: 'texture', maps: out, size: TS };
}

/** 모델: 중복 제거·정리·텍스처 webp 압축 → 바닥 중앙 정렬 + 목표 높이로 스케일 정규화 */
export async function processModel(id, gltfPath, targetHeight, outFile) {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const doc = await io.read(gltfPath);
  await doc.transform(dedup(), flatten(), prune(), textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [MTS, MTS], quality: 80 }));
  const sizeOf = async () => (await io.writeBinary(doc)).length;
  // 너무 큰 모델은 폴리곤을 단계적으로 줄인다(고폴리 스캔 모델 대응)
  if ((await sizeOf()) > MAX_MODEL_BYTES) {
    await MeshoptSimplifier.ready;
    for (const ratio of [0.5, 0.25, 0.12, 0.06]) { await doc.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.02 })); await doc.transform(quantize()); if ((await sizeOf()) <= MAX_MODEL_BYTES) break; }
    if ((await sizeOf()) > MAX_MODEL_BYTES) throw new Error(`단순화 후에도 ${(await sizeOf() / 1048576).toFixed(1)}MB (> ${MAX_MODEL_BYTES / 1048576}MB) — 제외`);
  }
  const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0];
  const b = getBounds(scene); const size = [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]];
  if (!(size[1] > 0)) throw new Error('모델 크기를 계산할 수 없음');
  const s = targetHeight / size[1]; const cx = (b.min[0] + b.max[0]) / 2, cz = (b.min[2] + b.max[2]) / 2;
  const root = doc.createNode('NormalizedRoot').setScale([s, s, s]).setTranslation([-cx * s, -b.min[1] * s, -cz * s]);
  for (const child of scene.listChildren()) { scene.removeChild(child); root.addChild(child); }
  scene.addChild(root);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  await io.write(outFile, doc);
  const buf = fs.readFileSync(outFile);
  const nb = getBounds(doc.getRoot().getDefaultScene() ?? scene);
  return { type: 'model', bytes: buf.length, sha256: sha256(buf), size_m: [nb.max[0] - nb.min[0], nb.max[1] - nb.min[1], nb.max[2] - nb.min[2]].map((x) => +x.toFixed(3)), triangles: doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives()).reduce((a, p) => a + (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3, 0) | 0 };
}

if (process.argv[1] && process.argv[1].endsWith('process.mjs')) {
  let ok = 0, fail = 0;
  for (const asset of manifest.assets) {
    const l = lock[asset.asset_id]; if (!l || l.download_status !== 'ok') continue;
    try {
      let r;
      if (asset.kind === 'texture') r = await processTexture(asset.asset_id, l.files);
      else { const out = path.join(PUB, 'models', `${asset.asset_id}.glb`); r = await processModel(asset.asset_id, l.files.gltf, asset.target_height ?? 1, out); r.path = `/assets/models/${asset.asset_id}.glb`; }
      proc[asset.asset_id] = { ...r, optimization_status: 'ok' }; ok++; log(`${asset.asset_id}: OK`);
    } catch (e) { proc[asset.asset_id] = { optimization_status: 'failed', error: String(e.message ?? e) }; fail++; log(`${asset.asset_id}: 실패 ${e.message}`); }
  }
  writeJson(procFile, proc); log(`완료: 성공 ${ok}, 실패 ${fail}`);
}
void join;
