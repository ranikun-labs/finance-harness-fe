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
    review: '검토',
    journal: '저널',
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
    home: {
      title: 'Home',
      hero: {
        eyebrow: '검토',
        heading: '지금 판단하려는 것을 검토해 보세요',
        description:
          '사겠다/팔겠다는 답을 드리지 않습니다. 확인해야 할 것, 근거 있는 사실, 아직 모르는 것을 정리해 드립니다.',
        action: '검토 시작',
        ariaLabel: '검토 시작',
      },
      question: {
        label: '내가 한 질문',
        placeholder: '예) 보유 중인 반도체 ETF를 지금 추가 매수해도 될까?',
        helper: '질문을 그대로 남기면 확인 항목과 근거를 나눠 정리합니다.',
        submit: '검토 시작',
        required: '검토할 내용을 입력해 주세요.',
      },
      examples: {
        heading: '이런 질문으로 시작해 보세요',
        items: {
          etf: '보유 중인 반도체 ETF를 지금 추가 매수해도 될까?',
          earnings: '이번 분기 실적 전망에서 먼저 확인할 것은 무엇일까?',
          loss: '손실 중인 종목을 계속 보유할 때 어떤 근거를 확인해야 할까?',
        },
      },
      policyNotice:
        '검토는 매수·매도 추천이나 수익률 예측을 제공하지 않습니다. 확인하지 못한 내용은 모르는 것으로 남깁니다.',
      recentRecords: {
        heading: '최근 기록',
        viewAll: '전체 기록 보기',
      },
      empty: {
        title: '아직 기록이 없어요',
        description: '질문에서 확인할 항목을 살펴보고 첫 기록을 준비해보세요.',
        action: '검토 시작',
      },
    },
    ask: {
      title: 'Ask 결과',
      titleWithQuery: 'Ask 결과 — {{query}}',
      header: {
        title: '검토',
        backLabel: '검토 시작으로 돌아가기',
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
      loading: {
        eyebrow: '검토 중',
        title: '검토 결과를 정리하고 있어요',
        description: '질문을 유지한 채 확인 항목과 근거를 나눠 정리합니다.',
        steps: {
          question: '질문을 확인 항목으로 정리',
          evidence: '확인 가능한 근거 찾기',
          unknown: '모르는 것 표시',
        },
        provenance:
          '확인 가능한 근거만 사실로 제시합니다. 확인하지 못한 것은 ‘모르는 것’으로 남겨 둡니다.',
      },
      error: {
        title: '검토를 완성하지 못했습니다',
        description:
          '일부 근거를 확인하지 못한 것과는 다릅니다 — 검토 자체가 처리되지 못했습니다. 입력한 질문은 그대로 남아 있습니다.',
        retry: '다시 시도',
        edit: '질문 수정',
      },
      structured: {
        resultTitle: '검토 결과',
        fixtureLabel: '예시 데이터',
        questionLabel: '내가 한 질문',
        checklist: {
          heading: '확인할 항목',
          helper: '직접 확인한 상태를 표시할 수 있어요.',
          progress: '{{checked}}/{{total}} 확인',
        },
        fact: {
          heading: '확인된 사실',
          helper: '각 사실에는 출처와 기준일을 함께 표시합니다.',
          sourceLabel: '출처',
          asOfLabel: '기준일',
        },
        inference: {
          heading: '해석',
          helper: '사실이 아닌 추론입니다.',
          basisLabel: '근거로 삼은 사실',
        },
        unknown: {
          heading: '아직 모르는 것',
          helper: '확인 불가 · 정보 부족 · 최신성 부족을 분리합니다.',
        },
        generatedAt: '생성 {{timestamp}}',
        reviewedAt: '검토 {{timestamp}}',
        timestampsHeading: '생성 및 검토 시각',
        provenance:
          '이 결과는 화면 흐름 확인을 위한 예시 데이터입니다. 실제 질문 분석이나 투자 자문 결과가 아닙니다.',
        partialTitle: '근거를 일부만 확인했습니다',
        partialDescription:
          '확인되지 않은 내용은 사실로 승격하지 않았습니다. 필요한 경우 추론을 생략하고 모르는 것으로 남겼습니다.',
        partialNarrow: '부분 결과는 오류가 아니라 정상적인 불완전 결과입니다.',
      },
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
      title: '저널',
      filters: {
        groupLabel: '기록 유형 필터',
        all: '전체',
        investment: '투자 기록',
        study: '공부 노트',
      },
      emotionLabel: '감정',
      noEmotion: '감정 태그 없음',
      reasoningLabel: '핵심 판단 이유',
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
    journalWorkspace: {
      listPaneLabel: '저널 목록',
      detailPaneLabel: '저널 상세',
      detailPrompt: {
        heading: '기록을 선택해 보세요',
        description: '목록에서 기록을 선택하면 이곳에서 판단 이유와 당시 맥락을 확인할 수 있어요.',
      },
    },
    journalNew: {
      investment: '일지 저장 (투자 기록)',
      study: '공부 노트 저장',
      typeSwitch: {
        investment: '투자 기록',
        study: '학습 기록',
        dirtyConfirm: '입력한 내용이 사라집니다. 기록 유형을 바꿀까요?',
      },
      decisionContext: {
        title: '당시 검토 맥락도 함께 남기기',
        switchLabel: 'Decision Context 포함',
        enabledDescription: '질문과 확인 상태는 항상 남고, 선택한 근거만 함께 보관합니다.',
        disabledDescription: '이 기록에는 당시 검토 맥락을 포함하지 않습니다.',
        minimumLabel: '항상 포함 · 최소 기록',
        originalQuestionLabel: '그때 내가 한 질문',
        checklistLabel: '확인 항목과 그때의 확인 상태',
        capturedAtLabel: '저장 시점',
        checked: '확인함',
        unchecked: '확인하지 않음',
        optionalLabel: '선택 포함 · 확인된 사실',
        optionalDescription: '함께 남길 사실만 선택할 수 있어요.',
        immutableNotice:
          '저장하는 순간 이 내용은 고정되고 이후 검토 결과가 바뀌어도 갱신되지 않습니다.',
      },
      form: {
        optional: '선택',
        checkEntries: '입력 확인',
        validUnsaved: '입력 형식을 확인했습니다. 아직 저장되지 않았습니다.',
        testFlowNotice: '테스트 흐름이며 저장되지 않습니다.',
        submitTest: '테스트 제출',
        submitting: '테스트 제출 중',
        failed: '테스트 제출에 실패했습니다. 입력을 확인한 뒤 다시 시도하세요.',
        retry: '다시 시도',
        validationSummary: '입력 내용을 확인해주세요.',
        validation: {
          required: '필수 입력 항목입니다.',
          maxLength: '허용된 글자 수를 초과했습니다.',
          invalidChoice: '선택값이 올바르지 않습니다.',
          invalidDatetime: '날짜와 시간을 확인해주세요.',
        },
        investment: {
          assetName: {
            label: '종목',
            placeholder: '종목명 또는 티커',
            helper: '기록하려는 대상만 적어주세요.',
          },
          occurredAt: {
            label: '기록 시각',
            helper: '시간대 변환 없이 입력한 현지 시각으로 기록합니다.',
          },
          action: {
            label: '내가 한 행동',
            helper: '추천이 아닌, 실제로 한 행동을 기록용으로 선택해주세요.',
          },
          reasoning: {
            label: '판단 이유',
            placeholder: '이 시점에 이 행동을 한 이유를 적어보세요.',
            helper: '예측이나 추천이 아닌 당시 근거를 남겨보세요.',
            count: '{{count}} / 4000',
          },
          emotion: {
            label: '감정',
            helper: '당시 감정을 하나만 선택할 수 있어요.',
            none: '선택 안 함',
          },
        },
        study: {
          title: {
            label: '배운 주제',
            placeholder: '배운 주제나 개념을 적어보세요.',
            helper: '이번에 학습한 주제만 적어주세요.',
          },
          occurredAt: {
            label: '기록 시각',
            helper: '시간대 변환 없이 입력한 현지 시각으로 기록합니다.',
          },
          keyContent: {
            label: '오늘 배운 것',
            placeholder: '이번에 새로 이해한 내용을 적어보세요.',
            helper: '핵심 내용을 내 말로 정리해보세요.',
            count: '{{count}} / 6000',
          },
          openQuestions: {
            label: '다음에 확인할 것',
            placeholder: '한 줄에 하나씩 적어보세요.',
            helper: '줄바꿈마다 하나의 질문으로 유지됩니다.',
          },
        },
      },
      invalidType: {
        heading: '지원하지 않는 기록 유형이에요',
        description: '투자 기록 또는 공부 노트 중에서 선택해주세요.',
        investmentAction: '투자 기록 작성',
        studyAction: '공부 노트 작성',
      },
    },
    journalDetail: {
      title: '일지 상세 — {{id}}',
      headerTitle: '기록 상세',
      backLabel: '기록 목록으로 돌아가기',
      metadata: {
        recordType: '기록 유형',
        recordedAt: '작성일',
        subject: '기록 대상',
        pastAction: '당시 행동',
        pastEmotion: '당시 감정',
      },
      investment: {
        questionHeading: '당시 질문',
        aiChecklistHeading: '과거 AI 체크리스트',
        recordHeading: '내가 남긴 기록',
        checkedItemsHeading: '체크한 항목',
      },
      study: {
        questionHeading: '원래 질문',
        summaryHeading: '정리한 내용',
        nextChecksHeading: '다음에 확인할 항목',
      },
      itemCount: '{{count}}개 항목',
      checkedProgress: '{{checked}} / {{total}}',
      checkedStatus: '확인함',
      uncheckedStatus: '확인하지 않음',
      decisionContext: {
        heading: '당시 검토 맥락',
        snapshotLabel: '저장 당시 그대로 · 변경되지 않음',
        originalQuestionLabel: '그때 내가 한 질문',
        checklistLabel: '확인 항목과 그때의 확인 상태',
        versionLabel: '체크리스트 버전',
        capturedAtLabel: '저장 시점',
        checked: '확인함',
        unchecked: '확인하지 않음',
        optionalEvidenceLabel: '함께 남긴 확인된 사실',
        noOptionalEvidence: '선택해서 남긴 사실이 없습니다.',
        immutableNotice:
          '이 맥락은 저장 당시의 snapshot입니다. 이후 검토 결과나 체크리스트가 바뀌어도 갱신되지 않습니다.',
      },
      navigation: {
        review: 'AI와 복기하기',
        list: '기록 목록으로 돌아가기',
      },
      notFound: {
        heading: '기록을 찾을 수 없어요',
        description: '요청한 기록이 없거나 더 이상 확인할 수 없어요.',
        listAction: '기록 목록으로 돌아가기',
      },
    },
    journalReview: {
      title: '복기 — {{id}}',
      headerTitle: '기록 복기',
      backLabel: '기록 상세로 돌아가기',
      metadata: {
        recordType: '기록 유형',
        recordedAt: '작성일',
        pastAction: '당시 행동',
        pastEmotion: '당시 감정',
      },
      summary: { heading: '복기 대상 기록' },
      status: { checked: '확인함', unchecked: '확인하지 않음' },
      investment: {
        questionHeading: '당시 질문',
        memoHeading: '당시 메모',
        statusHeading: '당시 확인 상태',
        reflectionHeading: '다시 살펴볼 질문',
        prompts: {
          assumption: '당시 중요하게 본 판단의 전제는 무엇이었나요?',
          uncheckedImpact: '확인하지 않은 항목이 당시 판단에 어떤 영향을 줄 수 있었나요?',
          counterEvidence: '당시 판단을 바꿀 반대 근거를 미리 정했나요?',
          nextChecks: '다음 판단 전에 먼저 확인할 항목은 무엇인가요?',
        },
      },
      study: {
        questionHeading: '원래 학습 질문',
        memoHeading: '당시 정리한 내용',
        statusHeading: '다음 확인 항목의 당시 상태',
        reflectionHeading: '학습을 다시 살펴볼 질문',
        prompts: {
          understanding: '당시 정리한 내용에서 이해한 핵심은 무엇인가요?',
          revisit: '지금 다시 확인하거나 설명을 보완할 부분은 무엇인가요?',
          nextQuestion: '다음에 이어서 확인할 학습 질문은 무엇인가요?',
        },
      },
      retrospective: {
        originalHeading: '원본 저널',
        editorHeading: '새 복기 기록',
        editorDescription: '원래 판단은 그대로 두고, 지금 시점의 배움을 별도 기록으로 남깁니다.',
        timestampLabel: '원본 작성 시각',
        bodyLabel: '지금 다시 보면, 무엇이 달라졌나요?',
        bodyPrompt: '한 문장이면 충분합니다. 지금 알게 된 점이나 달라진 시선을 적어보세요.',
        bodyPlaceholder: '예) 실적 발표를 확인하고 보니 당시 우려가 과했는지 알 수 있었다.',
        outcomeHeading: '결과 관찰 (선택)',
        outcomeDescription: '이후 실제로 무엇이 관찰됐는지 판단 품질과 분리해 기록합니다.',
        outcomeLabel: '결과 관찰',
        outcomePlaceholder: '예) 30일 뒤 실적 발표는 예상에 부합했다.',
        qualityHeading: '판단 과정',
        qualityDescription: '결과의 좋고 나쁨과 별개로, 당시 판단 과정을 돌아봅니다.',
        qualityLabel: '판단 과정에서 배운 점 (선택)',
        qualityPlaceholder: '예) 반대 근거를 먼저 확인했어야 했다.',
        nextCheckLabel: '다음에 확인할 것 (선택)',
        nextCheckPlaceholder: '예) 다음에는 확인 시점을 먼저 정한다.',
        save: '복기 저장',
        saving: '복기 저장 중',
        saveError: '복기 저장에 실패했습니다. 작성한 내용은 그대로 남아 있습니다.',
        retry: '다시 시도',
        savedHeading: '복기가 저장됐습니다',
        savedNotice: '오늘 시점의 별도 복기 기록으로 남았습니다.',
        savedAtLabel: '복기 작성 시각',
        separateRecordNotice: '원본 저널의 행동·감정·근거·확인 맥락은 변경되지 않았습니다.',
        immutableNotice: '원본 저널은 참고용으로만 표시되며 수정할 수 없습니다.',
        validationRequired: '복기 내용을 한 가지 이상 입력해 주세요.',
      },
      policyNotice:
        '이 화면은 정답을 판단하는 화면이 아니라, 당시 확인 상태와 판단 근거를 다시 살펴보기 위한 화면입니다.',
      navigation: { detail: '기록 상세로 돌아가기' },
      notFound: {
        heading: '복기할 기록을 찾을 수 없어요',
        description: '요청한 기록이 없거나 더 이상 확인할 수 없어요.',
        listAction: '기록 목록으로 돌아가기',
      },
    },
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
