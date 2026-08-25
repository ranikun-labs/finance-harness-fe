import { useTranslation } from '@/i18n/I18nContext';

interface LazyLoadingFallbackProps {
  /** The app/auth boundary owns the landmark while the page tree is suspended. */
  asMain?: boolean;
}

/** Minimal localized loading surface for lazy boundaries; it owns no route semantics. */
export function LazyLoadingFallback({ asMain = false }: LazyLoadingFallbackProps) {
  const { t } = useTranslation();
  const status = (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid="lazy-loading-fallback"
      className="border-border bg-muted text-muted-foreground flex items-center gap-2 rounded-xl border p-4 text-sm"
    >
      <span aria-hidden="true" className="bg-primary size-2 animate-pulse rounded-full" />
      <span>{t('common.loading')}</span>
    </div>
  );

  if (asMain) {
    return <main className="flex min-h-full items-center justify-center p-4">{status}</main>;
  }

  return status;
}
