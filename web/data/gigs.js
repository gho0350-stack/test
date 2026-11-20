// 부업 데이터 — 화면과 분리된 단일 데이터 소스.
// sources/checked 가 있는 항목만 공식 페이지에서 직접 읽어 확인한 내용입니다.
// amount/how 가 비어 있으면 아직 확인하지 못한 항목입니다.
export const GIGS = [
  {
    "id": "flitto",
    "name": "Flitto",
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
    "steps": [],
    "needs": [],
    "pros": [],
    "cons": [],
    "url": "https://www.flitto.com/arcade/",
    "verified": false,
    "sources": [],
    "checked": null,
    "logo": null,
    "doWhat": "번역·음성 관련 작업",
    "how": null,
    "amount": null,
    "amountShort": null,
    "timeNote": null
  },
  {
    "id": "adobe-stock",
    "name": "Adobe Stock",
    "category": "스톡 판매",
    "color": "#E5322D",
    "time": [
      "60"
    ],
    "skills": [
      "visual"
    ],
    "difficulty": 3,
    "steps": [
      "Adobe ID로 기여자 가입",
      "파일 업로드, 제목·키워드 입력",
      "심사 통과",
      "다운로드되면 로열티 적립"
    ],
    "needs": [
      "만 18세 이상",
      "내가 단독 소유자인 콘텐츠"
    ],
    "pros": [
      "비독점이라 다른 마켓에도 같이 올릴 수 있음"
    ],
    "cons": [
      "건당 금액이 작음",
      "팔리는 양은 알 수 없음"
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
    "logo": "logos/adobe-stock.png",
    "doWhat": "사진·영상·일러스트를 올려 두고 판매",
    "how": "구매자가 파일을 다운로드할 때마다 로열티가 쌓여요. 사진·일러스트는 33%, 영상은 35%예요.",
    "amountShort": "사진 1장 다운로드당 $0.33~$3.30",
    "amount": "사진·일러스트는 다운로드 1건당 $0.33~$3.30이에요. 구매자가 어떤 요금제로 샀는지에 따라 달라요. 영상은 구독 기준 $2.80~$8.40, 건당 구매면 HD $22.40~$28, 4K $56~$70이에요. 전부 미국 가격 기준이고, 한 달에 몇 건 팔리는지는 사이트에 나와 있지 않아요.",
    "timeNote": "사진이나 영상은 미리 있어야 해요. 올릴 때 파일마다 제목과 키워드를 적고, 심사를 기다려요. 첫 판매까지 얼마나 걸리는지는 확인하지 못했어요."
  },
  {
    "id": "shutterstock",
    "name": "Shutterstock",
    "category": "스톡 판매",
    "color": "#EE2B2B",
    "time": [
      "60"
    ],
    "skills": [
      "visual"
    ],
    "difficulty": 3,
    "steps": [
      "기여자 가입",
      "필요한 양식 작성",
      "콘텐츠 제출",
      "판매되면 정산"
    ],
    "needs": [
      "만 18세 이상",
      "제출 가이드라인 준수"
    ],
    "pros": [
      "판매 말고 AI 학습용 작업도 있음"
    ],
    "cons": [
      "로열티 비율과 최소 지급액은 확인하지 못함"
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
    "logo": "logos/shutterstock.png",
    "doWhat": "사진·영상·벡터를 올려 판매. AI 학습용 콘텐츠 제공이나 주석·검수 작업도 있음",
    "how": "라이선스가 팔리면 수익이 생겨요. 의뢰형 작업은 내 조건에 맞는 기회가 열리면 알림을 받는 방식이에요. 회사 발표로는 2003년 이후 기여자에게 누적 10억 달러 넘게 지급했어요.",
    "amountShort": null,
    "amount": null,
    "timeNote": "가입할 때 계정 등록용 양식을 써야 해요. 만 18세 이상이어야 하고요. 심사 기간과 업로드 방식은 확인하지 못했어요."
  },
  {
    "id": "crowdpic",
    "name": "크라우드픽",
    "category": "스톡 판매",
    "color": "#1F9D8B",
    "time": [
      "60"
    ],
    "skills": [
      "visual"
    ],
    "difficulty": 2,
    "steps": [
      "작가 신청",
      "이미지 업로드",
      "판매되면 정산"
    ],
    "needs": [
      "직접 만든 사진·일러스트 등"
    ],
    "pros": [
      "한국 소재 이미지 수요가 있음",
      "공모전은 수수료 없음"
    ],
    "cons": [
      "수수료율이 높은 편"
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
    "logo": null,
    "doWhat": "사진·일러스트·아이콘 등을 올려 판매",
    "how": "이미지가 판매될 때 수익이 생겨요. 판매 수수료는 50%예요. 2023년 10월 4일에 30%에서 올랐어요. 공모전은 수수료가 0%, API는 30%예요.",
    "amountShort": "판매 수수료 50%",
    "amount": "수수료만 확인했어요. 작가에게 돌아오는 금액, 이미지 1장 가격, 최소 정산액은 확인하지 못했어요.",
    "timeNote": "작가 신청 후 이미지를 올려요. 검수와 정산 일정은 확인하지 못했어요."
  },
  {
    "id": "pond5",
    "name": "Pond5",
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
    "steps": [],
    "needs": [],
    "pros": [],
    "cons": [],
    "url": "https://www.pond5.com/ko/",
    "verified": false,
    "sources": [],
    "checked": null,
    "logo": null,
    "doWhat": "영상·음악·효과음 소스를 올려서 판매",
    "how": null,
    "amount": null,
    "amountShort": null,
    "timeNote": null
  },
  {
    "id": "audiojungle",
    "name": "AudioJungle",
    "category": "스톡 판매",
    "color": "#82B440",
    "time": [
      "60"
    ],
    "skills": [
      "sound"
    ],
    "difficulty": 3,
    "steps": [],
    "needs": [],
    "pros": [],
    "cons": [],
    "url": "https://audiojungle.net/",
    "verified": false,
    "sources": [],
    "checked": null,
    "logo": null,
    "doWhat": "음악·효과음을 올려서 판매",
    "how": null,
    "amount": null,
    "amountShort": null,
    "timeNote": null
  },
  {
    "id": "artlist",
    "name": "Artlist",
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
    "steps": [],
    "needs": [],
    "pros": [],
    "cons": [],
    "url": "https://artlist.io/",
    "verified": false,
    "sources": [],
    "checked": null,
    "logo": null,
    "doWhat": "음악·영상 소스를 제공하는 아티스트로 참여",
    "how": null,
    "amount": null,
    "amountShort": null,
    "timeNote": null
  },
  {
    "id": "tooldi",
    "name": "툴디",
    "category": "디자인",
    "color": "#6C5CE7",
    "time": [
      "60"
    ],
    "skills": [
      "design"
    ],
    "difficulty": 2,
    "steps": [
      "크리에이터 지원",
      "템플릿·요소·사진 업로드",
      "스탯포인트 100 이상이면 유료 판매 가능",
      "리워드 정산"
    ],
    "needs": [
      "툴디 에디터로 만든 템플릿 또는 요소·사진"
    ],
    "pros": [
      "한 번 지원하면 템플릿·요소·사진 전부 가능"
    ],
    "cons": [
      "처음에는 무료 콘텐츠만 올릴 수 있음"
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
    "logo": "logos/tooldi.ico",
    "doWhat": "템플릿·요소·사진을 만들어 올려 판매",
    "how": "내 콘텐츠가 판매되거나 구독·인쇄에 쓰이면 리워드가 쌓여요. 툴디가 여는 챌린지에 참여해서 받는 보상도 있어요.",
    "amountShort": "판매 수수료 20% (등급별 12~17%)",
    "amount": "판매 수수료가 20%예요. 등급이 오르면 실버 17%, 골드 15%, 플래티넘 12%로 내려가요. 단가와 월 수익은 안내되지 않았어요. 페이지에 상위 크리에이터의 누적 지급 사례가 있지만 상위권 기준이라 참고만 하세요.",
    "timeNote": "템플릿은 툴디 에디터로 직접 만들어 올려요. 요소와 사진은 크리에이터 센터에서 올려요. 브론즈 등급(스탯포인트 100 이상)부터 유료 판매와 정산이 열려서, 그 전에는 무료 콘텐츠를 올리며 점수를 쌓아야 해요."
  },
  {
    "id": "miricanvas",
    "name": "MiriCanvas",
    "category": "디자인",
    "color": "#FF5C8A",
    "time": [
      "60"
    ],
    "skills": [
      "design"
    ],
    "difficulty": 2,
    "steps": [],
    "needs": [],
    "pros": [],
    "cons": [],
    "url": "https://designhub.miricanvas.com/ko/login?prevUrl=%2Fko%2Felement%2Fupload",
    "verified": false,
    "sources": [],
    "checked": null,
    "logo": null,
    "doWhat": "디자인 요소를 만들어 올림",
    "how": null,
    "amount": null,
    "amountShort": null,
    "timeNote": null
  },
  {
    "id": "redbubble",
    "name": "Redbubble",
    "category": "디자인",
    "color": "#E41321",
    "time": [
      "60"
    ],
    "skills": [
      "design"
    ],
    "difficulty": 2,
    "steps": [],
    "needs": [],
    "pros": [],
    "cons": [],
    "url": "https://www.redbubble.com/",
    "verified": false,
    "sources": [],
    "checked": null,
    "logo": null,
    "doWhat": "내 디자인을 올리면 티셔츠·스티커 같은 상품으로 판매",
    "how": null,
    "amount": null,
    "amountShort": null,
    "timeNote": null
  },
  {
    "id": "stibee",
    "name": "Stibee",
    "category": "글쓰기",
    "color": "#FF6B35",
    "time": [
      "60"
    ],
    "skills": [
      "writing"
    ],
    "difficulty": 2,
    "steps": [
      "주제 정하기",
      "스티비에서 제작·발송",
      "구독자 모으기",
      "수익 방식 직접 연결"
    ],
    "needs": [
      "꾸준히 쓸 수 있는 주제"
    ],
    "pros": [
      "발송·자동화·분석 기능이 한곳에 있음"
    ],
    "cons": [
      "수익 구조를 직접 만들어야 함"
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
    "logo": "logos/stibee.png",
    "doWhat": "뉴스레터를 만들어 발송하는 도구",
    "how": "여기서 바로 돈이 생기지는 않아요. 구독자를 모은 뒤 광고나 협찬을 직접 붙여야 해요.",
    "amountShort": "도구라 수익 없음",
    "amount": "요금제는 확인하지 못했어요.",
    "timeNote": "뉴스레터를 계속 써야 하고, 구독자를 모으는 시간이 따로 들어요."
  },
  {
    "id": "maily",
    "name": "Maily",
    "category": "글쓰기",
    "color": "#2D9CDB",
    "time": [
      "60"
    ],
    "skills": [
      "writing"
    ],
    "difficulty": 2,
    "steps": [
      "가입하고 뉴스레터 만들기",
      "글 발행",
      "구독자 모으기",
      "유료 멤버십 설정"
    ],
    "needs": [
      "꾸준히 쓸 수 있는 주제"
    ],
    "pros": [
      "무료 플랜으로 시작 가능"
    ],
    "cons": [
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
    "logo": null,
    "doWhat": "뉴스레터를 써서 발행",
    "how": "유료 멤버십 기능으로 구독자에게 유료 구독을 받을 수 있어요.",
    "amountShort": null,
    "amount": "유료 멤버십 수수료와 정산 조건은 확인하지 못했어요. 베이직 플랜은 무료이고 월 1,000건 발송, 월 4회 발행까지예요.",
    "timeNote": "정해 둔 주기로 계속 써야 해요. 구독자가 모이기까지 걸리는 시간은 사람마다 달라요."
  },
  {
    "id": "fiverr",
    "name": "Fiverr",
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
    "steps": [],
    "needs": [],
    "pros": [],
    "cons": [],
    "url": "https://www.fiverr.com/",
    "verified": false,
    "sources": [],
    "checked": null,
    "logo": null,
    "doWhat": "내 기술을 서비스로 등록하고 주문 받기",
    "how": null,
    "amount": null,
    "amountShort": null,
    "timeNote": null
  },
  {
    "id": "crowdworks",
    "name": "CrowdWorks",
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
    "steps": [],
    "needs": [],
    "pros": [],
    "cons": [],
    "url": "https://works.crowdworks.kr/",
    "verified": false,
    "sources": [],
    "checked": null,
    "logo": null,
    "doWhat": "AI 학습용 데이터 라벨링 작업",
    "how": null,
    "amount": null,
    "amountShort": null,
    "timeNote": null
  },
  {
    "id": "aiworks",
    "name": "AIWORKS",
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
    "steps": [],
    "needs": [],
    "pros": [],
    "cons": [],
    "url": "https://aiworks.co.kr/",
    "verified": false,
    "sources": [],
    "checked": null,
    "logo": null,
    "doWhat": "AI 데이터 작업",
    "how": null,
    "amount": null,
    "amountShort": null,
    "timeNote": null
  },
  {
    "id": "metworks",
    "name": "METWORKS",
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
    "steps": [],
    "needs": [],
    "pros": [],
    "cons": [],
    "url": "https://www.metworks.co.kr/",
    "verified": false,
    "sources": [],
    "checked": null,
    "logo": null,
    "doWhat": "AI 데이터 작업",
    "how": null,
    "amount": null,
    "amountShort": null,
    "timeNote": null
  },
  {
    "id": "labelon",
    "name": "LabelOn",
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
    "steps": [
      "실명으로 회원가입",
      "프로젝트 확인",
      "작업 참여",
      "크레딧 적립 후 입금"
    ],
    "needs": [
      "실명 가입",
      "만 15세 미만은 법정대리인 동의 필요"
    ],
    "pros": [
      "집에서 PC로 가능"
    ],
    "cons": [
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
    "logo": "logos/labelon.png",
    "doWhat": "AI 학습용 데이터에 라벨을 붙이는 작업 (어노테이터·리뷰어)",
    "how": "프로젝트에 참여해 작업하면 크레딧이 쌓여요. 사이트에 \"My Credit\"과 입금계좌관리 메뉴가 있어요.",
    "amountShort": null,
    "amount": "크레딧 단가와 출금 기준은 확인하지 못했어요.",
    "timeNote": "프로젝트가 열려 있을 때 참여해요. 사이트에 이용가이드와 체험하기 메뉴가 있어요."
  },
  {
    "id": "pandarank",
    "name": "판다랭크",
    "category": "블로그·쇼핑",
    "color": "#16A34A",
    "time": [
      "60"
    ],
    "skills": [
      "phone"
    ],
    "difficulty": 2,
    "steps": [
      "가입",
      "키워드·상품 분석",
      "블로그·스토어 운영",
      "수익화"
    ],
    "needs": [
      "블로그·스마트스토어·SNS 채널 중 하나"
    ],
    "pros": [
      "글감과 키워드 고르는 시간을 줄일 수 있음"
    ],
    "cons": [
      "수익은 내 채널 성과에 달림"
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
    "logo": "logos/pandarank.png",
    "doWhat": "블로그·스마트스토어용 키워드·상품 분석 도구",
    "how": "도구 자체는 수익을 주지 않아요. 분석한 걸로 블로그나 스토어를 운영해서, 쇼핑 커넥트나 체험단 같은 걸 직접 해야 해요.",
    "amountShort": "도구라 수익 없음",
    "amount": "요금제는 확인하지 못했어요. 가입하면 무료 크레딧을 준다고 안내돼 있어요.",
    "timeNote": "블로그나 스토어를 운영할 시간이 따로 필요해요."
  },
  {
    "id": "social-louder",
    "name": "Sociallouder",
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
    "steps": [],
    "needs": [],
    "pros": [],
    "cons": [],
    "url": "https://apps.apple.com/kr/app/id6747383642",
    "verified": false,
    "sources": [],
    "checked": null,
    "logo": null,
    "doWhat": "SNS 체험단에 참여해서 게시물 올리기",
    "how": "게시물을 올리면 포인트가 쌓이고, 현금으로 바꿀 수 있다고 앱스토어 설명에 적혀 있어요.",
    "amount": null,
    "amountShort": null,
    "timeNote": null
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
