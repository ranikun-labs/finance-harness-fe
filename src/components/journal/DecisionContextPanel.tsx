import { useState } from 'react';

import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Disclosure } from '@/components/ui/disclosure';
import { InfoList, InfoRow } from '@/components/ui/info-row';
import type { DecisionContextSnapshot } from '@/mocks/decisionContext';
import { BREAKPOINTS } from '@/constants/layout';
import { useTranslation } from '@/i18n/I18nContext';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { formatJournalInstant } from '@/lib/date';
import { cn } from '@/lib/utils';
import { localize, type LocalizedText } from '@/mocks/reviewResult';

function StatusMark({ checked, label }: { checked: boolean; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold',
        checked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
      )}
    >
      <span aria-hidden="true">{checked ? '✓' : '—'}</span>
      {label}
    </span>
  );
}

/** 읽기 전용 snapshot의 확인 여부: 배지가 아니라 기호+라벨 텍스트다(색만으로 전달하지 않는다). */
function SnapshotCheckText({ checked, label }: { checked: boolean; label: string }) {
  return (
    <span
      className={cn(
        'type-meta inline-flex shrink-0 items-center gap-1',
        checked ? 'text-foreground font-semibold' : 'text-text-secondary',
      )}
    >
      <span aria-hidden="true">{checked ? '✓' : '—'}</span>
      {label}
    </span>
  );
}

function LocalizedTextBlock({ text, locale }: { text: LocalizedText; locale: 'ko' | 'en' }) {
  return <span className="min-w-0 wrap-anywhere">{localize(text, locale)}</span>;
}

export interface DecisionContextCapturePanelProps {
  context: DecisionContextSnapshot;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onEvidenceChange: (evidenceId: string) => void;
}

/**
 * Review → Journal presentation seam. This panel owns no submit/API data; it only
 * displays the context view-model and the local optional-evidence selection.
 *
 * 작성 폼의 맨 끝(기록 시점 다음)에 놓이는 마지막 필드 묶음이다(UX 계약 순서). 본문(질문·확인 항목·선택 사실)은
 * 접는 Disclosure이고, 폰(768 미만)에서는 한 줄 요약만 보이게 접힌 채 시작한다.
 */
