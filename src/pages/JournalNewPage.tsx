import { useEffect, useReducer, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';

import { DecisionContextCapturePanel } from '@/components/journal/DecisionContextPanel';
import { InvestmentJournalForm } from '@/features/journal-new/components/InvestmentJournalForm';
import { StudyJournalForm } from '@/features/journal-new/components/StudyJournalForm';
import { buildAppJournalDetailPath, buildAppJournalNewPath } from '@/constants/routes';
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

/**
 * `type` 쿼리 값('investment'/'study')은 도메인 식별자이며 번역 대상이 아니다 —
 * 표시 문구만 `t()`로 조회한다.
 */
type Props = { createPort?: JournalCreatePort };

interface JournalNewLocationState {
  decisionContext?: DecisionContextSnapshot;
}

export function JournalNewPage({ createPort }: Props) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const resolution = resolveJournalType(searchParams);
  const locationState = location.state as JournalNewLocationState | null;
  const incomingDecisionContext = locationState?.decisionContext;
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

  const changeType = (type: 'investment' | 'study') => {
    if (submitState.status === 'submitting') return;
    if (type === resolution.type) return;
    if (!dirty || window.confirm(t('app.journalNew.typeSwitch.dirtyConfirm'))) {
      navigate(buildAppJournalNewPath(type));
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
  return (
    <section className="flex min-h-full flex-col">
      <header className="p-4 pb-0">
        <h1 className="text-foreground text-lg font-semibold">
          {resolution.type === 'study' ? t('app.journalNew.study') : t('app.journalNew.investment')}
        </h1>
        <div className="bg-muted mt-4 flex gap-1 rounded-lg p-1">
          <button
            type="button"
            onClick={() => changeType('investment')}
            disabled={submitState.status === 'submitting'}
            className="min-h-11 flex-1 rounded-md px-2 text-sm font-semibold focus-visible:outline-2"
          >
            {t('app.journalNew.typeSwitch.investment')}
          </button>
          <button
            type="button"
            onClick={() => changeType('study')}
            disabled={submitState.status === 'submitting'}
            className="min-h-11 flex-1 rounded-md px-2 text-sm font-semibold focus-visible:outline-2"
          >
            {t('app.journalNew.typeSwitch.study')}
          </button>
        </div>
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
