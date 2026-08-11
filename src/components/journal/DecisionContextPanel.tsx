import { Card } from '@/components/ui/card';
import type { DecisionContextSnapshot } from '@/mocks/decisionContext';
import { useTranslation } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { localize, type LocalizedText } from '@/mocks/reviewResult';

function formatCapturedAt(value: string, locale: 'ko' | 'en'): string {
  return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
  }).format(new Date(value));
}

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

function LocalizedTextBlock({ text, locale }: { text: LocalizedText; locale: 'ko' | 'en' }) {
  return <span className="min-w-0 [overflow-wrap:anywhere]">{localize(text, locale)}</span>;
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
 */
export function DecisionContextCapturePanel({
  context,
  enabled,
  onEnabledChange,
  onEvidenceChange,
}: DecisionContextCapturePanelProps) {
  const { locale, t } = useTranslation();
  const panelId = 'decision-context-capture-details';

  return (
    <section
      className="border-border bg-card mx-4 mb-2 overflow-hidden rounded-xl border shadow-sm"
      aria-labelledby="decision-context-capture-heading"
      data-testid="decision-context-capture"
    >
      <div className="flex items-start gap-3 p-4">
        <button
          type="button"
          role="switch"
          aria-label={t('app.journalNew.decisionContext.switchLabel')}
          aria-checked={enabled}
          aria-controls={panelId}
          onClick={() => onEnabledChange(!enabled)}
          className={cn(
            'relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full p-1 transition-colors outline-none focus-visible:ring-3',
            enabled
              ? 'bg-primary focus-visible:ring-primary/30'
              : 'bg-muted focus-visible:ring-ring/50',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'size-4 rounded-full bg-white shadow-sm transition-transform',
              enabled && 'translate-x-5',
            )}
          />
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
        <div id={panelId} className="border-border bg-muted/30 space-y-5 border-t p-4">
          <div className="space-y-3">
            <p className="text-text-tertiary text-xs font-bold tracking-wider uppercase">
              {t('app.journalNew.decisionContext.minimumLabel')}
            </p>
            <dl className="space-y-3 text-sm">
              <div className="space-y-1">
                <dt className="text-muted-foreground text-xs font-semibold">
                  {t('app.journalNew.decisionContext.originalQuestionLabel')}
                </dt>
                <dd className="leading-6 font-semibold [overflow-wrap:anywhere]">
                  {context.originalQuestion}
                </dd>
              </div>
              <div className="space-y-2">
                <dt className="text-muted-foreground text-xs font-semibold">
                  {t('app.journalNew.decisionContext.checklistLabel')} · {context.checklistVersion}
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
                    {formatCapturedAt(context.capturedAt, locale)}
                  </time>
                </dd>
              </div>
            </dl>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-text-tertiary text-xs font-bold tracking-wider uppercase">
              {t('app.journalNew.decisionContext.optionalLabel')}
            </legend>
            <p className="text-muted-foreground text-xs leading-5">
              {t('app.journalNew.decisionContext.optionalDescription')}
            </p>
            <div className="space-y-2">
              {context.optionalEvidence.map((evidence) => (
                <label
                  key={evidence.id}
                  className="border-border bg-background flex min-w-0 cursor-pointer items-start gap-3 rounded-lg border p-3"
                >
                  <input
                    type="checkbox"
                    checked={evidence.included}
                    onChange={() => onEvidenceChange(evidence.id)}
                    className="accent-primary mt-1 size-4 shrink-0"
                  />
                  <span className="min-w-0 flex-1 space-y-1 text-sm">
                    <span className="block leading-5 font-semibold">
                      <LocalizedTextBlock text={evidence.claim} locale={locale} />
                    </span>
                    <span className="text-muted-foreground block text-xs leading-5">
                      <LocalizedTextBlock text={evidence.source} locale={locale} /> ·{' '}
                      {evidence.asOf}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <p className="text-muted-foreground border-border border-t border-dashed pt-3 text-xs leading-5">
            {t('app.journalNew.decisionContext.immutableNotice')}
          </p>
        </div>
      )}
    </section>
  );
}

export function DecisionContextSnapshotView({ context }: { context: DecisionContextSnapshot }) {
  const { locale, t } = useTranslation();
  const includedEvidence = context.optionalEvidence.filter((item) => item.included);

  return (
    <section
      className="space-y-3"
      aria-labelledby="decision-context-snapshot-heading"
      data-testid="decision-context-snapshot"
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 id="decision-context-snapshot-heading" className="text-base font-bold">
            {t('app.journalDetail.decisionContext.heading')}
          </h2>
          <p className="text-muted-foreground text-xs leading-5">
            {t('app.journalDetail.decisionContext.snapshotLabel')}
          </p>
        </div>
        <span aria-hidden="true" className="text-primary text-lg">
          ✓
        </span>
      </div>
      <Card>
        <dl className="space-y-4 text-sm">
          <div className="space-y-1">
            <dt className="text-muted-foreground text-xs font-semibold">
              {t('app.journalDetail.decisionContext.originalQuestionLabel')}
            </dt>
            <dd className="leading-6 font-semibold [overflow-wrap:anywhere]">
              {context.originalQuestion}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-muted-foreground text-xs font-semibold">
              {t('app.journalDetail.decisionContext.versionLabel')}
            </dt>
            <dd>{context.checklistVersion}</dd>
          </div>
          <div className="space-y-2">
            <dt className="text-muted-foreground text-xs font-semibold">
              {t('app.journalDetail.decisionContext.checklistLabel')}
            </dt>
            <dd>
              <ul className="space-y-2">
                {context.checklist.map((item) => (
                  <li key={item.id} className="flex min-w-0 items-start justify-between gap-2">
                    <span className="min-w-0 leading-5">
                      <LocalizedTextBlock text={item.wording} locale={locale} />
                    </span>
                    <StatusMark
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
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-muted-foreground text-xs font-semibold">
              {t('app.journalDetail.decisionContext.capturedAtLabel')}
            </dt>
            <dd>
              <time dateTime={context.capturedAt}>
                {formatCapturedAt(context.capturedAt, locale)}
              </time>
            </dd>
          </div>
        </dl>

        <div className="border-border mt-5 space-y-2 border-t pt-4">
          <h3 className="text-sm font-semibold">
            {t('app.journalDetail.decisionContext.optionalEvidenceLabel')}
          </h3>
          {includedEvidence.length > 0 ? (
            <ul className="space-y-2">
              {includedEvidence.map((evidence) => (
                <li key={evidence.id} className="bg-background rounded-lg border p-3 text-sm">
                  <p className="leading-5 font-semibold">
                    <LocalizedTextBlock text={evidence.claim} locale={locale} />
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs leading-5">
                    <LocalizedTextBlock text={evidence.source} locale={locale} /> · {evidence.asOf}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-xs leading-5">
              {t('app.journalDetail.decisionContext.noOptionalEvidence')}
            </p>
          )}
        </div>

        <p className="text-muted-foreground border-border mt-5 border-t border-dashed pt-3 text-xs leading-5">
          {t('app.journalDetail.decisionContext.immutableNotice')}
        </p>
      </Card>
    </section>
  );
}
