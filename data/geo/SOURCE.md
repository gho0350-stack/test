# 행정경계 데이터 출처

- 파일: `sido.geojson`(시/도 17개), `sigungu.geojson`(시/군/구 251개)
- 원본: [southkorea/southkorea-maps](https://github.com/southkorea/southkorea-maps) 저장소의
  `kostat/2012/json/provinces-topo-simple.json`, `kostat/2012/json/municipalities-topo-simple.json`
  (통계청 KOSTAT 2012년 센서스용 행정구역경계 기반, TopoJSON → GeoJSON으로 변환만 수행, 좌표 자체는 원본 그대로)
- 라이선스: 저장소 README 기준 **KOSTAT 데이터는 "Free to share or remix"** — 상업적 이용 가능.
  (같은 저장소의 GADM 소스 데이터는 "비상업적 용도만 허용, 재배포 금지"라 이번 프로젝트에서는 사용하지 않음.)

## ⚠️ 알려진 한계 (실 서비스 전 재검증 필요)

1. **2012년 기준 경계**입니다. 이후 있었던 행정구역 변경(예: 세종특별자치시 관련 조정, 일부 시군구
   통합·개편)이 반영되지 않았을 수 있습니다.
2. **광역자치단체 명칭이 최신이 아닙니다.** 2023~2024년에 강원도→강원특별자치도,
   전라북도→전북특별자치도로 명칭이 바뀌었는데 이 파일의 `name` 값은 옛 명칭입니다.
   → 화면 표시용 명칭은 별도 매핑 테이블로 최신화 필요.
3. 시/군/구 코드(`code` 필드, 5자리)는 국토교통부 실거래가 API가 쓰는
   법정동코드 앞 5자리와 형식은 같지만, **연도에 따라 통폐합된 코드가 있을 수 있어 그대로
   실거래가 API에 사용하기 전 [행정표준코드관리시스템](https://www.code.go.kr/)과 대조 필요**.
4. 위례처럼 여러 시/군/구에 걸친 비공식 생활권(학군지) 경계는 이 파일에 없습니다.
   `data/regions.js`에서 별도로 관리합니다(현재는 근사 좌표의 마커일 뿐, 실제 폴리곤 아님).

재검증 시 참고할 공식 출처: [국가공간정보포털](https://www.nsdi.go.kr/),
[통계청 SGIS](https://sgis.kostat.go.kr/).
