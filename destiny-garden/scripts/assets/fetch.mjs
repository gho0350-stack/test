#!/usr/bin/env node
// 에셋 자동 수집: assets-manifest.json → Poly Haven / ambientCG 공식 API 검색·다운로드 → .cache/assets/raw/<asset_id>/ + assets-lock.json
// 사용: node scripts/assets/fetch.mjs [asset_id ...]   (이미 받은 파일은 체크섬으로 건너뜀)
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
import { ROOT, CACHE, readJson, writeJson, http, md5, sha256, score, sleep } from './lib.mjs';

const manifest = readJson(path.join(ROOT, 'assets-manifest.json'), { assets: [] });
const lockFile = path.join(ROOT, 'assets-lock.json'); const lock = readJson(lockFile, {});
const only = process.argv.slice(2);
const PH = 'https://api.polyhaven.com';
const TEX_MAPS = { diff: ['Diffuse', 'diff', 'Color'], nor: ['nor_gl', 'Normal', 'nor_dx'], rough: ['Rough', 'Roughness'], ao: ['AO', 'ao'], arm: ['arm'] };
const log = (...a) => console.log('[fetch]', ...a);

async function save(buf, file) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, buf); return { file, sha256: sha256(buf), bytes: buf.length }; }

async function polyhaven(asset, src, dir) {
  const type = asset.kind === 'texture' ? 'textures' : 'models';
  const cats = src.categories?.length ? src.categories : [''];
  const pool = new Map();
  if (!src.id) for (const c of cats) { try { const list = await http(`${PH}/assets?t=${type}${c ? `&c=${encodeURIComponent(c)}` : ''}`, { json: true }); for (const [id, info] of Object.entries(list)) pool.set(id, info); } catch (e) { log(`  목록 실패(${c}): ${e.message}`); } }
  const ranked = src.id ? [{ id: src.id, info: { name: src.id }, s: 99 }] : [...pool.entries()].map(([id, info]) => ({ id, info, s: score(id, info, src.keywords, src.avoid) })).filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || (b.info.download_count ?? 0) - (a.info.download_count ?? 0)).slice(0, 4);
  log(`  후보: ${ranked.map((r) => r.id).join(', ')}`);
  if (!ranked.length) throw new Error(`Poly Haven 에서 조건에 맞는 ${type} 없음 (${(src.keywords || []).join(',')})`);
  let lastErr;
  for (const cand of ranked) {
    try {
      const files = await http(`${PH}/files/${cand.id}`, { json: true });
      const res = process.env.TEX_RES || '1k'; const out = {};
      if (asset.kind === 'texture') {
        for (const [key, names] of Object.entries(TEX_MAPS)) {
          const name = names.find((n) => files[n]); if (!name) continue;
          const entry = files[name][res] ?? files[name]['2k'] ?? Object.values(files[name])[0]; const f = entry?.jpg ?? entry?.png; if (!f?.url) continue;
          const buf = await http(f.url); if (f.md5 && md5(buf) !== f.md5) throw new Error(`md5 불일치 ${key}`);
          out[key] = (await save(buf, path.join(dir, `${key}${path.extname(new URL(f.url).pathname) || '.jpg'}`))).file;
        }
        if (!out.diff) throw new Error('Diffuse 맵 없음');
      } else {
        const g = files.gltf?.[res]?.gltf ?? files.gltf?.['1k']?.gltf ?? Object.values(files.gltf ?? {})[0]?.gltf; if (!g?.url) throw new Error('gltf 파일 정보 없음');
        const main = await http(g.url); if (g.md5 && md5(main) !== g.md5) throw new Error('md5 불일치 gltf');
        out.gltf = (await save(main, path.join(dir, path.basename(new URL(g.url).pathname)))).file;
        for (const [rel, f] of Object.entries(g.include ?? {})) { const buf = await http(f.url); if (f.md5 && md5(buf) !== f.md5) throw new Error(`md5 불일치 ${rel}`); await save(buf, path.join(dir, rel)); }
      }
      return { source: 'polyhaven', source_url: `https://polyhaven.com/a/${cand.id}`, download_url: `${PH}/files/${cand.id}`, license: 'CC0', attribution: `${cand.info.name ?? cand.id} — Poly Haven (CC0)`, external_id: cand.id, files: out };
    } catch (e) { lastErr = e; log(`  후보 ${cand.id} 실패: ${e.message}`); }
  }
  throw lastErr;
}

