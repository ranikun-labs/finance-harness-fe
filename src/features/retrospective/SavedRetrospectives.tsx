import { useEffect, useRef, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Disclosure } from '@/components/ui/disclosure';
import { Notice } from '@/components/ui/notice';
import { TextField } from '@/components/ui/text-field';
import { useJournalEditFetch } from '@/features/journal-edit/JournalEditContext';
import { useTranslation } from '@/i18n/I18nContext';
import { formatJournalInstant } from '@/lib/date';

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
  timeZone,
  onDirtyChange,
}: {
  journalId: string;
  revision: number;
  /** 소속 기록의 IANA 시간대. 저장 시각을 기록 상세와 같은 벽시계로 보이게 한다(이름은 보이지 않는다). */
  timeZone?: string;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const fetchOverride = useJournalEditFetch();
  const fetchImpl = fetchOverride ?? window.fetch;
  const { locale, t } = useTranslation();
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
  const [saved, setSaved] = useState(false);
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

  const dirty = Object.values(draft).some((value) => value.length > 0);
  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (!dirty) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [dirty]);

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
    setSaved(false);
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
      setSaved(true);
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
    <div className="flex min-w-0 flex-col gap-8">
      <form onSubmit={submit} className="flex min-w-0 flex-col gap-6">
        <TextField
          multiline
          id="saved-retrospective-body"
          label={`${t('app.journalReview.retrospective.bodyLabel')} *`}
          hint={t('app.journalReview.retrospective.bodyPrompt')}
          required
          disabled={saving}
          maxLength={4000}
          value={draft.body}
          onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
          rows={5}
        />
        <Disclosure
          summary={
            korean
              ? '결과와 판단 과정 돌아보기 (선택)'
              : 'Review the outcome and decision process (optional)'
          }
        >
          {fields.slice(1, 3).map(([name, label]) => (
            <TextField
              key={name}
              multiline
              label={label}
              disabled={saving}
              maxLength={2000}
              value={draft[name]}
              onChange={(event) =>
                setDraft((current) => ({ ...current, [name]: event.target.value }))
              }
              rows={2}
            />
          ))}
        </Disclosure>
        <TextField
          multiline
          label={fields[3][1]}
          disabled={saving}
          maxLength={2000}
          value={draft.nextCheck}
          onChange={(event) =>
            setDraft((current) => ({ ...current, nextCheck: event.target.value }))
          }
          rows={2}
        />
        {saved && (
          <Notice tone="success">{korean ? '복기를 저장했어요.' : 'Reflection saved.'}</Notice>
        )}
        {error && <Notice tone="danger">{error}</Notice>}
        {/* 이 화면의 핵심 행동 1개. 저장 중에는 같은 자리에서 문구만 바뀐다. */}
        <Button type="submit" disabled={saving} className="w-full sm:w-auto sm:self-start">
          {saving ? (korean ? '저장 중…' : 'Saving…') : korean ? '복기 저장' : 'Save reflection'}
        </Button>
      </form>
      <section aria-labelledby="saved-retrospectives-heading" className="flex flex-col gap-3">
        <h3 id="saved-retrospectives-heading" className="type-content-title text-foreground">
          {korean ? '복기 이력' : 'Reflections'}
        </h3>
        {load === 'loading' && (
          <p role="status" className="type-supporting text-text-secondary">
            {korean ? '복기를 불러오는 중이에요' : 'Loading reflections'}
          </p>
        )}
        {load === 'error' && (
          <Notice
            tone="danger"
            action={
              <Button
                type="button"
                variant="text"
                onClick={() => {
                  setLoad('loading');
                  setRefresh((value) => value + 1);
                }}
              >
                {korean ? '다시 시도' : 'Retry'}
              </Button>
            }
          >
            {korean ? '복기를 불러오지 못했어요.' : 'Could not load reflections.'}
          </Notice>
        )}
        {load === 'ready' && items.length === 0 && (
          <p className="type-supporting text-text-secondary">
            {korean ? '아직 저장한 복기가 없어요.' : 'No reflections yet.'}
          </p>
        )}
        {/* 저장된 복기는 상자가 아니라 구분선으로 나뉜 행이다(최신순 그대로). */}
        {load === 'ready' &&
          items.map((item) => (
            <article
              key={item.retrospectiveId}
              className="border-border flex min-w-0 flex-col gap-3 border-t py-5"
            >
              <time className="type-meta text-text-secondary" dateTime={item.createdAt}>
                {formatJournalInstant(item.createdAt, timeZone, locale)}
              </time>
              <dl className="flex flex-col gap-3">
                {fields.map(([name, label]) => {
                  const value = item[name];
                  return value ? (
                    <div key={name} className="min-w-0">
                      <dt className="type-label text-text-secondary">{label}</dt>
                      <dd className="type-reading text-foreground mt-1 wrap-break-word break-keep whitespace-pre-wrap">
                        {value}
                      </dd>
                    </div>
                  ) : null;
                })}
              </dl>
            </article>
          ))}
        {hasMore && (
          <p className="type-supporting text-text-secondary">
            {korean ? '최근 복기 50개를 표시해요.' : 'Showing the latest 50 reflections.'}
          </p>
        )}
      </section>
    </div>
  );
}
