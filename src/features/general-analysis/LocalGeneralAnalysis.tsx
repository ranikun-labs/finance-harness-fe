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
  const response = await fetch(`/finance/local-fake-analysis${path}`, {
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
export function LocalGeneralAnalysis({
  question,
  onEdit,
}: {
  question: string;
  onEdit: () => void;
}) {
  const [scenario, setScenario] = useState('SECTOR');
  const [lens, setLens] = useState<{
    facts: { id: string; source: string; value: string }[];
    interpretation: string;
    nextLens: string | null;
    basicCalls: number;
    supplementalCalls: number;
    asOf: string;
    fixtureLabel: string;
    suggestionId: string | null;
    analysisId: string;
  }>();
  const [contribution, setContribution] = useState<{
    source: string;
    asOf: string;
    values: { identifier: string; indexContribution: number }[];
  }>();
  const [suggestionUsed, setSuggestionUsed] = useState(false);
  const suggestionLock = useRef(false);
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
    setLens(undefined);
    setContribution(undefined);
    setSuggestionUsed(false);
    suggestionLock.current = false;
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
      )) as { status?: unknown; output?: unknown; analysisId?: unknown };
      if (current !== version.current) return;
      if (response?.status === 'BLOCKED')
        setMessage(
          'This request cannot be analyzed. Consider asking about general checks instead.',
        );
      else if (
        response?.status === 'COMPLETED' &&
        isOutput(response.output) &&
        typeof response.analysisId === 'string'
      ) {
        const result = (await request(
          `${base}/synthetic-lens`,
          'POST',
          { checklistId: setup.checklistId, analysisId: response.analysisId, scenario },
          controller.signal,
        )) as typeof lens & { status?: unknown };
        if (current !== version.current) return;
        if (
          !result ||
          result.status !== 'COMPLETED' ||
          !Array.isArray(result.facts) ||
          !result.facts.length ||
          !result.facts.every(
            (f) =>
              f &&
              typeof f.id === 'string' &&
              typeof f.source === 'string' &&
              typeof f.value === 'string',
          ) ||
          typeof result.interpretation !== 'string' ||
          ![null, 'SECTOR', 'MACRO'].includes(result.nextLens) ||
          result.fixtureLabel !== 'SYNTHETIC_FIXTURE' ||
          typeof result.asOf !== 'string' ||
          !Number.isFinite(Date.parse(result.asOf)) ||
          result.basicCalls !== 1 ||
          result.supplementalCalls !== (result.nextLens === null ? 0 : 1) ||
          (result.suggestionId != null &&
            (typeof result.suggestionId !== 'string' ||
              !/^[0-9a-f-]{36}$/i.test(result.suggestionId) ||
              scenario !== 'SECTOR' ||
              result.nextLens !== 'SECTOR' ||
              !result.facts.some(
                (f) =>
                  f.id === 'supplement:SECTOR' &&
                  f.source === 'synthetic-supplement:SECTOR:SECTOR' &&
                  f.value === 'Invented sector concentration detail',
              )))
        )
          throw new Error('Invalid synthetic evidence');
        setOutput(response.output);
        setLens({ ...result, analysisId: response.analysisId });
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
  async function openContribution() {
    if (!setup || !lens?.suggestionId || suggestionLock.current || busy) return;
    suggestionLock.current = true;
    setSuggestionUsed(true);
    setBusy(true);
    const current = version.current;
    const controller = new AbortController();
    active.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    try {
      const result = (await request(
        `/questions/${encodeURIComponent(setup.questionId)}/synthetic-contribution`,
        'POST',
        {
          checklistId: setup.checklistId,
          analysisId: lens.analysisId,
          suggestionId: lens.suggestionId,
        },
        controller.signal,
      )) as {
        status?: string;
        source?: string;
        asOf?: string;
        values?: { identifier: string; indexContribution: number }[];
      };
      if (current !== version.current) return;
      if (
        result.status !== 'COMPLETED' ||
        result.source !== 'synthetic-supplement:SECTOR:SECTOR' ||
        result.asOf !== lens.asOf ||
        !Array.isArray(result.values) ||
        result.values.length !== 2 ||
        !result.values.every(
          (v) => typeof v.identifier === 'string' && Number.isFinite(v.indexContribution),
        )
      )
        throw new Error('Invalid fixture');
      if (
        result.values[0].identifier !== 'SYNTHETIC-A' ||
        result.values[0].indexContribution !== 0.6 ||
        result.values[1].identifier !== 'SYNTHETIC-B' ||
        result.values[1].indexContribution !== 0.4
      )
        throw new Error('Invalid contribution fixture');
      setContribution({ source: result.source, asOf: result.asOf, values: result.values });
    } catch {
      if (current === version.current)
        setMessage('Suggestion expired or could not be validated. Run analysis again.');
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
      <button type="button" onClick={onEdit}>
        Edit question
      </button>
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
        <p>Invented signals and evidence; not market observations.</p>
        <label>
          Scenario{' '}
          <select
            value={scenario}
            onChange={(e) => {
              invalidate();
              setScenario(e.target.value);
            }}
          >
            <option value="SECTOR">Sector concentration</option>
            <option value="MACRO">Broad macro</option>
            <option value="WEAK">Weak signals</option>
          </select>
        </label>
        {lens && (
          <div>
            <h3>Evidence (synthetic facts)</h3>
            <p>
              {lens.fixtureLabel} · as of {lens.asOf}
            </p>
            <ul>
              {lens.facts.map((f) => (
                <li key={f.id}>
                  {f.id}: {f.value} ({f.source})
                </li>
              ))}
            </ul>
            <p>Interpretation: {lens.interpretation}</p>
            <p>Next lens: {lens.nextLens ?? 'None'}</p>
            <p>
              Lookup trace: basic {lens.basicCalls}; supplemental {lens.supplementalCalls}
            </p>
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
      {output && lens?.nextLens === 'SECTOR' && lens.suggestionId && (
        <button
          type="button"
          disabled={busy || suggestionUsed}
          onClick={() => void openContribution()}
        >
          Explore invented index contributions
        </button>
      )}
      {contribution && (
        <div>
          <p>
            Synthetic index contributions · {contribution.source} · as of {contribution.asOf}
          </p>
          <ul>
            {contribution.values.map((v) => (
              <li key={v.identifier}>
                {v.identifier}: {v.indexContribution}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
