import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  EMOTION_TAGS,
  RECORD_ACTIONS,
  type EmotionTag,
  type RecordAction,
} from '@/constants/policy';
import { JournalChoiceGroup } from '@/features/journal-new/components/JournalChoiceGroup';
import { JournalFormField } from '@/features/journal-new/components/JournalFormField';
import { JournalValidationSummary } from '@/features/journal-new/components/JournalValidationSummary';
import { JOURNAL_VALIDATION_MESSAGE_KEYS } from '@/features/journal-new/model/journalFormMessages';
import type { InvestmentJournalFormState } from '@/features/journal-new/model/journalFormTypes';
import type { JournalSubmitState } from '@/features/journal-new/model/journalSubmitState';
import {
  validateInvestmentJournalForm,
  type InvestmentJournalField,
} from '@/features/journal-new/model/journalFormValidation';
import { useTranslation } from '@/i18n/I18nContext';

const initialValues: InvestmentJournalFormState = {
  type: 'investment',
  assetName: '',
  occurredAt: '',
  action: '',
  reasoning: '',
  emotion: '',
};
type Props = {
  onDirtyChange: (dirty: boolean) => void;
  onValidSubmit?: (state: InvestmentJournalFormState) => void;
  onFormEdited?: () => void;
  submitState?: JournalSubmitState;
};

