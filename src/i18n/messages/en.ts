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
  auth: {
    entry: {
      eyebrow: 'Authentication',
      heading: 'Sign in to continue',
      description:
        'If this is your first time, an account can be created as part of the same flow.',
      resumeDescription: 'You will continue to the record screen you selected.',
      providerAction: 'Continue with OAuth',
      providerNeutralNotice: 'The authentication provider has not been selected yet.',
      cancel: 'Back to the review result',
      cancelEntry: 'Back to record type selection',
      cancelReviewStart: 'Back to starting a review',
      loading: 'Checking your sign-in request',
      failure: 'We could not sign you in',
      failureDescription: 'Try again, or return to the review result without losing its context.',
      retry: 'Try again',
      noIntent: 'Choose where to continue so the original task can be resumed.',
      resumeNotice: 'You can continue writing from the review result.',
      redirecting: 'Taking you to the sign-in screen.',
      unavailable: 'The authentication connection is not ready.',
      unavailableDescription: 'The next screen will not open until an auth result is provided.',
    },
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
    entryType: { investment: 'Decision record', study: 'Learning note' },
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
      handoff: {
        heading: 'Continue to a record',
        description: 'Use what you reviewed to write your own record.',
        investment: {
          title: 'Leave a decision record',
          description: 'Record your own judgment and reasoning from the review.',
        },
        study: {
          title: 'Leave a learning note',
          description: 'Organize what you learned and what you want to check next.',
        },
      },
      navigation: {
        studyNote: 'Learning note',
        investmentRecord: 'Decision record',
        askAgain: 'Ask another question',
      },
    },
    journalList: {
      title: 'Journal',
      loading: {
        title: 'Loading your journal',
        description: 'Checking the record list from the server.',
      },
      error: {
        title: 'We could not load your journal',
        description: 'Please try again in a moment.',
        retry: 'Try again',
      },
      invalidRequest: {
        title: 'Check the journal request',
        description: 'The list request was not valid.',
        retry: 'Try again',
      },
      invalidResult: {
        title: 'The journal response is unavailable',
        description: 'The server response could not be displayed safely.',
        retry: 'Try again',
      },
      filters: {
        groupLabel: 'Filter by record type',
        all: 'All',
        investment: 'Decision record',
        study: 'Learning note',
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
      loadMore: 'Load more',
      loadingMore: 'Loading more…',
      endOfList: 'You have reached the end of the journal.',
      loadMoreError: {
        title: 'We could not load the next records',
        description: 'The records already loaded are still available.',
        retry: 'Try again',
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
      investment: 'Decision record',
      study: 'Learning note',
      entryChoice: {
        heading: 'New record',
        prompt: 'What would you like to leave behind?',
        investment: {
          title: 'Decision record',
          description: 'Record what you decided and why.',
        },
        study: {
          title: 'Learning note',
          description: 'Organize what you learned and what to check next.',
        },
      },
      typeChange: {
        action: 'Change record type',
        dirtyConfirm: 'Your current entries will be discarded. Change record type?',
      },
      handoff: {
        originHeading: 'Record continued from review',
        originDescription:
          'Use the review as reference while writing your own record. You can edit or remove anything before saving.',
        questionLabel: 'Reviewed question',
        learningDraftNotice:
          'This draft came from the review result. Edit or remove anything before saving.',
        returnToReview: 'Back to review result',
        returnToReviewDirtyConfirm: 'Your draft will be discarded. Return to the review result?',
      },
      decisionContext: {
        title: 'Keep the review context with this record',
        switchLabel: 'Include review context',
        enabledDescription: 'Keep the review context you used when making this judgment.',
        disabledDescription: 'This judgment will not include the review context.',
        minimumLabel: 'Always included · minimum record',
        originalQuestionLabel: 'Question at the time',
        checklistLabel: 'Checks and their status at the time',
        capturedAtLabel: 'Saved at',
        checked: 'Checked',
        unchecked: 'Not checked',
        optionalLabel: 'Optional · verified evidence',
        optionalDescription: 'Choose which evidence to keep with this record.',
        immutableNotice:
          'The question, checklist version, check status, and captured time stay as they were. The full AI review result is not saved.',
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
            label: 'Subject',
            placeholder: 'Asset name or ticker',
            helper: 'What subject is this decision about?',
          },
          occurredAt: {
            label: 'Recorded at',
            helper: 'This keeps the local time you enter without timezone conversion.',
            now: 'Just now',
            change: 'Change',
          },
          action: {
            label: 'What judgment did you make?',
            helper: 'Choose the judgment you made for this record, not a recommendation.',
          },
          reasoning: {
            label: 'Why did you make that judgment?',
            placeholder: 'Describe why you took that action at that time.',
            helper:
              'Note the facts, interpretation, and unknowns so you can revisit this judgment later.',
            count: '{{count}} / 4000',
          },
          emotion: {
            label: 'How did you feel at the time? (Optional)',
            helper: 'Optional. Choose at most one state from that time.',
            none: 'No selection',
          },
        },
        study: {
          title: {
            label: 'What did you learn?',
            placeholder: 'Describe a topic or concept you learned.',
            helper: 'Write what you learned in one sentence.',
          },
          occurredAt: {
            label: 'Recorded at',
            helper: 'This keeps the local time you enter without timezone conversion.',
            now: 'Just now',
            change: 'Change',
          },
          keyContent: {
            label: 'Key summary',
            placeholder: 'Describe what you newly understood.',
            helper: 'Summarize the key content in your own words.',
            count: '{{count}} / 6000',
          },
          openQuestions: {
            label: 'What to check next',
            placeholder: 'Write a question you want to check.',
            helper:
              'Add up to 10 questions, each up to 500 characters. Duplicates stay in the order you enter them.',
            add: 'Add question',
            remove: 'Delete question {{index}}',
            removeShort: 'Delete',
            itemLabel: 'Question to check {{index}}',
            count: '{{count}} / 10',
          },
        },
      },
      invalidType: {
        heading: 'Unsupported record type',
        description: 'Choose either a decision record or a learning note.',
        investmentAction: 'Create decision record',
        studyAction: 'Create learning note',
      },
    },
    journalDetail: {
      title: 'Entry Detail — {{id}}',
      headerTitle: 'Record details',
      backLabel: 'Back to records',
      metadata: {
        recordType: 'Record type',
        recordedAt: 'Recorded on',
        timeZone: 'Record time zone',
        createdAt: 'Created at',
        updatedAt: 'Updated at',
        subject: 'Subject',
        pastAction: 'Action at the time',
        pastEmotion: 'Emotion at the time',
      },
      investment: {
        reasoningHeading: 'Why I made this judgment',
        questionHeading: 'Question at the time',
        aiChecklistHeading: 'Past AI checklist',
        recordHeading: 'My record',
        checkedItemsHeading: 'Items checked',
      },
      study: {
        keyContentHeading: 'Key content',
        openQuestionsHeading: 'Open questions',
        noOpenQuestions: 'There are no additional questions to check.',
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
      loading: {
        title: 'Loading record details',
        description: 'Checking the selected record from the server.',
      },
      error: {
        title: 'We could not load the record details',
        description: 'Please try again in a moment.',
        retry: 'Try again',
      },
      invalidRequest: {
        title: 'Check the record request',
        description: 'The record identifier was not valid.',
        retry: 'Try again',
      },
      invalidResult: {
        title: 'The record response is unavailable',
        description: 'The server response could not be displayed safely.',
        retry: 'Try again',
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
