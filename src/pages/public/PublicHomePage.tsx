import { useParams } from 'react-router';

import { PageSkeleton } from '@/components/layout/PageSkeleton';

/** 공개 웹 홈 placeholder. 실제 랜딩 UI는 후속 STEP에서 구현한다. */
export function PublicHomePage() {
  const { locale } = useParams<{ locale: string }>();
  return <PageSkeleton title={`공개 웹 홈 (${locale})`} />;
}
