// 부업 데이터 — 화면과 분리된 단일 데이터 소스.
// sources/checked 가 있는 항목만 공식 페이지에서 직접 읽어 확인한 내용입니다.
export const GIGS = [
  {
    "id": "flitto",
    "name": "Flitto",
    "tagline": "번역·녹음 같은 짧은 작업을 하고 포인트를 받아요",
    "category": "언어",
    "color": "#2F6BFF",
    "time": [
      "5",
      "30",
      "60"
    ],
    "skills": [
      "language",
      "sound"
    ],
    "difficulty": 1,
    "earnType": "포인트 → 현금 환전",
    "cadence": "아무 때나",
    "summary": "문장 번역이나 검수, 음성 녹음 같은 작업을 건건이 하고 포인트를 받는 서비스예요. 포인트가 일정 금액 이상 모이면 현금으로 바꿀 수 있어요.",
    "steps": [
      "가입하고 쓸 수 있는 언어 고르기",
      "번역·검수·녹음 중 하고 싶은 작업 선택",
      "작업하고 포인트 쌓기",
      "환전 신청"
    ],
    "needs": [
      "스마트폰",
      "한국어 말고 하나 이상의 언어 (있으면 유리)"
    ],
    "pros": [
      "작업 하나가 짧아서 이동 중에도 가능",
      "처음 해도 어렵지 않음"
    ],
    "cons": [
      "건당 보상은 작은 편",
      "환전하려면 최소 금액을 채워야 함"
    ],
    "url": "https://www.flitto.com/arcade/",
    "verified": false,
    "sources": [],
    "checked": null,
    "logo": null
  },
  {
    "id": "adobe-stock",
    "name": "Adobe Stock",
    "tagline": "찍은 사진·영상을 올려 두고 다운로드될 때마다 로열티 받기",
    "category": "스톡 판매",
    "color": "#E5322D",
    "time": [
      "60"
    ],
    "skills": [
      "visual"
    ],
    "difficulty": 3,
    "earnType": "다운로드당 로열티 (사진·일러스트 33%, 영상 35%)",
    "cadence": "올려 둔 만큼, 천천히",
    "summary": "사진·영상·일러스트를 올리면 구매자가 다운로드할 때마다 로열티가 들어와요. 로열티는 구매자의 요금제에 따라 달라서, 사이트 예시로는 이미지 한 장당 $0.33~$3.30(미국 가격 기준)이에요.",
    "steps": [
      "Adobe ID로 기여자 가입",
      "파일 올리고 제목·키워드 입력",
      "심사 통과",
      "다운로드되면 로열티 적립"
    ],
    "needs": [
      "만 18세 이상",
      "내가 단독 소유자인 콘텐츠",
      "기여자 약관과 콘텐츠 정책 동의"
    ],
    "pros": [
      "로열티 최대 35%, 비독점이라 다른 곳에도 올릴 수 있음",
      "기여자는 Behance를 무료로 쓸 수 있음"
    ],
    "cons": [
      "금액은 구매 요금제에 따라 달라 예측이 어려움",
      "가격은 미국 고객 기준이라 지역마다 다를 수 있음"
    ],
    "url": "https://contributor.stock.adobe.com/",
    "verified": false,
    "sources": [
      {
        "label": "Adobe Stock 기여자 안내",
        "url": "https://contributor.stock.adobe.com/"
      },
      {
        "label": "Adobe Stock 로열티",
        "url": "https://contributor.stock.adobe.com/royalties"
      }
    ],
    "checked": "2026-11-20",
    "logo": "logos/adobe-stock.png"
  },
  {
    "id": "shutterstock",
    "name": "Shutterstock",
    "tagline": "사진·영상·벡터를 올려 팔고, AI 학습용 작업도 신청",
    "category": "스톡 판매",
    "color": "#EE2B2B",
    "time": [
      "60"
    ],
    "skills": [
      "visual"
    ],
    "difficulty": 3,
    "earnType": "판매 로열티, AI 학습용 콘텐츠·작업 의뢰",
    "cadence": "올려 둔 만큼, 의뢰가 올 때",
    "summary": "공식 안내에는 2003년부터 기여자에게 10억 달러 넘게 지급했다고 나와 있어요. 이미지·영상 라이선스 판매 외에, AI 학습용 콘텐츠 제공과 주석·검수 같은 작업 기회도 소개돼요.",
    "steps": [
      "기여자로 가입",
      "샘플 제출·심사",
      "승인 후 콘텐츠 업로드",
      "판매되면 정산"
    ],
    "needs": [
      "만 18세 이상",
      "계정 등록 시 필요한 양식 작성",
      "약관과 제출 가이드라인 준수"
    ],
    "pros": [
      "판매 외에도 AI 학습용 콘텐츠·작업 등 수입 경로가 여럿",
      "일부 기회는 조건이 맞으면 알림으로 연결"
    ],
    "cons": [
      "로열티 비율과 최소 지급액은 가입 후 안내 페이지에서 확인해야 함"
    ],
    "url": "https://submit.shutterstock.com/",
    "verified": false,
    "sources": [
      {
        "label": "Shutterstock 기여자 안내",
        "url": "https://submit.shutterstock.com/"
      },
      {
        "label": "계정·제출 가이드라인",
        "url": "https://submit.shutterstock.com/help/en/articles/10594696"
      }
    ],
    "checked": "2026-11-20",
    "logo": "logos/shutterstock.png"
  },
  {
    "id": "crowdpic",
    "name": "크라우드픽",
    "tagline": "한국 분위기 사진·일러스트를 올려 팔기",
    "category": "스톡 판매",
    "color": "#1F9D8B",
    "time": [
      "60"
    ],
    "skills": [
      "visual"
    ],
    "difficulty": 2,
    "earnType": "판매 수수료 50% (공모전은 0%)",
    "cadence": "올려 둔 만큼",
    "summary": "한국 이용자 중심의 이미지 마켓이에요. 사이트 공지에 따르면 2023년 10월 4일부터 스톡 이미지 판매 수수료가 30%에서 50%로 올랐고, 공모전 수수료는 0%, API 수수료는 30%예요.",
    "steps": [
      "작가 신청",
      "이미지 업로드",
      "검수",
      "판매되면 정산"
    ],
    "needs": [
      "직접 만든 사진·일러스트·아이콘 등",
      "작가 가이드와 품질 가이드 확인"
    ],
    "pros": [
      "한국 이용자가 찾는 소재(증명사진 배경, 한식, 지도 등)가 눈에 띔",
      "공모전은 수수료가 없음"
    ],
    "cons": [
      "판매 수수료가 50%라 작가 몫이 크지 않을 수 있음",
      "정산 최소 금액은 확인하지 못함"
    ],
    "url": "https://www.crowdpic.net/",
    "verified": false,
    "sources": [
      {
        "label": "크라우드픽 메인(수수료 공지)",
        "url": "https://www.crowdpic.net/"
      }
    ],
    "checked": "2026-11-20",
    "logo": null
  },
  {
    "id": "pond5",
    "name": "Pond5",
    "tagline": "영상·음악·효과음 소스 판매",
    "category": "스톡 판매",
    "color": "#F36C21",
    "time": [
      "60"
    ],
    "skills": [
      "visual",
      "sound"
    ],
    "difficulty": 3,
    "earnType": "팔릴 때마다 수익",
    "cadence": "올려 둔 만큼",
    "summary": "영상 클립, 음악, 효과음 같은 소스를 올려 파는 마켓이에요. 직접 촬영한 영상이나 만든 소리가 있다면 쓸 수 있어요.",
    "steps": [
      "아티스트 가입",
      "파일 업로드와 설명 입력",
      "검수 통과",
      "판매되면 수익"
    ],
    "needs": [
      "영상이나 소리 파일",
      "권리 문제가 없는 소스"
    ],
    "pros": [
      "사진 말고 영상·음원으로도 가능",
      "가격을 직접 정할 수 있는 경우가 있음"
    ],
    "cons": [
      "영상 작업은 시간이 오래 걸림",
      "경쟁이 있음"
    ],
    "url": "https://www.pond5.com/ko/",
    "verified": false,
    "sources": [],
    "checked": null,
    "logo": null
  },
  {
    "id": "audiojungle",
    "name": "AudioJungle",
    "tagline": "내가 만든 음악·효과음 팔기",
    "category": "스톡 판매",
    "color": "#82B440",
    "time": [
      "60"
    ],
    "skills": [
      "sound"
    ],
    "difficulty": 3,
    "earnType": "판매 시 수익 분배",
    "cadence": "올려 둔 만큼",
    "summary": "엔바토 마켓에서 음악과 효과음을 파는 곳이에요. 영상 제작자들이 배경음악으로 사 가요.",
    "steps": [
      "작가 가입",
      "음원 업로드",
      "심사",
      "판매되면 수익"
    ],
    "needs": [
      "음악·효과음 제작 능력",
      "제작 도구"
    ],
    "pros": [
      "음악을 만들 줄 알면 바로 활용 가능",
      "한 번 올리면 계속 팔릴 수 있음"
    ],
    "cons": [
      "음원 제작 실력이 필요함",
      "심사 기준이 있음"
    ],
    "url": "https://audiojungle.net/",
    "verified": false,
    "sources": [],
    "checked": null,
    "logo": null
  },
  {
    "id": "artlist",
    "name": "Artlist",
    "tagline": "영상 제작자가 쓰는 음악·영상 소스 플랫폼",
    "category": "스톡 판매",
    "color": "#111111",
    "time": [
      "60"
    ],
    "skills": [
      "sound",
      "visual"
    ],
    "difficulty": 3,
    "earnType": "계약에 따른 수익",
    "cadence": "계약 기준",
    "summary": "영상 제작자가 구독해서 쓰는 음악·영상 소스 서비스예요. 직접 만든 음악이나 영상을 제공하는 아티스트로 참여하는 길이 있어요.",
    "steps": [
      "아티스트 신청 방법 확인",
      "작품 제출",
      "검토",
      "계약 후 제공"
    ],
    "needs": [
      "완성도 있는 음악이나 영상",
      "포트폴리오"
    ],
    "pros": [
      "플랫폼이 구독자를 이미 모아 둠"
    ],
    "cons": [
      "아무나 들어갈 수 있는 구조는 아님",
      "조건은 공식 사이트에서 확인 필요"
    ],
    "url": "https://artlist.io/",
    "verified": false,
    "sources": [],
    "checked": null,
    "logo": null
  },
  {
    "id": "tooldi",
    "name": "툴디",
    "tagline": "템플릿·요소·사진을 올려 판매·구독·인쇄 리워드 받기",
    "category": "디자인",
    "color": "#6C5CE7",
    "time": [
      "60"
    ],
    "skills": [
      "design"
    ],
    "difficulty": 2,
    "earnType": "판매·구독·인쇄·프로모션 리워드, 판매 수수료 20%(등급별 12~17%로 감면)",
    "cadence": "판매될 때, 월 단위",
    "summary": "툴디에서 쓰이는 템플릿·요소·사진을 올리는 크리에이터 프로그램이에요. 등급은 스탯포인트로 정해지고, 브론즈(100점 이상)부터 유료 콘텐츠 등록과 리워드 정산이 열려요. 판매 수수료는 20%이고 실버 17%, 골드 15%, 플래티넘 12%로 내려가요.",
    "steps": [
      "크리에이터 지원",
      "템플릿은 에디터로 만들어 심사 등록, 요소·사진은 크리에이터 센터로 업로드",
      "등급에 따라 유료 판매·정산",
      "리워드 정산"
    ],
    "needs": [
      "툴디 에디터로 만든 템플릿 또는 요소·사진",
      "템플릿은 심사 승인 필요"
    ],
    "pros": [
      "한 번 지원하면 템플릿·요소·사진 모두 활동 가능",
      "활동할수록 수수료가 줄어드는 구조"
    ],
    "cons": [
      "처음에는 무료 콘텐츠 중심(일반 등급)",
      "등급을 올릴 스탯포인트를 쌓아야 함"
    ],
    "url": "https://www.tooldi.com/introduce-creator",
    "verified": false,
    "sources": [
      {
        "label": "툴디 크리에이터 안내",
        "url": "https://www.tooldi.com/introduce-creator"
      }
    ],
    "checked": "2026-11-20",
    "logo": "logos/tooldi.ico"
  },
  {
    "id": "miricanvas",
    "name": "MiriCanvas",
    "tagline": "디자인 요소를 만들어 올리기",
    "category": "디자인",
    "color": "#FF5C8A",
    "time": [
      "60"
    ],
    "skills": [
      "design"
    ],
    "difficulty": 2,
    "earnType": "요소 사용에 따른 수익",
    "cadence": "올려 둔 만큼",
    "summary": "미리캔버스에서 쓰는 디자인 요소를 올리는 곳이에요. 로그인 후 업로드 화면으로 이동해요.",
    "steps": [
      "로그인",
      "디자인 요소 업로드",
      "심사",
      "사용되면 수익"
    ],
    "needs": [
      "디자인 툴 사용 능력"
    ],
    "pros": [
      "이용자가 많은 툴이라 쓰일 기회가 있음"
    ],
    "cons": [
      "수익 조건은 로그인 후 확인 필요"
    ],
    "url": "https://designhub.miricanvas.com/ko/login?prevUrl=%2Fko%2Felement%2Fupload",
    "verified": false,
    "sources": [],
    "checked": null,
    "logo": null
  },
  {
    "id": "redbubble",
    "name": "Redbubble",
    "tagline": "내 디자인을 상품에 얹어 팔기",
    "category": "디자인",
    "color": "#E41321",
    "time": [
      "60"
    ],
    "skills": [
      "design"
    ],
    "difficulty": 2,
    "earnType": "판매마진",
    "cadence": "올려 둔 만큼",
    "summary": "내가 만든 디자인을 올리면 티셔츠, 스티커, 폰케이스 같은 상품에 인쇄해서 팔아 줘요. 재고와 배송은 플랫폼이 맡아요.",
    "steps": [
      "가입하고 샵 만들기",
      "디자인 업로드",
      "상품 선택",
      "팔리면 마진 정산"
    ],
    "needs": [
      "디자인 파일",
      "영어 제목·태그"
    ],
    "pros": [
      "재고 부담이 없음",
      "디자인만 있으면 시작 가능"
    ],
    "cons": [
      "경쟁이 많음",
      "디자인 저작권을 지켜야 함"
    ],
    "url": "https://www.redbubble.com/",
    "verified": false,
    "sources": [],
    "checked": null,
    "logo": null
  },
  {
    "id": "stibee",
    "name": "Stibee",
    "tagline": "이메일 뉴스레터 만들고 발송하는 도구",
    "category": "글쓰기",
    "color": "#FF6B35",
    "time": [
      "60"
    ],
    "skills": [
      "writing"
    ],
    "difficulty": 2,
    "earnType": "발송 도구라 수익은 직접 설계",
    "cadence": "발행 주기에 따라",
    "summary": "공식 소개는 \"이메일 제작부터 자동화, 데이터 분석, 성과 개선까지\"인 이메일 마케팅 도구예요. 수익을 바로 주는 서비스는 아니고, 구독자를 모은 뒤 광고·협찬 등을 직접 연결해야 해요.",
    "steps": [
      "뉴스레터 주제 정하기",
      "스티비에서 제작·발송",
      "구독자 모으기",
      "수익 방식 직접 연결"
    ],
    "needs": [
      "꾸준히 쓸 수 있는 주제"
    ],
    "pros": [
      "발송·자동화·분석 기능이 한 곳에 있음"
    ],
    "cons": [
      "돈이 되는 구조는 스스로 만들어야 함",
      "요금제는 확인하지 못함"
    ],
    "url": "https://stibee.com/",
    "verified": false,
    "sources": [
      {
        "label": "스티비 메인",
        "url": "https://stibee.com/"
      }
    ],
    "checked": "2026-11-20",
    "logo": "logos/stibee.png"
  },
  {
    "id": "maily",
    "name": "Maily",
    "tagline": "뉴스레터를 발행하고 유료 멤버십으로 수익 만들기",
    "category": "글쓰기",
    "color": "#2D9CDB",
    "time": [
      "60"
    ],
    "skills": [
      "writing"
    ],
    "difficulty": 2,
    "earnType": "유료 멤버십 (수수료는 확인 못함)",
    "cadence": "발행 주기에 따라",
    "summary": "뉴스레터 플랫폼이에요. 베이직 플랜은 무료로, 월 1,000건 발송·월 4회 발행까지 쓸 수 있고, 유료 멤버십 기능도 있다고 소개돼요.",
    "steps": [
      "가입하고 뉴스레터 만들기",
      "글 쓰고 발행",
      "구독자 모으기",
      "유료 멤버십 설정"
    ],
    "needs": [
      "꾸준히 쓸 수 있는 주제",
      "구독자를 모을 방법"
    ],
    "pros": [
      "무료 플랜으로 시작 가능",
      "검색되는 블로그 형태로도 발행"
    ],
    "cons": [
      "유료 멤버십 수수료와 정산 조건은 확인하지 못함",
      "구독자가 없으면 수익이 없음"
    ],
    "url": "https://maily.so/",
    "verified": false,
    "sources": [
      {
        "label": "메일리 메인",
        "url": "https://maily.so/"
      }
    ],
    "checked": "2026-11-20",
    "logo": null
  },
  {
    "id": "fiverr",
    "name": "Fiverr",
    "tagline": "내 기술을 해외에 서비스로 팔기",
    "category": "재능 판매",
    "color": "#1DBF73",
    "time": [
      "60"
    ],
    "skills": [
      "design",
      "writing",
      "language"
    ],
    "difficulty": 3,
    "earnType": "작업 건당 판매",
    "cadence": "주문 들어올 때",
    "summary": "번역, 디자인, 영상 편집, 글쓰기 같은 기술을 서비스 상품으로 올려 해외 고객에게 파는 마켓이에요.",
    "steps": [
      "판매자 가입",
      "서비스(기그) 등록",
      "주문 받기",
      "작업 후 정산"
    ],
    "needs": [
      "팔 수 있는 기술",
      "영어 소통"
    ],
    "pros": [
      "시장이 크고 내 기술을 직접 가격으로 정함"
    ],
    "cons": [
      "처음 주문받기까지 어려움",
      "수수료가 있음"
    ],
    "url": "https://www.fiverr.com/",
    "verified": false,
    "sources": [],
    "checked": null,
    "logo": null
  },
  {
    "id": "crowdworks",
    "name": "CrowdWorks",
    "tagline": "AI 학습용 데이터 라벨링 작업하기",
    "category": "데이터 작업",
    "color": "#0B5FFF",
    "time": [
      "5",
      "30",
      "60"
    ],
    "skills": [
      "phone"
    ],
    "difficulty": 1,
    "earnType": "작업 건당 보상",
    "cadence": "프로젝트가 열릴 때",
    "summary": "이미지에 표시하거나 문장을 분류하는 식으로 AI가 배울 데이터를 만드는 작업이에요. 프로젝트마다 작업 방식과 보상이 달라요.",
    "steps": [
      "회원 가입",
      "작업 자격 테스트",
      "프로젝트 선택",
      "검수 후 보상"
    ],
    "needs": [
      "PC나 스마트폰",
      "꼼꼼함"
    ],
    "pros": [
      "특별한 기술 없이도 시작할 수 있는 작업이 있음",
      "집에서 가능"
    ],
    "cons": [
      "프로젝트가 있을 때만 일할 수 있음",
      "자격 테스트를 통과해야 함"
    ],
    "url": "https://works.crowdworks.kr/",
    "verified": false,
    "sources": [],
    "checked": null,
    "logo": null
  },
  {
    "id": "aiworks",
    "name": "AIWORKS",
    "tagline": "AI 데이터 작업 참여하기",
    "category": "데이터 작업",
    "color": "#3B82F6",
    "time": [
      "30",
      "60"
    ],
    "skills": [
      "phone"
    ],
    "difficulty": 1,
    "earnType": "작업 건당 보상",
    "cadence": "프로젝트가 열릴 때",
    "summary": "AI 학습용 데이터를 만드는 작업 플랫폼이에요. 정확한 서비스 방식은 공식 사이트에서 확인이 필요해요.",
    "steps": [
      "가입",
      "프로젝트 확인",
      "작업",
      "보상 받기"
    ],
    "needs": [
      "PC"
    ],
    "pros": [
      "(확인 후 작성)"
    ],
    "cons": [
      "(확인 후 작성)"
    ],
    "url": "https://aiworks.co.kr/",
    "verified": false,
    "sources": [],
    "checked": null,
    "logo": null
  },
  {
    "id": "databakery",
    "name": "Data Bakery",
    "tagline": "AI 데이터 작업 참여하기",
    "category": "데이터 작업",
    "color": "#F59E0B",
    "time": [
      "30",
      "60"
    ],
    "skills": [
      "phone"
    ],
    "difficulty": 1,
    "earnType": "작업 건당 보상",
    "cadence": "프로젝트가 열릴 때",
    "summary": "AI 데이터 작업 관련 서비스예요. 공식 주소를 받은 뒤 내용을 채울 예정이에요.",
    "steps": [
      "(확인 후 작성)"
    ],
    "needs": [
      "(확인 후 작성)"
    ],
    "pros": [
      "(확인 후 작성)"
    ],
    "cons": [
      "(확인 후 작성)"
    ],
    "url": null,
    "verified": false,
    "sources": [],
    "checked": null,
    "logo": null
  },
  {
    "id": "metworks",
    "name": "METWORKS",
    "tagline": "데이터 작업 프로젝트 참여하기",
    "category": "데이터 작업",
    "color": "#0EA5A4",
    "time": [
      "30",
      "60"
    ],
    "skills": [
      "phone"
    ],
    "difficulty": 1,
    "earnType": "작업 건당 보상",
    "cadence": "프로젝트가 열릴 때",
    "summary": "AI 데이터 작업 프로젝트에 참여하는 플랫폼이에요. 정확한 작업 방식과 보상은 공식 사이트에서 확인이 필요해요.",
    "steps": [
      "가입",
      "프로젝트 확인",
      "작업",
      "검수 후 보상"
    ],
    "needs": [
      "PC"
    ],
    "pros": [
      "(확인 후 작성)"
    ],
    "cons": [
      "(확인 후 작성)"
    ],
    "url": "https://www.metworks.co.kr/",
    "verified": false,
    "sources": [],
    "checked": null,
    "logo": null
  },
  {
    "id": "labelon",
    "name": "LabelOn",
    "tagline": "AI 데이터에 이름표를 붙이는 재택 라벨링",
    "category": "데이터 작업",
    "color": "#7C3AED",
    "time": [
      "30",
      "60"
    ],
    "skills": [
      "phone"
    ],
    "difficulty": 1,
    "earnType": "크레딧 적립 (환전 조건은 확인 못함)",
    "cadence": "프로젝트가 열릴 때",
    "summary": "운영사 Euclidsoft(유클리드소프트)의 \"e-working Platform for AI\"예요. 가입 후 프로젝트에 참여하는 어노테이터·리뷰어로 일하는 구조이고, 메뉴에 \"My Credit\"과 입금계좌관리가 있어요.",
    "steps": [
      "회원 가입(실명)",
      "프로젝트 확인",
      "작업 참여",
      "크레딧 적립 후 입금"
    ],
    "needs": [
      "실명 가입",
      "만 15세 미만은 법정대리인 동의 필요"
    ],
    "pros": [
      "집에서 PC로 할 수 있음",
      "체험하기 메뉴가 있음"
    ],
    "cons": [
      "프로젝트 단가·출금 기준은 가입 후에 확인해야 함",
      "3개월 이상 로그인하지 않으면 이용이 제한될 수 있음"
    ],
    "url": "https://www.labelon.kr/",
    "verified": false,
    "sources": [
      {
        "label": "LabelOn 메인·이용약관",
        "url": "https://www.labelon.kr/"
      }
    ],
    "checked": "2026-11-20",
    "logo": "logos/labelon.png"
  },
  {
    "id": "pandarank",
    "name": "판다랭크",
    "tagline": "블로그·스마트스토어 채널을 키우는 분석·AI 도구",
    "category": "블로그·쇼핑",
    "color": "#16A34A",
    "time": [
      "60"
    ],
    "skills": [
      "phone"
    ],
    "difficulty": 2,
    "earnType": "도구 이용 (수익은 내 채널에서)",
    "cadence": "채널 운영 시간에 따라",
    "summary": "스스로를 \"크리에이터 수익화 플랫폼\"이라고 소개해요. 키워드 분석, 블로그 분석·순위, 상품 분석, AI 글쓰기 도구가 있고, 쇼핑 커넥트·체험단 메뉴도 있어요. 가입 시 무료 크레딧을 준다고 안내돼요.",
    "steps": [
      "가입(무료 크레딧)",
      "키워드·상품 분석",
      "블로그나 스토어 운영",
      "체험단·쇼핑 커넥트 등으로 수익화"
    ],
    "needs": [
      "블로그·스마트스토어·SNS 채널 중 하나"
    ],
    "pros": [
      "글감·키워드 고르는 시간을 줄일 수 있음"
    ],
    "cons": [
      "도구 자체가 돈을 주진 않고, 수익은 채널 성과에 달림",
      "요금제는 확인하지 못함"
    ],
    "url": "https://pandarank.net/",
    "verified": false,
    "sources": [
      {
        "label": "판다랭크 메인",
        "url": "https://pandarank.net/"
      }
    ],
    "checked": "2026-11-20",
    "logo": "logos/pandarank.png"
  },
  {
    "id": "social-louder",
    "name": "Sociallouder",
    "tagline": "SNS 체험단 — 게시물 올리고 포인트 받기",
    "category": "SNS",
    "color": "#8A4DFF",
    "time": [
      "30",
      "60"
    ],
    "skills": [
      "sns"
    ],
    "difficulty": 2,
    "earnType": "포인트 (현금 전환 가능)",
    "cadence": "캠페인마다",
    "summary": "SNS 체험단 플랫폼이에요. 블로그·인스타그램·유튜브·틱톡 중 쓰는 채널로 참여하고, 게시물을 올리면 현금으로 바꿀 수 있는 포인트가 쌓여요. 영화 시사회, 전시, 팝업스토어 같은 문화 체험 캠페인이 있다고 소개돼 있어요.",
    "steps": [
      "가입하고 SNS 계정 연결",
      "맞는 캠페인에 신청",
      "선정되면 가이드대로 게시",
      "보상 받기"
    ],
    "needs": [
      "운영 중인 SNS 계정",
      "가이드라인대로 글을 쓸 수 있는 것"
    ],
    "pros": [
      "팔로워가 적어도 신청 가능한 캠페인이 있음",
      "제품을 직접 써볼 수 있음"
    ],
    "cons": [
      "신청해도 안 뽑힐 수 있음",
      "게시 기간·문구 조건을 지켜야 함"
    ],
    "url": "https://apps.apple.com/kr/app/id6747383642",
    "verified": false,
    "sources": [],
    "checked": null,
    "logo": null
  }
];

export const TIME_OPTIONS = [
  { id: '5', label: '5분 남짓' },
  { id: '30', label: '30분쯤' },
  { id: '60', label: '1시간 이상' },
];

export const SKILL_OPTIONS = [
  { id: 'phone', label: '폰만 있음', short: '폰만으로 가능' },
  { id: 'language', label: '외국어 조금', short: '외국어 활용' },
  { id: 'visual', label: '사진·영상 찍음', short: '찍어둔 사진 활용' },
  { id: 'design', label: '디자인 가능', short: '디자인 활용' },
  { id: 'writing', label: '글 쓰는 편', short: '글쓰기 활용' },
  { id: 'sound', label: '음악·목소리', short: '소리 활용' },
  { id: 'sns', label: 'SNS 계정 있음', short: '내 SNS 활용' },
];
