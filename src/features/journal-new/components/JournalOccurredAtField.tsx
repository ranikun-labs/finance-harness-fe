import type { ChangeEvent, RefCallback } from 'react';

import { Button } from '@/components/ui/button';
import { JournalFormField } from '@/features/journal-new/components/JournalFormField';

type Props = {
  id: string;
  label: string;
  helper: string;
  nowLabel: string;
  changeLabel: string;
  value: string;
  initialValue: string;
  expanded: boolean;
  error?: string;
  disabled?: boolean;
  inputRef: RefCallback<HTMLInputElement>;
  onExpandedChange: (expanded: boolean) => void;
  onBlur: () => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function JournalOccurredAtField({
  id,
  label,
  helper,
  nowLabel,
  changeLabel,
  value,
  initialValue,
  expanded,
  error,
  disabled = false,
  inputRef,
  onExpandedChange,
  onBlur,
  onChange,
}: Props) {
  const editorId = `${id}-editor`;
  const displayValue = value === initialValue ? nowLabel : value || nowLabel;

  return (
    <div className="border-border bg-muted/20 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-foreground text-sm font-semibold">{label}</p>
          <p className="text-muted-foreground truncate text-sm">{displayValue}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-11 shrink-0"
          aria-expanded={expanded}
          aria-controls={editorId}
          aria-label={`${label} ${changeLabel}`}
          disabled={disabled}
          onClick={() => onExpandedChange(!expanded)}
        >
          {changeLabel}
        </Button>
      </div>
      {expanded && (
        <div id={editorId} className="mt-3">
          <JournalFormField id={id} label={label} helper={helper} error={error}>
            {(fieldAria) => (
              <input
                {...fieldAria}
                ref={inputRef}
                id={id}
                type="datetime-local"
                disabled={disabled}
                value={value}
                onBlur={onBlur}
                onChange={onChange}
                className="border-input min-h-11 w-full rounded-md border px-3 focus-visible:outline-2"
              />
            )}
          </JournalFormField>
        </div>
      )}
    </div>
  );
}
