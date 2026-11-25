import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent, MouseEvent, RefObject } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router';

import { EmptyState } from '@/components/common/EmptyState';
import { useRetrospectiveDraft } from '@/components/layout/RetrospectiveDraftContext';
import { Stack } from '@/components/layout/Stack';
import { DecisionContextSnapshotView } from '@/components/journal/DecisionContextPanel';
import { RecordTagText } from '@/components/common/RecordTagText';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Disclosure } from '@/components/ui/disclosure';
import { ErrorState } from '@/components/ui/error-state';
import { InfoList, InfoRow } from '@/components/ui/info-row';
import { Notice } from '@/components/ui/notice';
import { TextField } from '@/components/ui/text-field';
import { APP_ROUTE_PATHS, buildAppJournalDetailPath } from '@/constants/routes';
import { useTranslation } from '@/i18n/I18nContext';
import { SavedRetrospectives } from '@/features/retrospective/SavedRetrospectives';
import { JournalRevisionReviewBoundary } from '@/features/journal-edit/JournalRevisionReviewBoundary';
import type { UseJournalDetailResult } from '@/features/journal-read/model/useJournalDetail';
import { formatJournalInstant, formatJournalOccurredAt, formatLocalizedDate } from '@/lib/date';
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
  onBack?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

function ReviewHeader({ title, backLabel, backTo, onBack }: ReviewHeaderProps) {
  return (
    <header className="retrospective-header flex min-h-14 items-center gap-1">
      <Link
        aria-label={backLabel}
        className={cn(
          buttonVariants({ variant: 'text-neutral', size: 'icon' }),
          'retrospective-header-back type-section-title shrink-0',
        )}
        to={backTo}
        onClick={onBack}
      >
        <span aria-hidden="true">←</span>
      </Link>
      <h1 className="type-content-title text-foreground">{title}</h1>
    </header>
  );
}

/** 사용자가 쓴 글·원본 본문: reading 16/27, 한글은 어절 단위로 줄바꿈하고 긴 무공백 문자열은 끊어 넘침을 막는다. */
const READING_TEXT_CLASS =
  'type-reading text-foreground min-w-0 max-w-2xl wrap-break-word break-keep';

