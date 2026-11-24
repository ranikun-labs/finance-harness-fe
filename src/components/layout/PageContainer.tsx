import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

/**
 * 콘텐츠 최대 폭 계약(`CONTENT_MAX_WIDTH_PX`)을 담는 host. 값은 Tailwind가 정적으로
 * 읽을 수 있도록 리터럴 클래스로 둔다(`layout.test`/`PageContainer.test`가 상수와 대조).
 * - `reading`: 660 — 기본 읽기 단일 column
 * - `result`: 760 — 검토 결과
 * - `fluid`: 상한 없음 — 부모(2-pane 등)가 폭을 소유할 때만
 */
const SIZE_CLASS = {
  reading: 'max-w-[660px]',
  result: 'max-w-[760px]',
  fluid: '',
} as const;

export type PageContainerSize = keyof typeof SIZE_CLASS;

export const PAGE_CONTAINER_SIZE_CLASS = SIZE_CLASS;

interface PageContainerProps extends ComponentPropsWithoutRef<'div'> {
  size?: PageContainerSize;
}

export function PageContainer({ size = 'reading', className, ...props }: PageContainerProps) {
  return (
    <div className={cn('mx-auto min-h-full w-full', SIZE_CLASS[size], className)} {...props} />
  );
}
