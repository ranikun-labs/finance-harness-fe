import type { JournalEntryType } from '@/constants/routes';
import type { MessageKey } from '@/i18n/dictionary';
import { useTranslation } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';

export type JournalTypeFilterValue = 'all' | JournalEntryType;

interface JournalTypeFilterProps {
  value: JournalTypeFilterValue;
  onChange: (value: JournalTypeFilterValue) => void;
}

const FILTER_OPTIONS: JournalTypeFilterValue[] = ['all', 'investment', 'study'];

const FILTER_LABEL_KEY: Record<JournalTypeFilterValue, MessageKey> = {
  all: 'app.journalList.filters.all',
  investment: 'app.journalList.filters.investment',
  study: 'app.journalList.filters.study',
};

/** all/investment/study 화면 local filter state UI. 선택 상태는 호출부(JournalList)가 소유한다. */
export function JournalTypeFilter({ value, onChange }: JournalTypeFilterProps) {
  const { t } = useTranslation();

  return (
    <div role="group" aria-label={t('app.journalList.filters.groupLabel')} className="flex gap-2">
      {FILTER_OPTIONS.map((option) => {
        const isActive = value === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option)}
            className={cn(
              'flex h-11 shrink-0 items-center rounded-[11px] px-4 text-sm font-bold whitespace-nowrap transition-colors',
              isActive
                ? 'bg-foreground text-background'
                : 'bg-card text-muted-foreground border-border border',
            )}
          >
            {t(FILTER_LABEL_KEY[option])}
          </button>
        );
      })}
    </div>
  );
}
