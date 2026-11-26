# -*- coding: utf-8 -*-
"""학교 공식 홈페이지에서 진학 실적 후보 수집(허용 정책 auto_policy=예 인 출처만).
순서: robots.txt 확인 -> 홈페이지에서 '진학/입시/대입/합격/실적/입학설명회' 링크 탐색(같은 사이트, 최대 2단계) -> HTML/PDF 본문 가져오기
      -> 학년도와 대학 이름이 나오는 페이지만 AI 추출 -> 근거 문구가 원문에 있는 값만 검토대기 행으로.
예의: 식별 가능한 User-Agent, 요청 간격 1초 이상, robots.txt 가 막으면 건너뜀, 페이지 수 상한. 이미지(포스터·표 이미지)는 이번 단계에서 처리하지 않는다."""
import html, io, re, time, urllib.parse, urllib.request, urllib.robotparser
UA = "Mozilla/5.0 (compatible; eodisalji-school-map-bot; +https://gho0350-stack.github.io/test/)"
KEY = re.compile(r"진학|입시|대입|합격|실적|입학설명회|입학안내|학교소개|학교생활|자료실|공지|입결")
NEED = re.compile(r"서울대|의대|의약학|SKY|연세대|고려대")
YEAR = re.compile(r"20(2[3-7])\s*학년도")

def norm_url(u):
    if not u: return ""
    u = u.strip()
    if not re.match(r"https?://", u): u = "http://" + u
    return u

def robots_ok(url, cache={}):
    p = urllib.parse.urlparse(url); base = f"{p.scheme}://{p.netloc}"
    if base not in cache:
        rp = urllib.robotparser.RobotFileParser(); rp.set_url(base + "/robots.txt")
        try: rp.read()
        except Exception: rp = None          # robots.txt 를 못 읽으면(없음 포함) 허용으로 본다
        cache[base] = rp
    rp = cache[base]; return True if rp is None else rp.can_fetch(UA, url)

def get(url, timeout=25, maxbytes=6_000_000):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    r = urllib.request.urlopen(req, timeout=timeout); ct = r.headers.get("Content-Type", ""); data = r.read(maxbytes)
    return ct, data

def html_text(b):
    for enc in ("utf8", "euc-kr", "cp949"):
        try: t = b.decode(enc); break
        except UnicodeDecodeError: t = b.decode("utf8", "ignore")
    t = re.sub(r"<script.*?</script>|<style.*?</style>", "", t, flags=re.S)
    return t, re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", t))).strip()

def pdf_text(b):
    try:
        import fitz   # pymupdf
        doc = fitz.open(stream=b, filetype="pdf"); return " ".join(p.get_text() for p in doc)[:60000]
    except Exception: return ""

def links(raw_html, base):
    out = []
    for m in re.finditer(r'<a[^>]+href=["\']([^"\'#]+)["\'][^>]*>(.*?)</a>', raw_html, flags=re.S | re.I):
        href, label = m.group(1), re.sub(r"<[^>]+>", " ", m.group(2)); u = urllib.parse.urljoin(base, html.unescape(href))
        if KEY.search(label + " " + href): out.append((u, re.sub(r"\s+", " ", html.unescape(label)).strip()[:60]))
    return out

def same_site(u, base):
    a, b = urllib.parse.urlparse(u).netloc.lower().replace("www.", ""), urllib.parse.urlparse(base).netloc.lower().replace("www.", "")
    return a == b or a.endswith("." + b)

def discover(home, fetch=get, max_pages=12, delay=1.0, log=print):
    """홈페이지에서 시작해 진학 관련 후보 페이지의 (url, 본문 텍스트)를 모은다."""
    home = norm_url(home); seen, out, queue = set(), [], [(home, 0)]
    while queue and len(out) < max_pages:
        url, depth = queue.pop(0)
        if url in seen or not robots_ok(url): continue
        seen.add(url)
        try: ct, data = fetch(url)
        except Exception as e: log("  가져오기 실패:", url[:80], type(e).__name__); continue
        time.sleep(delay)
        if "pdf" in ct.lower() or url.lower().endswith(".pdf"):
            t = pdf_text(data)
            if t and NEED.search(t) and YEAR.search(t): out.append((url, t))
            continue
        raw, text = html_text(data)
        if NEED.search(text) and YEAR.search(text) and len(text) > 200: out.append((url, text))
        if depth < 2:
            for u, label in links(raw, url):
                if same_site(u, home) and u not in seen and not re.search(r"\.(jpg|jpeg|png|gif|zip|hwp|hwpx|xlsx?|pptx?)$", u, re.I): queue.append((u, depth + 1))
    return out