async function ambientcg(asset, src, dir) {
  if (asset.kind !== 'texture') throw new Error('ambientCG 는 텍스처만 지원');
  const data = await http(src.id ? `https://ambientcg.com/api/v2/full_json?id=${encodeURIComponent(src.id)}&include=downloadData` : `https://ambientcg.com/api/v2/full_json?type=Material&q=${encodeURIComponent(src.query)}&sort=Popular&limit=3&include=downloadData`, { json: true });
  for (const a of data.foundAssets ?? []) {
    try {
      const dl = Object.values(a.downloadFolders ?? {}).flatMap((f) => Object.values(f.downloadFiletypeCategories ?? {})).flatMap((c) => c.downloads ?? []).find((d) => /^1K-JPG$/i.test(d.attribute));
      if (!dl?.fullDownloadPath) continue;
      const zip = await save(await http(dl.fullDownloadPath), path.join(dir, 'pack.zip'));
      execFileSync('unzip', ['-o', '-q', zip.file, '-d', path.join(dir, 'unz')]);
      const all = fs.readdirSync(path.join(dir, 'unz')); const pick = (re) => all.find((f) => re.test(f)); const out = {};
      const m = { diff: pick(/_Color\.(jpg|png)$/i), nor: pick(/_NormalGL\.(jpg|png)$/i), rough: pick(/_Roughness\.(jpg|png)$/i), ao: pick(/_AmbientOcclusion\.(jpg|png)$/i) };
      for (const [k, v] of Object.entries(m)) if (v) out[k] = path.join(dir, 'unz', v);
      if (!out.diff) continue;
      return { source: 'ambientcg', source_url: `https://ambientcg.com/view?id=${a.assetId}`, download_url: dl.fullDownloadPath, license: 'CC0', attribution: `${a.assetId} — ambientCG (CC0)`, external_id: a.assetId, files: out };
    } catch (e) { log(`  ambientCG ${a.assetId} 실패: ${e.message}`); }
  }
  throw new Error('ambientCG 에서 사용할 수 있는 에셋 없음');
}

const adapters = { polyhaven, ambientcg };
let ok = 0, fail = 0;
for (const asset of manifest.assets) {
  if (only.length && !only.includes(asset.asset_id)) continue;
  const dir = path.join(CACHE, 'raw', asset.asset_id);
  const prev = lock[asset.asset_id];
  if (prev?.download_status === 'ok' && prev.files && Object.values(prev.files).every((f) => fs.existsSync(f))) { log(`${asset.asset_id}: 캐시 사용`); ok++; continue; }
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  log(`${asset.asset_id} 수집 시작`);
  let result = null; const errors = [];
  for (const src of asset.sources) {
    try { result = await adapters[src.type](asset, src, dir); break; } catch (e) { errors.push(`${src.type}: ${e.message}`); log(`  ${src.type} 실패 → 다음 공급처 (${e.message})`); }
  }
  if (result && !(manifest.allowed_licenses ?? ['CC0']).includes(result.license)) { errors.push(`허용되지 않는 라이선스 ${result.license}`); result = null; }
  lock[asset.asset_id] = result ? { ...result, download_status: 'ok', fetched_at: new Date().toISOString() } : { download_status: 'failed', errors, fallback_asset: asset.fallback_asset, alt_sources: '다른 공급처 추가 필요(Kenney/Quaternius/Poly Pizza 는 공식 API 미확인)' };
  result ? ok++ : fail++;
  await sleep(300);
}
writeJson(lockFile, lock);
log(`완료: 성공 ${ok}, 실패 ${fail}`);
