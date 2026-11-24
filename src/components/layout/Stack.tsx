import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

/** 간격은 Foundation 스케일(관련 8 / 카드 안 12 / 섹션 40)만 허용한다. */
const GAP_CLASS = {
  related: 'gap-2',
  group: 'gap-3',
  section: 'gap-10',
} as const;

interface StackProps extends ComponentPropsWithoutRef<'div'> {
  gap?: keyof typeof GAP_CLASS;
}

/** 세로 흐름 단일 column. DOM 순서가 곧 시각·탭 순서다. */
export function Stack({ gap = 'group', className, ...props }: StackProps) {
  return <div className={cn('flex min-w-0 flex-col', GAP_CLASS[gap], className)} {...props} />;
}
