# -*- coding: utf-8 -*-
"""진학 실적 자동 수집 공통 모듈: 사용량 기록, 네이버 검색, AI 추출(제공자 교체 가능), 후보 행 생성.
AI 제공자는 환경변수 AI_PROVIDER(gemini|anthropic|openai)와 해당 키로 고른다. 모델 이름은 *_MODEL 환경변수로 바꿀 수 있다(제공자가 모델을 바꿔도 코드 수정 불필요).
키는 코드·CSV 에 넣지 않고 GitHub Secrets 에서만 읽는다. 호출 한도는 *_MAX_CALLS 로 막는다. 실제 API 호출은 키가 있는 환경에서만 실행된다."""
import datetime, json, os, re, urllib.error, urllib.parse, urllib.request
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
USAGE = os.path.join(ROOT, "pipeline", "out", "api_usage.json")

class Usage:
    """일자·제공자별 호출 수와 토큰 사용량을 누적한다(비용 관리용)."""
    def __init__(self, path=USAGE): self.path = path; self.d = json.load(open(path, encoding="utf8")) if os.path.exists(path) else {}
    def add(self, provider, calls=1, tin=0, tout=0):
        day = self.d.setdefault(datetime.date.today().isoformat(), {}).setdefault(provider, {"calls": 0, "input_tokens": 0, "output_tokens": 0})
        day["calls"] += calls; day["input_tokens"] += tin; day["output_tokens"] += tout
    def today(self, provider): return self.d.get(datetime.date.today().isoformat(), {}).get(provider, {"calls": 0})["calls"]
    def save(self): json.dump(self.d, open(self.path, "w", encoding="utf8"), ensure_ascii=False, indent=1)

def _post(url, headers, body, timeout=90):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers=dict(headers, **{"Content-Type": "application/json"}))
    return json.load(urllib.request.urlopen(req, timeout=timeout))

# ---------- 네이버 검색 ----------
def naver_search(query, kind="webkr", display=10, usage=None):
    cid, sec = os.environ["NAVER_CLIENT_ID"], os.environ["NAVER_CLIENT_SECRET"]
    if usage and usage.today("naver") >= int(os.environ.get("NAVER_MAX_CALLS", "200")): raise RuntimeError("네이버 검색 일일 호출 한도(NAVER_MAX_CALLS) 도달")
    req = urllib.request.Request(f"https://openapi.naver.com/v1/search/{kind}.json?" + urllib.parse.urlencode({"query": query, "display": display}), headers={"X-Naver-Client-Id": cid, "X-Naver-Client-Secret": sec})
    d = json.load(urllib.request.urlopen(req, timeout=30))
    if usage: usage.add("naver")
    strip = lambda t: re.sub(r"<[^>]+>", "", t or "")
    return [{"title": strip(i.get("title")), "link": i.get("link"), "desc": strip(i.get("description"))} for i in d.get("items", [])]

def plan_queries(schools, years, have):
    """이미 확보한 (학교, 연도, 범주)는 건너뛰고 부족한 지표 위주로 검색어를 만든다. have: {(school_id, year): set(범주)}"""
    want = {"MED": "의대 합격", "SNU": "서울대 합격", "SKY": "SKY 합격", "INSEOUL": "인서울 합격"}; out = []
    for s in schools:
        for y in years:
            miss = [k for k in want if k not in have.get((s["id"], y), set())]
            if not miss: continue
            out.append({"school_id": s["id"], "year": y, "missing": miss, "queries": [f"{s['name']} {y}학년도 대입 실적", *[f"{s['name']} {y} {want[k]}" for k in miss], f"{s['name']} {y} 대학별 합격 현황 입학설명회"]})
    return out

# ---------- AI 추출 ----------
PROMPT = """다음 자료에서 '{school}'의 {year}학년도 대입 진학 실적을 JSON 배열로만 추출하세요. 자료에 숫자가 **명시된 항목만** 담고, 없는 값은 만들지 마세요(추측·계산 금지).
각 원소: {{"category": "MED|DENT|KMED|PHARM|VET|MED4|MEDGRP|MEDSCI_RAW|SNU|SNU_MED|YONSEI|KOREA|SKY|INSEOUL|GRAD", "count": 정수, "count_type": "합격건수|등록인원", "student_scope": "재학생만|재학생+졸업생|알수없음", "duplicate_included": "포함|제외|알수없음", "campus_scope": "서울캠퍼스 기준|전체 캠퍼스 포함|알수없음|해당없음", "evidence": "자료에서 그대로 옮긴 근거 문장(120자 이내)"}}
카테고리: MED 의대, DENT 치대, KMED 한의대, PHARM 약대, VET 수의대, MED4 의치한약 소계(수의 제외·미명시), MEDGRP 수의대 포함이 확인된 의치한약수 합계, MEDSCI_RAW 구성이 불명확한 '의약학 계열', SNU 서울대, SNU_MED 서울대 의대, YONSEI 연세대, KOREA 고려대, SKY 세 대학 합계, INSEOUL 서울 소재 대학 전체.
다른 학교 값이나 다른 학년도 값은 제외하세요. 자료에 해당 숫자가 없으면 빈 배열 []을 반환하세요."""

