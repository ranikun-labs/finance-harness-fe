import { expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { I18nProvider } from '@/i18n/I18nContext';
import { ReferenceHolding } from './ReferenceHolding';

it('aborts a pending read and keeps its ticker hidden when the session ends', async () => {
  let resolve!: (response: Response) => void;
  const fetchImpl = vi.fn(
    (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Promise<Response>((settle) => {
        resolve = settle;
      }),
  );
  const { rerender } = render(
    <I18nProvider locale="en">
      <ReferenceHolding fetchImpl={fetchImpl} />
    </I18nProvider>,
  );
  await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1));
  const signal = fetchImpl.mock.calls[0]?.[1]?.signal;
  rerender(<I18nProvider locale="en">{null}</I18nProvider>);
  expect(signal?.aborted).toBe(true);
  await act(async () => resolve(new Response(JSON.stringify({ ticker: 'AAPL' }))));
  expect(screen.queryByText('AAPL')).not.toBeInTheDocument();
});
