"""실거래 정규화 규칙 (가이드 '가장 주의할 데이터 3가지' 중 59㎡ 계산)."""
from datetime import date, timedelta
from statistics import median

# 서비스 기준 면적대 (전용면적, ㎡). 화면에 '서비스 기준'이라고 명시할 것.
AREA_BUCKETS = {59: (55.0, 60.0), 84: (80.0, 85.0), 101: (95.0, 105.0)}

def bucket(area):
    for k, (lo, hi) in AREA_BUCKETS.items():
        if lo <= area <= hi: return k
    return None

def is_jeonse(deposit_manwon, monthly_manwon):
    """월세 0 이면 전세. 보증금 있는 월세를 전세로 오분류하지 않는다."""
    return (monthly_manwon or 0) == 0 and (deposit_manwon or 0) > 0

def to_manwon(text):
    return int(str(text).replace(",", "").strip() or 0)

def eok(manwon): return round(manwon / 10000, 2)

def stats(rows, area_key, today, months=12, value="amount"):
    """rows: [{'date':'YYYY-MM-DD','area':float,'amount' or 'deposit':int(만원)}] -> 최근 N개월 범위 통계.
    최저~최고와 함께 거래 건수, 최근 거래일을 반환 (건수가 적으면 UI에서 경고)."""
    start = today - timedelta(days=round(months * 30.4))
    sel = [r for r in rows if bucket(r["area"]) == area_key and start <= date.fromisoformat(r["date"]) <= today]
    if not sel: return None
    v = [r[value] for r in sel]
    return {"min": eok(min(v)), "max": eok(max(v)), "median": eok(median(v)), "count": len(v), "last": max(r["date"] for r in sel)}

def norm_name(name):
    """K-apt 단지명과 실거래 단지명 매칭용 정규화."""
    import re
    n = re.sub(r"\(.*?\)", "", name or "")
    n = re.sub(r"[\s·\-]", "", n)
    n = re.sub(r"(아파트|단지)$", "", n)
    return n
