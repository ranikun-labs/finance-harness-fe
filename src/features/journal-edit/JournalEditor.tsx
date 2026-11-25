import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useJournalEditFetch } from './JournalEditContext';
import { createJournalEditPort, JournalEditError } from './journalEditPort';
import type { JournalDetailViewModel } from '@/features/journal-read/model/journalReadViewModel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { TextField } from '@/components/ui/text-field';
import { cn } from '@/lib/utils';
import { DetailAction } from './DetailAction';
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
      // 수정은 앱바의 텍스트 행동이다. 본문 맨 위에 무스타일 버튼을 두지 않는다.
      <DetailAction>
        <Button
          type="button"
          variant="text-neutral"
          className="h-11 px-3"
          data-testid="journal-edit-open"
          onClick={() => setEditing(true)}
        >
          {t('journalEdit.edit')}
        </Button>
      </DetailAction>
    );
  const controlClass =
    'type-body text-foreground border-input bg-card rounded-control w-full min-w-0 border px-4 disabled:bg-control disabled:text-text-disabled';
  return (
    <Card className="p-5 sm:p-6">
      <form
        onSubmit={(e) => void save(e)}
        data-testid="journal-edit-form"
        className="flex min-w-0 flex-col gap-4"
      >
        <Notice tone="neutral" className="bg-inset">
          {t('journalEdit.notice')}
        </Notice>
        {Object.keys(fields).map((key) => {
          const label = t(
            `app.journalNew.form.${detail.type}.${key}.label` as Parameters<typeof t>[0],
          );
          if (key === 'action' || key === 'emotion') {
            return (
              <div key={key} className="flex min-w-0 flex-col gap-1.5">
                <label
                  htmlFor={`journal-edit-${key}`}
                  className="type-content-title text-foreground"
                >
                  {label}
                </label>
                <select
                  id={`journal-edit-${key}`}
                  data-edit-field={key}
                  value={fields[key]}
                  disabled={busy}
                  className={cn(controlClass, 'h-12')}
                  onChange={(e) => setFields({ ...fields, [key]: e.target.value })}
                >
                  {key === 'emotion' && <option value="">—</option>}
                  {(key === 'action' ? RECORD_ACTIONS : EMOTION_TAGS).map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            );
          }
          return (
            <TextField
              key={key}
              multiline
              label={label}
              data-edit-field={key}
              value={fields[key]}
              disabled={busy}
              required={key !== 'openQuestions'}
              onChange={(e) => setFields({ ...fields, [key]: e.target.value })}
            />
          );
        })}
        {error && (
          <Notice
            tone="danger"
            action={
              <Button type="button" variant="text" className="h-11 px-3" onClick={onSaved}>
                {t('journalEdit.reload')}
              </Button>
            }
          >
            {t(error === 'conflict' ? 'journalEdit.conflict' : 'journalEdit.failed')}
          </Notice>
        )}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="neutral"
            className="flex-1 sm:flex-none"
            disabled={busy}
            onClick={() => {
              setFields(initialFields());
              setError(null);
              setEditing(false);
            }}
          >
            {t('journalEdit.cancel')}
          </Button>
          <Button type="submit" className="flex-1 sm:flex-none" disabled={busy || error !== null}>
            {t('journalEdit.save')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