export function DecisionContextCapturePanel({
  context,
  enabled,
  onEnabledChange,
  onEvidenceChange,
}: DecisionContextCapturePanelProps) {
  const { locale, t } = useTranslation();
  const panelId = 'decision-context-capture-details';
  // 처음 열 때만 viewport를 따른다(폰 접힘 / 태블릿 이상 펼침). 이후 열림 상태는 native <details>가 소유해
  // 입력 중 회전·리사이즈가 사용자가 고른 상태를 되돌리지 않는다.
  const wide = useMediaQuery(`(min-width: ${BREAKPOINTS.tablet}px)`);
  const [initiallyOpen] = useState(wide);

  return (
    <section
      className="bg-card rounded-card overflow-hidden"
      aria-labelledby="decision-context-capture-heading"
      data-testid="decision-context-capture"
    >
      <div className="flex items-start gap-1 p-4 pb-2">
        {/* 터치 영역은 44×44, 보이는 트랙은 44×24다. */}
        <button
          type="button"
          role="switch"
          aria-label={t('app.journalNew.decisionContext.switchLabel')}
          aria-checked={enabled}
          aria-controls={panelId}
          onClick={() => onEnabledChange(!enabled)}
          className="group -mt-1.5 -ml-1 inline-flex size-11 shrink-0 items-center justify-center rounded-full outline-none"
        >
          <span
            aria-hidden="true"
            className={cn(
              'relative inline-flex h-6 w-11 rounded-full p-1 transition-colors group-focus-visible:outline-2 group-focus-visible:outline-offset-2',
              enabled ? 'bg-primary' : 'bg-muted',
            )}
          >
            <span
              className={cn(
                'size-4 rounded-full bg-white shadow-sm transition-transform',
                enabled && 'translate-x-5',
              )}
            />
          </span>
        </button>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 id="decision-context-capture-heading" className="text-sm font-bold">
            {t('app.journalNew.decisionContext.title')}
          </h2>
          <p className="text-muted-foreground text-xs leading-5">
            {enabled
              ? t('app.journalNew.decisionContext.enabledDescription')
              : t('app.journalNew.decisionContext.disabledDescription')}
          </p>
        </div>
        <span className="text-muted-foreground hidden text-xs sm:inline">
          {t('app.journalNew.decisionContext.switchLabel')}
        </span>
      </div>

      {enabled && (
        <Disclosure
          id={panelId}
          className="mx-4 mb-2"
          open={initiallyOpen}
          summary={t('app.journalNew.decisionContext.detailsSummary', {
            checklist: String(context.checklist.length),
            facts: String(context.optionalEvidence.length),
          })}
        >
          <div className="space-y-5 pb-2">
            <div className="space-y-3">
              <p className="text-text-tertiary text-xs font-bold tracking-wider uppercase">
                {t('app.journalNew.decisionContext.minimumLabel')}
              </p>
              <dl className="space-y-3 text-sm">
                <div className="space-y-1">
                  <dt className="text-muted-foreground text-xs font-semibold">
                    {t('app.journalNew.decisionContext.originalQuestionLabel')}
                  </dt>
                  <dd className="leading-6 font-semibold wrap-anywhere">
                    {context.originalQuestion}
                  </dd>
                </div>
                <div className="space-y-2">
                  <dt className="text-muted-foreground text-xs font-semibold">
                    {t('app.journalNew.decisionContext.checklistLabel')} ·{' '}
                    {context.checklistVersion}
                  </dt>
                  <dd>
                    <ul className="space-y-2">
                      {context.checklist.map((item) => (
                        <li key={item.id} className="flex min-w-0 items-start gap-2">
                          <span
                            aria-hidden="true"
                            className={cn(
                              'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md text-xs font-bold',
                              item.checked
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {item.checked ? '✓' : '—'}
                          </span>
                          <span className="flex min-w-0 flex-1 items-start justify-between gap-2">
                            <LocalizedTextBlock text={item.wording} locale={locale} />
                            <StatusMark
                              checked={item.checked}
                              label={
                                item.checked
                                  ? t('app.journalNew.decisionContext.checked')
                                  : t('app.journalNew.decisionContext.unchecked')
                              }
                            />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted-foreground text-xs font-semibold">
                    {t('app.journalNew.decisionContext.capturedAtLabel')}
                  </dt>
                  <dd>
                    <time dateTime={context.capturedAt}>
                      {formatJournalInstant(context.capturedAt, undefined, locale)}
                    </time>
                  </dd>
                </div>
              </dl>
            </div>

            <fieldset className="space-y-1">
              <legend className="text-text-tertiary text-xs font-bold tracking-wider uppercase">
                {t('app.journalNew.decisionContext.optionalLabel')}
              </legend>
              <p className="text-muted-foreground pt-2 text-xs leading-5">
                {t('app.journalNew.decisionContext.optionalDescription')}
              </p>
              <div>
                {context.optionalEvidence.map((evidence) => (
                  <Checkbox
                    key={evidence.id}
                    checked={evidence.included}
                    onChange={() => onEvidenceChange(evidence.id)}
                    label={
                      <span className="block min-w-0 space-y-1 text-sm">
                        <span className="block leading-5 font-semibold">
                          <LocalizedTextBlock text={evidence.claim} locale={locale} />
                        </span>
                        <span className="text-muted-foreground block text-xs leading-5">
                          <LocalizedTextBlock text={evidence.source} locale={locale} /> ·{' '}
                          {evidence.asOf}
                        </span>
                      </span>
                    }
                  />
                ))}
              </div>
            </fieldset>

            <p className="text-muted-foreground border-border border-t border-dashed pt-3 text-xs leading-5">
              {t('app.journalNew.decisionContext.immutableNotice')}
            </p>
          </div>
        </Disclosure>
      )}
    </section>
  );
}

export function DecisionContextSnapshotView({ context }: { context: DecisionContextSnapshot }) {
  const { locale, t } = useTranslation();
  const includedEvidence = context.optionalEvidence.filter((item) => item.included);

  return (
    <section
      className="flex flex-col gap-3"
      aria-labelledby="decision-context-snapshot-heading"
      data-testid="decision-context-snapshot"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h2 id="decision-context-snapshot-heading" className="type-section-title text-foreground">
          {t('app.journalDetail.decisionContext.heading')}
        </h2>
        <p className="type-meta text-text-secondary">
          {t('app.journalDetail.decisionContext.snapshotLabel')}
        </p>
      </div>
      {/* 읽기 전용 snapshot은 카드 안의 inset 면이다(테두리·그림자 없음). */}
      <Card inset className="px-5 pt-5 pb-0 sm:px-6">
        <InfoList>
          <InfoRow
            layout="stack"
            label={t('app.journalDetail.decisionContext.originalQuestionLabel')}
          >
            <span className="type-content-title">{context.originalQuestion}</span>
          </InfoRow>
          <InfoRow layout="stack" label={t('app.journalDetail.decisionContext.versionLabel')}>
            {context.checklistVersion}
          </InfoRow>
          <InfoRow layout="stack" label={t('app.journalDetail.decisionContext.checklistLabel')}>
            <ul className="flex flex-col gap-2">
              {context.checklist.map((item) => (
                <li key={item.id} className="flex min-w-0 items-start justify-between gap-3">
                  <span className="type-body min-w-0">
                    <LocalizedTextBlock text={item.wording} locale={locale} />
                  </span>
                  <SnapshotCheckText
                    checked={item.checked}
                    label={
                      item.checked
                        ? t('app.journalDetail.decisionContext.checked')
                        : t('app.journalDetail.decisionContext.unchecked')
                    }
                  />
                </li>
              ))}
            </ul>
          </InfoRow>
          <InfoRow layout="stack" label={t('app.journalDetail.decisionContext.capturedAtLabel')}>
            <time dateTime={context.capturedAt}>
              {formatJournalInstant(context.capturedAt, undefined, locale)}
            </time>
          </InfoRow>
        </InfoList>

        <div className="border-border flex flex-col gap-2 border-t py-3">
          <h3 className="type-content-title text-foreground">
            {t('app.journalDetail.decisionContext.optionalEvidenceLabel')}
          </h3>
          {includedEvidence.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {includedEvidence.map((evidence) => (
                <li key={evidence.id} className="bg-card rounded-inset p-3">
                  <p className="type-body text-foreground font-semibold">
                    <LocalizedTextBlock text={evidence.claim} locale={locale} />
                  </p>
                  <p className="type-meta text-text-secondary mt-1">
                    <LocalizedTextBlock text={evidence.source} locale={locale} /> · {evidence.asOf}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="type-supporting text-text-secondary">
              {t('app.journalDetail.decisionContext.noOptionalEvidence')}
            </p>
          )}
        </div>

        <p className="type-meta text-text-secondary border-border border-t py-3">
          {t('app.journalDetail.decisionContext.immutableNotice')}
        </p>
      </Card>
    </section>
  );
}
