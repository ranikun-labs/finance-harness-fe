import { useEffect, useRef } from 'react';

import type { JournalEntryType } from '@/constants/routes';
import type { MessageKey } from '@/i18n/dictionary';
import { useTranslation } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';

export type JournalTypeFilterValue = 'all' | JournalEntryType;

interface JournalTypeFilterProps {
  value: JournalTypeFilterValue;
  onChange: (value: JournalTypeFilterValue) => void;
  restoreFocus?: (button: HTMLButtonElement) => void;
}

const FILTER_OPTIONS: JournalTypeFilterValue[] = ['all', 'investment', 'study'];

const FILTER_LABEL_KEY: Record<JournalTypeFilterValue, MessageKey> = {
  all: 'app.journalList.filters.all',
  investment: 'app.journalList.filters.investment',
  study: 'app.journalList.filters.study',
};

/** all/investment/study 화면 local filter state UI. 선택 상태는 호출부(JournalList)가 소유한다. */
export function JournalTypeFilter({ value, onChange, restoreFocus }: JournalTypeFilterProps) {
  const { t } = useTranslation();
  const activeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (activeButton.current) restoreFocus?.(activeButton.current);
  }, [restoreFocus]);

  return (
    <div
      role="group"
      aria-label={t('app.journalList.filters.groupLabel')}
      className="flex flex-wrap gap-2"
    >
      {FILTER_OPTIONS.map((option) => {
        const isActive = value === option;
        return (
          <button
            key={option}
            type="button"
            data-journal-filter={option}
            ref={isActive ? activeButton : undefined}
            aria-pressed={isActive}
            onClick={() => onChange(option)}
            className={cn(
              'focus-visible:ring-ring flex h-11 shrink-0 items-center rounded-[11px] px-4 text-sm font-bold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-2',
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
