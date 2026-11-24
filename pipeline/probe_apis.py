"""API 응답 실제 필드 점검: 어떤 엔드포인트가 응답하는지, 어떤 필드가 오는지(해제여부·거래유형·계약구분 등)를 기록한다.
결과: out/api_samples.json  (키 값은 저장하지 않는다)"""
import json, os, urllib.parse
from datetime import date
import xml.etree.ElementTree as ET
import colab_molit as m

def d2(e): return {c.tag: (d2(c) if len(c) else (c.text or "").strip()) for c in e}

def probe(key, today=None):
    today = today or date.today(); ym = m.months_back(2, today)[1]; out = {"asOf": today.isoformat(), "dealYm": ym, "endpoints": {}}
    for kind in ("trade", "rent"):
        for ep in m.EP[kind]:
            rec = {}
            try:
                root = m.call(m.BASE + ep, {"serviceKey": key, "LAWD_CD": m.LAWD["강남구"], "DEAL_YMD": ym, "pageNo": 1, "numOfRows": 3})
                items = [d2(i) for i in root.findall(".//item")]
                rec = {"ok": True, "count_total": (root.findtext(".//totalCount") or ""), "fields": sorted({k for i in items for k in i}), "sample": items[:2]}
            except Exception as e: rec = {"ok": False, "error": str(e)[:300]}
            out["endpoints"][ep] = rec
    for name, url, q in (("kapt_list", m.KAPT_LIST, {"sigunguCode": m.LAWD["강남구"], "pageNo": 1, "numOfRows": 2}), ("kapt_info", m.KAPT_INFO, {"kaptCode": "A13583507"})):
        try:
            h, body = m.kcall(url, dict(q, serviceKey=key)); out["endpoints"][name] = {"ok": True, "sample": json.loads(json.dumps(body, ensure_ascii=False))}
        except Exception as e: out["endpoints"][name] = {"ok": False, "error": str(e)[:300]}
    return out

if __name__ == "__main__":
    key = os.environ.get("DATA_GO_KR_KEY")
    if not key: raise SystemExit("DATA_GO_KR_KEY 필요")
    json.dump(probe(urllib.parse.unquote(key)), open("out/api_samples.json", "w", encoding="utf8"), ensure_ascii=False, indent=1)
