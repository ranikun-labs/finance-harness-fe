import { useEffect, useReducer, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useNavigationType, useSearchParams } from 'react-router';

import { DecisionContextCapturePanel } from '@/components/journal/DecisionContextPanel';
import { InvestmentJournalForm } from '@/features/journal-new/components/InvestmentJournalForm';
import { StudyJournalForm } from '@/features/journal-new/components/StudyJournalForm';
import {
  APP_ROUTE_PATHS,
  buildAppJournalDetailPath,
  buildAppJournalNewPath,
} from '@/constants/routes';
import {
  toInvestmentJournalCreateCommand,
  toStudyJournalCreateCommand,
} from '@/features/journal-new/model/journalCreateCommand';
import type { JournalCreatePort } from '@/features/journal-new/model/journalCreatePort';
import type {
  InvestmentJournalFormState,
  StudyJournalFormState,
} from '@/features/journal-new/model/journalFormTypes';
import {
  initialJournalSubmitState,
  journalSubmitReducer,
} from '@/features/journal-new/model/journalSubmitState';
import { resolveJournalType } from '@/features/journal-new/model/journalType';
import { useTranslation } from '@/i18n/I18nContext';
import type { DecisionContextSnapshot } from '@/mocks/decisionContext';
import type { ReviewJournalHandoff } from '@/mocks/reviewResult';

/**
 * `type` 쿼리 값('investment'/'study')은 도메인 식별자이며 번역 대상이 아니다 —
 * 표시 문구만 `t()`로 조회한다.
 */
type Props = { createPort?: JournalCreatePort };

interface JournalNewLocationState {
  decisionContext?: DecisionContextSnapshot;
  reviewHandoff?: ReviewJournalHandoff;
}

