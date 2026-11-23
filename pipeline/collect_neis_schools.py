import json, urllib.parse, urllib.request
names = {"hwimun":"휘문고등학교","sookmyung":"숙명여자고등학교","sehwa":"세화고등학교","banpo":"반포고등학교","jamsil":"잠실고등학교","boin":"보인고등학교","jinmyeong":"진명여자고등학교","yangjeong":"양정고등학교","seorabeol":"서라벌고등학교","cheongwon":"청원여자고등학교","baejae":"배재고등학교","hanyoung":"한영고등학교"}
out={}
for k,n in names.items():
    q=urllib.parse.urlencode({"Type":"json","pSize":10,"ATPT_OFCDC_SC_CODE":"B10","SCHUL_NM":n})
    d=json.load(urllib.request.urlopen("https://open.neis.go.kr/hub/schoolInfo?"+q,timeout=30))
    rows=d.get("schoolInfo",[{},{}])[1].get("row",[]) if "schoolInfo" in d else []
    out[k]=rows
    print(k,n,len(rows),[ (r["SCHUL_NM"],r["ORG_RDNMA"],r["FOND_SC_NM"],r["COEDU_SC_NM"],r.get("HS_SC_NM")) for r in rows])
json.dump(out,open("out/neis_schools.json","w"),ensure_ascii=False,indent=1)
