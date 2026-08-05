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
    home: {
      title: 'Home',
      hero: {
        eyebrow: 'Check before deciding',
        heading: 'Start with a question before you decide',
        description: 'Ask what you are curious about and review the points worth checking.',
        action: 'Start a question',
        ariaLabel: 'Explore a question',
      },
      recentRecords: {
        heading: 'Recent records',
        viewAll: 'View all records',
      },
      empty: {
        title: 'No records yet',
        description: 'Ask a question and review what to check before preparing your first record.',
        action: 'Start a question',
      },
    },
    ask: {
      title: 'Ask Result',
      titleWithQuery: 'Ask Result — {{query}}',
      header: {
        title: 'AI Check',
        backLabel: 'Back to home',
      },
      empty: {
        title: 'No question to review yet',
        description: 'Ask a question to see example perspectives to check and questions to record.',
        cta: 'Ask a question',
      },
      questionLabel: 'My question',
      perspectives: {
        heading: 'Example review perspectives',
        items: {
          businessContext: 'Business context',
          industryTrends: 'Industry trends',
          earningsAssumptions: 'Earnings assumptions',
          pricedInExpectations: 'Expectations reflected in price',
          currencyAndRates: 'Currency and interest rates',
          biasAndCounterEvidence: 'Decision bias and counter-evidence',
        },
      },
      checklist: {
        heading: 'What to check',
        count: '6 items',
        items: {
          businessContext: {
            title: 'Business context',
            description: 'Check the revenue model and the key assumptions about the business.',
          },
          industryTrends: {
            title: 'Industry trends',
            description: 'Check the direction of demand and supply in the industry.',
          },
          earningsAssumptions: {
            title: 'Earnings assumptions',
            description: 'Check which assumptions are included in the earnings expectations.',
          },
          pricedInExpectations: {
            title: 'Expectations reflected in price',
            description: 'Check how much of those expectations may already be reflected in price.',
          },
          currencyAndRates: {
            title: 'Currency and interest rates',
            description:
              'Check how changes in currency and interest rates could affect the assumptions.',
          },
          biasAndCounterEvidence: {
            title: 'Decision bias and counter-evidence',
            description: 'Check your decision bias together with evidence against your view.',
          },
        },
      },
      fixtureNotice:
        'This screen is a functional example only. It is not an analysis of your actual question or investment advice.',
      recordQuestions: {
        heading: 'Questions for your next record',
        items: {
          businessAssumption: 'Which business assumption mattered most to me?',
          evidenceToCheck:
            'What needs more checking: industry conditions or earnings expectations?',
          counterEvidence: 'What counter-evidence could change my view?',
        },
      },
      navigation: {
        studyNote: 'Study note',
        investmentRecord: 'Investment record',
        askAgain: 'Ask another question',
      },
    },
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
      typeSwitch: {
        investment: 'Investment record',
        study: 'Study record',
        dirtyConfirm: 'Your current entries will be discarded. Change record type?',
      },
      form: {
        optional: 'Optional',
        checkEntries: 'Check entries',
        validUnsaved: 'Your entries are valid. They have not been saved yet.',
        testFlowNotice: 'This is a test flow and does not save your entry.',
        submitTest: 'Submit test entry',
        submitting: 'Submitting test entry',
        failed: 'The test submission failed. Check your input and try again.',
        retry: 'Try again',
        validationSummary: 'Please check the entries below.',
        validation: {
          required: 'This field is required.',
          maxLength: 'This entry is too long.',
          invalidChoice: 'Choose a valid option.',
          invalidDatetime: 'Check the date and time.',
        },
        investment: {
          assetName: {
            label: 'Asset',
            placeholder: 'Asset name or ticker',
            helper: 'Enter only the subject of this record.',
          },
          occurredAt: {
            label: 'Recorded at',
            helper: 'This keeps the local time you enter without timezone conversion.',
          },
          action: {
            label: 'What I did',
            helper: 'Choose what you actually did for this record, not a recommendation.',
          },
          reasoning: {
            label: 'Reasoning',
            placeholder: 'Describe why you took that action at that time.',
            helper: 'Record your reasoning, not a prediction or recommendation.',
            count: '{{count}} / 4000',
          },
          emotion: {
            label: 'Emotion',
            helper: 'Choose at most one emotion from that time.',
            none: 'No selection',
          },
        },
        study: {
          title: {
            label: 'Topic learned',
            placeholder: 'Describe a topic or concept you learned.',
            helper: 'Enter the topic you studied.',
          },
          occurredAt: {
            label: 'Recorded at',
            helper: 'This keeps the local time you enter without timezone conversion.',
          },
          keyContent: {
            label: 'What I learned today',
            placeholder: 'Describe what you newly understood.',
            helper: 'Summarize the key content in your own words.',
            count: '{{count}} / 6000',
          },
          openQuestions: {
            label: 'What to check next',
            placeholder: 'Write one item per line.',
            helper: 'Each line remains one question.',
          },
        },
      },
      invalidType: {
        heading: 'Unsupported record type',
        description: 'Choose either an investment record or a study note.',
        investmentAction: 'Create investment record',
        studyAction: 'Create study note',
      },
    },
    journalDetail: {
      title: 'Entry Detail — {{id}}',
      headerTitle: 'Record details',
      backLabel: 'Back to records',
      metadata: {
        recordType: 'Record type',
        recordedAt: 'Recorded on',
        subject: 'Subject',
        pastAction: 'Action at the time',
        pastEmotion: 'Emotion at the time',
      },
      investment: {
        questionHeading: 'Question at the time',
        aiChecklistHeading: 'Past AI checklist',
        recordHeading: 'My record',
        checkedItemsHeading: 'Items checked',
      },
      study: {
        questionHeading: 'Original question',
        summaryHeading: 'What I learned',
        nextChecksHeading: 'What to check next',
      },
      itemCount: '{{count}} items',
      checkedProgress: '{{checked}} / {{total}}',
      checkedStatus: 'Checked',
      uncheckedStatus: 'Not checked',
      navigation: {
        review: 'Review with AI',
        list: 'Back to records',
      },
      notFound: {
        heading: 'Record not found',
        description: 'This record does not exist or is no longer available.',
        listAction: 'Back to records',
      },
    },
    journalReview: {
      title: 'Review — {{id}}',
      headerTitle: 'Review record',
      backLabel: 'Back to record details',
      metadata: {
        recordType: 'Record type',
        recordedAt: 'Recorded on',
        pastAction: 'Action at the time',
        pastEmotion: 'Emotion at the time',
      },
      summary: { heading: 'Record being reviewed' },
      status: { checked: 'Checked', unchecked: 'Not checked' },
      investment: {
        questionHeading: 'Question at the time',
        memoHeading: 'Note at the time',
        statusHeading: 'Check status at the time',
        reflectionHeading: 'Questions to revisit',
        prompts: {
          assumption: 'Which assumptions mattered most to your reasoning at the time?',
          uncheckedImpact:
            'How might the unchecked items have affected your reasoning at the time?',
          counterEvidence: 'Had you identified evidence that would change your reasoning?',
          nextChecks: 'What would you check first before making a future decision?',
        },
      },
      study: {
        questionHeading: 'Original study question',
        memoHeading: 'What you summarized at the time',
        statusHeading: 'Previous status of follow-up items',
        reflectionHeading: 'Questions for revisiting your learning',
        prompts: {
          understanding: 'What was the main idea you understood from your summary?',
          revisit: 'What would you revisit or explain more clearly now?',
          nextQuestion: 'What study question would you explore next?',
        },
      },
      policyNotice:
        'This screen does not judge whether your decision was correct. It helps you revisit what you checked and the reasoning you used at the time.',
      navigation: { detail: 'Back to record details' },
      notFound: {
        heading: 'Record unavailable for review',
        description: 'This record does not exist or is no longer available.',
        listAction: 'Back to records',
      },
    },
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
