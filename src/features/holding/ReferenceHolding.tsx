import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Card } from '@/components/ui/card';
import { useTranslation } from '@/i18n/I18nContext';
import { HOLDING_PATH, type FinanceReferenceFetch } from '@/features/auth/financeReferenceAuth';
const tickerPattern = /^[A-Z][A-Z0-9.-]{0,9}$/;

async function readTicker(response: Response): Promise<string | null> {
  if (!response.ok) throw new Error('Holding request failed');
  const { ticker } = (await response.json()) as { ticker: unknown };
  if (ticker === null || (typeof ticker === 'string' && tickerPattern.test(ticker))) return ticker;
  throw new Error('Invalid holding response');
}

export function ReferenceHolding({ fetchImpl }: { fetchImpl: FinanceReferenceFetch }) {
  const { t } = useTranslation();
  const [ticker, setTicker] = useState('');
  const [saved, setSaved] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'unavailable' | 'saving' | 'error' | 'ready'>(
    'loading',
  );
  const saveOperation = useRef<AbortController | null>(null);

  useEffect(() => {
    const operation = new AbortController();
    void fetchImpl(HOLDING_PATH, { signal: operation.signal, cache: 'no-store' })
      .then(readTicker)
      .then((value) => {
        if (operation.signal.aborted) return;
        setSaved(value);
        setTicker(value ?? '');
        setStatus('ready');
      })
      .catch(() => {
        if (!operation.signal.aborted) setStatus('unavailable');
      });
    return () => operation.abort();
  }, [fetchImpl]);

  useEffect(() => () => saveOperation.current?.abort(), []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidate = ticker.trim().toUpperCase();
    if (!tickerPattern.test(candidate)) {
      setStatus('error');
      return;
    }
    setStatus('saving');
    saveOperation.current?.abort();
    const operation = new AbortController();
    saveOperation.current = operation;
    try {
      const response = await fetchImpl(HOLDING_PATH, {
        method: 'PUT',
        signal: operation.signal,
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: candidate }),
      });
      const value = await readTicker(response);
      if (operation.signal.aborted) return;
      setSaved(value);
      setTicker(value ?? '');
      setStatus('ready');
    } catch {
      if (!operation.signal.aborted) setStatus('error');
    }
  }

  const busy = status === 'loading' || status === 'saving' || status === 'unavailable';
  return (
    <Card className="gap-3 p-5" aria-labelledby="holding-heading">
      <h2 id="holding-heading" className="font-bold">
        {t('app.holding.title')}
      </h2>
      <p role="status" data-testid="saved-holding">
        {status === 'loading'
          ? t('app.holding.loading')
          : status === 'unavailable'
            ? t('app.holding.unavailable')
            : (saved ?? t('app.holding.empty'))}
      </p>
      <form onSubmit={save} className="flex flex-wrap items-end gap-2">
        <label className="grid gap-1">
          {t('app.holding.ticker')}
          <input
            className="border-input min-h-11 rounded-md border px-3"
            value={ticker}
            onChange={(event) => setTicker(event.target.value)}
            disabled={busy}
            maxLength={10}
            required
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="border-input min-h-11 rounded-md border px-3"
        >
          {t('app.holding.save')}
        </button>
      </form>
      {status === 'error' && <p role="alert">{t('app.holding.error')}</p>}
    </Card>
  );
}
