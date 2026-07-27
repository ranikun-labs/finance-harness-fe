import type { Locale } from '@/constants/routes';
import { en } from '@/i18n/messages/en';
import { ko } from '@/i18n/messages/ko';

/**
 * 번역 리소스의 유일한 shape. `ko`/`en` 둘 다 이 인터페이스를 명시적으로 만족해야
 * 하므로(`export const ko: Messages`), 한쪽에 키가 빠지거나 타입이 달라지면
 * `tsc -b`가 즉시 컴파일 에러로 잡는다 — 별도 스키마 검증 라이브러리가 필요 없다.
 * `typeof ko`로 파생하지 않는 이유: 리터럴 값 타입이 그대로 굳어버려 `en`이 다른
 * 문자열을 넣는 순간(정상적인 상황) 타입 에러가 나는 함정이 있기 때문이다.
 */
/**
 * mock 투자 대상 sample key. 실존 종목명·티커를 쓰지 않는 중립 샘플의 locale-independent
 * 식별자 — 표시명은 `Messages.app.journalList.subjects`에서만 매핑한다.
 */
export type SampleSubjectKey = 'semiconductorCompanyA' | 'platformCompanyB' | 'batteryCompanyC';

export interface Messages {
  common: {
    appName: string;
  };
  nav: {
    home: string;
    ask: string;
    journal: string;
    ariaLabel: string;
  };
  public: {
    home: { title: string };
    features: { title: string };
    learn: { title: string };
    notFound: { heading: string; description: string; backHome: string };
    localeSwitcher: { ariaLabel: string };
  };
  /**
   * `RecordTagBadge`(kind: emotion/action/entryType) 전용 label 사전. 이 컴포넌트는
   * 화면·페이지 이름을 알지 못하므로 `app.*` 아래가 아니라 별도 top-level에 둔다.
   */
  recordTags: {
    entryType: { investment: string; study: string };
    action: { interest: string; watching: string; buy: string; sell: string };
    emotion: { FOMO: string; 불안: string; 확신: string; 관망: string; 혼란: string };
  };
  app: {
    home: { title: string };
    ask: { title: string; titleWithQuery: string };
    journalList: {
      title: string;
      filters: { groupLabel: string; all: string; investment: string; study: string };
      emotionLabel: string;
      noEmotion: string;
      checkedProgress: string;
      countLabel: string;
      emptyAll: { title: string; description: string; cta: string; hint: string };
      emptyFilter: { title: string; description: string; resetAction: string };
      subjects: Record<SampleSubjectKey, string>;
    };
    journalNew: { investment: string; study: string };
    journalDetail: { title: string };
    journalReview: { title: string };
    onboarding: { title: string };
    notFound: { heading: string; description: string; backHome: string };
  };
}

type DotPaths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${DotPaths<T[K]>}`;
}[keyof T & string];

/**
 * `Messages`의 모든 leaf(string) 값에 대한 dot-path key 유니언. 예:
 * `'public.home.title'`, `'app.journalDetail.title'`. 존재하지 않는 키를 넘기면
 * `t()` 호출부에서 컴파일 타임에 막힌다.
 */
export type MessageKey = DotPaths<Messages>;

export const MESSAGES: Record<Locale, Messages> = { ko, en };

export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale];
}

/**
 * 각 locale이 "자기 자신"을 가리키는 이름(예: 링크 라벨). 현재 뷰잉 locale에 따라
 * 번역되는 문구가 아니라 대상 locale 고유의 표기이므로 `Messages`와는 별도 테이블로
 * 관리한다.
 */
export const LOCALE_LABELS: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
};
