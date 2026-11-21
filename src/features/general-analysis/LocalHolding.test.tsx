import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { LocalHolding } from './LocalHolding';

afterEach(() => vi.unstubAllGlobals());

it('saves a ticker and renders a matching synthetic filing from the local server', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ ticker: null }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ ticker: 'AAPL' }) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ticker: 'AAPL',
        source: 'local-synthetic-fixture:v1',
        asOf: '2026-01-01T00:00:00Z',
        period: 'fictional period',
        notice: 'Synthetic example; not an official filing.',
      }),
    });
  vi.stubGlobal('fetch', fetchMock);
  render(<LocalHolding />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save ticker' })).toBeEnabled());
  fireEvent.change(screen.getByLabelText('Ticker'), { target: { value: 'aapl' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save ticker' }));
  expect(await screen.findByLabelText('Saved holding')).toHaveTextContent('AAPL');
  fireEvent.click(screen.getByRole('button', { name: 'View filing example' }));
  expect(await screen.findByLabelText('Filing example')).toHaveTextContent(
    'not an official filing',
  );
});

it('does not claim a save on an invalid response', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ticker: null }) })
      .mockResolvedValueOnce({ ok: false }),
  );
  render(<LocalHolding />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save ticker' })).toBeEnabled());
  fireEvent.change(screen.getByLabelText('Ticker'), { target: { value: 'AAPL' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save ticker' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not save');
  expect(screen.queryByLabelText('Saved holding')).toBeNull();
});
