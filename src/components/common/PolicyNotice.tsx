import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PolicyNoticeProps {
  icon?: ReactNode;
  title?: ReactNode;
  children: ReactNode;
  tone?: 'neutral' | 'destructive';
  className?: string;
}

/**
 * UI shell만 책임진다. 문구·번역은 항상 호출부가 `children`으로 넘긴다 —
 * 이 컴포넌트는 번역 훅이나 i18n key 타입을 알지 않는다.
 */
export function PolicyNotice({
  icon,
  title,
  children,
  tone = 'neutral',
  className,
}: PolicyNoticeProps) {
  return (
    <div
      role="note"
      className={cn(
        'flex gap-2 rounded-md border p-3 text-sm',
        tone === 'neutral' && 'bg-muted/50 border-border text-muted-foreground',
        tone === 'destructive' && 'bg-destructive/5 border-destructive/30 text-destructive',
        className,
      )}
    >
      {icon && (
        <span className="shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="flex flex-col gap-1">
        {title && <span className="text-foreground font-semibold">{title}</span>}
        <div>{children}</div>
      </div>
    </div>
  );
}
