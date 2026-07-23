import { useSearchParams } from 'react-router';

import { PageSkeleton } from '@/components/layout/PageSkeleton';

export function AskPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');

  return <PageSkeleton title={query ? `Ask 결과 — ${query}` : 'Ask 결과'} />;
}
