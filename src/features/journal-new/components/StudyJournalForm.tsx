import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { JournalFormField } from '@/features/journal-new/components/JournalFormField';
import { JournalValidationSummary } from '@/features/journal-new/components/JournalValidationSummary';
import { JOURNAL_VALIDATION_MESSAGE_KEYS } from '@/features/journal-new/model/journalFormMessages';
import type { StudyJournalFormState } from '@/features/journal-new/model/journalFormTypes';
import {
  validateStudyJournalForm,
  type StudyJournalField,
} from '@/features/journal-new/model/journalFormValidation';
import { useTranslation } from '@/i18n/I18nContext';
const initialValues: StudyJournalFormState = {
  type: 'study',
  title: '',
  occurredAt: '',
  keyContent: '',
  openQuestions: [],
};
function areStringArraysEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
export function StudyJournalForm({ onDirtyChange }: { onDirtyChange: (dirty: boolean) => void }) {
  const { t } = useTranslation();
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState<Partial<Record<StudyJournalField, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const controls = useRef<Partial<Record<StudyJournalField, HTMLElement | null>>>({});
  const result = useMemo(() => validateStudyJournalForm(values), [values]);
  const errors = result.errors;
  const isDirty = useMemo(
    () =>
      Object.keys(initialValues).some((key) => {
        const field = key as keyof StudyJournalFormState;
        if (field === 'openQuestions') {
          return !areStringArraysEqual(values.openQuestions, initialValues.openQuestions);
        }
        return values[field] !== initialValues[field];
      }),
    [values],
  );
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);
  const errorFor = (field: StudyJournalField) =>
    touched[field] || submitAttempted ? errors.find((error) => error.field === field) : undefined;
  const update = <K extends keyof StudyJournalFormState>(
    key: K,
    value: StudyJournalFormState[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setConfirmed(false);
  };
  const focus = (field: StudyJournalField) => controls.current[field]?.focus();
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);
    if (!result.valid) {
      setConfirmed(false);
      requestAnimationFrame(() => focus(result.errors[0].field as StudyJournalField));
      return;
    }
    setConfirmed(true);
  };
  const labels: Record<string, string> = {
    title: t('app.journalNew.form.study.title.label'),
    occurredAt: t('app.journalNew.form.study.occurredAt.label'),
    keyContent: t('app.journalNew.form.study.keyContent.label'),
    openQuestions: t('app.journalNew.form.study.openQuestions.label'),
  };
  const messages = Object.fromEntries(
    Object.entries(JOURNAL_VALIDATION_MESSAGE_KEYS).map(([key, messageKey]) => [
      key,
      t(messageKey),
    ]),
  );
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
          onFocus={(field) => focus(field as StudyJournalField)}
        />
      )}
      <JournalFormField
        id="title"
        label={labels.title}
        helper={t('app.journalNew.form.study.title.helper')}
        error={
          errorFor('title') && t(JOURNAL_VALIDATION_MESSAGE_KEYS[errorFor('title')!.messageKey])
        }
      >
        {(aria) => (
          <input
            {...aria}
            ref={(node) => {
              controls.current.title = node;
            }}
            id="title"
            type="text"
            maxLength={120}
            value={values.title}
            placeholder={t('app.journalNew.form.study.title.placeholder')}
            onBlur={() => setTouched((v) => ({ ...v, title: true }))}
            onChange={(event) => update('title', event.target.value)}
            className="border-input min-h-11 rounded-md border px-3 focus-visible:outline-2"
          />
        )}
      </JournalFormField>
      <JournalFormField
        id="occurredAt"
        label={labels.occurredAt}
        helper={t('app.journalNew.form.study.occurredAt.helper')}
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
            value={values.occurredAt}
            onBlur={() => setTouched((v) => ({ ...v, occurredAt: true }))}
            onChange={(event) => update('occurredAt', event.target.value)}
            className="border-input min-h-11 rounded-md border px-3 focus-visible:outline-2"
          />
        )}
      </JournalFormField>
      <JournalFormField
        id="keyContent"
        label={labels.keyContent}
        helper={t('app.journalNew.form.study.keyContent.helper')}
        error={
          errorFor('keyContent') &&
          t(JOURNAL_VALIDATION_MESSAGE_KEYS[errorFor('keyContent')!.messageKey])
        }
      >
        {(aria) => (
          <>
            <textarea
              {...aria}
              ref={(node) => {
                controls.current.keyContent = node;
              }}
              id="keyContent"
              maxLength={6000}
              value={values.keyContent}
              placeholder={t('app.journalNew.form.study.keyContent.placeholder')}
              onBlur={() => setTouched((v) => ({ ...v, keyContent: true }))}
              onChange={(event) => update('keyContent', event.target.value)}
              className="border-input min-h-32 resize-y rounded-md border p-3 focus-visible:outline-2"
            />
            <p className="text-muted-foreground text-right text-xs">
              {t('app.journalNew.form.study.keyContent.count', {
                count: String(values.keyContent.length),
              })}
            </p>
          </>
        )}
      </JournalFormField>
      <JournalFormField
        id="openQuestions"
        label={labels.openQuestions}
        optionalLabel={t('app.journalNew.form.optional')}
        helper={t('app.journalNew.form.study.openQuestions.helper')}
      >
        {(aria) => (
          <textarea
            {...aria}
            ref={(node) => {
              controls.current.openQuestions = node;
            }}
            id="openQuestions"
            value={values.openQuestions.join('\n')}
            placeholder={t('app.journalNew.form.study.openQuestions.placeholder')}
            onBlur={() => setTouched((v) => ({ ...v, openQuestions: true }))}
            onChange={(event) => {
              const value = event.target.value;
              update('openQuestions', value === '' ? [] : value.split('\n'));
            }}
            className="border-input min-h-28 resize-y rounded-md border p-3 focus-visible:outline-2"
          />
        )}
      </JournalFormField>
      {confirmed && (
        <p role="status" className="text-foreground text-sm">
          {t('app.journalNew.form.validUnsaved')}
        </p>
      )}
      <Button type="submit" size="lg">
        {t('app.journalNew.form.checkEntries')}
      </Button>
    </form>
  );
}
