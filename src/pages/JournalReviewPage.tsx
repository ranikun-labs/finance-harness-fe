import { useParams } from 'react-router';

import { PageSkeleton } from '@/components/layout/PageSkeleton';

export function JournalReviewPage() {
  const { id } = useParams<{ id: string }>();
  return <PageSkeleton title={`복기 — ${id}`} />;
}
