import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { LocalGeneralAnalysis } from './LocalGeneralAnalysis';
const setup = {
  questionId: 'q',
  checklistId: 'c',
  checklistItems: [{ id: 'facts', prompt: 'Which facts?' }],
};
const response = (body: unknown) => ({ ok: true, json: async () => body }) as Response;
afterEach(() => vi.unstubAllGlobals());
it('requires confirmation and hides a response that arrives after confirmation is withdrawn', async () => {
  let finish!: (value: Response) => void;
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(response(setup))
    .mockResolvedValueOnce(response({ confirmed: true }))
    .mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    );
  vi.stubGlobal('fetch', fetchMock);
  render(<LocalGeneralAnalysis question="Explain risk" onEdit={() => {}} />);
  await screen.findByText('Which facts?');
  expect(screen.getByRole('button', { name: 'Analyze' })).toBeDisabled();
  fireEvent.click(screen.getByLabelText('I reviewed the checklist'));
  fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  fireEvent.click(screen.getByLabelText('I reviewed the checklist'));
  finish(
    response({
      status: 'COMPLETED',
      output: {
        summary: 'Late output',
        observations: ['a'],
        assumptions: ['b'],
        nextChecks: ['c'],
        evidenceNote: 'd',
      },
    }),
  );
  await waitFor(() => expect(screen.queryByText('Late output')).not.toBeInTheDocument());
  expect(screen.getByRole('status')).toHaveTextContent('Review the checklist');
});
it('hides invalid completed output', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(response(setup))
      .mockResolvedValueOnce(response({}))
      .mockResolvedValueOnce(response({ status: 'COMPLETED', output: {} })),
  );
  render(<LocalGeneralAnalysis question="Explain risk" onEdit={() => {}} />);
  await screen.findByText('Which facts?');
  fireEvent.click(screen.getByLabelText('I reviewed the checklist'));
  fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
  expect(
    await screen.findByText('Analysis could not be validated. Please try again.'),
  ).toBeInTheDocument();
});
it('shows only validated backend evidence after analysis', async () => {
  const output = {
    summary: 'Summary',
    observations: ['Observation'],
    assumptions: ['Assumption'],
    nextChecks: ['Check'],
    evidenceNote: 'Synthetic',
  };
  const lens = {
    status: 'COMPLETED',
    facts: [{ id: 'sector', source: 'synthetic-basic:SECTOR', value: '0.8' }],
    interpretation: 'Sector signal',
    nextLens: 'SECTOR',
    basicCalls: 1,
    supplementalCalls: 1,
    asOf: '2026-01-01T00:00:00Z',
    fixtureLabel: 'SYNTHETIC_FIXTURE',
  };
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(response(setup))
      .mockResolvedValueOnce(response({}))
      .mockResolvedValueOnce(response({ status: 'COMPLETED', analysisId: 'a', output }))
      .mockResolvedValueOnce(response(lens)),
  );
  render(<LocalGeneralAnalysis question="Explain risk" onEdit={() => {}} />);
  await screen.findByText('Which facts?');
  fireEvent.click(screen.getByLabelText('I reviewed the checklist'));
  fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
  expect(await screen.findByText('Lookup trace: basic 1; supplemental 1')).toBeInTheDocument();
  expect(screen.getByText('Interpretation: Sector signal')).toBeInTheDocument();
});
it('offers a synthetic contribution only after sector evidence and reads it only on click', async () => {
  const output = {
    summary: 'Summary',
    observations: ['Observation'],
    assumptions: ['Assumption'],
    nextChecks: ['Check'],
    evidenceNote: 'Synthetic',
  };
  const asOf = '2026-01-01T00:00:00Z';
  const mock = vi
    .fn()
    .mockResolvedValueOnce(response(setup))
    .mockResolvedValueOnce(response({}))
    .mockResolvedValueOnce(response({ status: 'COMPLETED', analysisId: 'a', output }))
    .mockResolvedValueOnce(
      response({
        status: 'COMPLETED',
        facts: [{ id: 'sector', source: 'synthetic-basic:SECTOR', value: '0.8' }],
        interpretation: 'Sector signal',
        nextLens: 'SECTOR',
        basicCalls: 1,
        supplementalCalls: 1,
        asOf,
        fixtureLabel: 'SYNTHETIC_FIXTURE',
        suggestionId: 'receipt',
      }),
    )
    .mockResolvedValueOnce(
      response({
        status: 'COMPLETED',
        source: 'synthetic-supplement:SECTOR:SECTOR',
        asOf,
        values: [
          { identifier: 'SYNTHETIC-A', indexContribution: 0.6 },
          { identifier: 'SYNTHETIC-B', indexContribution: 0.4 },
        ],
      }),
    );
  vi.stubGlobal('fetch', mock);
  render(<LocalGeneralAnalysis question="Explain risk" onEdit={() => {}} />);
  await screen.findByText('Which facts?');
  fireEvent.click(screen.getByLabelText('I reviewed the checklist'));
  fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
  const button = await screen.findByRole('button', {
    name: 'Explore invented index contributions',
  });
  expect(mock).toHaveBeenCalledTimes(4);
  fireEvent.click(button);
  expect(await screen.findByText('SYNTHETIC-A: 0.6')).toBeInTheDocument();
  fireEvent.click(button);
  expect(mock).toHaveBeenCalledTimes(5);
});
