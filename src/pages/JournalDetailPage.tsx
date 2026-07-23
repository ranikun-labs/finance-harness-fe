import { useParams } from 'react-router';

import { PageSkeleton } from '@/components/layout/PageSkeleton';

export function JournalDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <PageSkeleton title={`일지 상세 — ${id}`} />;
}
