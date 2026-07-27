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
  app: {
    home: { title: 'Home' },
    ask: { title: 'Ask 결과', titleWithQuery: 'Ask 결과 — {{query}}' },
    journalList: { title: '기록 목록' },
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
