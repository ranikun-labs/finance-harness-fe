import { useEffect, useRef, useState } from 'react';
import type { FormEvent, RefObject } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';

import { EmptyState } from '@/components/common/EmptyState';
import { PolicyNotice } from '@/components/common/PolicyNotice';
import { DecisionContextSnapshotView } from '@/components/journal/DecisionContextPanel';
import { RecordTagBadge } from '@/components/common/RecordTagBadge';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { APP_ROUTE_PATHS, buildAppJournalDetailPath } from '@/constants/routes';
import { useTranslation } from '@/i18n/I18nContext';
import { formatLocalizedDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import {
  createLocalRetrospectiveSavePort,
  createRetrospectiveRecord,
  EMPTY_RETROSPECTIVE_DRAFT,
  type RetrospectiveDraft,
  type RetrospectiveRecord,
  type RetrospectiveSavePort,
} from '@/mocks/retrospective';
import {
  JOURNAL_ENTRIES,
  type JournalChecklistItem,
  type JournalEntry,
} from '@/mocks/journalEntries';

interface ReviewHeaderProps {
  title: string;
  backLabel: string;
  backTo: string;
}

function ReviewHeader({ title, backLabel, backTo }: ReviewHeaderProps) {
  return (
    <header className="relative flex min-h-11 items-center justify-center">
      <Link
        aria-label={backLabel}
        className="text-text-secondary focus-visible:ring-ring/50 absolute left-0 flex size-11 items-center justify-center rounded-md text-xl font-semibold outline-none focus-visible:ring-3"
        to={backTo}
      >
        <span aria-hidden="true">←</span>
      </Link>
      <h1 className="text-base font-bold">{title}</h1>
    </header>
  );
}

function formatRetrospectiveTimestamp(value: string, locale: 'ko' | 'en'): string {
  return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
  }).format(new Date(value));
}

function ReviewSummary({ entry }: { entry: JournalEntry }) {
  const { t, locale } = useTranslation();
  const heading =
    entry.type === 'investment' ? t(`app.journalList.subjects.${entry.subjectKey}`) : entry.title;

  return (
    <Card className="space-y-4 p-5">
      <p className="min-w-0 text-xl font-extrabold tracking-tight [overflow-wrap:anywhere]">
        {heading}
      </p>
      <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 text-sm">
        <dt className="text-muted-foreground">{t('app.journalReview.metadata.recordType')}</dt>
        <dd className="justify-self-end">
          <RecordTagBadge kind="entryType" value={entry.type} />
        </dd>
        <dt className="text-muted-foreground">{t('app.journalReview.metadata.recordedAt')}</dt>
        <dd className="text-right font-medium">
          <time dateTime={entry.recordedAt}>{formatLocalizedDate(entry.recordedAt, locale)}</time>
        </dd>
        {entry.type === 'investment' && (
          <>
            <dt className="text-muted-foreground">{t('app.journalReview.metadata.pastAction')}</dt>
            <dd className="justify-self-end">
              <RecordTagBadge kind="action" value={entry.action} />
            </dd>
            {entry.emotion && (
              <>
                <dt className="text-muted-foreground">
                  {t('app.journalReview.metadata.pastEmotion')}
                </dt>
                <dd className="justify-self-end">
                  <RecordTagBadge kind="emotion" value={entry.emotion} />
                </dd>
              </>
            )}
          </>
        )}
      </dl>
    </Card>
  );
}

interface StatusListProps {
  items: JournalChecklistItem[];
  checkedLabel: string;
  uncheckedLabel: string;
}

