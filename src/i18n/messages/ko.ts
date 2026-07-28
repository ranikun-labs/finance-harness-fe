import type { Messages } from '@/i18n/dictionary';

/**
 * canonical 사전. 기존 placeholder 컴포넌트가 쓰던 문자열을 바이트 단위로 그대로
 * 옮겼다 — 기존 Vitest/Playwright assertion(`/공개 웹 홈/`, `'홈'`, `'페이지를 찾을
 * 수 없어요'` 등)이 이 값에 의존하므로 임의로 다듬지 않는다.
 */
export const ko: Messages = {
  common: {
    appName: 'AI 투자 체크리스트',
  },
  nav: {
    home: '홈',
    ask: '질문',
    journal: '기록',
    ariaLabel: '주요 화면 이동',
  },
  public: {
    home: { title: '공개 웹 홈' },
    features: { title: '기능 소개' },
    learn: { title: '학습' },
    notFound: {
      heading: '공개 페이지를 찾을 수 없어요',
      description: '주소를 다시 확인해주세요.',
      backHome: '홈으로',
    },
    localeSwitcher: { ariaLabel: '언어 선택' },
  },
  recordTags: {
    entryType: { investment: '투자 기록', study: '공부 노트' },
    action: { interest: '관심', watching: '관망', buy: '매수', sell: '매도' },
    emotion: { FOMO: 'FOMO', 불안: '불안', 확신: '확신', 관망: '관망', 혼란: '혼란' },
  },
  app: {
    home: { title: 'Home' },
    ask: {
      title: 'Ask 결과',
      titleWithQuery: 'Ask 결과 — {{query}}',
      header: {
        title: 'AI 체크',
        backLabel: '홈으로 돌아가기',
      },
      empty: {
        title: '아직 확인할 질문이 없어요',
        description: '질문을 남기면 확인할 관점과 기록할 질문의 예시를 볼 수 있어요.',
        cta: '질문하러 가기',
      },
      questionLabel: '내 질문',
      perspectives: {
        heading: '예시 체크 관점',
        items: {
          businessContext: '사업 맥락',
          industryTrends: '산업 흐름',
          earningsAssumptions: '실적 전제',
          pricedInExpectations: '가격 반영 수준',
          currencyAndRates: '환율·금리',
          biasAndCounterEvidence: '판단 편향과 반대 근거',
        },
      },
      checklist: {
        heading: '확인할 항목',
        count: '6개',
        items: {
          businessContext: {
            title: '사업 맥락',
            description: '수익 구조와 핵심 사업 전제가 무엇인지 확인하세요.',
          },
          industryTrends: {
            title: '산업 흐름',
            description: '산업의 수요와 공급 흐름이 어떤지 확인하세요.',
          },
          earningsAssumptions: {
            title: '실적 전제',
            description: '기대하는 실적에 어떤 가정이 포함됐는지 확인하세요.',
          },
          pricedInExpectations: {
            title: '가격 반영 수준',
            description: '현재 가격에 기대가 얼마나 반영되었는지 확인하세요.',
          },
          currencyAndRates: {
            title: '환율·금리',
            description: '환율과 금리 변화가 전제에 미치는 영향을 확인하세요.',
          },
          biasAndCounterEvidence: {
            title: '판단 편향과 반대 근거',
            description: '내 판단의 편향과 반대 근거가 무엇인지 함께 확인하세요.',
          },
        },
      },
      fixtureNotice:
        '이 화면은 기능 확인용 예시이며, 실제 질문 분석이나 투자 자문 결과가 아닙니다.',
      recordQuestions: {
        heading: '다음 기록에 남길 질문',
        items: {
          businessAssumption: '내가 중요하게 본 사업 전제는 무엇인가?',
          evidenceToCheck: '산업과 실적 기대 중 확인이 더 필요한 것은 무엇인가?',
          counterEvidence: '내 판단을 바꿀 수 있는 반대 근거는 무엇인가?',
        },
      },
      navigation: {
        studyNote: '공부 노트',
        investmentRecord: '투자 기록',
        askAgain: '추가 질문',
      },
    },
    journalList: {
      title: '기록',
      filters: {
        groupLabel: '기록 유형 필터',
        all: '전체',
        investment: '투자 기록',
        study: '공부 노트',
      },
      emotionLabel: '감정',
      noEmotion: '감정 태그 없음',
      checkedProgress: '체크 완료 {{checked}}/{{total}}',
      countLabel: '{{count}}개의 기록',
      emptyAll: {
        title: '아직 저장된 기록이 없어요',
        description: '질문을 체크리스트로 바꾸고 첫 기록을 남겨보세요.',
        cta: '질문하러 가기',
        hint: '질문 하나가 체크리스트가 되고, 체크리스트가 나만의 기록이 돼요.',
      },
      emptyFilter: {
        title: '해당 유형의 기록이 아직 없어요',
        description: '다른 유형을 선택하거나 전체 기록을 확인해보세요.',
        resetAction: '전체 보기',
      },
      subjects: {
        semiconductorCompanyA: '반도체 기업 A',
        platformCompanyB: '플랫폼 기업 B',
        batteryCompanyC: '배터리 기업 C',
      },
    },
    journalNew: {
      investment: '일지 저장 (투자 기록)',
      study: '공부 노트 저장',
    },
    journalDetail: { title: '일지 상세 — {{id}}' },
    journalReview: { title: '복기 — {{id}}' },
    onboarding: {
      title: '온보딩',
      productName: 'AI 투자 체크리스트',
      tagline: '질문 → 체크리스트 → 기록 → 복기',
      hero: {
        title: '수익률을 맞히는 AI가 아닙니다',
        description: '투자 전에 스스로 물어야 할 것을 체크리스트로 정리하고 기록하게 돕습니다.',
      },
      notProvided: {
        heading: '제공하지 않는 것',
        items: {
          recommendation: {
            title: '매수·매도 추천',
            description: '무엇을 사고팔지 대신 결정하지 않습니다.',
          },
          priceGuidance: {
            title: '목표가·손절가 제시',
            description: '가격 기준을 제시하거나 계산하지 않습니다.',
          },
          allocation: {
            title: '수량·비중 추천',
            description: '얼마를 담을지 또는 비중을 제안하지 않습니다.',
          },
          predictionOrDelegation: {
            title: '수익률 예측·투자 판단 대행',
            description: '투자 결과를 예측하거나 판단을 대신하지 않습니다.',
          },
        },
      },
      provided: {
        heading: '대신 제공하는 것',
        items: {
          questionContext: {
            title: '질문 맥락 정리',
            description: '질문에서 스스로 확인할 관점을 정리합니다.',
          },
          checklist: {
            title: '체크리스트',
            description: '투자 전에 확인할 항목을 체크리스트로 만듭니다.',
          },
          decisionRecord: {
            title: '판단 기록',
            description: '그때의 판단과 이유를 기록으로 남깁니다.',
          },
          review: {
            title: '사후 복기',
            description: '시간이 지난 뒤 판단을 다시 돌아봅니다.',
          },
        },
      },
      cta: '동의하고 시작하기',
      disclaimer:
        '이 앱은 투자를 권유하거나 수익을 보장하지 않습니다. 모든 판단은 본인의 책임입니다.',
    },
    notFound: {
      heading: '페이지를 찾을 수 없어요',
      description: '주소를 다시 확인해주세요.',
      backHome: '홈으로',
    },
  },
};