function ReviewSummary({ entry }: { entry: JournalEntry }) {
  const { t, locale } = useTranslation();
  const heading =
    entry.type === 'investment' ? t(`app.journalList.subjects.${entry.subjectKey}`) : entry.title;

  return (
    <Card className="flex flex-col gap-3 p-5 sm:p-6">
      <p className="type-key-value text-foreground min-w-0 wrap-anywhere break-keep">{heading}</p>
      {/* 메타(유형·행동·감정)는 배지가 아니라 텍스트다. 값 색으로 감정에 의미를 싣지 않는다. */}
      <InfoList>
        <InfoRow label={t('app.journalReview.metadata.recordType')}>
          <RecordTagText kind="entryType" value={entry.type} />
        </InfoRow>
        <InfoRow label={t('app.journalReview.metadata.recordedAt')}>
          <time dateTime={entry.recordedAt}>{formatLocalizedDate(entry.recordedAt, locale)}</time>
        </InfoRow>
        {entry.type === 'investment' && (
          <>
            <InfoRow label={t('app.journalReview.metadata.pastAction')}>
              <RecordTagText kind="action" value={entry.action} />
            </InfoRow>
            {entry.emotion && (
              <InfoRow label={t('app.journalReview.metadata.pastEmotion')}>
                <RecordTagText kind="emotion" value={entry.emotion} />
              </InfoRow>
            )}
          </>
        )}
      </InfoList>
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
    <Card className="px-5 py-2 sm:px-6">
      <ul className="divide-border divide-y">
        {items.map((item, index) => {
          const statusLabel = item.checked ? checkedLabel : uncheckedLabel;
          return (
            <li className="flex min-w-0 items-start gap-3 py-3" key={`${index}-${item.text}`}>
              {/* 상태는 기호+텍스트로 함께 전달한다(색에만 의존하지 않음). */}
              <span
                aria-hidden="true"
                className={cn(
                  'type-label flex size-6 shrink-0 items-center justify-center',
                  item.checked ? 'text-foreground' : 'text-text-secondary',
                )}
              >
                {item.checked ? '✓' : '—'}
              </span>
              <span className="min-w-0 flex-1">
                <span className="type-body text-foreground block wrap-anywhere break-keep">
                  {item.text}
                </span>
                <span className="type-meta text-text-secondary mt-1 block">{statusLabel}</span>
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
    <Card className="px-5 py-2 sm:px-6">
      <ul className="divide-border divide-y">
        {prompts.map((prompt, index) => (
          <li className="flex min-w-0 items-start gap-3 py-3" key={prompt}>
            <span
              aria-hidden="true"
              className="type-label text-text-secondary flex size-6 shrink-0 items-center justify-center"
            >
              {index + 1}
            </span>
            <span className="type-body text-foreground min-w-0 wrap-anywhere break-keep">
              {prompt}
            </span>
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
        className="flex flex-col gap-4"
        aria-labelledby="retrospective-saved-heading"
        data-testid="retrospective-saved"
      >
        <div className="flex flex-col gap-2">
          <h2 id="retrospective-saved-heading" className="type-section-title text-foreground">
            {copy.savedHeading}
          </h2>
          <p className="type-supporting text-text-secondary break-keep">{copy.savedNotice}</p>
        </div>
        <Card className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-col gap-1">
            <span className="type-meta text-text-secondary block">{copy.savedAtLabel}</span>
            <time className="type-body text-foreground" dateTime={savedRecord.createdAt}>
              {formatJournalInstant(savedRecord.createdAt, undefined, locale)}
            </time>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="type-label text-text-secondary">{copy.bodyLabel}</h3>
            <p className={cn(READING_TEXT_CLASS, 'whitespace-pre-wrap')}>{savedRecord.body}</p>
          </div>
          {savedRecord.outcomeObservation && (
            <div className="border-border flex flex-col gap-1 border-t pt-4">
              <h3 className="type-label text-text-secondary">{copy.outcomeLabel}</h3>
              <p className={cn(READING_TEXT_CLASS, 'whitespace-pre-wrap')}>
                {savedRecord.outcomeObservation}
              </p>
            </div>
          )}
          {savedRecord.decisionQuality && (
            <div className="border-border flex flex-col gap-1 border-t pt-4">
              <h3 className="type-label text-text-secondary">{copy.qualityLabel}</h3>
              <p className={cn(READING_TEXT_CLASS, 'whitespace-pre-wrap')}>
                {savedRecord.decisionQuality}
              </p>
            </div>
          )}
          {savedRecord.nextCheck && (
            <div className="border-border flex flex-col gap-1 border-t pt-4">
              <h3 className="type-label text-text-secondary">{copy.nextCheckLabel}</h3>
              <p className={cn(READING_TEXT_CLASS, 'whitespace-pre-wrap')}>
                {savedRecord.nextCheck}
              </p>
            </div>
          )}
          {/* Light에서 inset=page 동색이라 page 위에서는 면이 안 보인다. 카드 안에 둔다. */}
          <Notice>{copy.separateRecordNotice}</Notice>
        </Card>
      </section>
    );
  }

  return (
    // 머리(제목·설명)는 카드 밖에 둔다. 원본 열 머리와 같은 높이에서 시작해 두 열이 같은 무게로 읽힌다.
    <form
      className="flex min-w-0 flex-col gap-4"
      aria-labelledby="retrospective-editor-heading"
      onSubmit={onSubmit}
      noValidate
      data-testid="retrospective-editor"
    >
      <div className="flex flex-col gap-2">
        <h2 id="retrospective-editor-heading" className="type-section-title text-foreground">
          {copy.editorHeading}
        </h2>
        <p className="type-supporting text-text-secondary break-keep">{copy.editorDescription}</p>
      </div>

      <Card className="flex min-w-0 flex-col gap-6 p-5 sm:p-6">
        <TextField
          multiline
          ref={bodyRef}
          id="retrospective-body"
          name="retrospective-body"
          rows={6}
          label={copy.bodyLabel}
          hint={copy.bodyPrompt}
          error={validationError}
          value={draft.body}
          onChange={(event) => onDraftChange('body', event.target.value)}
          placeholder={copy.bodyPlaceholder}
        />

        {/* 선택 입력은 상자가 아니라 구분선으로 나뉜 접힘 줄이다. 버튼 의미(aria-expanded)는 그대로. */}
        <section className="border-border border-y" aria-labelledby="retrospective-outcome-heading">
          <button
            type="button"
            className="flex min-h-14 w-full items-center justify-between gap-3 py-3 text-left"
            aria-expanded={outcomeOpen}
            aria-controls="retrospective-optional-fields"
            onClick={onOutcomeToggle}
          >
            <span className="flex min-w-0 flex-col gap-1">
              <span
                id="retrospective-outcome-heading"
                className="type-content-title text-foreground block break-keep"
              >
                {copy.outcomeHeading}
              </span>
              <span className="type-meta text-text-secondary block break-keep">
                {copy.outcomeDescription}
              </span>
            </span>
            <ChevronDown
              aria-hidden="true"
              className={cn('text-text-secondary size-5 shrink-0', outcomeOpen && 'rotate-180')}
            />
          </button>
          {outcomeOpen && (
            <div id="retrospective-optional-fields" className="flex flex-col gap-5 pt-1 pb-4">
              <TextField
                multiline
                id="retrospective-outcome"
                name="retrospective-outcome"
                rows={3}
                label={copy.outcomeLabel}
                value={draft.outcomeObservation}
                onChange={(event) => onDraftChange('outcomeObservation', event.target.value)}
                placeholder={copy.outcomePlaceholder}
              />
              <div className="border-border flex flex-col gap-2 border-t pt-4">
                <h3 className="type-content-title text-foreground">{copy.qualityHeading}</h3>
                <TextField
                  multiline
                  id="retrospective-quality"
                  name="retrospective-quality"
                  rows={3}
                  label={copy.qualityLabel}
                  hint={copy.qualityDescription}
                  value={draft.decisionQuality}
                  onChange={(event) => onDraftChange('decisionQuality', event.target.value)}
                  placeholder={copy.qualityPlaceholder}
                />
              </div>
              <div className="border-border border-t pt-4">
                <TextField
                  multiline
                  id="retrospective-next-check"
                  name="retrospective-next-check"
                  rows={2}
                  label={copy.nextCheckLabel}
                  value={draft.nextCheck}
                  onChange={(event) => onDraftChange('nextCheck', event.target.value)}
                  placeholder={copy.nextCheckPlaceholder}
                />
              </div>
            </div>
          )}
        </section>

        {status === 'save-error' && (
          <Notice
            tone="danger"
            data-testid="retrospective-save-error"
            action={
              <Button type="button" variant="text" onClick={onRetry}>
                {copy.retry}
              </Button>
            }
          >
            {copy.saveError}
          </Notice>
        )}

        <div className="flex flex-col gap-3">
          {isSaving && (
            <p role="status" aria-live="polite" className="type-supporting text-text-secondary">
              {copy.saving}
            </p>
          )}
          {/* 이 화면의 핵심 행동 1개. 재시도는 text라 진한 버튼은 항상 저장 하나뿐이다. */}
          <Button type="submit" disabled={isSaving} className="w-full sm:w-auto sm:self-start">
            {isSaving ? copy.saving : copy.save}
          </Button>
        </div>
      </Card>
    </form>
  );
}

export interface JournalReviewPageProps {
  savePort?: RetrospectiveSavePort;
}

function ExampleJournalReviewPage({ savePort }: JournalReviewPageProps) {
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
      <div className="flex w-full min-w-0 flex-col gap-6 px-5 pt-4 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-6">
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
                className={buttonVariants({ variant: 'text' })}
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
      <div className="px-5 pt-4 sm:px-6 sm:pt-6">
        <ReviewHeader
          title={t('app.journalReview.headerTitle')}
          backLabel={t('app.journalReview.backLabel')}
          backTo={detailPath}
        />
        <p className="type-supporting text-text-secondary mt-3 break-keep">
          {t('app.journalReview.exampleOnly')}
        </p>
      </div>

      <div className="retrospective-workspace" data-testid="retrospective-workspace">
        <section
          className="retrospective-original-pane min-w-0 px-5 pt-6 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:px-6"
          aria-labelledby="retrospective-original-heading"
        >
          <Stack gap="section">
            <div className="flex flex-col gap-2">
              <h2
                id="retrospective-original-heading"
                className="type-section-title text-foreground"
              >
                {t('app.journalReview.retrospective.originalHeading')}
              </h2>
              <p className="type-supporting text-text-secondary break-keep">
                {t('app.journalReview.retrospective.immutableNotice')}
              </p>
            </div>

            <section className="flex flex-col gap-3" aria-labelledby="journal-review-summary">
              <h2 id="journal-review-summary" className="type-content-title text-foreground">
                {t('app.journalReview.summary.heading')}
              </h2>
              <ReviewSummary entry={entry} />
            </section>

            {entry.type === 'investment' ? (
              <>
                <section
                  className="flex flex-col gap-3"
                  aria-labelledby="journal-review-investment-question"
                >
                  <h2
                    id="journal-review-investment-question"
                    className="type-content-title text-foreground"
                  >
                    {t('app.journalReview.investment.questionHeading')}
                  </h2>
                  <Card className="p-5 sm:p-6">
                    <p className="type-content-title text-foreground min-w-0 wrap-break-word break-keep">
                      {entry.question}
                    </p>
                  </Card>
                </section>

                <section
                  className="flex flex-col gap-3"
                  aria-labelledby="journal-review-investment-memo"
                >
                  <h2
                    id="journal-review-investment-memo"
                    className="type-content-title text-foreground"
                  >
                    {t('app.journalReview.investment.memoHeading')}
                  </h2>
                  <Card className="p-5 sm:p-6">
                    <p className={READING_TEXT_CLASS}>{entry.memo}</p>
                  </Card>
                </section>

                <section
                  className="flex flex-col gap-3"
                  aria-labelledby="journal-review-investment-status"
                >
                  <h2
                    id="journal-review-investment-status"
                    className="type-content-title text-foreground"
                  >
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
                <section
                  className="flex flex-col gap-3"
                  aria-labelledby="journal-review-study-question"
                >
                  <h2
                    id="journal-review-study-question"
                    className="type-content-title text-foreground"
                  >
                    {t('app.journalReview.study.questionHeading')}
                  </h2>
                  <Card className="p-5 sm:p-6">
                    <p className="type-content-title text-foreground min-w-0 wrap-break-word break-keep">
                      {entry.question}
                    </p>
                  </Card>
                </section>

                <section
                  className="flex flex-col gap-3"
                  aria-labelledby="journal-review-study-memo"
                >
                  <h2 id="journal-review-study-memo" className="type-content-title text-foreground">
                    {t('app.journalReview.study.memoHeading')}
                  </h2>
                  <Card className="p-5 sm:p-6">
                    <p className={READING_TEXT_CLASS}>{entry.memo}</p>
                  </Card>
                </section>

                <section
                  className="flex flex-col gap-3"
                  aria-labelledby="journal-review-study-status"
                >
                  <h2
                    id="journal-review-study-status"
                    className="type-content-title text-foreground"
                  >
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

            {entry.decisionContext && (
              <DecisionContextSnapshotView context={entry.decisionContext} />
            )}

            {/* COPY ⑥ 고지. Light에서 inset=page 동색이라 page 위에서는 면이 안 보여 카드 안에 둔다. */}
            <Card className="p-3">
              <Notice>{t('app.journalReview.policyNotice')}</Notice>
            </Card>

            <section className="flex flex-col gap-3" aria-labelledby="journal-review-reflection">
              <h2 id="journal-review-reflection" className="type-content-title text-foreground">
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
          </Stack>
        </section>

        <section
          className="retrospective-editor-pane min-w-0 px-5 pt-6 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:px-6"
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

function SavedJournalReviewPage({ state, retry }: UseJournalDetailResult) {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useTranslation();
  const detail = state.data;
  const originalTouched = useRef(false);
  const [retrospectiveDirty, setRetrospectiveDirty] = useState(false);
  const { setDirty } = useRetrospectiveDraft();
  const handleDirtyChange = useCallback(
    (dirty: boolean) => {
      setRetrospectiveDirty(dirty);
      setDirty(dirty);
    },
    [setDirty],
  );
  const confirmBack = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      (event.currentTarget.target && event.currentTarget.target !== '_self')
    )
      return;
    if (
      retrospectiveDirty &&
      !window.confirm(
        locale === 'ko'
          ? '작성 중인 복기가 사라집니다. 돌아갈까요?'
          : 'Your unsaved reflection will be lost. Go back?',
      )
    )
      event.preventDefault();
  };
  const [originalOpen, setOriginalOpen] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(min-width: 1024px) and (orientation: landscape), (min-width: 1280px)')
          .matches
      : true,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia(
      '(min-width: 1024px) and (orientation: landscape), (min-width: 1280px)',
    );
    const onChange = (event: MediaQueryListEvent) => {
      if (!originalTouched.current) setOriginalOpen(event.matches);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const notFound = state.error?.code === 'journal_not_found';

  return (
    <div className="retrospective-route flex min-h-full w-full min-w-0 flex-col">
      <div className="px-5 pt-4 sm:px-6 sm:pt-6">
        <ReviewHeader
          title={
            notFound ? t('app.journalReview.notFound.heading') : t('app.journalReview.headerTitle')
          }
          backLabel={
            state.status === 'success'
              ? t('app.journalReview.backLabel')
              : t('app.journalReview.notFound.listAction')
          }
          backTo={
            state.status === 'success' && id
              ? buildAppJournalDetailPath(id)
              : APP_ROUTE_PATHS.journalList
          }
          onBack={confirmBack}
        />
      </div>
      {state.status === 'loading' && (
        <div className="px-5 py-6 sm:px-6">
          <Card
            role="status"
            className="type-supporting text-text-secondary px-6 py-12 text-center"
          >
            {t('app.journalDetail.loading.title')}
          </Card>
        </div>
      )}
      {state.status === 'error' && (
        <div className="px-5 py-6 sm:px-6">
          <Card>
            {notFound ? (
              <EmptyState
                title={t('app.journalReview.notFound.description')}
                action={
                  <Link
                    className={buttonVariants({ variant: 'text' })}
                    to={APP_ROUTE_PATHS.journalList}
                  >
                    {t('app.journalReview.notFound.listAction')}
                  </Link>
                }
              />
            ) : (
              <ErrorState
                title={t('app.journalDetail.error.title')}
                // 복구 가능한 오류에서는 재시도가 유일한 핵심 행동이라 진한 버튼 1개, 목록 이동은 text.
                action={
                  <div className="flex flex-col items-center gap-2">
                    <Button type="button" onClick={retry}>
                      {t('app.journalDetail.error.retry')}
                    </Button>
                    <Link
                      className={buttonVariants({ variant: 'text' })}
                      to={APP_ROUTE_PATHS.journalList}
                    >
                      {t('app.journalReview.notFound.listAction')}
                    </Link>
                  </div>
                }
              />
            )}
          </Card>
        </div>
      )}
      {state.status === 'success' && detail && (
        <div className="retrospective-workspace">
          <section
            className="retrospective-original-pane min-w-0 px-5 py-6 sm:px-6"
            aria-labelledby="saved-retro-original"
          >
            <Stack gap="group">
              <h2 id="saved-retro-original" className="type-section-title text-foreground">
                {t('app.journalReview.retrospective.originalHeading')}
              </h2>
              <Card className="flex flex-col gap-4 p-5 sm:p-6">
                <h3 className="type-key-value text-foreground wrap-anywhere break-keep">
                  {detail.type === 'investment' ? detail.assetName : detail.title}
                </h3>
                <p className="type-meta text-text-secondary">
                  {formatJournalOccurredAt(detail.occurredAt, detail.timeZone, locale)}
                </p>
                {detail.type === 'investment' && (
                  <p className="type-supporting text-text-secondary">
                    <RecordTagText kind="action" value={detail.action} />
                  </p>
                )}
                {!originalOpen && (
                  <p className="type-supporting text-text-secondary line-clamp-2 wrap-anywhere break-keep">
                    {detail.type === 'investment' ? detail.reasoning : detail.keyContent}
                  </p>
                )}
                <Disclosure
                  className="retrospective-original-details"
                  open={originalOpen}
                  onToggle={(event) => setOriginalOpen(event.currentTarget.open)}
                  onSummaryClick={() => {
                    originalTouched.current = true;
                  }}
                  summary={t('app.journalReview.retrospective.originalDetails')}
                >
                  {detail.type === 'investment' ? (
                    <p className={cn(READING_TEXT_CLASS, 'whitespace-pre-wrap')}>
                      {detail.reasoning}
                    </p>
                  ) : (
                    <>
                      <p className={cn(READING_TEXT_CLASS, 'whitespace-pre-wrap')}>
                        {detail.keyContent}
                      </p>
                      <ul className="type-body text-foreground flex list-disc flex-col gap-1 pl-5 wrap-anywhere break-keep">
                        {detail.openQuestions.map((question, index) => (
                          <li key={index}>{question}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </Disclosure>
              </Card>
            </Stack>
          </section>
          <section
            className="retrospective-editor-pane min-w-0 px-5 py-6 sm:px-6"
            aria-labelledby="saved-retro-unavailable"
          >
            <Stack gap="group">
              <h2 id="saved-retro-unavailable" className="type-section-title text-foreground">
                {t('app.journalReview.retrospective.editorHeading')}
              </h2>
              {import.meta.env.VITE_FINANCE_RETROSPECTIVE_ENABLED === 'true' &&
              detail.revision !== undefined ? (
                <Card className="p-5 sm:p-6">
                  <SavedRetrospectives
                    key={`${detail.journalId}:${detail.revision}`}
                    journalId={detail.journalId}
                    revision={detail.revision}
                    timeZone={detail.timeZone}
                    onDirtyChange={handleDirtyChange}
                  />
                </Card>
              ) : (
                <Card className="p-3">
                  <Notice role="status">{t('app.journalReview.saveUnavailable')}</Notice>
                </Card>
              )}
              <Link
                className={buttonVariants({ variant: 'neutral' })}
                to={buildAppJournalDetailPath(detail.journalId)}
                onClick={confirmBack}
              >
                {t('app.journalReview.backLabel')}
              </Link>
            </Stack>
          </section>
        </div>
      )}
    </div>
  );
}

export function JournalReviewPage(props: JournalReviewPageProps) {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  return !searchParams.has('sourceRevision') && JOURNAL_ENTRIES.some((item) => item.id === id) ? (
    <ExampleJournalReviewPage {...props} />
  ) : (
    <JournalRevisionReviewBoundary key={id}>
      {(read) => <SavedJournalReviewPage {...read} />}
    </JournalRevisionReviewBoundary>
  );
}
