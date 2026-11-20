import { useEffect, type ReactNode } from 'react';
import { useParams, useSearchParams } from 'react-router';

import { useJournalReadPort } from '@/features/journal-read/JournalReadPortContext';
import {
  useJournalDetail,
  type UseJournalDetailResult,
} from '@/features/journal-read/model/useJournalDetail';
import { useTranslation } from '@/i18n/I18nContext';
import { isCurrentJournalReviewResult } from './journalEditPort';

export function JournalRevisionReviewBoundary({
  children,
}: {
  children: (read: UseJournalDetailResult) => ReactNode;
}) {
  const [search] = useSearchParams();
  const { id } = useParams();
  const port = useJournalReadPort();
  const read = useJournalDetail(port, id);
  const { state, retry } = read;
  const { t } = useTranslation();

  useEffect(() => {
    window.addEventListener('finance-journal-updated', retry);
    return () => window.removeEventListener('finance-journal-updated', retry);
  }, [retry]);

  const expected = search.get('sourceRevision');
  if (expected !== null && state.status === 'success' && state.data) {
    const { journalId, revision } = state.data;
    const expectedRevision = /^(0|[1-9][0-9]*)$/.test(expected) ? Number(expected) : -1;
    if (
      revision === undefined ||
      !isCurrentJournalReviewResult(
        { journalId: id ?? '', revision: expectedRevision },
        { journalId, revision },
      )
    ) {
      return <p role="status">{t('journalEdit.notice')}</p>;
    }
  }

  return children(read);
}
