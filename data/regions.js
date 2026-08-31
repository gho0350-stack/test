/**
 * 전국 지도에서 "학군지도 상세 화면이 있는 커스텀 영역" 레지스트리.
 *
 * 위례처럼 공식 행정구역과 무관하게 여러 시/군/구에 걸친 생활권을 다룰 때 씁니다.
 * marker 좌표는 지금은 근사치(placeholder)입니다 — 실제 폴리곤 경계가 아니라
 * "이 부근을 클릭하면 상세 화면으로 이동" 정도의 안내용 점입니다.
 * (정확한 생활권 경계를 그리려면 국가공간정보포털 등에서 폴리곤을 새로 그려야 합니다.)
 */

const CUSTOM_DISTRICTS = [
  {
    id: "wirye",
    name: "위례신도시",
    sidoCodes: ["11", "31"], // 서울특별시, 경기도
    sigunguCodes: ["11240", "31021", "31180"], // 송파구, 성남시 수정구, 하남시
    marker: {
      lat: 37.474,
      lon: 127.144,
      approx: true,
      note: "송파구·성남시 수정구·하남시 경계가 만나는 지점의 근사 좌표. 정확한 위례 생활권 폴리곤 아님(확인 필요)."
    },
    detailView: "wirye" // js/app.js가 그리는 상세 화면(WIRYE_ZONES) 식별자
  }
  // 다른 지역(예: 광교, 판교, 세종 등)도 같은 형태로 추가 가능.
  // 상세 데이터(zones)는 별도 data/<id>-data.js 파일로 분리하고 detailView로 연결할 것.
];

if (typeof module !== "undefined") {
  module.exports = { CUSTOM_DISTRICTS };
}
