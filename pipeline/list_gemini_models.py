# -*- coding: utf-8 -*-
"""내 Gemini 키로 실제 쓸 수 있는 모델 이름 목록을 출력한다(키는 출력하지 않는다). 사용: GEMINI_API_KEY=... python3 pipeline/list_gemini_models.py"""
import json, os, urllib.request
req = urllib.request.Request("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", headers={"x-goog-api-key": os.environ["GEMINI_API_KEY"]})
d = json.load(urllib.request.urlopen(req, timeout=30))
rows = [m for m in d.get("models", []) if "generateContent" in m.get("supportedGenerationMethods", [])]
print(f"generateContent 가능한 모델 {len(rows)}개 (이름 / 입력토큰 한도 / 설명)")
for m in sorted(rows, key=lambda m: m["name"]): print(f"- {m['name'].replace('models/', '')} / {m.get('inputTokenLimit')} / {(m.get('displayName') or '')}")
