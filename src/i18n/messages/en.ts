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
  app: {
    home: { title: 'Home' },
    ask: { title: 'Ask Result', titleWithQuery: 'Ask Result — {{query}}' },
    journalList: { title: 'Journal List' },
    journalNew: {
      investment: 'Save Entry (Investment)',
      study: 'Save Study Note',
    },
    journalDetail: { title: 'Entry Detail — {{id}}' },
    journalReview: { title: 'Review — {{id}}' },
    onboarding: { title: 'Onboarding' },
    notFound: {
      heading: 'This page doesn’t exist',
      description: 'Please check the address and try again.',
      backHome: 'Back home',
    },
  },
};
