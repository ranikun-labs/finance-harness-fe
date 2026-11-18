import { useEffect, type ReactNode } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { useJournalReadPort } from '@/features/journal-read/JournalReadPortContext';
import { useJournalDetail } from '@/features/journal-read/model/useJournalDetail';
import { useTranslation } from '@/i18n/I18nContext';
import { isCurrentJournalReviewResult } from './journalEditPort';
export function JournalRevisionReviewBoundary({ children }: { children: ReactNode }) {
  const [search] = useSearchParams();
  return search.has('sourceRevision') ? (
    <LiveRevisionGuard expected={search.get('sourceRevision')!}>{children}</LiveRevisionGuard>
  ) : (
    children
  );
}
function LiveRevisionGuard({ expected, children }: { expected: string; children: ReactNode }) {
  const { id } = useParams();
  const port = useJournalReadPort();
  const { state, retry } = useJournalDetail(port, id);
  useEffect(() => {
    const changed = () => retry();
    window.addEventListener('finance-journal-updated', changed);
    return () => window.removeEventListener('finance-journal-updated', changed);
  }, [retry]);
  const { t } = useTranslation();
  if (state.status === 'loading') return <p role="status">{t('common.loading')}</p>;
  const detail = state.data;
  const revision = /^(0|[1-9][0-9]*)$/.test(expected) ? Number(expected) : -1;
  if (
    state.status !== 'success' ||
    !detail ||
    detail.revision === undefined ||
    !isCurrentJournalReviewResult(
      { journalId: id ?? '', revision },
      { journalId: detail.journalId, revision: detail.revision },
    )
  )
    return <p role="status">{t('journalEdit.notice')}</p>;
  return children;
}
