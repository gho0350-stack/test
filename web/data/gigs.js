// 부업 데이터 — 화면과 분리된 단일 데이터 소스.
// 정산·조건은 2026-11-20 기준으로 공식 페이지와 대조한 내용입니다 (sources 참고).
export const GIGS = [
  {
    "id": "flitto",
    "name": "Flitto",
    "category": "언어",
    "color": "#2F6BFF",
    "logo": null,
    "time": [
      "5",
      "30",
      "60"
    ],
    "skills": [
      "language",
      "sound"
    ],
    "url": "https://www.flitto.com/arcade/",
    "doWhat": "번역·검수 같은 짧은 태스크를 하고 포인트 받기",
    "headline": "200,000P = US$140",
    "alert": null,
    "rows": [
      {
        "k": "얼마 벌어요",
        "v": "태스크마다 포인트가 달라요. 고정 시급은 없어요. 은행송금은 200,000P당 US$140예요."
      },
      {
        "k": "돈은 언제 받아요",
        "v": "200,000P부터 은행송금을 신청해요. 본인인증이 필요하고, 월~일 신청분은 다음 주 4영업일 안에 들어와요."
      },
      {
        "k": "시간은 얼마나 들어요",
        "v": "태스크마다 문제 수와 제한 시간이 달라요. 검수 뒤에 다시 해야 할 수도 있어요."
      },
      {
        "k": "어떻게 시작해요",
        "v": "가입하고 참여 언어를 등록해요. 일부 녹음·촬영 미션은 앱에서만 돼요."
      },
      {
        "k": "첫 수익까지",
        "v": "검수가 끝나면 포인트가 쌓여요. 현금은 200,000P를 채워야 받아요."
      }
    ],
    "example": "한 달에 200,000P를 모으면 US$140를 원화로 받아요. 환율에 따라 달라요.",
    "note": null,
    "sources": [
      {
        "label": "작업·참여 조건",
        "url": "https://support.flitto.com/hc/ko/articles/8623567564441--단문-참여-방법"
      },
      {
        "label": "현금 교환 기준",
        "url": "https://support.flitto.com/hc/ko/articles/4406338305433-스토어에서는-어떤-것들을-주문할-수-있나요"
      },
      {
        "label": "입금 일정 개정",
        "url": "https://support.flitto.com/hc/ko/articles/54416171951513-은행송금-Cash-out-상품의-입금-일정-변경-공지"
      }
    ],
    "checked": "2026-11-20"
  },
  {
    "id": "adobe-stock",
    "name": "Adobe Stock",
    "category": "스톡 판매",
    "color": "#E5322D",
    "logo": "logos/adobe-stock.png",
    "time": [
      "60"
    ],
    "skills": [
      "visual"
    ],
    "url": "https://contributor.stock.adobe.com/",
    "doWhat": "사진·영상·일러스트를 올려 두고 팔기",
    "headline": "팔릴 때마다 로열티 33~35%",
    "alert": null,
    "rows": [
      {
        "k": "얼마 벌어요",
        "v": "사진·일러스트는 33%, 영상은 35%예요. 대용량 구독으로 팔린 표준 이미지는 최소 $0.33부터고, 누적 판매량에 따라 $0.36, $0.38로 올라가요."
      },
      {
        "k": "돈은 언제 받아요",
        "v": "잔액 $25 이상이고 첫 판매 뒤 45일이 지나면 신청할 수 있어요. PayPal, Payoneer, Skrill로 받고 보통 7~10영업일 걸려요."
      },
      {
        "k": "시간은 얼마나 들어요",
        "v": "찍고, 보정하고, 제목·키워드를 적는 시간이 들어요. 올린 뒤 심사도 기다려야 해요."
      },
      {
        "k": "어떻게 시작해요",
        "v": "만 18세 이상이고, 내가 직접 만든 콘텐츠만 올릴 수 있어요. 이메일·전화 인증을 하고 지급 계정을 등록해요."
      },
      {
        "k": "첫 수익까지",
        "v": "언제 팔릴지는 몰라요. 첫 출금은 첫 판매 45일 뒤부터예요."
      }
    ],
    "example": "한 달에 100번 팔리고 모두 $0.33이면 $33이에요. 세금과 제작비는 빼기 전이에요.",
    "note": null,
    "sources": [
      {
        "label": "로열티·최소 금액",
        "url": "https://helpx.adobe.com/stock/contributor/payments-earnings/royalties-pricing/royalty-rates-assets.html"
      },
      {
        "label": "출금 조건·지급 기간",
        "url": "https://helpx.adobe.com/stock/contributor/payments-earnings/payment-taxes/request-payment-content.html"
      },
      {
        "label": "가입",
        "url": "https://helpx.adobe.com/stock/contributor/get-started/manage-your-account/sign-up-as-a-stock-contributor.html"
      }
    ],
    "checked": "2026-11-20"
  },
  {
    "id": "shutterstock",
    "name": "Shutterstock",
    "category": "스톡 판매",
    "color": "#EE2B2B",
    "logo": "logos/shutterstock.png",
    "time": [
      "60"
    ],
    "skills": [
      "visual"
    ],
    "url": "https://submit.shutterstock.com/",
    "doWhat": "사진·영상·벡터를 올려 팔고, AI 학습용 작업도 신청하기",
    "headline": "라이선스 수입의 15~40%",
    "alert": null,
    "rows": [
      {
        "k": "얼마 벌어요",
        "v": "이미지와 영상 각각 6개 등급이 있고, 등급이 높을수록 내 몫이 커져요. 매년 1월 1일에 등급이 초기화돼요. 건당 $0.10인 경우도 있어요."
      },
      {
        "k": "돈은 언제 받아요",
        "v": "최소 지급액을 $25 이상으로 정해요. 월초에 계산해서 15일까지 지급하고, 모자라면 다음 달로 넘어가요. 세금·지급 계정 정보가 필요해요."
      },
      {
        "k": "시간은 얼마나 들어요",
        "v": "촬영·편집하고 메타데이터를 적는 시간이 들어요. AI 학습용 의뢰 작업은 과제마다 마감이 있어요."
      },
      {
        "k": "어떻게 시작해요",
        "v": "만 18세 이상이에요. 제출 가이드라인을 지켜야 해요."
      },
      {
        "k": "첫 수익까지",
        "v": "심사를 통과한 뒤 첫 판매부터 쌓여요. 언제 팔릴지는 몰라요."
      }
    ],
    "example": "한 달에 100건이 모두 $0.10이면 $10이에요. 최소 지급액 $25에 못 미쳐서 다음 달로 넘어가요.",
    "note": "AI 학습용 의뢰 작업은 일반 판매와 보상 조건이 달라요.",
    "sources": [
      {
        "label": "로열티 등급",
        "url": "https://submit.shutterstock.com/help/en/articles/10594604-how-much-will-i-be-paid-as-a-contributor-to-shutterstock"
      },
      {
        "label": "소액 다운로드",
        "url": "https://submit.shutterstock.com/help/en/articles/12136655-why-am-i-still-seeing-0-10-earnings-at-higher-levels"
      },
      {
        "label": "최소 지급액",
        "url": "https://submit.shutterstock.com/help/en/articles/10594630-contributor-terms-of-service-2023-update"
      },
      {
        "label": "지급 일정",
        "url": "https://submit.shutterstock.com/help/en/collections/11599942-earnings-and-payments"
      }
    ],
    "checked": "2026-11-20"
  },
  {
    "id": "crowdpic",
    "name": "크라우드픽",
    "category": "스톡 판매",
    "color": "#1F9D8B",
    "logo": null,
    "time": [
      "60"
    ],
    "skills": [
      "visual"
    ],
    "url": "https://www.crowdpic.net/",
    "doWhat": "사진·일러스트·아이콘을 올려 팔기",
    "headline": "판매 수수료 50%",
    "alert": null,
    "rows": [
      {
        "k": "얼마 벌어요",
        "v": "JPG·PNG 1,000원이 팔리면 500P, AI·EPS·PSD 1,500원이 팔리면 750P가 쌓여요. 공모전은 수수료가 0%예요. API는 제휴 방식에 따라 달라요."
      },
      {
        "k": "돈은 언제 받아요",
        "v": "1P는 1원이에요. 5,000P부터 1,000원 단위로 출금해요. 개인은 3.3%를 떼고 받아요."
      },
      {
        "k": "시간은 얼마나 들어요",
        "v": "그리거나 찍고, 보정하고, 검색어를 적는 시간이 들어요."
      },
      {
        "k": "어떻게 시작해요",
        "v": "만 14세 이상이에요. 본인확인과 본인 명의 한국 계좌가 필요하고, 이미지 심사를 통과해야 해요."
      },
      {
        "k": "첫 수익까지",
        "v": "심사를 통과한 뒤 첫 판매부터 쌓여요. 5,000P를 채워야 출금할 수 있어요."
      }
    ],
    "example": "한 달에 JPG·PNG 20건이 팔리면 10,000원이에요. 원천징수와 제작비는 빼기 전이에요.",
    "note": null,
    "sources": [
      {
        "label": "요율·단가·출금·시작 조건",
        "url": "https://www.crowdpic.net/guide/uploader_guide"
      },
      {
        "label": "서비스·본인 명의 요건",
        "url": "https://www.crowdpic.net/guide/faq"
      }
    ],
    "checked": "2026-11-20"
  },
  {
    "id": "pond5",
    "name": "Pond5",
    "category": "스톡 판매",
    "color": "#F36C21",
    "logo": null,
    "time": [
      "60"
    ],
    "skills": [
      "visual",
      "sound"
    ],
    "url": "https://www.pond5.com/ko/",
    "doWhat": "영상·음악·효과음 소스를 올려 팔기",
    "headline": "판매액의 30% (독점 영상은 40%)",
    "alert": null,
    "rows": [
      {
        "k": "얼마 벌어요",
        "v": "일반 비독점은 30%, 독점 영상은 40%예요. 데이터셋 라이선스는 20%예요. 실제 금액은 판매가에 따라 달라요."
      },
      {
        "k": "돈은 언제 받아요",
        "v": "잔액 $25 이상이면 매달 15일에 지급해요. PayPal, Payoneer, Skrill 중에서 고르고, Skrill은 4%가 빠져요."
      },
      {
        "k": "시간은 얼마나 들어요",
        "v": "촬영·녹음·작곡·편집하고 태그를 넣는 시간이 들어요. 콘텐츠마다 달라요."
      },
      {
        "k": "어떻게 시작해요",
        "v": "기여자로 가입하고, 내 권리가 있는 파일과 필요한 동의서를 준비해요. 콘텐츠 심사를 받아요."
      },
      {
        "k": "첫 수익까지",
        "v": "판매 약 2일 뒤 대시보드에 반영돼요. $25가 넘으면 다음 지급일에 받아요."
      }
    ],
    "example": "일반 판매액이 한 달에 $100이면 $30이에요. 세금과 환전비는 빼기 전이에요.",
    "note": null,
    "sources": [
      {
        "label": "요율·지급·반영 시점",
        "url": "https://contributor.pond5.com/getting-started/payout-overview/"
      },
      {
        "label": "2025년 변경 공지",
        "url": "https://contributor.pond5.com/2024/12/11/pond5-contributor-agreement-update/"
      },
      {
        "label": "계약·권리 조건",
        "url": "https://www.pond5.com/legal/contributor"
      }
    ],
    "checked": "2026-11-20"
  },
  {
    "id": "audiojungle",
    "name": "AudioJungle",
    "category": "스톡 판매",
    "color": "#82B440",
    "logo": null,
    "time": [
      "60"
    ],
    "skills": [
      "sound"
    ],
    "url": "https://audiojungle.net/",
    "doWhat": "음악·효과음을 올려 팔기 (기존 작가만)",
    "headline": "작가 수수료 50%",
    "alert": "지금은 신규 작가를 받지 않아요. 음악·효과음은 재개 예정 목록에도 없어요.",
    "rows": [
      {
        "k": "얼마 벌어요",
        "v": "Item Price의 50%를 받아요. 구매자 수수료는 뺀 금액이에요. 원천징수와 송금 비용은 따로 나가요."
      },
      {
        "k": "돈은 언제 받아요",
        "v": "잔액 $50 이상이고 세금·지급 프로필을 설정해야 해요. 매월 8일에 수익이 잔액으로 옮겨지고 다음 지급일에 받아요."
      },
      {
        "k": "시간은 얼마나 들어요",
        "v": "음원을 만들고 믹싱하고 설명을 쓰는 시간이 들어요."
      },
      {
        "k": "어떻게 시작해요",
        "v": "신규 작가 신청은 지금 닫혀 있어요. 기존 작가는 신원·세금·지급 정보를 갖춰야 해요."
      },
      {
        "k": "첫 수익까지",
        "v": "신규 음악 작가는 지금 시작할 수 없어요."
      }
    ],
    "example": "한 달 Item Price가 $100이면 $50이에요. 세금과 송금비는 빼기 전이에요.",
    "note": null,
    "sources": [
      {
        "label": "현행 수수료·정산",
        "url": "https://help.author.envato.com/hc/en-us/articles/360000472943-Introduction-to-Earnings"
      },
      {
        "label": "신규 가입·음악 접수 중단",
        "url": "https://help.author.envato.com/hc/en-us/articles/900005349363-Beginner-s-Guide-to-Selling-on-Envato"
      },
      {
        "label": "지급 프로필",
        "url": "https://help.author.envato.com/hc/en-us/articles/20535795834393-Setting-up-your-Payout-profile"
      }
    ],
    "checked": "2026-11-20"
  },
  {
    "id": "artlist",
    "name": "Artlist",
    "category": "스톡 판매",
    "color": "#111111",
    "logo": null,
    "time": [
      "60"
    ],
    "skills": [
      "sound",
      "visual"
    ],
    "url": "https://artlist.io/",
    "doWhat": "영상·효과음·템플릿을 제공하는 기여자로 지원하기",
    "headline": "구독 순수익의 30%를 나눠요",
    "alert": "음악 신규 제출은 지금 받지 않아요.",
    "rows": [
      {
        "k": "얼마 벌어요",
        "v": "영상은 구독 순수익의 30%를 모아서 이용자 다운로드 기여도대로 나눠요. 건당 고정 단가는 없어요. 음악·효과음 지급률은 공개돼 있지 않아요."
      },
      {
        "k": "돈은 언제 받아요",
        "v": "영상·템플릿 기여자는 1년에 한 번, 12월~1월에 받아요. PayPal이나 Payoneer로 USD를 받아요."
      },
      {
        "k": "시간은 얼마나 들어요",
        "v": "촬영·편집·사운드 제작과 샘플 준비가 필요해요. 영상은 큐레이션 심사에 최대 3개월 걸려요."
      },
      {
        "k": "어떻게 시작해요",
        "v": "지원서와 포트폴리오, 샘플을 내고 선발돼서 계약해요. 내 저작권과 필요한 동의서가 있어야 해요."
      },
      {
        "k": "첫 수익까지",
        "v": "선발·계약·심사·공개를 거친 뒤 이용 실적이 생겨야 해요. 입금은 1년에 한 번이에요."
      }
    ],
    "example": null,
    "note": null,
    "sources": [
      {
        "label": "지원·음악 접수 중단",
        "url": "https://help.artlist.io/hc/en-us/articles/29496366354589-Submit-your-content-to-Artlist"
      },
      {
        "label": "영상 수익 배분",
        "url": "https://filmmakershub.artlist.io/hc/en-us/articles/8648555846289-Royalties-and-payout-system"
      },
      {
        "label": "심사·연간 정산",
        "url": "https://filmmakershub.artlist.io/hc/en-us/articles/8665849125137-FAQ"
      }
    ],
    "checked": "2026-11-20"
  },
  {
    "id": "tooldi",
    "name": "툴디",
    "category": "디자인",
    "color": "#6C5CE7",
    "logo": "logos/tooldi.ico",
    "time": [
      "60"
    ],
    "skills": [
      "design"
    ],
    "url": "https://www.tooldi.com/introduce-creator",
    "doWhat": "템플릿·요소·사진을 만들어 올려 팔기",
    "headline": "판매 수수료 20%, 등급이 오르면 최대 10%까지",
    "alert": null,
    "rows": [
      {
        "k": "얼마 벌어요",
        "v": "기본 20%예요. 실버 17%, 골드 15%, 플래티넘 12%, 수퍼브 10%로 내려가요. 구독·인쇄 리워드는 따로 계산해요."
      },
      {
        "k": "돈은 언제 받아요",
        "v": "브론즈 이상이고 출금 가능액이 10,000원 이상이면 신청해요. 신청 뒤 10영업일 안에 계좌로 들어와요. 본인 계좌와 증빙을 등록해야 해요."
      },
      {
        "k": "시간은 얼마나 들어요",
        "v": "만들고 올리는 시간이 들어요. 콘텐츠 심사는 최대 10영업일 걸려요."
      },
      {
        "k": "어떻게 시작해요",
        "v": "크리에이터 신청을 승인받고 콘텐츠 심사를 통과해요. 요소·사진은 별도 권한이 필요해요. 유료 판매와 출금은 브론즈 이상부터예요."
      },
      {
        "k": "첫 수익까지",
        "v": "심사를 통과한 뒤 팔리거나 쓰여야 쌓여요. 10,000원을 채워야 받을 수 있어요."
      }
    ],
    "example": "직접 판매가 한 달에 50,000원이면 40,000원이에요. 원천징수 전이에요.",
    "note": null,
    "sources": [
      {
        "label": "등급·수수료 개정",
        "url": "https://docs.tooldi.com/notice/2026-09-03/"
      },
      {
        "label": "출금 조건·기간",
        "url": "https://docs.tooldi.com/creator/settlement/withdraw/"
      },
      {
        "label": "시작·심사",
        "url": "https://docs.tooldi.com/creator/"
      },
      {
        "label": "기본 수수료·약관",
        "url": "https://policy.tooldi.com/creator-terms"
      }
    ],
    "checked": "2026-11-20"
  },
  {
    "id": "miricanvas",
    "name": "MiriCanvas",
    "category": "디자인",
    "color": "#FF5C8A",
    "logo": null,
    "time": [
      "60"
    ],
    "skills": [
      "design"
    ],
    "url": "https://designhub.miricanvas.com/ko/login?prevUrl=%2Fko%2Felement%2Fupload",
    "doWhat": "디자인 요소를 만들어 올리기",
    "headline": "사용 실적에 따라 로열티",
    "alert": null,
    "rows": [
      {
        "k": "얼마 벌어요",
        "v": "요소가 쓰이거나 다운로드되거나 인쇄에 쓰이면 로열티가 생겨요. 유형·사용 수·기여도로 계산하고, 구독은 풀로 나눠서 건당 단가가 정해져 있지 않아요."
      },
      {
        "k": "돈은 언제 받아요",
        "v": "누적 로열티가 100,000원이 된 달의 다음 달 25일에 송금해요. 모자라면 넘어가요. 정산 정보와 서류가 필요해요."
      },
      {
        "k": "시간은 얼마나 들어요",
        "v": "요소를 만들고 파일 규격을 맞추고 정보를 입력하는 시간이 들어요. 심사 대기도 있어요."
      },
      {
        "k": "어떻게 시작해요",
        "v": "디자인허브 기여자로 가입해요. 포트폴리오는 필수가 아니에요. 내 권리가 있는 콘텐츠를 내고 심사를 통과해요."
      },
      {
        "k": "첫 수익까지",
        "v": "심사를 통과한 뒤 실제로 쓰여야 생겨요. 처음 받는 건 10만 원이 쌓인 달의 다음 달 25일이에요."
      }
    ],
    "example": null,
    "note": null,
    "sources": [
      {
        "label": "기여자 약관·산정 구조",
        "url": "https://designhub.miricanvas.com/ko/terms"
      },
      {
        "label": "정확한 송금 시점",
        "url": "https://miricanvas-designhub.zendesk.com/hc/ko/articles/21153665162393-수익-지급-받기"
      },
      {
        "label": "가입·콘텐츠 안내",
        "url": "https://www.miricanvas.com/page/contributor/"
      }
    ],
    "checked": "2026-11-20"
  },
  {
    "id": "redbubble",
    "name": "Redbubble",
    "category": "디자인",
    "color": "#E41321",
    "logo": null,
    "time": [
      "60"
    ],
    "skills": [
      "design"
    ],
    "url": "https://www.redbubble.com/",
    "doWhat": "내 디자인을 올리면 티셔츠·스티커 같은 상품으로 팔아줘요",
    "headline": "내 월 수익에서 플랫폼 수수료 0~50%",
    "alert": null,
    "rows": [
      {
        "k": "얼마 벌어요",
        "v": "기본가격에 내 마진을 얹어요. 월 수익에서 Standard 50%, Premium 20%, Pro 0%를 떼요. Standard·Premium은 월 $150이 상한이에요. 마진을 20% 넘게 붙이면 넘는 부분에 50%가 또 붙어요."
      },
      {
        "k": "돈은 언제 받아요",
        "v": "수수료를 뺀 금액이 $10 이상이면 월초에 정산을 시작해서 보통 15일까지 넣어줘요. 모자라면 넘어가요."
      },
      {
        "k": "시간은 얼마나 들어요",
        "v": "디자인을 만들고 상품에 맞게 배치하고 태그를 적는 시간이 들어요. 제작과 배송은 Redbubble이 해요."
      },
      {
        "k": "어떻게 시작해요",
        "v": "내 권리가 있는 디자인을 올려요. 공개 판매 전에 디자인 5개 이상과 전화번호 인증이 필요해요. 한국 번호가 인증되는지는 확인하지 못했어요."
      },
      {
        "k": "첫 수익까지",
        "v": "디자인을 공개하고 첫 주문이 들어오면 시작이에요. 언제일지는 몰라요."
      }
    ],
    "example": "기본가격 $20 상품에 마진 20%를 붙여 한 달에 10개 팔면 마진이 $40이에요. Standard 수수료 50%를 빼면 $20이에요.",
    "note": null,
    "sources": [
      {
        "label": "계정 수수료",
        "url": "https://help.redbubble.com/hc/en-us/articles/50959863016724-How-does-my-Account-Tier-determine-my-account-fees"
      },
      {
        "label": "최소 지급액",
        "url": "https://help.redbubble.com/hc/en-us/articles/360027407652-What-is-the-Artist-Payment-Threshold"
      },
      {
        "label": "입금 시점",
        "url": "https://help.redbubble.com/hc/en-us/articles/202270389-When-do-I-get-paid"
      },
      {
        "label": "마진 계산",
        "url": "https://help.redbubble.com/hc/en-us/articles/202270799-How-is-my-payment-calculated"
      },
      {
        "label": "전화 인증·최소 디자인",
        "url": "https://help.redbubble.com/hc/en-us/articles/53472043298324-I-m-stuck-on-phone-number-verification-what-do-I-do"
      }
    ],
    "checked": "2026-11-20"
  },
  {
    "id": "stibee",
    "name": "Stibee",
    "category": "글쓰기",
    "color": "#FF6B35",
    "logo": "logos/stibee.png",
    "time": [
      "60"
    ],
    "skills": [
      "writing"
    ],
    "url": "https://stibee.com/",
    "doWhat": "유료 뉴스레터를 만들어 구독료 받기",
    "headline": "결제액의 3.52%만 떼요",
    "alert": null,
    "rows": [
      {
        "k": "얼마 벌어요",
        "v": "유료 구독 결제 수수료는 3.2%에 부가세를 더해 3.52%예요. 별도 중개수수료는 없어요. 스티비 요금제 이용료는 따로 내요."
      },
      {
        "k": "돈은 언제 받아요",
        "v": "한 달 구독료를 모아 다음 달 15일에 정산서를 주고 25일에 계좌로 넣어줘요. 연간 구독은 12개월로 나눠서 받아요."
      },
      {
        "k": "시간은 얼마나 들어요",
        "v": "기획하고 쓰고 편집하고 발송하는 시간이 들어요. 구독자 관리도 해야 해요."
      },
      {
        "k": "어떻게 시작해요",
        "v": "유료 구독을 지원하는 요금제(스탠다드·프로·엔터프라이즈)를 써야 해요. 유료 구독 주소록과 상품을 만들고 정산 정보를 등록해요."
      },
      {
        "k": "첫 수익까지",
        "v": "첫 유료 구독이 결제되면 시작이에요. 결제한 달의 다음 달 25일에 받아요. 구독자가 언제 모일지는 몰라요."
      }
    ],
    "example": "월 10,000원 구독자가 10명이면 100,000원이고, 결제 수수료를 빼면 96,480원이에요. 요금제 이용료는 빼기 전이에요.",
    "note": null,
    "sources": [
      {
        "label": "수수료·정산·이용 요금제",
        "url": "https://help.stibee.com/paid-newsletter/billing/process"
      },
      {
        "label": "유료 구독 주소록",
        "url": "https://help.stibee.com/paid-newsletter/settings/create"
      },
      {
        "label": "유료 서비스 이용료",
        "url": "https://policy.stibee.com/payment"
      }
    ],
    "checked": "2026-11-20"
  },
  {
    "id": "maily",
    "name": "Maily",
    "category": "글쓰기",
    "color": "#2D9CDB",
    "logo": null,
    "time": [
      "60"
    ],
    "skills": [
      "writing"
    ],
    "url": "https://maily.so/",
    "doWhat": "유료 뉴스레터를 써서 구독료 받기",
    "headline": "결제액의 20%를 떼요",
    "alert": null,
    "rows": [
      {
        "k": "얼마 벌어요",
        "v": "월간 구독 결제액에서 총 20%가 빠져요. 정산 도움말 기준으로 결제 수수료 약 3.3%, 부가세 약 10%, 서비스 수수료 약 6.7%예요. 사업소득으로 신고하면 원천세 3.3%가 따로 빠져요."
      },
      {
        "k": "돈은 언제 받아요",
        "v": "정산 대상액이 50,000원이 되면 출금할 수 있어요. 결제한 달의 다다음 달 10일에 정산돼요. 정산 정보를 내야 해요."
      },
      {
        "k": "시간은 얼마나 들어요",
        "v": "기획하고 쓰고 편집해서 발행하는 시간이 들어요. 회원 관리도 해야 해요."
      },
      {
        "k": "어떻게 시작해요",
        "v": "뉴스레터를 만들고 멤버십 가격을 정해요. 월 멤버십은 최대 10만 원이에요. 출금할 때 본인·계좌·신분증 정보가 필요해요."
      },
      {
        "k": "첫 수익까지",
        "v": "첫 멤버십이 결제되면 시작이에요. 5만 원이 쌓이고 정산일이 돼야 받아요."
      }
    ],
    "example": "월 10,000원 구독자 10명이면 100,000원이고, 20%를 빼면 80,000원이에요. 원천세 3.3%까지 빼면 77,360원이에요.",
    "note": null,
    "sources": [
      {
        "label": "수수료·최소금액·입금일",
        "url": "https://maily.so/app/guides/monetization/withdraw"
      },
      {
        "label": "멤버십 가격·설정",
        "url": "https://maily.so/app/guides/monetization/membership"
      },
      {
        "label": "약관",
        "url": "https://maily.so/app/service_policy"
      }
    ],
    "checked": "2026-11-20"
  },
  {
    "id": "fiverr",
    "name": "Fiverr",
    "category": "재능 판매",
    "color": "#1DBF73",
    "logo": null,
    "time": [
      "60"
    ],
    "skills": [
      "design",
      "writing",
      "language"
    ],
    "url": "https://www.fiverr.com/",
    "doWhat": "내 기술을 서비스로 등록하고 주문받기",
    "headline": "주문 금액의 80%",
    "alert": null,
    "rows": [
      {
        "k": "얼마 벌어요",
        "v": "완료한 주문의 80%가 내 몫이에요. 수수료는 20%예요. 추가 옵션과 팁도 포함돼요. 가격은 내가 정해요."
      },
      {
        "k": "돈은 언제 받아요",
        "v": "보통 주문을 완료하고 14일이 지나야 출금할 수 있어요. PayPal·Payoneer·은행송금을 쓸 수 있고, 방식마다 최소 금액과 수수료가 달라요."
      },
      {
        "k": "시간은 얼마나 들어요",
        "v": "고객과 이야기하고, 만들고, 수정하고, 납품하는 시간이 다 들어요. 주문 범위와 납기에 따라 달라요."
      },
      {
        "k": "어떻게 시작해요",
        "v": "만 18세 이상이에요. 13~17세는 보호자가 관리하는 계정만 쓸 수 있어요. 프로필과 서비스(Gig)를 만들고 필요한 인증을 해요."
      },
      {
        "k": "첫 수익까지",
        "v": "첫 주문이 언제 들어올지는 몰라요. 납품한 뒤에도 14일을 더 기다려야 해요."
      }
    ],
    "example": "$50짜리 주문을 한 달에 4건 끝내면 $200이고, 80%인 $160이에요. 세금과 환전비는 빼기 전이에요.",
    "note": null,
    "sources": [
      {
        "label": "판매자 몫·안전 대기",
        "url": "https://www.fiverr.com/legal-portal/legal-terms/payment-terms-of-service"
      },
      {
        "label": "출금 방식",
        "url": "https://help.fiverr.com/hc/en-us/articles/360010530058-Withdrawing-your-earnings-managing-payout-methods"
      },
      {
        "label": "연령·가입",
        "url": "https://help.fiverr.com/hc/en-us/articles/37331817242385-Creating-your-Fiverr-account"
      }
    ],
    "checked": "2026-11-20"
  },
  {
    "id": "crowdworks",
    "name": "CrowdWorks",
    "category": "데이터 작업",
    "color": "#0B5FFF",
    "logo": null,
    "time": [
      "5",
      "30",
      "60"
    ],
    "skills": [
      "phone"
    ],
    "url": "https://works.crowdworks.kr/",
    "doWhat": "AI 학습용 데이터 라벨링 작업하기",
    "headline": "1P = 1원",
    "alert": null,
    "rows": [
      {
        "k": "얼마 벌어요",
        "v": "공고마다 건당 포인트와 작업량이 달라요. 고정 시급은 없어요."
      },
      {
        "k": "돈은 언제 받아요",
        "v": "1,000원 단위로 출금하고, 매주 등록한 계좌로 입금돼요. 최소 금액과 정확한 요일은 가입 후에 한 번 더 확인해 주세요."
      },
      {
        "k": "시간은 얼마나 들어요",
        "v": "교육과 가이드를 읽고, 작업하고, 반려되면 고치는 시간이 들어요."
      },
      {
        "k": "어떻게 시작해요",
        "v": "작업자로 가입하고 프로젝트마다 자격과 테스트를 통과해요. 촬영·녹음은 스마트폰, 일부 라벨링은 PC가 필요해요. 본인 계좌를 등록해요."
      },
      {
        "k": "첫 수익까지",
        "v": "가입해도 바로 일이 있는 건 아니에요. 프로젝트에 배정되고 승인되면 포인트가 들어와요."
      }
    ],
    "example": null,
    "note": "출금 기준은 앱 설명과 과거 후기를 바탕으로 한 거라 정확하지 않을 수 있어요.",
    "sources": [
      {
        "label": "공식 작업자 사이트",
        "url": "https://works.crowdworks.kr/"
      },
      {
        "label": "공식 개발자 앱 설명",
        "url": "https://play.google.com/store/apps/details?hl=ko&id=kr.crowdworks"
      },
      {
        "label": "과거 출금 후기(보조, 현행 확정 아님)",
        "url": "https://rains212.tistory.com/26?category=1119348"
      }
    ],
    "checked": "2026-11-20"
  },
  {
    "id": "aiworks",
    "name": "aiworks Plus",
    "category": "데이터 작업",
    "color": "#3B82F6",
    "logo": null,
    "time": [
      "30",
      "60"
    ],
    "skills": [
      "phone"
    ],
    "url": "https://aiworksplus.com/",
    "doWhat": "AI 학습용 이미지·영상·음성·텍스트 데이터 모으고 가공하기",
    "headline": null,
    "alert": "aiworks가 aiworks Plus로 이름이 바뀌었어요. 새 작업자 사이트는 직접 열어보지 못했어요.",
    "rows": [
      {
        "k": "얼마 벌어요",
        "v": "유상 과제는 포인트를 받아요. 봉사활동 과제는 현금이 아니에요. 지금 단가와 수수료는 공개된 자료에서 찾지 못했어요."
      },
      {
        "k": "돈은 언제 받아요",
        "v": "최소 출금액과 지급 주기는 로그인 후 안내에서 확인해야 해요."
      },
      {
        "k": "시간은 얼마나 들어요",
        "v": "수집·녹음·라벨링하는 시간이 들어요. 과제마다 교육과 장비가 달라요."
      },
      {
        "k": "어떻게 시작해요",
        "v": "aiworks Plus에서 가입하고 모집 중인 과제를 확인해요."
      },
      {
        "k": "첫 수익까지",
        "v": "지금 모집 상황을 확인해야 알 수 있어요."
      }
    ],
    "example": null,
    "note": null,
    "sources": [
      {
        "label": "현재 이름·공식 연결 주소",
        "url": "https://aiworkx.ai/contents/aiworks.html?lan=null"
      },
      {
        "label": "운영사 과거 참여 안내",
        "url": "https://blog.aiworkx.ai/aiworks/?lan=en"
      },
      {
        "label": "이전 서비스 후기(역사적 참고)",
        "url": "https://mac-os.tistory.com/213"
      }
    ],
    "checked": "2026-11-20"
  },
  {
    "id": "metworks",
    "name": "METWORKS",
    "category": "데이터 작업",
    "color": "#0EA5A4",
    "logo": null,
    "time": [
      "30",
      "60"
    ],
    "skills": [
      "phone"
    ],
    "url": "https://www.metworks.co.kr/",
    "doWhat": "AI 학습용 텍스트·이미지·영상·음성 미션과 설문 참여하기",
    "headline": "10,000P = 10,000원",
    "alert": null,
    "rows": [
      {
        "k": "얼마 벌어요",
        "v": "미션마다 단가와 제출량이 달라요. 일반 포인트는 10,000P를 10,000원으로 바꿔요. 출금할 때 3.3%가 빠져요."
      },
      {
        "k": "돈은 언제 받아요",
        "v": "일반 포인트는 10,000P부터 10,000원 단위로 신청해요. 현금포인트는 기한 안에 전액 신청해요. 수요일 17시까지 신청하면 다음 주 목요일에 들어와요."
      },
      {
        "k": "시간은 얼마나 들어요",
        "v": "미션 종류에 따라 수집·가공·설문 시간이 들어요. 가이드를 읽고 검수를 기다리는 시간도 있어요."
      },
      {
        "k": "어떻게 시작해요",
        "v": "가입하고 등급에 맞는 미션을 해요. 계좌와 소득 신고용 본인 정보가 필요해요."
      },
      {
        "k": "첫 수익까지",
        "v": "검수가 끝나야 포인트가 쌓여요. 첫 미션이 언제 배정될지는 몰라요."
      }
    ],
    "example": "승인된 포인트가 10,000P면 3.3%를 빼고 9,670원이에요.",
    "note": null,
    "sources": [
      {
        "label": "서비스·미션",
        "url": "https://www.metworks.co.kr/home/main/"
      },
      {
        "label": "검수·출금·지급 정책",
        "url": "https://www.metworks.co.kr/home/guide/point_policy.php"
      },
      {
        "label": "2024년 세금 공제 변경",
        "url": "https://www.metworks.co.kr/home/guide/notice_view.php?no=146"
      }
    ],
    "checked": "2026-11-20"
  },
  {
    "id": "labelon",
    "name": "LabelOn",
    "category": "데이터 작업",
    "color": "#7C3AED",
    "logo": "logos/labelon.png",
    "time": [
      "30",
      "60"
    ],
    "skills": [
      "phone"
    ],
    "url": "https://www.labelon.kr/",
    "doWhat": "AI 학습용 데이터에 라벨 붙이기 (어노테이터·리뷰어)",
    "headline": null,
    "alert": null,
    "rows": [
      {
        "k": "얼마 벌어요",
        "v": "프로젝트와 작업 유형마다 보상이 달라요. 지금 기준의 단가와 크레딧 환산은 공개돼 있지 않아요."
      },
      {
        "k": "돈은 언제 받아요",
        "v": "본인 계좌와 정산 서류가 필요해요. 2022년 공지에는 40,000원 미만은 다음 달로 넘어간다고 돼 있는데, 지금도 같은지는 확인하지 못했어요."
      },
      {
        "k": "시간은 얼마나 들어요",
        "v": "가이드를 읽고 라벨링하고 검수·수정하는 시간이 들어요. 프로젝트 물량에 따라 달라요."
      },
      {
        "k": "어떻게 시작해요",
        "v": "실명으로 가입해요. 만 15세 미만은 법정대리인 동의가 필요해요."
      },
      {
        "k": "첫 수익까지",
        "v": "작업과 검수가 끝나 크레딧이 확정돼야 해요. 일정은 공개돼 있지 않아요."
      }
    ],
    "example": null,
    "note": null,
    "sources": [
      {
        "label": "서비스·가입 약관",
        "url": "https://www.labelon.kr/"
      },
      {
        "label": "크레딧 FAQ 목록",
        "url": "https://www.labelon.kr/guide/faq/faqList"
      },
      {
        "label": "과거 정산 공지(2022년)",
        "url": "https://www.labelon.kr/guide/notice/noticeDetail?id=30167"
      }
    ],
    "checked": "2026-11-20"
  },
  {
    "id": "pandarank",
    "name": "판다랭크",
    "category": "블로그·쇼핑",
    "color": "#16A34A",
    "logo": "logos/pandarank.png",
    "time": [
      "60"
    ],
    "skills": [
      "phone"
    ],
    "url": "https://pandarank.net/",
    "doWhat": "블로그·스토어 키워드 분석, AI 글쓰기, 쇼핑커넥트, 체험단을 돕는 도구",
    "headline": "도구 자체로는 수익이 없어요",
    "alert": null,
    "rows": [
      {
        "k": "얼마 벌어요",
        "v": "분석하고 글을 쓴다고 돈이 나오지는 않아요. 제휴 판매가 생기거나 체험단·광고 계약이 되면 그 조건대로 받아요. 도구 이용료와 제휴 수수료는 따로예요."
      },
      {
        "k": "돈은 언제 받아요",
        "v": "제휴 플랫폼, 광고주, 체험단 캠페인의 지급 조건을 따라요. 구매가 확정돼야 받는 경우가 많아요."
      },
      {
        "k": "시간은 얼마나 들어요",
        "v": "키워드 조사, 글 검토·발행, 채널 관리, 직접 써보는 시간이 들어요. AI 기능을 써도 총 시간은 알려져 있지 않아요."
      },
      {
        "k": "어떻게 시작해요",
        "v": "블로그·스마트스토어·SNS 채널이 하나는 있어야 해요."
      },
      {
        "k": "첫 수익까지",
        "v": "도구만 써서는 안 생겨요. 실제 구매나 계약이 있어야 해요."
      }
    ],
    "example": null,
    "note": null,
    "sources": [
      {
        "label": "현재 기능·수익화 경로",
        "url": "https://pandarank.net/"
      },
      {
        "label": "쇼핑커넥트·PC 기능 요건",
        "url": "https://www.pandarank.net/faq"
      }
    ],
    "checked": "2026-11-20"
  },
  {
    "id": "social-louder",
    "name": "Sociallouder",
    "category": "SNS",
    "color": "#8A4DFF",
    "logo": null,
    "time": [
      "30",
      "60"
    ],
    "skills": [
      "sns"
    ],
    "url": "https://sociallouder.com/",
    "doWhat": "SNS 체험단에 참여해서 게시물·리뷰 올리기",
    "headline": "캠페인마다 포인트·혜택이 달라요",
    "alert": null,
    "rows": [
      {
        "k": "얼마 벌어요",
        "v": "선정된 캠페인에서 포인트나 제품·관람 혜택을 받아요. 포인트는 현금으로 바꿀 수 있지만 제품과 관람권은 현금이 아니에요. 공통 단가는 공개돼 있지 않아요."
      },
      {
        "k": "돈은 언제 받아요",
        "v": "모집 공고에는 포인트 출금이 된다고 나와 있어요. 최소 출금액과 입금일은 공식 원문에서 확인하지 못했어요."
      },
      {
        "k": "시간은 얼마나 들어요",
        "v": "관람하고 촬영하고 리뷰를 쓰고 올리는 시간이 들어요. 캠페인마다 게시 기한과 유지 조건이 있어요."
      },
      {
        "k": "어떻게 시작해요",
        "v": "내 SNS·블로그 채널로 신청하고 선정돼야 해요. 채널과 팔로워 조건은 캠페인마다 달라요."
      },
      {
        "k": "첫 수익까지",
        "v": "선정되고 미션을 끝내고 검수받은 뒤에 받아요. 첫 선정 시점은 몰라요."
      }
    ],
    "example": null,
    "note": null,
    "sources": [
      {
        "label": "공식 캠페인 목록",
        "url": "https://sociallouder.com/"
      },
      {
        "label": "공식 소개서",
        "url": "https://sociallouder.com/pds/AllinONE.pdf"
      },
      {
        "label": "운영사 모집 공고 재게시(보조)",
        "url": "https://www.all-con.co.kr/view/contest/534594?device=pc"
      }
    ],
    "checked": "2026-11-20"
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
