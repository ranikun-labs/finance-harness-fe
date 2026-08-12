import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { JournalFormField } from '@/features/journal-new/components/JournalFormField';
import { JournalOccurredAtField } from '@/features/journal-new/components/JournalOccurredAtField';
import { JournalValidationSummary } from '@/features/journal-new/components/JournalValidationSummary';
import { JOURNAL_VALIDATION_MESSAGE_KEYS } from '@/features/journal-new/model/journalFormMessages';
import type { StudyJournalFormState } from '@/features/journal-new/model/journalFormTypes';
import type { JournalSubmitState } from '@/features/journal-new/model/journalSubmitState';
import {
  validateStudyJournalForm,
  MAX_OPEN_QUESTIONS,
  MAX_OPEN_QUESTION_LENGTH,
  type StudyJournalField,
} from '@/features/journal-new/model/journalFormValidation';
import { useTranslation } from '@/i18n/I18nContext';
import { getCurrentLocalDateTimeInput } from '@/lib/date';
function createInitialValues(): StudyJournalFormState {
  return {
    type: 'study',
    title: '',
    occurredAt: getCurrentLocalDateTimeInput(),
    keyContent: '',
    openQuestions: [],
  };
}
function areStringArraysEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
type Props = {
  onDirtyChange: (dirty: boolean) => void;
  onValidSubmit?: (state: StudyJournalFormState) => void;
  onFormEdited?: () => void;
  submitState?: JournalSubmitState;
};

export function StudyJournalForm({
  onDirtyChange,
  onValidSubmit,
  onFormEdited,
  submitState,
}: Props) {
  const { t } = useTranslation();
  const initialValues = useMemo(() => createInitialValues(), []);
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState<Partial<Record<StudyJournalField, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [occurredAtExpanded, setOccurredAtExpanded] = useState(false);
  const controls = useRef<Partial<Record<StudyJournalField, HTMLElement | null>>>({});
  const questionRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const result = useMemo(() => validateStudyJournalForm(values), [values]);
  const errors = result.errors;
  const submitting = submitState?.status === 'submitting';
  const testFlow = Boolean(onValidSubmit);
  const isDirty = useMemo(
    () =>
      Object.keys(initialValues).some((key) => {
        const field = key as keyof StudyJournalFormState;
        if (field === 'openQuestions') {
          return !areStringArraysEqual(values.openQuestions, initialValues.openQuestions);
        }
        return values[field] !== initialValues[field];
      }),
    [values, initialValues],
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
    onFormEdited?.();
  };
  const focus = (field: StudyJournalField) => {
    if (field === 'occurredAt') {
      setOccurredAtExpanded(true);
      requestAnimationFrame(() => controls.current.occurredAt?.focus());
      return;
    }
    controls.current[field]?.focus();
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);
    if (!result.valid) {
      setConfirmed(false);
      requestAnimationFrame(() => focus(result.errors[0].field as StudyJournalField));
      return;
    }
    if (onValidSubmit) {
      onValidSubmit(values);
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
  const updateQuestion = (index: number, value: string) => {
    update(
      'openQuestions',
      values.openQuestions.map((question, questionIndex) =>
        questionIndex === index ? value : question,
      ),
    );
  };
  const addQuestion = () => {
    if (submitting || values.openQuestions.length >= MAX_OPEN_QUESTIONS) return;
    const nextIndex = values.openQuestions.length;
    update('openQuestions', [...values.openQuestions, '']);
    requestAnimationFrame(() => questionRefs.current[nextIndex]?.focus());
  };
  const removeQuestion = (index: number) => {
    update(
      'openQuestions',
      values.openQuestions.filter((_, questionIndex) => questionIndex !== index),
    );
    delete questionRefs.current[index];
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
            disabled={submitting}
            value={values.title}
            placeholder={t('app.journalNew.form.study.title.placeholder')}
            onBlur={() => setTouched((v) => ({ ...v, title: true }))}
            onChange={(event) => update('title', event.target.value)}
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
              disabled={submitting}
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
        error={
          errorFor('openQuestions') &&
          t(JOURNAL_VALIDATION_MESSAGE_KEYS[errorFor('openQuestions')!.messageKey])
        }
      >
        {(aria) => (
          <div className="flex flex-col gap-3">
            <div id="openQuestions-items" className="flex flex-col gap-2">
              {values.openQuestions.map((question, index) => {
                const inputId = index === 0 ? 'openQuestions' : `openQuestions-${index + 1}`;
                const itemLabel = t('app.journalNew.form.study.openQuestions.itemLabel', {
                  index: String(index + 1),
                });
                return (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      {...aria}
                      ref={(node) => {
                        questionRefs.current[index] = node;
                        if (index === 0) controls.current.openQuestions = node;
                      }}
                      id={inputId}
                      type="text"
                      maxLength={MAX_OPEN_QUESTION_LENGTH}
                      disabled={submitting}
                      value={question}
                      aria-label={index === 0 ? `${labels.openQuestions} ${itemLabel}` : itemLabel}
                      placeholder={t('app.journalNew.form.study.openQuestions.placeholder')}
                      onBlur={() => setTouched((v) => ({ ...v, openQuestions: true }))}
                      onChange={(event) => updateQuestion(index, event.target.value)}
                      className="border-input min-h-11 min-w-0 flex-1 rounded-md border px-3 focus-visible:outline-2"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-11 shrink-0"
                      disabled={submitting}
                      aria-label={t('app.journalNew.form.study.openQuestions.remove', {
                        index: String(index + 1),
                      })}
                      onClick={() => removeQuestion(index)}
                    >
                      {t('app.journalNew.form.study.openQuestions.removeShort')}
                    </Button>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11"
                disabled={submitting || values.openQuestions.length >= MAX_OPEN_QUESTIONS}
                aria-controls="openQuestions-items"
                onClick={addQuestion}
              >
                {t('app.journalNew.form.study.openQuestions.add')}
              </Button>
              <p className="text-muted-foreground text-xs" aria-live="polite">
                {t('app.journalNew.form.study.openQuestions.count', {
                  count: String(values.openQuestions.length),
                })}
              </p>
            </div>
          </div>
        )}
      </JournalFormField>
      <JournalOccurredAtField
        id="occurredAt"
        label={labels.occurredAt}
        helper={t('app.journalNew.form.study.occurredAt.helper')}
        nowLabel={t('app.journalNew.form.study.occurredAt.now')}
        changeLabel={t('app.journalNew.form.study.occurredAt.change')}
        value={values.occurredAt}
        initialValue={initialValues.occurredAt}
        expanded={occurredAtExpanded}
        error={
          errorFor('occurredAt') &&
          t(JOURNAL_VALIDATION_MESSAGE_KEYS[errorFor('occurredAt')!.messageKey])
        }
        disabled={submitting}
        inputRef={(node) => {
          controls.current.occurredAt = node;
        }}
        onExpandedChange={setOccurredAtExpanded}
        onBlur={() => setTouched((v) => ({ ...v, occurredAt: true }))}
        onChange={(event) => update('occurredAt', event.target.value)}
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
