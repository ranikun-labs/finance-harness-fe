import { useEffect, useRef } from 'react';

import type { JournalEntryType } from '@/constants/routes';
import type { MessageKey } from '@/i18n/dictionary';
import { SelectChip } from '@/components/ui/select-chip';
import { useTranslation } from '@/i18n/I18nContext';

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

/**
 * all/investment/study 화면 local filter state UI. 선택 상태는 호출부(JournalList)가 소유한다.
 * Foundation Select Chip(체크 아이콘 + subtle 면, 터치 44)을 쓴다.
 */
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
      {FILTER_OPTIONS.map((option) => (
        <SelectChip
          key={option}
          data-journal-filter={option}
          ref={value === option ? activeButton : undefined}
          pressed={value === option}
          onClick={() => onChange(option)}
        >
          {t(FILTER_LABEL_KEY[option])}
        </SelectChip>
      ))}
    </div>
  );
}
