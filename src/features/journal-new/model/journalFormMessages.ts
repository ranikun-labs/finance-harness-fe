import type { JournalValidationMessageKey } from '@/features/journal-new/model/journalFormValidation';
import type { MessageKey } from '@/i18n/dictionary';

/** Validator의 내부 message key와 사용자 노출 i18n key를 exhaustive하게 연결한다. */
export const JOURNAL_VALIDATION_MESSAGE_KEYS: Record<JournalValidationMessageKey, MessageKey> = {
  'journal.validation.required': 'app.journalNew.form.validation.required',
  'journal.validation.max_length': 'app.journalNew.form.validation.maxLength',
  'journal.validation.invalid_option': 'app.journalNew.form.validation.invalidChoice',
  'journal.validation.invalid_datetime': 'app.journalNew.form.validation.invalidDatetime',
};
