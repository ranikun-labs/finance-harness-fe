import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Status Display(컨트롤 아님): 배지는 상태에만 쓰고 색만으로 전달하지 않는다 — 라벨 텍스트 필수.
 * 범용 시각 primitive. 감정/행동 등 도메인 enum이나 i18n key를 알지 않는다 —
 * 라벨은 항상 `children`으로 호출부가 넘긴다.
 */
const badgeVariants = cva(
  'type-label inline-flex w-fit items-center gap-1 rounded-badge px-2 py-0.5 whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'bg-muted text-text-secondary',
        // Foundation info 상태(브랜드와 독립). 기존 `info`는 호환용 브랜드 tint라 이름이 달라졌다.
        information: 'bg-info-bg text-info',
        success: 'bg-success-bg text-success',
        warning: 'bg-warning-bg text-warning',
        danger: 'bg-danger-bg text-danger',
        conflict: 'bg-conflict-bg text-conflict',
        // 호환 alias — 화면 PR 정리 후 information/danger로 이관하고 제거한다.
        info: 'bg-primary/10 text-primary',
        destructive: 'bg-danger-bg text-danger',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  },
);

function Badge({
  className,
  tone,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ tone, className }))} {...props} />;
}

export { Badge };
