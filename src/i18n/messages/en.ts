import type { Messages } from '@/i18n/dictionary';

export const en: Messages = {
  common: {
    appName: 'AI Investment Checklist',
  },
  nav: {
    home: 'Home',
    ask: 'Ask',
    journal: 'Journal',
    ariaLabel: 'Primary navigation',
  },
  public: {
    home: { title: 'Public Home' },
    features: { title: 'Features' },
    learn: { title: 'Learn' },
    notFound: {
      heading: 'This page doesn’t exist',
      description: 'Please check the address and try again.',
      backHome: 'Back home',
    },
    localeSwitcher: { ariaLabel: 'Language' },
  },
  recordTags: {
    entryType: { investment: 'Investment', study: 'Study' },
    action: { interest: 'Interested', watching: 'Watching', buy: 'Bought', sell: 'Sold' },
    emotion: {
      FOMO: 'FOMO',
      불안: 'Anxious',
      확신: 'Confident',
      관망: 'Wait-and-see',
      혼란: 'Confused',
    },
  },
  app: {
    home: { title: 'Home' },
    ask: { title: 'Ask Result', titleWithQuery: 'Ask Result — {{query}}' },
    journalList: {
      title: 'Records',
      filters: {
        groupLabel: 'Filter by record type',
        all: 'All',
        investment: 'Investment',
        study: 'Study',
      },
      emotionLabel: 'Emotion',
      noEmotion: 'No emotion tag',
      checkedProgress: 'Checked {{checked}}/{{total}}',
      countLabel: '{{count}} records',
      emptyAll: {
        title: 'No records yet',
        description: 'Turn a question into a checklist and save your first record.',
        cta: 'Go ask a question',
        hint: 'One question becomes a checklist, and a checklist becomes your own record.',
      },
      emptyFilter: {
        title: 'No records of this type yet',
        description: 'Try a different type or view all records.',
        resetAction: 'View all',
      },
      subjects: {
        semiconductorCompanyA: 'Semiconductor Company A',
        platformCompanyB: 'Platform Company B',
        batteryCompanyC: 'Battery Company C',
      },
    },
    journalNew: {
      investment: 'Save Entry (Investment)',
      study: 'Save Study Note',
    },
    journalDetail: { title: 'Entry Detail — {{id}}' },
    journalReview: { title: 'Review — {{id}}' },
    onboarding: {
      title: 'Onboarding',
      productName: 'AI Investment Checklist',
      tagline: 'Question → Checklist → Record → Review',
      hero: {
        title: 'This AI does not predict returns.',
        description:
          'It helps you organize your pre-investment questions into a checklist and keep a record of your reasoning.',
      },
      notProvided: {
        heading: 'What it does not provide',
        items: {
          recommendation: {
            title: 'Buy or sell recommendations',
            description: 'It does not decide what you should buy or sell.',
          },
          priceGuidance: {
            title: 'Price targets or stop-loss levels',
            description: 'It does not set or calculate price thresholds.',
          },
          allocation: {
            title: 'Position-size or allocation recommendations',
            description: 'It does not suggest how much to invest or allocate.',
          },
          predictionOrDelegation: {
            title: 'Return predictions or investment decisions',
            description: 'It does not predict outcomes or make investment decisions for you.',
          },
        },
      },
      provided: {
        heading: 'What it provides instead',
        items: {
          questionContext: {
            title: 'Question context',
            description: 'It organizes the perspectives to examine in your question.',
          },
          checklist: {
            title: 'Checklists',
            description: 'It turns the points to review before investing into a checklist.',
          },
          decisionRecord: {
            title: 'Decision records',
            description: 'It helps you record your decisions and the reasons behind them.',
          },
          review: {
            title: 'Post-hoc review',
            description: 'It helps you revisit your past decisions after time has passed.',
          },
        },
      },
      cta: 'Agree and get started',
      disclaimer:
        'This app does not recommend investments or guarantee returns. You are responsible for every decision.',
    },
    notFound: {
      heading: 'This page doesn’t exist',
      description: 'Please check the address and try again.',
      backHome: 'Back home',
    },
  },
};
