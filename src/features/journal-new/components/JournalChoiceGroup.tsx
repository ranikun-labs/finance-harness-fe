import type { ReactNode } from 'react';

interface Choice {
  value: string;
  label: string;
}
interface JournalChoiceGroupProps {
  id: string;
  label: string;
  helper: string;
  error?: string;
  choices: readonly Choice[];
  value: string;
  onChange: (value: string) => void;
  radioRefs?: Record<string, HTMLInputElement | null>;
  extra?: ReactNode;
}
export function JournalChoiceGroup({
  id,
  label,
  helper,
  error,
  choices,
  value,
  onChange,
  radioRefs,
  extra,
}: JournalChoiceGroupProps) {
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  return (
    <fieldset
      className="flex flex-col gap-2"
      aria-describedby={error ? `${helperId} ${errorId}` : helperId}
    >
      <legend className="text-foreground text-sm font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {choices.map((choice) => (
          <label
            key={choice.value}
            className="border-input has-[:checked]:border-primary has-[:checked]:bg-primary/10 focus-within:ring-ring flex min-h-11 cursor-pointer items-center rounded-md border px-3 text-sm font-medium focus-within:ring-2"
          >
            <input
              ref={(node) => {
                if (radioRefs) radioRefs[choice.value] = node;
              }}
              className="sr-only"
              type="radio"
              name={id}
              value={choice.value}
              checked={value === choice.value}
              onChange={() => onChange(choice.value)}
              aria-invalid={Boolean(error)}
            />
            {choice.label}
          </label>
        ))}
        {extra}
      </div>
      <p id={helperId} className="text-muted-foreground text-sm">
        {helper}
      </p>
      {error && (
        <p id={errorId} className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
