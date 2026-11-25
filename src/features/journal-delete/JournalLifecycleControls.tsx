import { useContext, useEffect, useRef, useState } from 'react';
import { JournalEditFetchContext } from '@/features/journal-edit/JournalEditContext';
import type { JournalDetailViewModel } from '@/features/journal-read/model/journalReadViewModel';
import type { JournalRevisionRef } from '@/features/journal-edit/journalEditPort';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Notice } from '@/components/ui/notice';
import { DetailAction } from '@/features/journal-edit/DetailAction';
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
    <>
      {/* 삭제는 앱바의 텍스트 행동이다. 안내(숨김·보관)는 제목 앞에 두지 않고 확인 Dialog 안에서 말한다. */}
      <DetailAction>
        <Button
          type="button"
          variant="danger-text"
          className="h-11 px-3"
          disabled={busy || error !== null}
          onClick={() => setConfirmed({ journalId: detail.journalId, revision: detail.revision! })}
        >
          {t('journalLifecycle.remove')}
        </Button>
      </DetailAction>
      <Dialog
        open={confirmed !== null}
        destructive
        title={t('journalLifecycle.remove')}
        description={t('journalLifecycle.retained')}
        cancelLabel={t('journalEdit.cancel')}
        confirmLabel={t('journalLifecycle.confirm')}
        onClose={() => {
          if (!busy) setConfirmed(null);
        }}
        onConfirm={() => void remove()}
      />
      {error && (
        <Notice
          tone="danger"
          action={
            <Button
              type="button"
              variant="text"
              className="h-11 px-3"
              onClick={() => {
                setError(null);
                setConfirmed(null);
                onReload();
              }}
            >
              {t('journalEdit.reload')}
            </Button>
          }
        >
          {t(error === 'conflict' ? 'journalEdit.conflict' : 'journalEdit.failed')}
        </Notice>
      )}
    </>
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
    <section aria-label={t('journalLifecycle.deletedList')} className="px-5 pt-2 pb-10 sm:px-6">
      {/* 목록 끝의 텍스트 링크다. 평소에는 목록을 밀어내지 않고, 눌러야 펼쳐진다. */}
      <Button
        type="button"
        variant="text-neutral"
        className="-ml-3 h-11 px-3"
        aria-expanded={open}
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
      >
        {t('journalLifecycle.deletedList')}
      </Button>
      {open && (
        <Card className="mt-2 flex flex-col gap-3 p-5">
          <p className="type-supporting text-text-secondary break-keep">
            {t('journalLifecycle.retained')}
          </p>
          <div>
            <Button
              type="button"
              variant="text"
              className="-ml-3 h-11 px-3"
              disabled={busy}
              onClick={() => setReload((v) => v + 1)}
            >
              {t('journalEdit.reload')}
            </Button>
          </div>
          {error && <Notice tone="danger">{t('journalEdit.failed')}</Notice>}
          {listing?.source === fetchImpl && (
            <>
              {listing.items.length === 0 && (
                <p className="type-body text-foreground">{t('journalLifecycle.empty')}</p>
              )}
              <ul className="divide-border divide-y">
                {listing.items.map((item) => (
                  <li key={item.journalId} className="flex items-center justify-between gap-3">
                    <span className="type-supporting text-text-body min-w-0 wrap-anywhere">
                      {item.type} · {item.deletedAt}
                    </span>
                    <Button
                      type="button"
                      variant="text"
                      className="h-11 shrink-0 px-3"
                      disabled={busy || error}
                      onClick={() => void restore(item)}
                    >
                      {t('journalLifecycle.restore')}
                    </Button>
                  </li>
                ))}
              </ul>
              {listing.hasMore && (
                <p className="type-supporting text-text-secondary">{t('journalLifecycle.more')}</p>
              )}
            </>
          )}
        </Card>
      )}
    </section>
  );
}
