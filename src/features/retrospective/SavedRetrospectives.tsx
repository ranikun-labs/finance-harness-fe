import { useEffect, useRef, useState, type FormEvent } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { useJournalEditFetch } from '@/features/journal-edit/JournalEditContext';
import { useTranslation } from '@/i18n/I18nContext';

interface Retrospective {
  retrospectiveId: string;
  journalId: string;
  sourceRevision: number;
  createdAt: string;
  body: string;
  outcomeObservation: string | null;
  decisionQuality: string | null;
  nextCheck: string | null;
}

type LoadState = 'loading' | 'ready' | 'error';

export function SavedRetrospectives({
  journalId,
  revision,
}: {
  journalId: string;
  revision: number;
}) {
  const fetchOverride = useJournalEditFetch();
  const fetchImpl = fetchOverride ?? window.fetch;
  const { locale } = useTranslation();
  const korean = locale === 'ko';
  const [items, setItems] = useState<Retrospective[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [load, setLoad] = useState<LoadState>('loading');
  const [draft, setDraft] = useState({
    body: '',
    outcomeObservation: '',
    decisionQuality: '',
    nextCheck: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const keysRef = useRef(new Map<string, string>());
  const pendingRef = useRef(false);
  const endpoint = `/finance/journals/${encodeURIComponent(journalId)}/retrospectives`;

  useEffect(() => {
    const controller = new AbortController();
    void fetchImpl(endpoint, { credentials: 'include', signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const result: unknown = await response.json();
        if (
          !result ||
          typeof result !== 'object' ||
          !Array.isArray((result as { items?: unknown }).items) ||
          typeof (result as { hasMore?: unknown }).hasMore !== 'boolean'
        )
          throw new Error();
        const parsed = result as { items: Retrospective[]; hasMore: boolean };
        if (
          !parsed.items.every(
            (item) =>
              item &&
              typeof item.retrospectiveId === 'string' &&
              item.journalId === journalId &&
              typeof item.body === 'string' &&
              Number.isSafeInteger(item.sourceRevision) &&
              item.sourceRevision >= 0 &&
              typeof item.createdAt === 'string' &&
              !Number.isNaN(Date.parse(item.createdAt)) &&
              (item.outcomeObservation === null || typeof item.outcomeObservation === 'string') &&
              (item.decisionQuality === null || typeof item.decisionQuality === 'string') &&
              (item.nextCheck === null || typeof item.nextCheck === 'string'),
          )
        )
          throw new Error();
        if (!controller.signal.aborted) {
          setItems(parsed.items);
          setHasMore(parsed.hasMore);
          setLoad('ready');
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoad('error');
      });
    return () => controller.abort();
  }, [endpoint, fetchImpl, journalId, refresh]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || !draft.body.trim()) return;
    const payload = JSON.stringify({
      sourceRevision: revision,
      body: draft.body.trim(),
      ...(draft.outcomeObservation.trim() && {
        outcomeObservation: draft.outcomeObservation.trim(),
      }),
      ...(draft.decisionQuality.trim() && { decisionQuality: draft.decisionQuality.trim() }),
      ...(draft.nextCheck.trim() && { nextCheck: draft.nextCheck.trim() }),
    });
    let key = keysRef.current.get(payload);
    if (!key) {
      key = crypto.randomUUID();
      keysRef.current.set(payload, key);
    }
    pendingRef.current = true;
    setSaving(true);
    setError('');
    try {
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
        body: payload,
      });
      if (!response.ok) {
        if (response.status === 409)
          setError(
            korean
              ? '기록이 변경되었거나 요청이 충돌했어요. 기록 상세에서 다시 확인해 주세요.'
              : 'The record changed or the request conflicted. Check the record again.',
          );
        else
          setError(
            korean
              ? '저장하지 못했어요. 입력을 유지했으니 다시 시도해 주세요.'
              : 'Could not save. Your input is preserved; try again.',
          );
        return;
      }
      if (response.status !== 201) throw new Error('Unexpected save response');
      const saved: unknown = await response.json();
      const requested = JSON.parse(payload) as Record<string, unknown>;
      if (!saved || typeof saved !== 'object') throw new Error('Invalid save response');
      const record = saved as Record<string, unknown>;
      if (
        typeof record.retrospectiveId !== 'string' ||
        !record.retrospectiveId ||
        record.journalId !== journalId ||
        record.sourceRevision !== revision ||
        typeof record.createdAt !== 'string' ||
        Number.isNaN(Date.parse(record.createdAt)) ||
        record.body !== requested.body ||
        (record.outcomeObservation ?? null) !== (requested.outcomeObservation ?? null) ||
        (record.decisionQuality ?? null) !== (requested.decisionQuality ?? null) ||
        (record.nextCheck ?? null) !== (requested.nextCheck ?? null)
      )
        throw new Error('Invalid save response');
      setDraft({ body: '', outcomeObservation: '', decisionQuality: '', nextCheck: '' });
      keysRef.current.delete(payload);
      setLoad('loading');
      setRefresh((value) => value + 1);
    } catch {
      setError(
        korean
          ? '저장하지 못했어요. 입력을 유지했으니 다시 시도해 주세요.'
          : 'Could not save. Your input is preserved; try again.',
      );
    } finally {
      pendingRef.current = false;
      setSaving(false);
    }
  }

  const fields = [
    ['body', korean ? '복기 내용' : 'Reflection', true],
    ['outcomeObservation', korean ? '결과 관찰' : 'Outcome', false],
    ['decisionQuality', korean ? '판단 돌아보기' : 'Decision quality', false],
    ['nextCheck', korean ? '다음 확인' : 'Next check', false],
  ] as const;

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-4">
        {fields.map(([name, label, required]) => (
          <label key={name} className="block space-y-2 text-sm font-semibold">
            <span>
              {label}
              {required && ' *'}
            </span>
            <textarea
              required={required}
              disabled={saving}
              maxLength={name === 'body' ? 4000 : 2000}
              value={draft[name]}
              onChange={(event) =>
                setDraft((current) => ({ ...current, [name]: event.target.value }))
              }
              className="border-border bg-background w-full rounded-xl border p-3 text-sm"
              rows={name === 'body' ? 5 : 2}
            />
          </label>
        ))}
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <button type="submit" disabled={saving} className={buttonVariants()}>
          {saving ? (korean ? '저장 중…' : 'Saving…') : korean ? '복기 저장' : 'Save reflection'}
        </button>
      </form>
      <section aria-labelledby="saved-retrospectives-heading" className="space-y-3">
        <h3 id="saved-retrospectives-heading" className="text-base font-bold">
          {korean ? '복기 이력' : 'Reflections'}
        </h3>
        {load === 'loading' && (
          <p role="status">{korean ? '복기를 불러오는 중이에요' : 'Loading reflections'}</p>
        )}
        {load === 'error' && (
          <div role="alert">
            <p>{korean ? '복기를 불러오지 못했어요.' : 'Could not load reflections.'}</p>
            <button
              type="button"
              className={buttonVariants({ variant: 'outline' })}
              onClick={() => {
                setLoad('loading');
                setRefresh((value) => value + 1);
              }}
            >
              {korean ? '다시 시도' : 'Retry'}
            </button>
          </div>
        )}
        {load === 'ready' && items.length === 0 && (
          <p>{korean ? '아직 저장한 복기가 없어요.' : 'No reflections yet.'}</p>
        )}
        {load === 'ready' &&
          items.map((item) => (
            <article
              key={item.retrospectiveId}
              className="border-border space-y-2 rounded-xl border p-4"
            >
              <time dateTime={item.createdAt}>
                {new Intl.DateTimeFormat(korean ? 'ko-KR' : 'en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(item.createdAt))}
              </time>
              <p className="break-words whitespace-pre-wrap">{item.body}</p>
              {item.outcomeObservation && <p>{item.outcomeObservation}</p>}
              {item.decisionQuality && <p>{item.decisionQuality}</p>}
              {item.nextCheck && <p>{item.nextCheck}</p>}
            </article>
          ))}
        {hasMore && (
          <p>{korean ? '최근 복기 50개를 표시해요.' : 'Showing the latest 50 reflections.'}</p>
        )}
      </section>
    </div>
  );
}
