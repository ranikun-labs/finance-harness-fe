import { useContext, useEffect, useRef, useState } from 'react';
import { JournalEditFetchContext } from '@/features/journal-edit/JournalEditContext';
import type { JournalDetailViewModel } from '@/features/journal-read/model/journalReadViewModel';
import type { JournalRevisionRef } from '@/features/journal-edit/journalEditPort';
import { useTranslation } from '@/i18n/I18nContext';
import {
  createJournalLifecyclePort,
  JournalLifecycleError,
  type DeletedJournal,
} from './journalLifecyclePort';

export function JournalDeleteControl({
  detail,
  onReload,
}: {
  detail: JournalDetailViewModel;
  onReload: () => void;
}) {
  const fetchImpl = useContext(JournalEditFetchContext);
  const { t } = useTranslation();
  const [confirmed, setConfirmed] = useState<JournalRevisionRef | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<'conflict' | 'failed' | null>(null);
  const generation = useRef(0);
  const active = useRef<AbortController | null>(null);
  useEffect(() => {
    generation.current += 1;
    return () => {
      generation.current += 1;
      active.current?.abort();
    };
  }, [fetchImpl]);
  if (!fetchImpl || detail.revision === undefined) return null;
  const remove = async () => {
    if (!confirmed || busy) return;
    const ticket = generation.current;
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setError(null);
    try {
      const result = await createJournalLifecyclePort(fetchImpl).transition(
        confirmed,
        'delete',
        controller.signal,
      );
      if (ticket !== generation.current || controller.signal.aborted) return;
      window.dispatchEvent(new CustomEvent('finance-journal-lifecycle', { detail: result }));
    } catch (e) {
      if (ticket !== generation.current || controller.signal.aborted) return;
      setError(e instanceof JournalLifecycleError ? e.code : 'failed');
      setConfirmed(null); // Never adopt a newer revision or automatically retry an uncertain operation.
    } finally {
      if (ticket === generation.current) setBusy(false);
    }
  };
  return (
    <section aria-label={t('journalLifecycle.remove')}>
      <p>{t('journalLifecycle.retained')}</p>
      {confirmed ? (
        <>
          <p>{t('journalLifecycle.confirm')}</p>
          <button type="button" disabled={busy} onClick={() => void remove()}>
            {t('journalLifecycle.confirm')}
          </button>
          <button type="button" disabled={busy} onClick={() => setConfirmed(null)}>
            {t('journalEdit.cancel')}
          </button>
        </>
      ) : (
        <button
          type="button"
          disabled={busy || error !== null}
          onClick={() => setConfirmed({ journalId: detail.journalId, revision: detail.revision! })}
        >
          {t('journalLifecycle.remove')}
        </button>
      )}
      {error && (
        <>
          <p role="alert">
            {t(error === 'conflict' ? 'journalEdit.conflict' : 'journalEdit.failed')}
          </p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setConfirmed(null);
              onReload();
            }}
          >
            {t('journalEdit.reload')}
          </button>
        </>
      )}
    </section>
  );
}

export function DeletedJournalList() {
  const fetchImpl = useContext(JournalEditFetchContext);
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [reload, setReload] = useState(0);
  const [listing, setListing] = useState<{
    source: typeof fetchImpl;
    items: DeletedJournal[];
    hasMore: boolean;
  } | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const active = useRef<AbortController | null>(null);
  useEffect(() => {
    const ticket = ++generation.current;
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    if (open && fetchImpl) {
      void Promise.resolve()
        .then(() => {
          if (ticket !== generation.current || controller.signal.aborted) return null;
          setError(false);
          setListing(null);
          return createJournalLifecyclePort(fetchImpl).list(controller.signal);
        })
        .then((result) => {
          if (result && ticket === generation.current && !controller.signal.aborted)
            setListing({ source: fetchImpl, ...result });
        })
        .catch(() => {
          if (ticket === generation.current && !controller.signal.aborted) setError(true);
        });
    }
    return () => {
      generation.current += 1;
      controller.abort();
    };
  }, [fetchImpl, open, reload]);
  if (!fetchImpl) return null;
  const restore = async (item: DeletedJournal) => {
    if (busy) return;
    const ticket = generation.current;
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setError(false);
    try {
      const result = await createJournalLifecyclePort(fetchImpl).transition(
        item,
        'restore',
        controller.signal,
      );
      if (ticket !== generation.current || controller.signal.aborted) return;
      setListing((current) =>
        current?.source === fetchImpl
          ? { ...current, items: current.items.filter((i) => i.journalId !== item.journalId) }
          : current,
      );
      window.dispatchEvent(new CustomEvent('finance-journal-lifecycle', { detail: result }));
    } catch {
      if (ticket === generation.current && !controller.signal.aborted) setError(true);
    } finally {
      if (ticket === generation.current) setBusy(false);
    }
  };
  return (
    <section aria-label={t('journalLifecycle.deletedList')}>
      <button type="button" disabled={busy} onClick={() => setOpen((v) => !v)}>
        {t('journalLifecycle.deletedList')}
      </button>
      {open && (
        <>
          <p>{t('journalLifecycle.retained')}</p>
          <button type="button" disabled={busy} onClick={() => setReload((v) => v + 1)}>
            {t('journalEdit.reload')}
          </button>
          {error && <p role="alert">{t('journalEdit.failed')}</p>}
          {listing?.source === fetchImpl && (
            <>
              {listing.items.length === 0 && <p>{t('journalLifecycle.empty')}</p>}
              <ul>
                {listing.items.map((item) => (
                  <li key={item.journalId}>
                    <span>
                      {item.type} · {item.deletedAt}
                    </span>
                    <button
                      type="button"
                      disabled={busy || error}
                      onClick={() => void restore(item)}
                    >
                      {t('journalLifecycle.restore')}
                    </button>
                  </li>
                ))}
              </ul>
              {listing.hasMore && <p>{t('journalLifecycle.more')}</p>}
            </>
          )}
        </>
      )}
    </section>
  );
}
