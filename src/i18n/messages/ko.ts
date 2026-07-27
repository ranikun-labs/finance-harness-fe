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
    ask: { title: 'Ask 결과', titleWithQuery: 'Ask 결과 — {{query}}' },
    journalList: {
      title: '기록 목록',
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
    onboarding: { title: '온보딩' },
    notFound: {
      heading: '페이지를 찾을 수 없어요',
      description: '주소를 다시 확인해주세요.',
      backHome: '홈으로',
    },
  },
};
