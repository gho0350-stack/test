/**
 * 위례 학군지도 - 영역별 데이터 초안 (v0.1)
 *
 * 각 값은 { value, source, verified } 형태를 기본으로 합니다.
 *   - verified: true  -> 웹 검색으로 1차 출처를 확인한 값
 *   - verified: false -> 아직 못 채운 항목. value는 null, source는 "확인 필요"로 둠
 *
 * 실제 서비스 반영 전 반드시 [확인 필요] 항목을 1차 출처로 검증할 것.
 * (README.md 7장 "아직 채우지 못한 것" 목록 참고)
 */

const WIRYE_ZONES = [
  {
    id: "nam-songpa",
    name: "남위례 · 송파권역",
    region: "서울 송파구 거여동·장지동 일대",
    status: { value: "2017년경 입주 완료", verified: true,
      source: "https://ko.wikipedia.org/wiki/%EC%9C%84%EB%A1%80%EC%8B%A0%EB%8F%84%EC%8B%9C" },
    elementarySchools: { value: null, verified: false, source: "확인 필요 - 학교알리미(schoolinfo.go.kr) 법정동별 조회 필요" },
    middleSchools:     { value: null, verified: false, source: "확인 필요 - 학교알리미" },
    highSchools:       { value: null, verified: false, source: "확인 필요 - 학교알리미, 자사고/특목고 지정 여부는 시도교육청 고시 대조 필요" },
    skyMedicalAdmits:  { value: null, verified: false, source: "확인 필요 - 원칙적으로 학교 자체 공개자료만 사용 (README 3-2 참고, 공식 공시 항목 아님)" },
    flagshipApartment: { value: null, verified: false, source: "확인 필요 - 산출 기준(평당가/기준월) 확정 후 국토부 실거래가로 계산" },
    transactionPriceSource: {
      value: "국토교통부 실거래가 공개시스템",
      verified: true,
      source: "https://rt.molit.go.kr/"
    },
    transitPlans: [
      {
        name: "위례신사선",
        stage: "재정사업 전환, 예비타당성 진행 중 (2025~2026)",
        note: "기존 2028년 개통 목표에서 2030년 이후로 지연 전망",
        verified: true,
        source: "https://www.hankyung.com/article/202412122631i"
      }
    ],
    walkTimeToStation: { value: null, verified: false, source: "확인 필요 - 단지별 실측 또는 지도 API 도보 길찾기로 계산" }
  },
  {
    id: "nam-seongnam",
    name: "남위례 · 성남권역(창곡동)",
    region: "경기 성남시 수정구 창곡동",
    status: { value: "2017년경 입주 완료", verified: true,
      source: "https://ko.wikipedia.org/wiki/%EC%9C%84%EB%A1%80%EC%8B%A0%EB%8F%84%EC%8B%9C" },
    elementarySchools: { value: null, verified: false, source: "확인 필요 - 학교알리미" },
    middleSchools:     { value: null, verified: false, source: "확인 필요 - 학교알리미" },
    highSchools: {
      value: [
        {
          name: "위례한빛고등학교",
          type: "공립 일반고 (자사고 아님)",
          founded: "2016-03-01",
          feature: "고교학점제 연구학교, 미술중점학급·체육중점학급 운영",
          source: "https://www.schoolinfo.go.kr/ei/ss/Pneiss_b01_s0.do?SHL_IDF_CD=0b715b78-cbda-4d57-ad77-40f60fa1a262"
        }
      ],
      verified: true,
      source: "https://www.schoolinfo.go.kr/"
    },
    skyMedicalAdmits:  { value: null, verified: false, source: "확인 필요 - 학교 자체 공개자료만 사용 (README 3-2 참고)" },
    flagshipApartment: { value: null, verified: false, source: "확인 필요" },
    transactionPriceSource: {
      value: "국토교통부 실거래가 공개시스템",
      verified: true,
      source: "https://rt.molit.go.kr/"
    },
    transitPlans: [
      {
        name: "위례과천선",
        stage: "노선안 공개(2025.2), 위례 통과 구간 포함 여부 논란",
        note: "송파 법조타운~과천 정부과천청사, 총연장 28.25km, 위례 미경유 우려로 주민 반발",
        verified: true,
        source: "https://www.newspim.com/news/view/20250320000846"
      }
    ],
    walkTimeToStation: { value: null, verified: false, source: "확인 필요" }
  },
  {
    id: "nam-hanam",
    name: "남위례 · 하남권역(학암동 일부)",
    region: "경기 하남시 학암동 일부",
    status: { value: "2017년경 입주 완료(권역 일부)", verified: true,
      source: "https://ko.wikipedia.org/wiki/%EC%9C%84%EB%A1%80%EC%8B%A0%EB%8F%84%EC%8B%9C" },
    elementarySchools: { value: null, verified: false, source: "확인 필요 - 학교알리미" },
    middleSchools:     { value: null, verified: false, source: "확인 필요 - 학교알리미" },
    highSchools:       { value: null, verified: false, source: "확인 필요 - 학교알리미" },
    skyMedicalAdmits:  { value: null, verified: false, source: "확인 필요 (README 3-2 참고)" },
    flagshipApartment: { value: null, verified: false, source: "확인 필요" },
    transactionPriceSource: {
      value: "국토교통부 실거래가 공개시스템",
      verified: true,
      source: "https://rt.molit.go.kr/"
    },
    transitPlans: [],
    walkTimeToStation: { value: null, verified: false, source: "확인 필요" }
  },
  {
    id: "buk-wirye",
    name: "북위례 (하남시 위례동)",
    region: "경기 하남시 위례동 (옛 육군특수전사령부 부지)",
    status: {
      value: "특전사 부지 이전 지연으로 개발이 늦어졌고, 서울 편입(메가서울) 논의도 진행 중",
      verified: true,
      source: "https://ko.wikipedia.org/wiki/%EC%9C%84%EB%A1%80%EC%8B%A0%EB%8F%84%EC%8B%9C"
    },
    elementarySchools: { value: null, verified: false, source: "확인 필요 - 학교알리미, 신설 예정교 포함 확인 필요" },
    middleSchools:     { value: null, verified: false, source: "확인 필요" },
    highSchools:       { value: null, verified: false, source: "확인 필요" },
    skyMedicalAdmits:  { value: null, verified: false, source: "확인 필요 (README 3-2 참고)" },
    flagshipApartment: { value: null, verified: false, source: "확인 필요 - 입주 진행 단계라 변동성 큼" },
    transactionPriceSource: {
      value: "국토교통부 실거래가 공개시스템",
      verified: true,
      source: "https://rt.molit.go.kr/"
    },
    transitPlans: [],
    walkTimeToStation: { value: null, verified: false, source: "확인 필요" }
  }
];

const DATA_SOURCES = {
  schoolInfo: "https://www.schoolinfo.go.kr/",
  realTransactionSystem: "https://rt.molit.go.kr/",
  realTransactionApiSale: "https://www.data.go.kr/data/15126469/openapi.do",
  realTransactionApiRent: "https://www.data.go.kr/data/15126474/openapi.do",
  legalDongCode: "https://www.code.go.kr/",
  spatialBoundary: "https://www.nsdi.go.kr/",
  kakaopayMerchant: "https://biz.kakaopay.com/applications"
};

if (typeof module !== "undefined") {
  module.exports = { WIRYE_ZONES, DATA_SOURCES };
}