def ask_ai(prompt, text=None, image_bytes=None, image_mime="image/png", usage=None):
    prov = os.environ.get("AI_PROVIDER", "gemini")
    if usage and usage.today(prov) >= int(os.environ.get("AI_MAX_CALLS", "40")): raise RuntimeError("AI 일일 호출 한도(AI_MAX_CALLS) 도달")
    if prov == "gemini":
        model = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")      # 모델명은 제공자 문서로 확인해 환경변수로 지정
        parts = [{"text": prompt + ("\n\n[자료]\n" + text if text else "")}]
        if image_bytes: import base64; parts.append({"inline_data": {"mime_type": image_mime, "data": base64.b64encode(image_bytes).decode()}})
        d = _post(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent", {"x-goog-api-key": os.environ["GEMINI_API_KEY"]}, {"contents": [{"parts": parts}], "generationConfig": {"temperature": 0, "responseMimeType": "application/json"}})
        out = d["candidates"][0]["content"]["parts"][0]["text"]; u = d.get("usageMetadata", {}); tin, tout = u.get("promptTokenCount", 0), u.get("candidatesTokenCount", 0)
    elif prov == "anthropic":
        model = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5-5"); content = []
        if image_bytes: import base64; content.append({"type": "image", "source": {"type": "base64", "media_type": image_mime, "data": base64.b64encode(image_bytes).decode()}})
        content.append({"type": "text", "text": prompt + ("\n\n[자료]\n" + text if text else "")})
        d = _post("https://api.anthropic.com/v1/messages", {"x-api-key": os.environ["ANTHROPIC_API_KEY"], "anthropic-version": "2023-06-01"}, {"model": model, "max_tokens": 2000, "temperature": 0, "messages": [{"role": "user", "content": content}]})
        out = d["content"][0]["text"]; tin, tout = d.get("usage", {}).get("input_tokens", 0), d.get("usage", {}).get("output_tokens", 0)
    elif prov == "openai":
        model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini"); content = [{"type": "text", "text": prompt + ("\n\n[자료]\n" + text if text else "")}]
        if image_bytes: import base64; content.append({"type": "image_url", "image_url": {"url": f"data:{image_mime};base64," + base64.b64encode(image_bytes).decode()}})
        d = _post("https://api.openai.com/v1/chat/completions", {"Authorization": "Bearer " + os.environ["OPENAI_API_KEY"]}, {"model": model, "temperature": 0, "messages": [{"role": "user", "content": content}]})
        out = d["choices"][0]["message"]["content"]; tin, tout = d.get("usage", {}).get("prompt_tokens", 0), d.get("usage", {}).get("completion_tokens", 0)
    else: raise RuntimeError(f"알 수 없는 AI_PROVIDER: {prov}")
    if usage: usage.add(prov, 1, tin, tout)
    return out

CATS_OK = {"MED", "DENT", "KMED", "PHARM", "VET", "MED4", "MEDGRP", "MEDSCI_RAW", "SNU", "SNU_MED", "YONSEI", "KOREA", "SKY", "INSEOUL", "GRAD"}
def parse_rows(raw_json, source_text=None):
    """AI 응답 검증: 스키마가 맞고, 텍스트 자료라면 근거 문구가 원문에 실제로 있어야 한다(없으면 환각으로 보고 버림)."""
    m = re.search(r"\[.*\]", raw_json, flags=re.S)
    try: arr = json.loads(m.group(0)) if m else []
    except ValueError: return [], ["JSON 파싱 실패"]
    ok, bad = [], []
    norm = lambda t: re.sub(r"\s+", "", t or "")
    for x in arr:
        try:
            if x["category"] not in CATS_OK or not re.fullmatch(r"\d+", str(x["count"])): raise ValueError("category/count")
            if source_text is not None and norm(x.get("evidence", ""))[:40] not in norm(source_text): raise ValueError("근거 문구가 원문에 없음")
            ok.append(x)
        except Exception as e: bad.append(f"{x.get('category')} {x.get('count')}: {e}")
    return ok, bad

def to_raw_row(x, school, year, source_id, url, method, origin_id, today=None):
    today = today or datetime.date.today().isoformat(); rc = "불명확" if x.get("campus_scope") == "알수없음" and x["category"] in ("YONSEI", "KOREA", "SKY") or x["category"] in ("MEDSCI_RAW",) else "확인"
    return {"record_id": f"{school['id']}-{year}-{x['category']}-{abs(hash(url + x['evidence'])) % 10**6:06d}", "school_id": school["id"], "school_name": school["name"], "admission_year": year, "category": x["category"], "count": str(x["count"]),
            "count_type": x.get("count_type") or "합격건수", "phase": "전체", "student_scope": x.get("student_scope") or "알수없음", "duplicate_included": x.get("duplicate_included") or "알수없음", "source_id": source_id, "source_url": url, "publish_date": "",
            "collected_at": today, "evidence": x["evidence"], "status": "검토대기", "reviewer": "", "reviewed_at": "", "campus_scope": x.get("campus_scope") or "알수없음", "range_check": rc, "extract_method": method, "origin_id": origin_id,
            "range_note": "" if rc == "확인" else "자동 추출 단계에서 범위(캠퍼스·구성)를 확인하지 못함", "note": "AI 추출(자동)"}