export function InvestmentJournalForm({
  onDirtyChange,
  onValidSubmit,
  onFormEdited,
  submitState,
}: Props) {
  const { t } = useTranslation();
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState<Partial<Record<InvestmentJournalField, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const controls = useRef<Partial<Record<InvestmentJournalField, HTMLElement | null>>>({});
  const actionRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const emotionRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const result = useMemo(() => validateInvestmentJournalForm(values), [values]);
  const errors = result.errors;
  const isDirty = useMemo(
    () =>
      Object.entries(initialValues).some(
        ([key, value]) => values[key as keyof InvestmentJournalFormState] !== value,
      ),
    [values],
  );
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);
  const errorFor = (field: InvestmentJournalField) =>
    touched[field] || submitAttempted ? errors.find((error) => error.field === field) : undefined;
  const update = <K extends keyof InvestmentJournalFormState>(
    key: K,
    value: InvestmentJournalFormState[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setConfirmed(false);
    onFormEdited?.();
  };
  const focus = (field: InvestmentJournalField) => {
    const node =
      field === 'action'
        ? actionRefs.current[RECORD_ACTIONS[0]]
        : field === 'emotion'
          ? emotionRefs.current[EMOTION_TAGS[0]]
          : controls.current[field];
    node?.focus();
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);
    if (!result.valid) {
      setConfirmed(false);
      requestAnimationFrame(() => focus(result.errors[0].field as InvestmentJournalField));
      return;
    }
    if (onValidSubmit) {
      onValidSubmit(values);
      return;
    }
    setConfirmed(true);
  };
  const labels: Record<string, string> = {
    assetName: t('app.journalNew.form.investment.assetName.label'),
    occurredAt: t('app.journalNew.form.investment.occurredAt.label'),
    action: t('app.journalNew.form.investment.action.label'),
    reasoning: t('app.journalNew.form.investment.reasoning.label'),
    emotion: t('app.journalNew.form.investment.emotion.label'),
  };
  const messages = Object.fromEntries(
    Object.entries(JOURNAL_VALIDATION_MESSAGE_KEYS).map(([key, messageKey]) => [
      key,
      t(messageKey),
    ]),
  );
  const actionLabels = {
    interest: t('recordTags.action.interest'),
    watching: t('recordTags.action.watching'),
    buy: t('recordTags.action.buy'),
    sell: t('recordTags.action.sell'),
  };
  const emotionLabels = {
    FOMO: t('recordTags.emotion.FOMO'),
    불안: t('recordTags.emotion.불안'),
    확신: t('recordTags.emotion.확신'),
    관망: t('recordTags.emotion.관망'),
    혼란: t('recordTags.emotion.혼란'),
  };
  const submitting = submitState?.status === 'submitting';
  const testFlow = Boolean(onValidSubmit);
  return (
    <form
      noValidate
      className="flex flex-col gap-6 p-4 pb-[calc(2rem+env(safe-area-inset-bottom))]"
      onSubmit={submit}
    >
      {!result.valid && submitAttempted && (
        <JournalValidationSummary
          heading={t('app.journalNew.form.validationSummary')}
          errors={errors}
          labels={labels}
          messages={messages}
          onFocus={(field) => focus(field as InvestmentJournalField)}
        />
      )}
      <JournalFormField
        id="assetName"
        label={labels.assetName}
        helper={t('app.journalNew.form.investment.assetName.helper')}
        error={
          errorFor('assetName') &&
          t(JOURNAL_VALIDATION_MESSAGE_KEYS[errorFor('assetName')!.messageKey])
        }
      >
        {(aria) => (
          <input
            {...aria}
            ref={(node) => {
              controls.current.assetName = node;
            }}
            id="assetName"
            type="text"
            maxLength={120}
            autoComplete="off"
            spellCheck={false}
            disabled={submitting}
            value={values.assetName}
            placeholder={t('app.journalNew.form.investment.assetName.placeholder')}
            onBlur={() => setTouched((v) => ({ ...v, assetName: true }))}
            onChange={(event) => update('assetName', event.target.value)}
            className="border-input min-h-11 rounded-md border px-3 focus-visible:outline-2"
          />
        )}
      </JournalFormField>
      <JournalFormField
        id="occurredAt"
        label={labels.occurredAt}
        helper={t('app.journalNew.form.investment.occurredAt.helper')}
        error={
          errorFor('occurredAt') &&
          t(JOURNAL_VALIDATION_MESSAGE_KEYS[errorFor('occurredAt')!.messageKey])
        }
      >
        {(aria) => (
          <input
            {...aria}
            ref={(node) => {
              controls.current.occurredAt = node;
            }}
            id="occurredAt"
            type="datetime-local"
            disabled={submitting}
            value={values.occurredAt}
            onBlur={() => setTouched((v) => ({ ...v, occurredAt: true }))}
            onChange={(event) => update('occurredAt', event.target.value)}
            className="border-input min-h-11 rounded-md border px-3 focus-visible:outline-2"
          />
        )}
      </JournalFormField>
      <JournalChoiceGroup
        id="action"
        label={labels.action}
        helper={t('app.journalNew.form.investment.action.helper')}
        error={
          errorFor('action') && t(JOURNAL_VALIDATION_MESSAGE_KEYS[errorFor('action')!.messageKey])
        }
        choices={RECORD_ACTIONS.map((value) => ({ value, label: actionLabels[value] }))}
        value={values.action}
        radioRefs={actionRefs}
        onChange={(value) => update('action', value as RecordAction)}
        disabled={submitting}
      />
      <JournalFormField
        id="reasoning"
        label={labels.reasoning}
        helper={t('app.journalNew.form.investment.reasoning.helper')}
        error={
          errorFor('reasoning') &&
          t(JOURNAL_VALIDATION_MESSAGE_KEYS[errorFor('reasoning')!.messageKey])
        }
      >
        {(aria) => (
          <>
            <textarea
              {...aria}
              ref={(node) => {
                controls.current.reasoning = node;
              }}
              id="reasoning"
              maxLength={4000}
              disabled={submitting}
              value={values.reasoning}
              placeholder={t('app.journalNew.form.investment.reasoning.placeholder')}
              onBlur={() => setTouched((v) => ({ ...v, reasoning: true }))}
              onChange={(event) => update('reasoning', event.target.value)}
              className="border-input min-h-32 resize-y rounded-md border p-3 focus-visible:outline-2"
            />
            <p className="text-muted-foreground text-right text-xs">
              {t('app.journalNew.form.investment.reasoning.count', {
                count: String(values.reasoning.length),
              })}
            </p>
          </>
        )}
      </JournalFormField>
      <JournalChoiceGroup
        id="emotion"
        label={labels.emotion}
        helper={t('app.journalNew.form.investment.emotion.helper')}
        error={
          errorFor('emotion') && t(JOURNAL_VALIDATION_MESSAGE_KEYS[errorFor('emotion')!.messageKey])
        }
        choices={EMOTION_TAGS.map((value) => ({ value, label: emotionLabels[value] }))}
        value={values.emotion}
        radioRefs={emotionRefs}
        onChange={(value) => update('emotion', value as EmotionTag)}
        disabled={submitting}
        extra={
          <label className="border-input focus-within:ring-ring flex min-h-11 cursor-pointer items-center rounded-md border px-3 text-sm font-medium focus-within:ring-2">
            <input
              className="sr-only"
              type="radio"
              name="emotion"
              checked={values.emotion === ''}
              disabled={submitting}
              onChange={() => update('emotion', '')}
            />
            {t('app.journalNew.form.investment.emotion.none')}
          </label>
        }
      />
      {confirmed && !testFlow && (
        <p role="status" className="text-foreground text-sm">
          {t('app.journalNew.form.validUnsaved')}
        </p>
      )}
      <Button type="submit" size="lg" disabled={submitting}>
        {testFlow
          ? submitState?.status === 'failed'
            ? t('app.journalNew.form.retry')
            : submitting
              ? t('app.journalNew.form.submitting')
              : t('app.journalNew.form.submitTest')
          : t('app.journalNew.form.checkEntries')}
      </Button>
    </form>
  );
}
