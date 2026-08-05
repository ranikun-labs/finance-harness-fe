import type { ReactNode } from 'react';

interface JournalFormFieldProps {
  id: string;
  label: string;
  optionalLabel?: string;
  helper: string;
  error?: string;
  children: (props: { 'aria-describedby': string; 'aria-invalid': boolean }) => ReactNode;
}

export function JournalFormField({
  id,
  label,
  optionalLabel,
  helper,
  error,
  children,
}: JournalFormFieldProps) {
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-2">
      <label className="text-foreground text-sm font-semibold" htmlFor={id}>
        {label}{' '}
        {optionalLabel && (
          <span className="text-muted-foreground text-xs font-normal">{optionalLabel}</span>
        )}
      </label>
      {children({
        'aria-describedby': error ? `${helperId} ${errorId}` : helperId,
        'aria-invalid': Boolean(error),
      })}
      <p id={helperId} className="text-muted-foreground text-sm">
        {helper}
      </p>
      {error && (
        <p id={errorId} className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