export function JournalNewPage({ createPort }: Props) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const { t } = useTranslation();
  const resolution = resolveJournalType(searchParams);
  const locationState = location.state as JournalNewLocationState | null;
  const incomingDecisionContext = locationState?.decisionContext;
  const reviewHandoff = locationState?.reviewHandoff;
  const [decisionContext, setDecisionContext] = useState<DecisionContextSnapshot | undefined>(() =>
    incomingDecisionContext
      ? {
          ...incomingDecisionContext,
          checklist: incomingDecisionContext.checklist.map((item) => ({ ...item })),
          optionalEvidence: incomingDecisionContext.optionalEvidence.map((item) => ({ ...item })),
        }
      : undefined,
  );
  const [decisionContextEnabled, setDecisionContextEnabled] = useState(
    Boolean(incomingDecisionContext),
  );
  const [dirty, setDirty] = useState(false);
  const [submitState, dispatch] = useReducer(journalSubmitReducer, initialJournalSubmitState);
  const inFlightRef = useRef(false);
  const attemptRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      attemptRef.current += 1;
    };
  }, []);

  if (!resolution.ok && resolution.reason === 'missing') {
    return (
      <section className="flex min-h-full flex-col gap-4 p-4 pb-[env(safe-area-inset-bottom)]">
        <header className="flex flex-col gap-1.5">
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            {t('app.journalNew.entryChoice.heading')}
          </h1>
          <p className="text-muted-foreground text-sm">{t('app.journalNew.entryChoice.prompt')}</p>
        </header>
        <div className="grid gap-3 md:grid-cols-2">
          <Link
            className="border-border bg-card text-foreground hover:border-primary/50 focus-visible:ring-ring/50 flex min-h-11 flex-col gap-1 rounded-xl border p-5 text-left transition-colors outline-none focus-visible:ring-3"
            to={buildAppJournalNewPath('investment')}
          >
            <span className="text-base font-semibold">
              {t('app.journalNew.entryChoice.investment.title')}
            </span>
            <span className="text-muted-foreground text-sm leading-relaxed">
              {t('app.journalNew.entryChoice.investment.description')}
            </span>
          </Link>
          <Link
            className="border-border bg-card text-foreground hover:border-primary/50 focus-visible:ring-ring/50 flex min-h-11 flex-col gap-1 rounded-xl border p-5 text-left transition-colors outline-none focus-visible:ring-3"
            to={buildAppJournalNewPath('study')}
          >
            <span className="text-base font-semibold">
              {t('app.journalNew.entryChoice.study.title')}
            </span>
            <span className="text-muted-foreground text-sm leading-relaxed">
              {t('app.journalNew.entryChoice.study.description')}
            </span>
          </Link>
        </div>
      </section>
    );
  }

  if (!resolution.ok) {
    return (
      <section className="flex min-h-full flex-col gap-4 p-4 pb-[env(safe-area-inset-bottom)]">
        <div className="border-border bg-card flex flex-col gap-3 rounded-xl border p-5">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-foreground text-lg font-semibold">
              {t('app.journalNew.invalidType.heading')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t('app.journalNew.invalidType.description')}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-center text-sm font-medium"
              to={buildAppJournalNewPath('investment')}
            >
              {t('app.journalNew.invalidType.investmentAction')}
            </Link>
            <Link
              className="border-border text-foreground rounded-md border px-4 py-2 text-center text-sm font-medium"
              to={buildAppJournalNewPath('study')}
            >
              {t('app.journalNew.invalidType.studyAction')}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const goToEntryChoice = () => {
    if (submitState.status === 'submitting') return;
    if (!dirty || window.confirm(t('app.journalNew.typeChange.dirtyConfirm'))) {
      navigate(APP_ROUTE_PATHS.journalNew);
    }
  };
  const returnToReview = () => {
    if (!reviewHandoff || submitState.status === 'submitting') return;
    if (!dirty || window.confirm(t('app.journalNew.handoff.returnToReviewDirtyConfirm'))) {
      if (navigationType === 'PUSH') {
        navigate(-1);
      } else {
        navigate(reviewHandoff.returnTarget, { replace: true });
      }
    }
  };
  const submit = (state: InvestmentJournalFormState | StudyJournalFormState) => {
    if (!createPort || inFlightRef.current) return;

    inFlightRef.current = true;
    const attempt = ++attemptRef.current;
    dispatch({ type: 'submitStarted' });
    const command =
      state.type === 'investment'
        ? toInvestmentJournalCreateCommand(state)
        : toStudyJournalCreateCommand(state);

    void Promise.resolve()
      .then(() => createPort.create(command))
      .then((result) => {
        if (!mountedRef.current || attempt !== attemptRef.current) return;
        const journalId = result.journalId.trim();
        if (journalId === '') {
          dispatch({ type: 'submitFailed', error: 'invalid_result' });
          return;
        }
        dispatch({ type: 'submitSucceeded', journalId });
        const savedDecisionContext =
          decisionContextEnabled && decisionContext
            ? {
                ...decisionContext,
                checklist: decisionContext.checklist.map((item) => ({ ...item })),
                optionalEvidence: decisionContext.optionalEvidence.map((item) => ({ ...item })),
              }
            : undefined;
        navigate(buildAppJournalDetailPath(journalId), {
          replace: true,
          state: savedDecisionContext ? { decisionContext: savedDecisionContext } : undefined,
        });
      })
      .catch(() => {
        if (!mountedRef.current || attempt !== attemptRef.current) return;
        dispatch({ type: 'submitFailed', error: 'create_failed' });
      })
      .finally(() => {
        if (attempt === attemptRef.current) inFlightRef.current = false;
      });
  };
  const formEdited = () => dispatch({ type: 'formEdited' });
  const typeCopy =
    resolution.type === 'study'
      ? {
          title: t('app.journalNew.study'),
          description: t('app.journalNew.entryChoice.study.description'),
        }
      : {
          title: t('app.journalNew.investment'),
          description: t('app.journalNew.entryChoice.investment.description'),
        };
  return (
    <section className="flex min-h-full flex-col">
      <header className="p-4 pb-0">
        <h1 className="text-foreground text-lg font-semibold">{typeCopy.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{typeCopy.description}</p>
        {reviewHandoff && (
          <section
            aria-labelledby="review-handoff-origin-heading"
            className="border-border bg-muted/30 mt-4 flex flex-col gap-2 rounded-xl border p-4"
          >
            <h2 id="review-handoff-origin-heading" className="text-sm font-semibold">
              {t('app.journalNew.handoff.originHeading')}
            </h2>
            <p className="text-muted-foreground text-sm leading-5">
              {t('app.journalNew.handoff.originDescription')}
            </p>
            <p className="text-muted-foreground text-xs font-semibold">
              {t('app.journalNew.handoff.questionLabel')}
            </p>
            <p className="text-sm leading-6 [overflow-wrap:anywhere]">
              {reviewHandoff.originalQuestion}
            </p>
            {reviewHandoff.kind === 'study' && (
              <p role="status" className="text-muted-foreground text-sm leading-5">
                {t('app.journalNew.handoff.learningDraftNotice')}
              </p>
            )}
            <button
              type="button"
              onClick={returnToReview}
              disabled={submitState.status === 'submitting'}
              className="text-primary focus-visible:ring-ring/50 min-h-11 self-start rounded-md text-left text-sm font-semibold underline-offset-4 outline-none hover:underline focus-visible:ring-3"
            >
              {t('app.journalNew.handoff.returnToReview')}
            </button>
          </section>
        )}
        <button
          type="button"
          onClick={goToEntryChoice}
          disabled={submitState.status === 'submitting'}
          className="text-primary focus-visible:ring-ring/50 mt-3 min-h-11 rounded-md text-left text-sm font-semibold underline-offset-4 outline-none hover:underline focus-visible:ring-3"
        >
          {t('app.journalNew.typeChange.action')}
        </button>
      </header>
      {decisionContext && (
        <DecisionContextCapturePanel
          context={decisionContext}
          enabled={decisionContextEnabled}
          onEnabledChange={setDecisionContextEnabled}
          onEvidenceChange={(evidenceId) => {
            setDecisionContext((current) =>
              current
                ? {
                    ...current,
                    optionalEvidence: current.optionalEvidence.map((evidence) =>
                      evidence.id === evidenceId
                        ? { ...evidence, included: !evidence.included }
                        : evidence,
                    ),
                  }
                : current,
            );
          }}
        />
      )}
      {resolution.type === 'investment' ? (
        <InvestmentJournalForm
          onDirtyChange={setDirty}
          onValidSubmit={createPort ? submit : undefined}
          onFormEdited={createPort ? formEdited : undefined}
          submitState={createPort ? submitState : undefined}
        />
      ) : (
        <StudyJournalForm
          initialValues={reviewHandoff?.learningDraft}
          onDirtyChange={setDirty}
          onValidSubmit={createPort ? submit : undefined}
          onFormEdited={createPort ? formEdited : undefined}
          submitState={createPort ? submitState : undefined}
        />
      )}
      {createPort && (
        <div className="px-4 pb-4">
          <p role="status" aria-live="polite" className="text-muted-foreground text-sm">
            {t('app.journalNew.form.testFlowNotice')}
            {submitState.status === 'submitting' ? ` ${t('app.journalNew.form.submitting')}` : ''}
          </p>
          {submitState.status === 'failed' && (
            <p role="alert" className="text-destructive mt-2 text-sm">
              {t('app.journalNew.form.failed')}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
