#!/usr/bin/env node
// 공급처 카탈로그 덤프(공식 API): 에셋 ID·이름·카테고리·태그를 assets-catalog/ 에 저장 → 사람이/Claude 가 정확한 에셋을 골라 manifest 에 ID 를 고정할 수 있게 한다.
import path from 'node:path';
import { ROOT, writeJson, http } from './lib.mjs';
const out = path.join(ROOT, 'assets-catalog');
for (const t of ['models', 'textures', 'hdris']) {
  try {
    const list = await http(`https://api.polyhaven.com/assets?t=${t}`, { json: true });
    const rows = Object.entries(list).map(([id, i]) => ({ id, name: i.name, categories: i.categories, tags: i.tags, downloads: i.download_count, max_resolution: i.max_resolution }));
    rows.sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0));
    writeJson(path.join(out, `polyhaven-${t}.json`), rows); console.log(`[catalog] polyhaven ${t}: ${rows.length}`);
  } catch (e) { console.log(`[catalog] polyhaven ${t} 실패: ${e.message}`); }
}
try {
  const rows = []; for (let off = 0; off < 600; off += 100) { const d = await http(`https://ambientcg.com/api/v2/full_json?type=Material&sort=Popular&limit=100&offset=${off}`, { json: true }); for (const a of d.foundAssets ?? []) rows.push({ id: a.assetId, name: a.displayName ?? a.assetId, tags: a.tags, category: a.displayCategory, downloads: a.downloadCount }); if ((d.foundAssets ?? []).length < 100) break; }
  writeJson(path.join(out, 'ambientcg-materials.json'), rows); console.log(`[catalog] ambientcg: ${rows.length}`);
} catch (e) { console.log(`[catalog] ambientcg 실패: ${e.message}`); }
