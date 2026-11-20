// 부업 데이터 — 화면과 분리된 단일 데이터 소스.
// 앱으로 옮길 때는 이 파일을 서버 JSON으로 바꾸면 됩니다.
// verified:false 항목은 공식 사이트에서 확인한 뒤 수정하세요.
export const GIGS = [
  {
    "id": "flitto",
    "name": "플리토",
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
    "verified": false
  },
  {
    "id": "adobe-stock",
    "name": "어도비 스톡",
    "tagline": "찍어둔 사진이나 영상을 올려 두고 팔기",
    "category": "스톡 판매",
    "color": "#E5322D",
    "time": [
      "60"
    ],
    "skills": [
      "visual"
    ],
    "difficulty": 3,
    "earnType": "팔릴 때마다 로열티",
    "cadence": "올려 둔 만큼, 천천히",
    "summary": "내가 만든 사진·영상·일러스트를 올려두면 누가 쓸 때마다 로열티가 들어와요. 올릴 때 손이 많이 가고, 수익은 그 뒤에 천천히 생기는 편이에요.",
    "steps": [
      "기여자로 가입",
      "파일 올리고 제목·키워드 적기",
      "심사 기다리기",
      "팔리면 정산"
    ],
    "needs": [
      "카메라나 스마트폰",
      "저작권·초상권 문제가 없는 파일"
    ],
    "pros": [
      "한 번 올리면 계속 팔릴 수 있음",
      "이미 갖고 있는 사진으로 시작 가능"
    ],
    "cons": [
      "심사에서 떨어지는 일이 흔함",
      "첫 수익까지 오래 걸릴 수 있음"
    ],
    "url": "https://stock.adobe.com/kr",
    "verified": false
  },
  {
    "id": "shutterstock",
    "name": "셔터스톡",
    "tagline": "사진·영상·음악을 올려 두고 팔기",
    "category": "스톡 판매",
    "color": "#EE2B2B",
    "time": [
      "60"
    ],
    "skills": [
      "visual"
    ],
    "difficulty": 3,
    "earnType": "팔릴 때마다 로열티",
    "cadence": "올려 둔 만큼, 천천히",
    "summary": "세계적인 스톡 마켓이에요. 기여자로 등록해 사진, 영상, 일러스트 등을 올리면 다운로드될 때마다 수익이 생겨요.",
    "steps": [
      "기여자로 가입",
      "샘플 파일 심사",
      "승인 후 파일 업로드",
      "판매되면 정산"
    ],
    "needs": [
      "카메라나 스마트폰",
      "저작권·초상권 문제가 없는 파일"
    ],
    "pros": [
      "전 세계에 팔 수 있음",
      "어도비 스톡과 같은 파일을 같이 올리는 사람이 많음"
    ],
    "cons": [
      "처음 승인받기가 쉽지 않음",
      "수익이 들쭉날쭉함"
    ],
    "url": "https://www.shutterstock.com/ko/",
    "verified": false
  },
  {
    "id": "crowdpic",
    "name": "크라우드픽",
    "tagline": "국내 사진 마켓에 내 사진 올리기",
    "category": "스톡 판매",
    "color": "#1F9D8B",
    "time": [
      "60"
    ],
    "skills": [
      "visual"
    ],
    "difficulty": 2,
    "earnType": "다운로드·판매 시 수익",
    "cadence": "올려 둔 만큼",
    "summary": "국내 이용자에게 사진을 파는 마켓이에요. 사진을 올려 두면 구매나 다운로드가 일어날 때 수익이 생겨요. 해외 스톡보다 한국 분위기의 사진을 찾는 수요가 있어요.",
    "steps": [
      "회원 가입 후 작가 등록",
      "사진 업로드와 태그 입력",
      "검수 통과",
      "판매되면 정산"
    ],
    "needs": [
      "사진 파일",
      "초상권·저작권 확인"
    ],
    "pros": [
      "국내 이용자 대상이라 한국 소재 사진에 유리",
      "해외 마켓보다 영어 부담이 적음"
    ],
    "cons": [
      "시장이 해외 스톡보다 작음",
      "수익 구조는 공식 사이트에서 확인 필요"
    ],
    "url": "https://www.crowdpic.net/",
    "verified": false
  },
  {
    "id": "pond5",
    "name": "폰드5",
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
    "verified": false
  },
  {
    "id": "audiojungle",
    "name": "오디오정글",
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
    "verified": false
  },
  {
    "id": "artlist",
    "name": "아트리스트",
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
    "verified": false
  },
  {
    "id": "tooldi",
    "name": "툴디",
    "tagline": "디자인 요소를 만들어 올리기",
    "category": "디자인",
    "color": "#6C5CE7",
    "time": [
      "60"
    ],
    "skills": [
      "design"
    ],
    "difficulty": 2,
    "earnType": "크리에이터 수익",
    "cadence": "올려 둔 만큼",
    "summary": "디자인 툴 툴디에 쓰이는 요소를 만들어 올리는 크리에이터 프로그램이 있어요. 디자인 파일을 올려 두면 다른 사람들이 가져다 써요.",
    "steps": [
      "크리에이터 가입",
      "디자인 요소 제작",
      "업로드와 심사",
      "사용되면 수익"
    ],
    "needs": [
      "일러스트나 디자인 툴 사용 능력"
    ],
    "pros": [
      "디자인 실력을 수익으로 연결 가능",
      "한국 사용자 대상"
    ],
    "cons": [
      "수익 구조는 크리에이터 안내에서 확인 필요"
    ],
    "url": "https://www.tooldi.com/introduce-creator",
    "verified": false
  },
  {
    "id": "miricanvas",
    "name": "미리캔버스 크리에이터",
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
    "verified": false
  },
  {
    "id": "redbubble",
    "name": "레드버블",
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
    "verified": false
  },
  {
    "id": "stibee",
    "name": "스티비",
    "tagline": "뉴스레터를 발행해서 독자 모으기",
    "category": "글쓰기",
    "color": "#FF6B35",
    "time": [
      "60"
    ],
    "skills": [
      "writing"
    ],
    "difficulty": 2,
    "earnType": "구독·광고 등 직접 설계",
    "cadence": "발행 주기에 따라",
    "summary": "국내 뉴스레터 발송 도구예요. 수익이 바로 생기는 서비스는 아니고, 구독자를 모아서 광고나 협찬, 유료 구독으로 이어가는 식이에요.",
    "steps": [
      "뉴스레터 주제 정하기",
      "스티비로 발행",
      "구독자 모으기",
      "수익 방식 붙이기"
    ],
    "needs": [
      "꾸준히 쓸 수 있는 주제",
      "글쓰기"
    ],
    "pros": [
      "내 독자를 직접 가질 수 있음",
      "주제를 자유롭게 정함"
    ],
    "cons": [
      "구독자 모으기가 가장 어려움",
      "수익까지 시간이 걸림"
    ],
    "url": "https://stibee.com/",
    "verified": false
  },
  {
    "id": "maily",
    "name": "메일리",
    "tagline": "글을 쓰고 구독으로 수익 만들기",
    "category": "글쓰기",
    "color": "#2D9CDB",
    "time": [
      "60"
    ],
    "skills": [
      "writing"
    ],
    "difficulty": 2,
    "earnType": "유료 구독 등",
    "cadence": "발행 주기에 따라",
    "summary": "뉴스레터를 발행하고 유료 구독을 받을 수 있는 플랫폼이에요. 전문 지식이나 취향 있는 글을 쓰는 사람에게 맞아요.",
    "steps": [
      "글 주제 정하고 가입",
      "뉴스레터 발행",
      "구독자 모으기",
      "유료 구독 설정"
    ],
    "needs": [
      "꾸준히 쓸 수 있는 주제",
      "글쓰기"
    ],
    "pros": [
      "유료 구독을 바로 받아볼 수 있음",
      "독자와 직접 연결"
    ],
    "cons": [
      "구독자가 없으면 수익이 없음",
      "꾸준히 써야 함"
    ],
    "url": "https://maily.so/",
    "verified": false
  },
  {
    "id": "fiverr",
    "name": "파이버",
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
    "verified": false
  },
  {
    "id": "crowdworks",
    "name": "크라우드웍스",
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
    "verified": false
  },
  {
    "id": "aiworks",
    "name": "에이아이웍스",
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
    "verified": false
  },
  {
    "id": "databakery",
    "name": "데이터 베이커리",
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
    "verified": false
  },
  {
    "id": "metworks",
    "name": "메트웍스",
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
    "verified": false
  },
  {
    "id": "labelon",
    "name": "라벨온",
    "tagline": "라벨링 작업 참여하기",
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
    "earnType": "작업 건당 보상",
    "cadence": "프로젝트가 열릴 때",
    "summary": "데이터에 이름표를 붙이는 라벨링 작업 플랫폼이에요. 정확한 작업 방식과 보상은 공식 사이트에서 확인이 필요해요.",
    "steps": [
      "가입",
      "프로젝트 확인",
      "작업",
      "검수 후 보상"
    ],
    "needs": [
      "PC나 스마트폰"
    ],
    "pros": [
      "(확인 후 작성)"
    ],
    "cons": [
      "(확인 후 작성)"
    ],
    "url": "https://www.labelon.kr/",
    "verified": false
  },
  {
    "id": "pandarank",
    "name": "판다랭크",
    "tagline": "온라인 판매할 때 쓰는 분석 도구",
    "category": "온라인 판매",
    "color": "#16A34A",
    "time": [
      "60"
    ],
    "skills": [
      "phone"
    ],
    "difficulty": 2,
    "earnType": "(판매 수익은 본인 하기 나름)",
    "cadence": "상품 준비 시간에 따라",
    "summary": "스마트스토어 같은 온라인 판매를 할 때 상품과 키워드를 살펴보는 도구로 알고 있어요. 이 서비스를 쓰면 바로 돈이 생기는 건 아니고, 판매 부업을 준비하는 사람이 활용해요.",
    "steps": [
      "서비스 가입",
      "팔 상품과 키워드 조사",
      "스토어에 등록",
      "판매"
    ],
    "needs": [
      "판매할 상품",
      "스토어 운영"
    ],
    "pros": [
      "어떤 상품을 팔지 정하는 데 도움이 될 수 있음"
    ],
    "cons": [
      "판매 자체는 따로 해야 함",
      "사업자 등록이 필요할 수 있음"
    ],
    "url": "https://pandarank.net/",
    "verified": false
  },
  {
    "id": "social-louder",
    "name": "소셜라우더",
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
    "verified": false
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
