import { ChevronRight } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

type DisclosureProps = Omit<React.ComponentProps<'details'>, 'title'> & {
  /** 접힘 줄에 보이는 제목. 항상 텍스트가 있어야 한다(아이콘만 두지 않는다). */
  summary: React.ReactNode;
  /** 접힘 줄을 눌렀을 때(키보드 포함)의 추가 처리. 열림 상태 자체는 `open`/`onToggle`로 다룬다. */
  onSummaryClick?: React.MouseEventHandler<HTMLElement>;
};

/**
 * 선택 항목·부가 정보를 접어 두는 구분선형 Disclosure.
 * 상자가 아니라 위·아래 hairline으로만 구분하고(카드 테두리 금지), 접힘 줄은 터치 최소 48을 보장한다.
 * 네이티브 `<details>`라 키보드(Enter/Space)·스크린리더 expanded 상태를 브라우저가 처리한다.
 * 포커스 표시는 전역 `:focus-visible`을 그대로 쓴다. 문구는 호출부가 넘긴다.
 */
function Disclosure({ summary, onSummaryClick, className, children, ...props }: DisclosureProps) {
  return (
    <details
      data-slot="disclosure"
      className={cn('group border-border min-w-0 border-y', className)}
      {...props}
    >
      <summary
        onClick={onSummaryClick}
        className="type-content-title text-foreground flex min-h-12 cursor-pointer items-center gap-2 py-3"
      >
        <ChevronRight
          aria-hidden="true"
          className="text-text-secondary size-4 shrink-0 group-open:rotate-90"
        />
        <span className="min-w-0 wrap-anywhere break-keep">{summary}</span>
      </summary>
      <div className="flex min-w-0 flex-col gap-4 pt-1 pb-4">{children}</div>
    </details>
  );
}

export { Disclosure };
export type { DisclosureProps };
