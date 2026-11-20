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
  render(<LocalGeneralAnalysis question="Explain risk" />);
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
  render(<LocalGeneralAnalysis question="Explain risk" />);
  await screen.findByText('Which facts?');
  fireEvent.click(screen.getByLabelText('I reviewed the checklist'));
  fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
  expect(
    await screen.findByText('Analysis could not be validated. Please try again.'),
  ).toBeInTheDocument();
});
