import { useEffect, useState } from 'react';

const TICKER = /^[A-Z][A-Z0-9.-]{0,9}$/;
type Filing = { ticker: string; source: string; asOf: string; period: string; notice: string };

/** Enabled only in the local experiment; the server derives the owner from its current user. */
export function LocalHolding() {
  const [saved, setSaved] = useState('');
  const [choice, setChoice] = useState('');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [filing, setFiling] = useState<Filing>();
  const [busy, setBusy] = useState(false);
  const ticker = choice.trim().toUpperCase();

  useEffect(() => {
    const controller = new AbortController();
    fetch('/finance/local-holding', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const data: unknown = await response.json();
        if (!data || typeof data !== 'object' || !('ticker' in data)) throw new Error();
        const value = data.ticker;
        if (value !== null && (typeof value !== 'string' || !TICKER.test(value))) throw new Error();
        setSaved(value ?? '');
        setChoice(value ?? '');
        setReady(true);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('Could not load the local holding.');
      });
    return () => controller.abort();
  }, []);

  async function save() {
    if (!TICKER.test(ticker)) {
      setError('Enter 1–10 letters, numbers, dots or hyphens, beginning with a letter.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch('/finance/local-holding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
      });
      if (!response.ok) throw new Error();
      const data: unknown = await response.json();
      if (!data || typeof data !== 'object' || !('ticker' in data) || data.ticker !== ticker)
        throw new Error();
      setSaved(ticker);
      setChoice(ticker);
      setFiling(undefined);
      setError('');
    } catch {
      setError('Could not save the local holding.');
    } finally {
      setBusy(false);
    }
  }

  async function viewFiling() {
    setBusy(true);
    setFiling(undefined);
    try {
      const response = await fetch('/finance/local-holding/filing');
      if (!response.ok) throw new Error();
      const data: unknown = await response.json();
      if (
        !data ||
        typeof data !== 'object' ||
        !('ticker' in data) ||
        data.ticker !== saved ||
        !('source' in data) ||
        data.source !== 'local-synthetic-fixture:v1' ||
        !('asOf' in data) ||
        typeof data.asOf !== 'string' ||
        !('period' in data) ||
        typeof data.period !== 'string' ||
        !('notice' in data) ||
        typeof data.notice !== 'string'
      )
        throw new Error();
      setFiling(data as Filing);
      setError('');
    } catch {
      setError('Could not load the synthetic filing example.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Local holding">
      <h2>Save a ticker</h2>
      <p>
        This local experiment saves one ticker for the locally configured user on the local server.
        Ownership is not verified.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <label>
          Ticker{' '}
          <input
            value={choice}
            disabled={!ready || busy}
            onChange={(event) => setChoice(event.target.value)}
            maxLength={10}
          />
        </label>
        <button type="submit" disabled={!ready || busy}>
          Save ticker
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      {saved && (
        <section aria-label="Saved holding">
          <h3>Saved ticker: {saved}</h3>
          <button type="button" disabled={busy} onClick={() => void viewFiling()}>
            View filing example
          </button>
          {filing && (
            <section aria-label="Filing example">
              <h4>Synthetic filing example for {filing.ticker}</h4>
              <p>{filing.notice} No filing provider is connected.</p>
              <p>
                Source: {filing.source} · as of {filing.asOf} · {filing.period}
              </p>
              <p>Official filing content is unavailable in this local experiment.</p>
            </section>
          )}
        </section>
      )}
    </section>
  );
}
