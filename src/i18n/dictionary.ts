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
    review: string;
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
    home: {
      /** 기존 skeleton route 제목 호환용. 실제 화면 h1은 `hero.heading`을 사용한다. */
      title: string;
      hero: {
        eyebrow: string;
        heading: string;
        description: string;
        action: string;
        ariaLabel: string;
      };
      recentRecords: {
        heading: string;
        viewAll: string;
      };
      empty: {
        title: string;
        description: string;
        action: string;
      };
    };
    ask: {
      /** 기존 skeleton 라우트 호환용 제목. 실제 Ask h1은 `header.title`을 사용한다. */
      title: string;
      titleWithQuery: string;
      header: { title: string; backLabel: string };
      empty: { title: string; description: string; cta: string };
      questionLabel: string;
      perspectives: {
        heading: string;
        items: {
          businessContext: string;
          industryTrends: string;
          earningsAssumptions: string;
          pricedInExpectations: string;
          currencyAndRates: string;
          biasAndCounterEvidence: string;
        };
      };
      checklist: {
        heading: string;
        count: string;
        items: {
          businessContext: { title: string; description: string };
          industryTrends: { title: string; description: string };
          earningsAssumptions: { title: string; description: string };
          pricedInExpectations: { title: string; description: string };
          currencyAndRates: { title: string; description: string };
          biasAndCounterEvidence: { title: string; description: string };
        };
      };
      fixtureNotice: string;
      recordQuestions: {
        heading: string;
        items: {
          businessAssumption: string;
          evidenceToCheck: string;
          counterEvidence: string;
        };
      };
      navigation: { studyNote: string; investmentRecord: string; askAgain: string };
    };
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
    journalNew: {
      investment: string;
      study: string;
      typeSwitch: { investment: string; study: string; dirtyConfirm: string };
      form: {
        optional: string;
        checkEntries: string;
        validUnsaved: string;
        testFlowNotice: string;
        submitTest: string;
        submitting: string;
        failed: string;
        retry: string;
        validationSummary: string;
        validation: {
          required: string;
          maxLength: string;
          invalidChoice: string;
          invalidDatetime: string;
        };
        investment: {
          assetName: { label: string; placeholder: string; helper: string };
          occurredAt: { label: string; helper: string };
          action: { label: string; helper: string };
          reasoning: { label: string; placeholder: string; helper: string; count: string };
          emotion: { label: string; helper: string; none: string };
        };
        study: {
          title: { label: string; placeholder: string; helper: string };
          occurredAt: { label: string; helper: string };
          keyContent: { label: string; placeholder: string; helper: string; count: string };
          openQuestions: { label: string; placeholder: string; helper: string };
        };
      };
      invalidType: {
        heading: string;
        description: string;
        investmentAction: string;
        studyAction: string;
      };
    };
    journalDetail: {
      title: string;
      headerTitle: string;
      backLabel: string;
      metadata: {
        recordType: string;
        recordedAt: string;
        subject: string;
        pastAction: string;
        pastEmotion: string;
      };
      investment: {
        questionHeading: string;
        aiChecklistHeading: string;
        recordHeading: string;
        checkedItemsHeading: string;
      };
      study: {
        questionHeading: string;
        summaryHeading: string;
        nextChecksHeading: string;
      };
      itemCount: string;
      checkedProgress: string;
      checkedStatus: string;
      uncheckedStatus: string;
      navigation: { review: string; list: string };
      notFound: { heading: string; description: string; listAction: string };
    };
    journalReview: {
      /** 기존 skeleton 및 route 제목 호환용. 실제 화면 h1은 `headerTitle`을 사용한다. */
      title: string;
      headerTitle: string;
      backLabel: string;
      metadata: {
        recordType: string;
        recordedAt: string;
        pastAction: string;
        pastEmotion: string;
      };
      summary: { heading: string };
      status: { checked: string; unchecked: string };
      investment: {
        questionHeading: string;
        memoHeading: string;
        statusHeading: string;
        reflectionHeading: string;
        prompts: {
          assumption: string;
          uncheckedImpact: string;
          counterEvidence: string;
          nextChecks: string;
        };
      };
      study: {
        questionHeading: string;
        memoHeading: string;
        statusHeading: string;
        reflectionHeading: string;
        prompts: {
          understanding: string;
          revisit: string;
          nextQuestion: string;
        };
      };
      policyNotice: string;
      navigation: { detail: string };
      notFound: { heading: string; description: string; listAction: string };
    };
    onboarding: {
      /** 기존 skeleton 라우트 호환용 제목. 실제 온보딩 h1은 `hero.title`을 사용한다. */
      title: string;
      productName: string;
      tagline: string;
      hero: { title: string; description: string };
      notProvided: {
        heading: string;
        items: {
          recommendation: { title: string; description: string };
          priceGuidance: { title: string; description: string };
          allocation: { title: string; description: string };
          predictionOrDelegation: { title: string; description: string };
        };
      };
      provided: {
        heading: string;
        items: {
          questionContext: { title: string; description: string };
          checklist: { title: string; description: string };
          decisionRecord: { title: string; description: string };
          review: { title: string; description: string };
        };
      };
      cta: string;
      disclaimer: string;
    };
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
