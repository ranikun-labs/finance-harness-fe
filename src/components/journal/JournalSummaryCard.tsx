import { Link } from 'react-router';

import { RecordTagBadge } from '@/components/common/RecordTagBadge';
import { Card } from '@/components/ui/card';
import { buildAppJournalDetailPath } from '@/constants/routes';
import { useTranslation } from '@/i18n/I18nContext';
import { formatJournalOccurredAt } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { JournalListItemViewModel } from '@/features/journal-read/model/journalReadViewModel';

interface JournalSummaryCardProps {
  entry: JournalListItemViewModel;
  selected?: boolean;
}

/**
 * Server-owned list projection. Detail-only fields such as reasoning, emotion, and
 * openQuestions are intentionally unavailable here, so a card cannot create an N+1 read.
 */
export function JournalSummaryCard({ entry, selected = false }: JournalSummaryCardProps) {
  const { locale } = useTranslation();
  const title = entry.type === 'investment' ? entry.assetName : entry.title;

  return (
    <Link
      to={buildAppJournalDetailPath(entry.journalId)}
      aria-current={selected ? 'page' : undefined}
      className="focus-visible:ring-ring/50 block rounded-xl outline-none focus-visible:ring-3"
    >
      <Card
        className={cn(
          'flex flex-col gap-3 p-[18px] transition-colors',
          selected && 'border-primary/50 bg-primary/5',
        )}
        data-journal-id={entry.journalId}
      >
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-foreground min-w-0 text-[17px] font-bold tracking-tight [overflow-wrap:anywhere]">
                {title}
              </span>
              <RecordTagBadge kind="entryType" value={entry.type} />
              {entry.type === 'investment' && <RecordTagBadge kind="action" value={entry.action} />}
            </div>
            <time
              className="text-muted-foreground text-xs"
              dateTime={entry.occurredAt}
              title={entry.timeZone}
            >
              {formatJournalOccurredAt(entry.occurredAt, entry.timeZone, locale)}
            </time>
          </div>
          <span aria-hidden="true" className="text-muted-foreground shrink-0 text-lg leading-none">
            ›
          </span>
        </div>

        <span className="text-muted-foreground text-xs [overflow-wrap:anywhere]">
          {entry.timeZone}
        </span>
      </Card>
    </Link>
  );
}