function StatusList({ items, checkedLabel, uncheckedLabel }: StatusListProps) {
  return (
    <Card>
      <ul className="divide-border divide-y">
        {items.map((item, index) => {
          const statusLabel = item.checked ? checkedLabel : uncheckedLabel;
          return (
            <li className="flex min-w-0 items-start gap-3 p-4" key={`${index}-${item.text}`}>
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold',
                  item.checked
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted text-muted-foreground',
                )}
              >
                {item.checked ? '✓' : '—'}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm leading-6 [overflow-wrap:anywhere]">
                  {item.text}
                </span>
                <span className="text-muted-foreground mt-1 block text-xs">{statusLabel}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function ReflectionPromptList({ prompts }: { prompts: string[] }) {
  return (
    <Card>
      <ul className="divide-border divide-y">
        {prompts.map((prompt, index) => (
          <li className="flex min-w-0 items-start gap-3 p-4" key={prompt}>
            <span
              aria-hidden="true"
              className="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            >
              {index + 1}
            </span>
            <span className="min-w-0 text-sm leading-6 [overflow-wrap:anywhere]">{prompt}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

interface RetrospectiveEditorProps {
  draft: RetrospectiveDraft;
  status: 'editing' | 'saving' | 'save-error' | 'saved';
  validationError?: string;
  savedRecord?: RetrospectiveRecord;
  outcomeOpen: boolean;
  bodyRef: RefObject<HTMLTextAreaElement | null>;
  onDraftChange: (field: keyof RetrospectiveDraft, value: string) => void;
  onOutcomeToggle: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onRetry: () => void;
}

function RetrospectiveEditor({
  draft,
  status,
  validationError,
  savedRecord,
  outcomeOpen,
  bodyRef,
  onDraftChange,
  onOutcomeToggle,
  onSubmit,
  onRetry,
}: RetrospectiveEditorProps) {
  const { locale, t } = useTranslation();
  const copy = {
    editorHeading: t('app.journalReview.retrospective.editorHeading'),
    editorDescription: t('app.journalReview.retrospective.editorDescription'),
    bodyLabel: t('app.journalReview.retrospective.bodyLabel'),
    bodyPrompt: t('app.journalReview.retrospective.bodyPrompt'),
    bodyPlaceholder: t('app.journalReview.retrospective.bodyPlaceholder'),
    outcomeHeading: t('app.journalReview.retrospective.outcomeHeading'),
    outcomeDescription: t('app.journalReview.retrospective.outcomeDescription'),
    outcomeLabel: t('app.journalReview.retrospective.outcomeLabel'),
    outcomePlaceholder: t('app.journalReview.retrospective.outcomePlaceholder'),
    qualityHeading: t('app.journalReview.retrospective.qualityHeading'),
    qualityDescription: t('app.journalReview.retrospective.qualityDescription'),
    qualityLabel: t('app.journalReview.retrospective.qualityLabel'),
    qualityPlaceholder: t('app.journalReview.retrospective.qualityPlaceholder'),
    nextCheckLabel: t('app.journalReview.retrospective.nextCheckLabel'),
    nextCheckPlaceholder: t('app.journalReview.retrospective.nextCheckPlaceholder'),
    save: t('app.journalReview.retrospective.save'),
    saving: t('app.journalReview.retrospective.saving'),
    saveError: t('app.journalReview.retrospective.saveError'),
    retry: t('app.journalReview.retrospective.retry'),
    savedHeading: t('app.journalReview.retrospective.savedHeading'),
    savedNotice: t('app.journalReview.retrospective.savedNotice'),
    savedAtLabel: t('app.journalReview.retrospective.savedAtLabel'),
    separateRecordNotice: t('app.journalReview.retrospective.separateRecordNotice'),
    immutableNotice: t('app.journalReview.retrospective.immutableNotice'),
  };
  const isSaving = status === 'saving';
  const isSaved = status === 'saved' && savedRecord;

  if (isSaved) {
    return (
      <section
        className="space-y-4"
        aria-labelledby="retrospective-saved-heading"
        data-testid="retrospective-saved"
      >
        <div className="space-y-2">
          <h2 id="retrospective-saved-heading" className="text-lg font-bold">
            {copy.savedHeading}
          </h2>
          <p className="text-muted-foreground text-sm leading-6">{copy.savedNotice}</p>
        </div>
        <Card className="space-y-4 p-5">
          <div className="space-y-1">
            <span className="text-muted-foreground block text-xs font-semibold">
              {copy.savedAtLabel}
            </span>
            <time className="text-sm font-medium" dateTime={savedRecord.createdAt}>
              {formatRetrospectiveTimestamp(savedRecord.createdAt, locale)}
            </time>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">{copy.bodyLabel}</h3>
            <p className="text-sm leading-7 [overflow-wrap:anywhere]">{savedRecord.body}</p>
          </div>
          {savedRecord.outcomeObservation && (
            <div className="border-border space-y-1 border-t pt-4">
              <h3 className="text-sm font-semibold">{copy.outcomeLabel}</h3>
              <p className="text-sm leading-7 [overflow-wrap:anywhere]">
                {savedRecord.outcomeObservation}
              </p>
            </div>
          )}
          {savedRecord.decisionQuality && (
            <div className="border-border space-y-1 border-t pt-4">
              <h3 className="text-sm font-semibold">{copy.qualityLabel}</h3>
              <p className="text-sm leading-7 [overflow-wrap:anywhere]">
                {savedRecord.decisionQuality}
              </p>
            </div>
          )}
          {savedRecord.nextCheck && (
            <div className="border-border space-y-1 border-t pt-4">
              <h3 className="text-sm font-semibold">{copy.nextCheckLabel}</h3>
              <p className="text-sm leading-7 [overflow-wrap:anywhere]">{savedRecord.nextCheck}</p>
            </div>
          )}
        </Card>
        <PolicyNotice>{copy.separateRecordNotice}</PolicyNotice>
      </section>
    );
  }

  return (
    <form
      className="space-y-5"
      aria-labelledby="retrospective-editor-heading"
      onSubmit={onSubmit}
      noValidate
      data-testid="retrospective-editor"
    >
      <div className="space-y-2">
        <h2 id="retrospective-editor-heading" className="text-lg font-bold">
          {copy.editorHeading}
        </h2>
        <p className="text-muted-foreground text-sm leading-6">{copy.editorDescription}</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="retrospective-body" className="text-sm font-semibold">
          {copy.bodyLabel}
        </label>
        <p id="retrospective-body-prompt" className="text-muted-foreground text-xs leading-5">
          {copy.bodyPrompt}
        </p>
        <textarea
          ref={bodyRef}
          id="retrospective-body"
          name="retrospective-body"
          rows={6}
          value={draft.body}
          onChange={(event) => onDraftChange('body', event.target.value)}
          placeholder={copy.bodyPlaceholder}
          aria-invalid={validationError ? 'true' : 'false'}
          aria-describedby={
            validationError ? 'retrospective-body-error' : 'retrospective-body-prompt'
          }
          className="border-border bg-background focus-visible:ring-ring/50 min-h-32 w-full resize-y rounded-xl border p-4 text-sm leading-7 outline-none focus-visible:ring-3"
        />
        {validationError && (
          <p id="retrospective-body-error" role="alert" className="text-destructive text-sm">
            {validationError}
          </p>
        )}
      </div>

      <section
        className="border-border overflow-hidden rounded-xl border"
        aria-labelledby="retrospective-outcome-heading"
      >
        <button
          type="button"
          className="focus-visible:ring-ring/50 flex min-h-14 w-full items-center justify-between gap-3 p-4 text-left outline-none focus-visible:ring-3"
          aria-expanded={outcomeOpen}
          aria-controls="retrospective-optional-fields"
          onClick={onOutcomeToggle}
        >
          <span className="min-w-0 space-y-1">
            <span id="retrospective-outcome-heading" className="block text-sm font-semibold">
              {copy.outcomeHeading}
            </span>
            <span className="text-muted-foreground block text-xs leading-5">
              {copy.outcomeDescription}
            </span>
          </span>
          <span aria-hidden="true" className="text-muted-foreground shrink-0 text-lg">
            {outcomeOpen ? '−' : '+'}
          </span>
        </button>
        {outcomeOpen && (
          <div
            id="retrospective-optional-fields"
            className="bg-muted/20 border-border space-y-5 border-t p-4"
          >
            <div className="space-y-2">
              <label htmlFor="retrospective-outcome" className="text-sm font-semibold">
                {copy.outcomeLabel}
              </label>
              <textarea
                id="retrospective-outcome"
                name="retrospective-outcome"
                rows={3}
                value={draft.outcomeObservation}
                onChange={(event) => onDraftChange('outcomeObservation', event.target.value)}
                placeholder={copy.outcomePlaceholder}
                className="border-border bg-background focus-visible:ring-ring/50 min-h-20 w-full resize-y rounded-xl border p-3 text-sm leading-6 outline-none focus-visible:ring-3"
              />
            </div>
            <div className="border-border space-y-2 border-t pt-4">
              <h3 className="text-sm font-semibold">{copy.qualityHeading}</h3>
              <p className="text-muted-foreground text-xs leading-5">{copy.qualityDescription}</p>
              <label htmlFor="retrospective-quality" className="text-sm font-semibold">
                {copy.qualityLabel}
              </label>
              <textarea
                id="retrospective-quality"
                name="retrospective-quality"
                rows={3}
                value={draft.decisionQuality}
                onChange={(event) => onDraftChange('decisionQuality', event.target.value)}
                placeholder={copy.qualityPlaceholder}
                className="border-border bg-background focus-visible:ring-ring/50 min-h-20 w-full resize-y rounded-xl border p-3 text-sm leading-6 outline-none focus-visible:ring-3"
              />
            </div>
            <div className="border-border space-y-2 border-t pt-4">
              <label htmlFor="retrospective-next-check" className="text-sm font-semibold">
                {copy.nextCheckLabel}
              </label>
              <textarea
                id="retrospective-next-check"
                name="retrospective-next-check"
                rows={2}
                value={draft.nextCheck}
                onChange={(event) => onDraftChange('nextCheck', event.target.value)}
                placeholder={copy.nextCheckPlaceholder}
                className="border-border bg-background focus-visible:ring-ring/50 min-h-16 w-full resize-y rounded-xl border p-3 text-sm leading-6 outline-none focus-visible:ring-3"
              />
            </div>
          </div>
        )}
      </section>

      {status === 'save-error' && (
        <div
          className="border-destructive/30 bg-destructive/5 text-destructive space-y-3 rounded-xl border p-4"
          role="alert"
          data-testid="retrospective-save-error"
        >
          <p className="text-sm leading-6">{copy.saveError}</p>
          <button
            type="button"
            className={cn(buttonVariants({ variant: 'destructive' }), 'min-h-11')}
            onClick={onRetry}
          >
            {copy.retry}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {isSaving && (
          <p role="status" aria-live="polite" className="text-muted-foreground text-sm">
            {copy.saving}
          </p>
        )}
        <button
          type="submit"
          disabled={isSaving}
          className={cn(buttonVariants({ size: 'lg' }), 'min-h-12 w-full')}
        >
          {isSaving ? copy.saving : copy.save}
        </button>
      </div>
    </form>
  );
}

export interface JournalReviewPageProps {
  savePort?: RetrospectiveSavePort;
}

export function JournalReviewPage({ savePort }: JournalReviewPageProps) {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const entry = JOURNAL_ENTRIES.find((item) => item.id === id);
  const [localSavePort] = useState<RetrospectiveSavePort>(() =>
    createLocalRetrospectiveSavePort({
      failFirst: searchParams.get('fixture') === 'save-error',
    }),
  );
  const mountedRef = useRef(true);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState<RetrospectiveDraft>(() => ({ ...EMPTY_RETROSPECTIVE_DRAFT }));
  const [status, setStatus] = useState<'editing' | 'saving' | 'save-error' | 'saved'>('editing');
  const [validationError, setValidationError] = useState<string>();
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const [savedRecord, setSavedRecord] = useState<RetrospectiveRecord>();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const updateDraft = (field: keyof RetrospectiveDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    if (validationError) setValidationError(undefined);
    if (status === 'save-error') setStatus('editing');
  };

  const persistRetrospective = async () => {
    if (!entry || status === 'saving' || status === 'saved') return;

    if (draft.body.trim() === '') {
      setValidationError(t('app.journalReview.retrospective.validationRequired'));
      bodyRef.current?.focus();
      return;
    }

    setValidationError(undefined);
    setStatus('saving');
    const record = createRetrospectiveRecord(entry, draft);
    try {
      await (savePort ?? localSavePort).save(record);
      if (!mountedRef.current) return;
      setSavedRecord(record);
      setStatus('saved');
    } catch {
      if (!mountedRef.current) return;
      setStatus('save-error');
    }
  };

  if (!entry) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-6 px-5 pt-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <ReviewHeader
          title={t('app.journalReview.notFound.heading')}
          backLabel={t('app.journalReview.notFound.listAction')}
          backTo={APP_ROUTE_PATHS.journalList}
        />
        <Card className="p-2">
          <EmptyState
            title={t('app.journalReview.notFound.description')}
            action={
              <Link
                className={cn(buttonVariants({ variant: 'default' }), 'mt-2 min-h-11')}
                to={APP_ROUTE_PATHS.journalList}
              >
                {t('app.journalReview.notFound.listAction')}
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  const detailPath = buildAppJournalDetailPath(entry.id);
  const checkedLabel = t('app.journalReview.status.checked');
  const uncheckedLabel = t('app.journalReview.status.unchecked');

  return (
    <div className="retrospective-route flex min-h-full w-full min-w-0 flex-col">
      <div className="px-5 pt-4">
        <ReviewHeader
          title={t('app.journalReview.headerTitle')}
          backLabel={t('app.journalReview.backLabel')}
          backTo={detailPath}
        />
      </div>

      <div className="retrospective-workspace" data-testid="retrospective-workspace">
        <section
          className="retrospective-original-pane min-w-0 space-y-6 px-5 pt-5 pb-[calc(2rem+env(safe-area-inset-bottom))]"
          aria-labelledby="retrospective-original-heading"
        >
          <div className="space-y-2">
            <h2 id="retrospective-original-heading" className="text-lg font-bold">
              {t('app.journalReview.retrospective.originalHeading')}
            </h2>
            <p className="text-muted-foreground text-sm leading-6">
              {t('app.journalReview.retrospective.immutableNotice')}
            </p>
          </div>

          <section className="space-y-2" aria-labelledby="journal-review-summary">
            <h2
              id="journal-review-summary"
              className="text-text-tertiary text-xs font-bold tracking-wider"
            >
              {t('app.journalReview.summary.heading')}
            </h2>
            <ReviewSummary entry={entry} />
          </section>

          {entry.type === 'investment' ? (
            <>
              <section className="space-y-2" aria-labelledby="journal-review-investment-question">
                <h2 id="journal-review-investment-question" className="text-base font-bold">
                  {t('app.journalReview.investment.questionHeading')}
                </h2>
                <Card className="border-l-primary border-l-4 p-4">
                  <p className="min-w-0 text-lg leading-7 font-semibold [overflow-wrap:anywhere]">
                    {entry.question}
                  </p>
                </Card>
              </section>

              <section className="space-y-2" aria-labelledby="journal-review-investment-memo">
                <h2 id="journal-review-investment-memo" className="text-base font-bold">
                  {t('app.journalReview.investment.memoHeading')}
                </h2>
                <Card className="p-4">
                  <p className="min-w-0 text-sm leading-7 [overflow-wrap:anywhere]">{entry.memo}</p>
                </Card>
              </section>

              <section className="space-y-3" aria-labelledby="journal-review-investment-status">
                <h2 id="journal-review-investment-status" className="text-base font-bold">
                  {t('app.journalReview.investment.statusHeading')}
                </h2>
                <StatusList
                  items={entry.decisionChecks}
                  checkedLabel={checkedLabel}
                  uncheckedLabel={uncheckedLabel}
                />
              </section>
            </>
          ) : (
            <>
              <section className="space-y-2" aria-labelledby="journal-review-study-question">
                <h2 id="journal-review-study-question" className="text-base font-bold">
                  {t('app.journalReview.study.questionHeading')}
                </h2>
                <Card className="border-l-muted-foreground border-l-4 p-4">
                  <p className="min-w-0 text-lg leading-7 font-semibold [overflow-wrap:anywhere]">
                    {entry.question}
                  </p>
                </Card>
              </section>

              <section className="space-y-2" aria-labelledby="journal-review-study-memo">
                <h2 id="journal-review-study-memo" className="text-base font-bold">
                  {t('app.journalReview.study.memoHeading')}
                </h2>
                <Card className="p-4">
                  <p className="min-w-0 text-sm leading-7 [overflow-wrap:anywhere]">{entry.memo}</p>
                </Card>
              </section>

              <section className="space-y-3" aria-labelledby="journal-review-study-status">
                <h2 id="journal-review-study-status" className="text-base font-bold">
                  {t('app.journalReview.study.statusHeading')}
                </h2>
                <StatusList
                  items={entry.nextChecks}
                  checkedLabel={checkedLabel}
                  uncheckedLabel={uncheckedLabel}
                />
              </section>
            </>
          )}

          {entry.decisionContext && <DecisionContextSnapshotView context={entry.decisionContext} />}

          <PolicyNotice>{t('app.journalReview.policyNotice')}</PolicyNotice>

          <section className="space-y-3" aria-labelledby="journal-review-reflection">
            <h2 id="journal-review-reflection" className="text-base font-bold">
              {entry.type === 'investment'
                ? t('app.journalReview.investment.reflectionHeading')
                : t('app.journalReview.study.reflectionHeading')}
            </h2>
            <ReflectionPromptList
              prompts={
                entry.type === 'investment'
                  ? [
                      t('app.journalReview.investment.prompts.assumption'),
                      t('app.journalReview.investment.prompts.uncheckedImpact'),
                      t('app.journalReview.investment.prompts.counterEvidence'),
                      t('app.journalReview.investment.prompts.nextChecks'),
                    ]
                  : [
                      t('app.journalReview.study.prompts.understanding'),
                      t('app.journalReview.study.prompts.revisit'),
                      t('app.journalReview.study.prompts.nextQuestion'),
                    ]
              }
            />
          </section>
        </section>

        <section
          className="retrospective-editor-pane min-w-0 space-y-6 px-5 pt-5 pb-[calc(2rem+env(safe-area-inset-bottom))]"
          aria-labelledby="retrospective-editor-heading"
        >
          <RetrospectiveEditor
            draft={draft}
            status={status}
            validationError={validationError}
            savedRecord={savedRecord}
            outcomeOpen={outcomeOpen}
            bodyRef={bodyRef}
            onDraftChange={updateDraft}
            onOutcomeToggle={() => setOutcomeOpen((current) => !current)}
            onSubmit={(event) => {
              event.preventDefault();
              void persistRetrospective();
            }}
            onRetry={() => {
              void persistRetrospective();
            }}
          />
        </section>
      </div>
    </div>
  );
}
