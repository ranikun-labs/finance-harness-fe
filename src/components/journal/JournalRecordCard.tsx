import { Link } from 'react-router';

import { RecordTagBadge } from '@/components/common/RecordTagBadge';
import { Card } from '@/components/ui/card';
import { buildAppJournalDetailPath } from '@/constants/routes';
import { useTranslation } from '@/i18n/I18nContext';
import { formatLocalizedDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { JournalEntry } from '@/mocks/journalEntries';

interface JournalRecordCardProps {
  entry: JournalEntry;
  selected?: boolean;
}

/**
 * 기록 1건을 표시하고 상세 route로 이동하는 단일 Link다. 카드 전체가 하나의
 * Link이므로 내부에 중첩 button/link를 두지 않는다 — 감정 배지·행동 배지도 모두
 * 비interactive 요소(span)로만 구성된다.
 */
export function JournalRecordCard({ entry, selected = false }: JournalRecordCardProps) {
  const { t, locale } = useTranslation();
  const title =
    entry.type === 'investment' ? t(`app.journalList.subjects.${entry.subjectKey}`) : entry.title;

  return (
    <Link
      to={buildAppJournalDetailPath(entry.id)}
      aria-current={selected ? 'page' : undefined}
      className="focus-visible:ring-ring/50 block rounded-xl outline-none focus-visible:ring-3"
    >
      <Card
        className={cn(
          'flex flex-col gap-3 p-[18px] transition-colors',
          selected && 'border-primary/50 bg-primary/5',
        )}
      >
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-foreground text-[17px] font-bold tracking-tight">{title}</span>
              <RecordTagBadge kind="entryType" value={entry.type} />
              {entry.type === 'investment' && <RecordTagBadge kind="action" value={entry.action} />}
            </div>
            <span className="text-muted-foreground text-xs">
              {formatLocalizedDate(entry.recordedAt, locale)}
            </span>
          </div>
          <span aria-hidden="true" className="text-muted-foreground shrink-0 text-lg leading-none">
            ›
          </span>
        </div>

        <div className="flex items-start gap-2">
          <span aria-hidden="true" className="bg-primary mt-1 h-4 w-[3px] shrink-0 rounded-full" />
          <span className="text-muted-foreground text-[13px] leading-snug italic">
            {entry.question}
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-muted-foreground text-[11px] font-semibold">
            {t('app.journalList.reasoningLabel')}
          </span>
          <p className="text-foreground/80 line-clamp-2 text-sm leading-relaxed">{entry.memo}</p>
        </div>

        <div className="flex items-center justify-between pt-0.5">
          {entry.emotion ? (
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-[11px] font-semibold">
                {t('app.journalList.emotionLabel')}
              </span>
              <RecordTagBadge kind="emotion" value={entry.emotion} />
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">{t('app.journalList.noEmotion')}</span>
          )}
          <span className="text-muted-foreground text-xs font-semibold">
            {t('app.journalList.checkedProgress', {
              checked: String(entry.checkedCount),
              total: String(entry.totalCount),
            })}
          </span>
        </div>
      </Card>
    </Link>
  );
}
