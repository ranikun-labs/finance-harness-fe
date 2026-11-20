import { syntheticLens } from './syntheticLens';
import { useEffect, useRef, useState } from 'react';

type Setup = {
  questionId: string;
  checklistId: string;
  checklistItems: { id: string; prompt: string }[];
};
type Output = {
  summary: string;
  observations: string[];
  assumptions: string[];
  nextChecks: string[];
  evidenceNote: string;
};

async function request(
  path: string,
  method: string,
  body: object,
  signal: AbortSignal,
): Promise<unknown> {
  const response = await fetch(`/finance/general-analysis${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) throw new Error('Request failed');
  return response.json() as Promise<unknown>;
}
function isSetup(value: unknown): value is Setup {
  if (!value || typeof value !== 'object') return false;
  const v = value as Setup;
  return (
    typeof v.questionId === 'string' &&
    typeof v.checklistId === 'string' &&
    Array.isArray(v.checklistItems) &&
    v.checklistItems.every((x) => typeof x?.id === 'string' && typeof x?.prompt === 'string')
  );
}
function isOutput(value: unknown): value is Output {
  if (!value || typeof value !== 'object') return false;
  const v = value as Output;
  return (
    typeof v.summary === 'string' &&
    !!v.summary.trim() &&
    typeof v.evidenceNote === 'string' &&
    !!v.evidenceNote.trim() &&
    [v.observations, v.assumptions, v.nextChecks].every(
      (a) =>
        Array.isArray(a) &&
        a.length > 0 &&
        Array.from(a).every((s) => typeof s === 'string' && !!s.trim()),
    )
  );
}
export function LocalGeneralAnalysis({ question }: { question: string }) {
  const [sector, setSector] = useState('0.8');
  const [macro, setMacro] = useState('0.4');
  const [lens, setLens] = useState<ReturnType<typeof syntheticLens>>();
  const [setup, setSetup] = useState<Setup>();
  const [checked, setChecked] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [output, setOutput] = useState<Output>();
  const [message, setMessage] = useState('Preparing checklist…');
  const [busy, setBusy] = useState(true);
  const active = useRef<AbortController | null>(null);
  const version = useRef(0);
  function invalidate() {
    version.current++;
    active.current?.abort();
    active.current = null;
    setOutput(undefined);
    setBusy(false);
    setMessage('Review the checklist before continuing.');
  }
  useEffect(() => {
    const controller = new AbortController();
    const generation = version;
    active.current = controller;
    const current = ++generation.current;
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    request('/questions', 'POST', { question }, controller.signal)
      .then((data) => {
        if (current !== version.current) return;
        if (!isSetup(data)) throw new Error('Invalid response');
        setSetup(data);
        setMessage('Review the checklist before continuing.');
        setBusy(false);
      })
      .catch(() => {
        if (current === version.current) {
          setMessage(
            'Could not prepare the checklist. Return to edit your question and try again.',
          );
          setBusy(false);
        }
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      clearTimeout(timeout);
      generation.current++;
      controller.abort();
      active.current?.abort();
    };
  }, [question]);
  async function analyze() {
    if (!setup || !confirmed || busy) return;
    invalidate();
    const current = ++version.current;
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setMessage('Analyzing…');
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    try {
      const base = `/questions/${encodeURIComponent(setup.questionId)}`;
      await request(
        `${base}/checklists/${encodeURIComponent(setup.checklistId)}`,
        'PUT',
        { checkedItemIds: checked, confirmed: true },
        controller.signal,
      );
      const response = (await request(
        `${base}/analysis`,
        'POST',
        { checklistId: setup.checklistId },
        controller.signal,
      )) as { status?: unknown; output?: unknown };
      if (current !== version.current) return;
      if (response?.status === 'BLOCKED')
        setMessage(
          'This request cannot be analyzed. Consider asking about general checks instead.',
        );
      else if (response?.status === 'COMPLETED' && isOutput(response.output)) {
        setOutput(response.output);
        setMessage('Completed');
      } else setMessage('Analysis could not be validated. Please try again.');
    } catch {
      if (current === version.current)
        setMessage('Analysis failed or timed out. Your question and checklist are preserved.');
    } finally {
      clearTimeout(timeout);
      if (current === version.current) {
        active.current = null;
        setBusy(false);
      }
    }
  }
  return (
    <section className="space-y-4" aria-label="Local general analysis">
      <p className="text-sm">
        Local demonstration using a deterministic fake analysis. No external market data.
      </p>
      <h1 className="text-xl font-bold">{question}</h1>
      <p role="status">{message}</p>
      {setup && (
        <>
          <h2 className="font-bold">Checklist</h2>
          <ul>
            {setup.checklistItems.map((item) => (
              <li key={item.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={checked.includes(item.id)}
                    onChange={(e) => {
                      invalidate();
                      setChecked(
                        e.target.checked
                          ? [...checked, item.id]
                          : checked.filter((id) => id !== item.id),
                      );
                    }}
                  />{' '}
                  {item.prompt}
                </label>
              </li>
            ))}
          </ul>
          <label>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => {
                invalidate();
                setConfirmed(e.target.checked);
              }}
            />{' '}
            I reviewed the checklist
          </label>
          <div>
            <button
              className="bg-primary rounded p-3 text-white disabled:opacity-50"
              disabled={!confirmed || busy}
              onClick={() => void analyze()}
            >
              Analyze
            </button>
          </div>
        </>
      )}
      <section aria-label="Synthetic lens">
        <h2>Synthetic market lens</h2>
        <p>Invented signals; not market observations.</p>
        <label>
          Sector signal{' '}
          <input
            type="number"
            min="0"
            max="1"
            step="any"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
          />
        </label>
        <label>
          Macro signal{' '}
          <input
            type="number"
            min="0"
            max="1"
            step="any"
            value={macro}
            onChange={(e) => setMacro(e.target.value)}
          />
        </label>
        <button
          onClick={() => {
            try {
              if (!sector || !macro) throw new Error();
              setLens(syntheticLens(Number(sector), Number(macro)));
            } catch {
              setLens(undefined);
            }
          }}
        >
          Evaluate synthetic signals
        </button>
        {lens && (
          <div>
            <p>Facts: {lens.facts.join('; ')}</p>
            <p>Interpretation: {lens.interpretation}</p>
            <p>Next lens: {lens.next ?? 'None'}</p>
          </div>
        )}
      </section>
      {output && (
        <article>
          <h2 className="font-bold">Analysis</h2>
          <p>{output.summary}</p>
          <h3>Observations</h3>
          <ul>
            {output.observations.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
          <h3>Assumptions</h3>
          <ul>
            {output.assumptions.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
          <h3>Next checks</h3>
          <ul>
            {output.nextChecks.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
          <p>{output.evidenceNote}</p>
        </article>
      )}
    </section>
  );
}
