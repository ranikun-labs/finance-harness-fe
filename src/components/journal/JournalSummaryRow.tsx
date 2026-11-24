import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';

import { RecordTagText } from '@/components/common/RecordTagText';
import { buildAppJournalDetailPath } from '@/constants/routes';
import { useTranslation } from '@/i18n/I18nContext';
import { formatJournalOccurredAt } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { JournalListItemViewModel } from '@/features/journal-read/model/journalReadViewModel';

interface JournalSummaryRowProps {
  entry: JournalListItemViewModel;
  selected?: boolean;
}

/** 구분점. 행이 좁아 메타가 두 줄로 쌓이면(@container) 줄 끝에 점이 남지 않도록 숨긴다. */
function MetaSeparator({ always = false }: { always?: boolean }) {
  return (
    <span aria-hidden="true" className={always ? undefined : 'hidden @[18rem]:inline'}>
      ·
    </span>
  );
}

/**
 * Server-owned list projection. Detail-only fields such as reasoning, emotion, and
 * openQuestions are intentionally unavailable here, so a row cannot create an N+1 read.
 *
 * Foundation 목록 행: 배지·카드 테두리·시간대 없이 제목 + 메타 글자(유형 · 행동 · 날짜)만 둔다.
 * 선택 면(brand.subtle)은 목록·상세가 함께 보일 때(selectedId가 있는 2-pane)만 생기며,
 * 색만이 아니라 `aria-current`와 제목 굵기로도 전달한다. 행 최소 높이 56.
 */
export function JournalSummaryRow({ entry, selected = false }: JournalSummaryRowProps) {
  const { locale } = useTranslation();
  const title = entry.type === 'investment' ? entry.assetName : entry.title;

  return (
    <li className="border-border @container [&+&]:border-t">
      <Link
        to={buildAppJournalDetailPath(entry.journalId)}
        aria-current={selected ? 'page' : undefined}
        data-journal-id={entry.journalId}
        className={cn(
          'rounded-inset flex min-h-14 items-center gap-3 px-3 py-3 transition-colors',
          selected ? 'bg-brand-subtle' : 'hover:bg-inset',
        )}
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            className={cn(
              'type-content-title text-foreground min-w-0 wrap-anywhere',
              selected && 'font-bold',
            )}
          >
            {title}
          </span>
          <span className="type-meta text-text-secondary flex flex-col @[18rem]:flex-row @[18rem]:flex-wrap @[18rem]:gap-x-1.5">
            <span className="flex gap-x-1.5">
              <span>
                <RecordTagText kind="entryType" value={entry.type} />
              </span>
              {entry.type === 'investment' && (
                <>
                  <MetaSeparator always />
                  <span>
                    <RecordTagText kind="action" value={entry.action} />
                  </span>
                </>
              )}
            </span>
            <MetaSeparator />
            <time dateTime={entry.occurredAt}>
              {formatJournalOccurredAt(entry.occurredAt, entry.timeZone, locale)}
            </time>
          </span>
        </span>
        <ChevronRight aria-hidden="true" className="text-text-tertiary size-5 shrink-0" />
      </Link>
    </li>
  );
}
