import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useJournalEditFetch } from './JournalEditContext';
import { createJournalEditPort, JournalEditError } from './journalEditPort';
import type { JournalDetailViewModel } from '@/features/journal-read/model/journalReadViewModel';
import { useTranslation } from '@/i18n/I18nContext';
import { RECORD_ACTIONS, EMOTION_TAGS } from '@/constants/policy';
export function JournalEditor({
  detail,
  onSaved,
}: {
  detail: JournalDetailViewModel;
  onSaved: () => void;
}) {
  const fetchImpl = useJournalEditFetch();
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<'conflict' | 'failed' | null>(null);
  const initialFields = (): Record<string, string> => {
    if (detail.type === 'study')
      return {
        title: detail.title,
        keyContent: detail.keyContent,
        openQuestions: detail.openQuestions.join('\n'),
      };
    return {
      assetName: detail.assetName,
      action: detail.action,
      reasoning: detail.reasoning,
      emotion: detail.emotion ?? '',
    };
  };
  const [fields, setFields] = useState<Record<string, string>>(initialFields);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  if (!fetchImpl || detail.revision === undefined) return null;
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError(null);
    try {
      const values: Record<string, unknown> = { ...fields };
      if (detail.type === 'study')
        values.openQuestions = fields.openQuestions === '' ? [] : fields.openQuestions.split('\n');
      else values.emotion = fields.emotion === '' ? null : fields.emotion;
      await createJournalEditPort(fetchImpl)(
        { journalId: detail.journalId, revision: detail.revision! },
        values,
        controller.signal,
      );
      if (!controller.signal.aborted) {
        setEditing(false);
        window.dispatchEvent(
          new CustomEvent('finance-journal-updated', { detail: { journalId: detail.journalId } }),
        );
        onSaved();
      }
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof JournalEditError ? e.code : 'failed');
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  };
  if (!editing)
    return (
      <button type="button" data-testid="journal-edit-open" onClick={() => setEditing(true)}>
        {t('journalEdit.edit')}
      </button>
    );
  return (
    <form
      onSubmit={(e) => void save(e)}
      data-testid="journal-edit-form"
      className="grid gap-3 border p-4"
    >
      <p>{t('journalEdit.notice')}</p>
      {Object.keys(fields).map((key) => (
        <label key={key}>
          {t(`app.journalNew.form.${detail.type}.${key}.label` as Parameters<typeof t>[0])}
          {key === 'action' || key === 'emotion' ? (
            <select
              data-edit-field={key}
              value={fields[key]}
              disabled={busy}
              onChange={(e) => setFields({ ...fields, [key]: e.target.value })}
            >
              {key === 'emotion' && <option value="">—</option>}
              {(key === 'action' ? RECORD_ACTIONS : EMOTION_TAGS).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          ) : (
            <textarea
              data-edit-field={key}
              value={fields[key]}
              disabled={busy}
              required={key !== 'openQuestions'}
              onChange={(e) => setFields({ ...fields, [key]: e.target.value })}
            />
          )}
        </label>
      ))}
      {error && (
        <p role="alert">
          {t(error === 'conflict' ? 'journalEdit.conflict' : 'journalEdit.failed')}
        </p>
      )}
      <button type="submit" disabled={busy || error !== null}>
        {t('journalEdit.save')}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setFields(initialFields());
          setError(null);
          setEditing(false);
        }}
      >
        {t('journalEdit.cancel')}
      </button>
      {error && (
        <button type="button" onClick={onSaved}>
          {t('journalEdit.reload')}
        </button>
      )}
    </form>
  );
}
