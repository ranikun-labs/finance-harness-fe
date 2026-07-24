import { useParams } from 'react-router';

import { PageSkeleton } from '@/components/layout/PageSkeleton';

/** 공개 웹 기능 소개 placeholder. 실제 UI는 후속 STEP에서 구현한다. */
export function FeaturesPage() {
  const { locale } = useParams<{ locale: string }>();
  return <PageSkeleton title={`기능 소개 (${locale})`} />;
}
