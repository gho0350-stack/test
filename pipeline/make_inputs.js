// data.js / real-data.js 에서 수집 입력(샘플 단지 목록, 학교 주소)을 만든다. 사용: node pipeline/make_inputs.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..', 'schoolmap'), out = path.join(__dirname, 'out');
const w = {}; vm.runInNewContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8') + ';', { window: w });
const reg = Object.fromEntries(w.SG.REGIONS.map((r) => [r.id, r.gu]));
const apts = [], sample = [];
w.SG.SCHOOLS.forEach((s) => s.apts.forEach((a, i) => { apts.push({ id: s.id + '-' + i, gu: reg[s.region], name: a[0], school: s.id }); sample.push({ id: s.id + '-' + i, gu: reg[s.region], name: a[0] }); }));
const rw = {}; vm.runInNewContext(fs.readFileSync(path.join(root, 'real-data.js'), 'utf8'), { window: rw });
const schools = Object.fromEntries(Object.entries(rw.SG_REAL.schools).map(([k, v]) => [k, { name: v.officialName, addr: v.addr }]));
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'sample_apts.json'), JSON.stringify(sample)); fs.writeFileSync(path.join(out, 'apts_for_kakao.json'), JSON.stringify(apts)); fs.writeFileSync(path.join(out, 'school_addrs.json'), JSON.stringify(schools));
console.log('inputs:', sample.length, 'apts', Object.keys(schools).length, 'schools');
