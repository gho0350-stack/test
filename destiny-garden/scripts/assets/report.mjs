#!/usr/bin/env node
// 레지스트리(public/assets/registry.json), 출처 문서(ATTRIBUTIONS.md), 상태 리포트(assets-report.json) 생성
import path from 'node:path';
import { ROOT, PUB, readJson, writeJson } from './lib.mjs';
import fs from 'node:fs';
const manifest = readJson(path.join(ROOT, 'assets-manifest.json'), { assets: [] });
const lock = readJson(path.join(ROOT, 'assets-lock.json'), {}); const proc = readJson(path.join(ROOT, 'assets-processed.json'), {});
const registry = { generated_at: new Date().toISOString(), textures: {}, models: {} }; const report = []; const attrib = [];
for (const a of manifest.assets) {
  const l = lock[a.asset_id] ?? { download_status: 'pending' }; const p = proc[a.asset_id] ?? { optimization_status: 'pending' };
  const ready = l.download_status === 'ok' && p.optimization_status === 'ok';
  report.push({ asset_id: a.asset_id, kind: a.kind, required_room: a.required_room, source: l.source ?? null, source_url: l.source_url ?? null, license: l.license ?? null, download_status: l.download_status, optimization_status: p.optimization_status, ready, fallback_asset: a.fallback_asset, errors: l.errors ?? (p.error ? [p.error] : []) });
  if (!ready) continue;
  if (a.kind === 'texture') registry.textures[a.asset_id] = p.maps; else registry.models[a.asset_id] = { path: p.path, size_m: p.size_m, triangles: p.triangles, bytes: p.bytes };
  attrib.push(`- **${a.asset_id}** — ${l.attribution} · ${l.license} · ${l.source_url}`);
}
fs.mkdirSync(PUB, { recursive: true });
writeJson(path.join(PUB, 'registry.json'), registry); writeJson(path.join(ROOT, 'assets-report.json'), { generated_at: registry.generated_at, ready: report.filter((r) => r.ready).length, total: report.length, assets: report });
fs.writeFileSync(path.join(ROOT, 'ATTRIBUTIONS.md'), `# 에셋 출처 및 라이선스\n\n자동 수집 파이프라인(\`scripts/assets\`)이 생성한 문서입니다. 사용 에셋은 CC0 계열만 허용합니다.\n\n${attrib.join('\n') || '_(아직 수집된 에셋이 없습니다)_'}\n`);
console.log(`[report] 준비 완료 ${report.filter((r) => r.ready).length}/${report.length}`);
