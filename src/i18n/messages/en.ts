import type { Messages } from '@/i18n/dictionary';

export const en: Messages = {
  common: {
    appName: 'AI Investment Checklist',
  },
  nav: {
    review: 'Review',
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
        eyebrow: 'Review',
        heading: 'Review what you are deciding now',
        description:
          'I won’t tell you to buy or sell. I’ll organize what to check, evidence-based facts, and what is still unknown.',
        action: 'Start review',
        ariaLabel: 'Start a review',
      },
      question: {
        label: 'My question',
        placeholder: 'e.g. Should I add to my semiconductor ETF position now?',
        helper: 'Keep your question intact while the review separates checks from evidence.',
        submit: 'Start review',
        required: 'Enter something to review.',
      },
      examples: {
        heading: 'Try a question like this',
        items: {
          etf: 'Should I add to my semiconductor ETF position now?',
          earnings: 'What should I check first in this quarter’s earnings outlook?',
          loss: 'What evidence should I check before holding a losing position?',
        },
      },
      policyNotice:
        'A review does not provide buy/sell recommendations or return predictions. Anything not verified remains unknown.',
      recentRecords: {
        heading: 'Recent records',
        viewAll: 'View all records',
      },
      empty: {
        title: 'No records yet',
        description: 'Ask a question and review what to check before preparing your first record.',
        action: 'Start review',
      },
    },
    ask: {
      title: 'Ask Result',
      titleWithQuery: 'Ask Result — {{query}}',
      header: {
        title: 'Review',
        backLabel: 'Back to review start',
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
      loading: {
        eyebrow: 'Reviewing',
        title: 'Organizing your review',
        description: 'Your question stays visible while checks and evidence are separated.',
        steps: {
          question: 'Turn the question into checks',
          evidence: 'Find verifiable evidence',
          unknown: 'Mark what is unknown',
        },
        provenance:
          'Only verifiable evidence is presented as fact. Anything not verified remains unknown.',
      },
      error: {
        title: 'The review could not be completed',
        description:
          'This is different from missing evidence: the review itself was not processed. Your question is still here.',
        retry: 'Try again',
        edit: 'Edit question',
      },
      structured: {
        resultTitle: 'Review result',
        fixtureLabel: 'Example data',
        questionLabel: 'My question',
        checklist: {
          heading: 'What to check',
          helper: 'You can mark the checks you have confirmed.',
          progress: '{{checked}}/{{total}} checked',
        },
        fact: {
          heading: 'Facts checked',
          helper: 'Each fact keeps its source and as-of date together.',
          sourceLabel: 'Source',
          asOfLabel: 'As of',
        },
        inference: {
          heading: 'Interpretation',
          helper: 'This is inference, not fact.',
          basisLabel: 'Fact used as basis',
        },
        unknown: {
          heading: 'What is still unknown',
          helper: 'Keep unverifiable, incomplete, and stale information separate from facts.',
        },
        generatedAt: 'Generated {{timestamp}}',
        reviewedAt: 'Reviewed {{timestamp}}',
        timestampsHeading: 'Generated and reviewed at',
        provenance:
          'This result is example data for checking the screen flow. It is not analysis of your actual question or investment advice.',
        partialTitle: 'Only some evidence was confirmed',
        partialDescription:
          'Unconfirmed content was not promoted to fact. Inference may be omitted and unknowns are kept visible.',
        partialNarrow: 'A partial result is an expected incomplete result, not an error.',
      },
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
      title: 'Journal',
      filters: {
        groupLabel: 'Filter by record type',
        all: 'All',
        investment: 'Investment',
        study: 'Study',
      },
      emotionLabel: 'Emotion',
      noEmotion: 'No emotion tag',
      reasoningLabel: 'Key reasoning',
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
    journalWorkspace: {
      listPaneLabel: 'Journal list',
      detailPaneLabel: 'Journal detail',
      detailPrompt: {
        heading: 'Select a record',
        description: 'Choose a record from the list to review its reasoning and context here.',
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
      decisionContext: {
        title: 'Keep the review context at the time',
        switchLabel: 'Include Decision Context',
        enabledDescription:
          'The question and check status are always kept; only selected evidence is included.',
        disabledDescription: 'This record will not include the review context from that time.',
        minimumLabel: 'Always included · minimum record',
        originalQuestionLabel: 'Question at the time',
        checklistLabel: 'Checks and their status at the time',
        capturedAtLabel: 'Saved at',
        checked: 'Checked',
        unchecked: 'Not checked',
        optionalLabel: 'Optional · verified evidence',
        optionalDescription: 'Choose which evidence to keep with this record.',
        immutableNotice:
          'This content is fixed when saved and is not updated if later review results change.',
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
      decisionContext: {
        heading: 'Review context at the time',
        snapshotLabel: 'Saved as-is · unchanged',
        originalQuestionLabel: 'Question at the time',
        checklistLabel: 'Checks and their status at the time',
        versionLabel: 'Checklist version',
        capturedAtLabel: 'Saved at',
        checked: 'Checked',
        unchecked: 'Not checked',
        optionalEvidenceLabel: 'Verified evidence kept with this record',
        noOptionalEvidence: 'No optional evidence was selected.',
        immutableNotice:
          'This context is a snapshot from the saved time. It does not update when later review results or checklists change.',
      },
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
      retrospective: {
        originalHeading: 'Original Journal',
        editorHeading: 'New retrospective',
        editorDescription:
          'Keep the original decision intact and record what you learned from today’s perspective.',
        timestampLabel: 'Original recorded at',
        bodyLabel: 'Looking back now, what is different?',
        bodyPrompt: 'One sentence is enough. Write what you know or see differently now.',
        bodyPlaceholder: 'e.g. The earnings release showed that my concern was too strong.',
        outcomeHeading: 'Outcome observation (optional)',
        outcomeDescription:
          'Record what actually happened separately from the quality of the decision process.',
        outcomeLabel: 'Outcome observation',
        outcomePlaceholder: 'e.g. The earnings release matched the expectation 30 days later.',
        qualityHeading: 'Decision process',
        qualityDescription:
          'Revisit how you reasoned at the time, separately from whether the outcome was good or bad.',
        qualityLabel: 'What I learned about my process (optional)',
        qualityPlaceholder: 'e.g. I should have checked counter-evidence first.',
        nextCheckLabel: 'What to check next (optional)',
        nextCheckPlaceholder: 'e.g. Set the next check date before making the decision.',
        save: 'Save retrospective',
        saving: 'Saving retrospective',
        saveError: 'Retrospective could not be saved. Your writing is still here.',
        retry: 'Try again',
        savedHeading: 'Retrospective saved',
        savedNotice: 'It was saved as a separate record for today.',
        savedAtLabel: 'Retrospective recorded at',
        separateRecordNotice:
          'The original Journal action, emotion, reasoning, and context were not changed.',
        immutableNotice: 'The original Journal is reference-only and cannot be edited here.',
        validationRequired: 'Add at least one line to your retrospective before saving.',
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
