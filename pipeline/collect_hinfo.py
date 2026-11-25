# -*- coding: utf-8 -*-
"""서울시교육청 고교홍보사이트 하이인포(hinfo.sen.go.kr) 학교목록(교육감배정교/학교장선발교, 학교유형, 학군)을 수집해 out/hinfo_schools.json 에 저장.
공개 목록 페이지를 사람이 보는 것과 같은 방식(검색 폼 POST, 페이지 이동)으로 읽으며, 요청 사이 간격을 둔다."""
import html, json, re, time, urllib.parse, urllib.request
URL = "https://hinfo.sen.go.kr/school/schoolList.do"

def fetch(page, retry=3):
    data = urllib.parse.urlencode({"subMenuNo": "02", "menuNo": "", "schoolGbn": "", "neiscode": "", "introYn": "", "searchDetail": "", "pageIndex": page, "searchSunbal": "", "searchHakgoon": "", "searchGonghak": "", "searchSulrip": "", "searchSchool": "", "searchSojiyeok": "", "searchReligion": "", "searchHighname": ""}).encode()
    for t in range(retry):
        try:
            req = urllib.request.Request(URL + "?subMenuNo=02", data=data, headers={"User-Agent": "Mozilla/5.0 (compatible; school-map-pipeline)", "Referer": URL})
            return urllib.request.urlopen(req, timeout=40).read().decode("utf8", "ignore")
        except Exception as e: last = e; time.sleep(2 + t)
    raise RuntimeError(f"하이인포 요청 실패: {last}")

def parse(t):
    rows = []
    for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", t, flags=re.S):
        cells = [re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", c))).strip() for c in re.findall(r"<td[^>]*>(.*?)</td>", tr, flags=re.S)]
        if len(cells) >= 7:
            name = cells[0].replace("상세보기", "").strip()
            if not name.endswith("학교"): continue
            rows.append({"name": name, "zone": cells[1], "gu": cells[2], "found": cells[3], "gender": cells[4], "type": cells[5], "religion": cells[6]})
    return rows

def run(log=print):
    t = fetch(1); m = re.search(r"학교 수\s*:\s*(\d+)", re.sub(r"<[^>]+>", " ", t)); total = int(m.group(1)) if m else 0
    out = parse(t); page = 1
    while len(out) < total and page < 60:
        page += 1; time.sleep(0.4); rows = parse(fetch(page))
        if not rows: break
        out += rows
    seen = {}; [seen.setdefault(r["name"], r) for r in out]
    log(f"하이인포 학교 {len(seen)}/{total}곳")
    return {"total": total, "schools": list(seen.values())}
