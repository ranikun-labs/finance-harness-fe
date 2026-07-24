import { useParams } from 'react-router';

import { PageSkeleton } from '@/components/layout/PageSkeleton';

/** 공개 웹 학습(`/:locale/learn/*`) placeholder. 실제 UI는 후속 STEP에서 구현한다. */
export function LearnPage() {
  const { locale } = useParams<{ locale: string }>();
  return <PageSkeleton title={`학습 (${locale})`} />;
}
