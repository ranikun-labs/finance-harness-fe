import type { JournalFieldError } from '@/features/journal-new/model/journalFormValidation';
interface Props {
  heading: string;
  errors: JournalFieldError[];
  labels: Record<string, string>;
  messages: Record<string, string>;
  onFocus: (field: JournalFieldError['field']) => void;
}
export function JournalValidationSummary({ heading, errors, labels, messages, onFocus }: Props) {
  return (
    <section
      className="border-destructive/40 bg-destructive/5 rounded-lg border p-4"
      role="alert"
      aria-live="assertive"
    >
      <h2 className="text-foreground font-semibold">{heading}</h2>
      <ul className="mt-2 flex flex-col gap-1">
        {errors.map((error) => (
          <li key={`${error.field}-${error.code}`}>
            <button
              type="button"
              className="text-destructive text-left underline focus-visible:outline-2"
              onClick={() => onFocus(error.field)}
            >
              {labels[error.field]}: {messages[error.messageKey]}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
