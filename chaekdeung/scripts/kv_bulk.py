#!/usr/bin/env python3
"""public/ 안의 모든 파일을 `wrangler kv bulk put` 이 읽는 JSON으로 만듭니다.

사용: python3 scripts/kv_bulk.py 출력파일.json
그다음: npx wrangler kv bulk put 출력파일.json --namespace-id=<KV id> --remote
(로컬 시험은 --remote 대신 --local)
"""
import base64
import json
import os
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public")
out = sys.argv[1] if len(sys.argv) > 1 else "kv-bulk.json"
items = []
for folder, _, files in os.walk(ROOT):
    for name in sorted(files):
        path = os.path.join(folder, name)
        key = os.path.relpath(path, ROOT).replace(os.sep, "/")
        with open(path, "rb") as f:
            items.append({"key": key, "value": base64.b64encode(f.read()).decode("ascii"), "base64": True})
with open(out, "w") as f:
    json.dump(items, f)
print(f"{len(items)} files -> {out}")
for it in items:
    print("  ", it["key"])
