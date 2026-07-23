import { useSearchParams } from 'react-router';

import { PageSkeleton } from '@/components/layout/PageSkeleton';
import type { JournalEntryType } from '@/constants/routes';

const TITLE_BY_TYPE: Record<JournalEntryType, string> = {
  investment: '일지 저장 (투자 기록)',
  study: '공부 노트 저장',
};

export function JournalNewPage() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');
  const title = type === 'study' ? TITLE_BY_TYPE.study : TITLE_BY_TYPE.investment;

  return <PageSkeleton title={title} />;
}
