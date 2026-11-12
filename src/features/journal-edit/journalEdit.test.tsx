import { MemoryRouter, Routes, Route } from 'react-router';
import { JournalRevisionReviewBoundary } from './JournalRevisionReviewBoundary';
import { JournalReadPortProvider } from '@/features/journal-read/JournalReadPortContext';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nProvider } from '@/i18n/I18nContext';
import { JournalEditor } from './JournalEditor';
import { JournalEditFetchContext } from './JournalEditContext';
import { createJournalEditPort, isCurrentJournalReviewResult } from './journalEditPort';
import { createFinanceReferenceJournalFetch } from '@/features/auth/financeReferenceAuth';
import type { JournalDetailViewModel } from '@/features/journal-read/model/journalReadViewModel';
const id = '550e8400-e29b-41d4-a716-446655440000';
const detail = {
  journalId: id,
  type: 'study',
  revision: 0,
  title: 'Original',
  keyContent: 'Content',
  openQuestions: ['Question'],
  occurredAt: '2026-08-12T14:30:00.000',
  timeZone: 'Asia/Seoul',
  createdAt: '2026-08-12T05:30:00Z',
  updatedAt: '2026-08-12T05:30:00Z',
} as JournalDetailViewModel;
describe('explicit own Journal correction', () => {
  it('sends only expected revision and editable fields without immutable identity/time', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ journalId: id, revision: 1 }), { status: 200 }),
      );
    const fields = { title: 'Corrected', keyContent: 'New', openQuestions: [] };
    expect(await createJournalEditPort(fetch)({ journalId: id, revision: 0 }, fields)).toEqual({
      journalId: id,
      revision: 1,
    });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`/finance/journals/${id}`);
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body)).toEqual({ expectedRevision: 0, fields });
  });
  it('does not retry or overwrite on stale revision409', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 409 }));
    await expect(
      createJournalEditPort(fetch)({ journalId: id, revision: 0 }, { title: 'x' }),
    ).rejects.toMatchObject({ code: 'conflict' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('rejects old AI result refs rather than relabeling them after edit', () => {
    const old = { journalId: id, revision: 0 };
    expect(isCurrentJournalReviewResult(old, { journalId: id, revision: 1 })).toBe(false);
    expect(old.revision).toBe(0);
    expect(
      isCurrentJournalReviewResult({ journalId: id, revision: 1 }, { journalId: id, revision: 1 }),
    ).toBe(true);
  });
  it('allows only authenticated exact detailPATCH, preserving DELETE denial', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    const session = { accessToken: 'public-test-token', expiresAt: Date.now() + 300000, epoch: 1 };
    const auth = createFinanceReferenceJournalFetch(fetch, () => session, vi.fn());
    await auth(`/finance/journals/${id}`, { method: 'PATCH' });
    expect(new Headers(fetch.mock.calls[0][1].headers).get('Authorization')).toBe(
      'Bearer public-test-token',
    );
    await expect(auth(`/finance/journals/${id}`, { method: 'DELETE' })).rejects.toMatchObject({
      code: 'external_request',
    });
  });
  it('shows edit controls, saves fields, then requests current server data', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ journalId: id, revision: 1 }), { status: 200 }),
      );
    const saved = vi.fn();
    render(
      <I18nProvider locale="en">
        <JournalEditFetchContext.Provider value={fetch}>
          <JournalEditor detail={detail} onSaved={saved} />
        </JournalEditFetchContext.Provider>
      </I18nProvider>,
    );
    fireEvent.click(screen.getByText('Edit record'));
    const title = document.querySelector('[data-edit-field="title"]') as HTMLTextAreaElement;
    fireEvent.change(title, { target: { value: 'Corrected' } });
    fireEvent.click(screen.getByText('Save changes'));
    await waitFor(() => expect(saved).toHaveBeenCalledOnce());
    expect(JSON.parse(fetch.mock.calls[0][1].body).fields.title).toBe('Corrected');
  });
  it('preserves typed edits on conflict and requires an explicit reload', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 409 }));
    const reload = vi.fn();
    render(
      <I18nProvider locale="en">
        <JournalEditFetchContext.Provider value={fetch}>
          <JournalEditor detail={detail} onSaved={reload} />
        </JournalEditFetchContext.Provider>
      </I18nProvider>,
    );
    fireEvent.click(screen.getByText('Edit record'));
    const title = document.querySelector('[data-edit-field="title"]') as HTMLTextAreaElement;
    fireEvent.change(title, { target: { value: 'Unsaved correction' } });
    fireEvent.click(screen.getByText('Save changes'));
    await screen.findByRole('alert');
    expect(title.value).toBe('Unsaved correction');
    expect(reload).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Reload latest record'));
    expect(reload).toHaveBeenCalledOnce();
  });
});

describe('edit and review boundary integration', () => {
  it('cancel restores original input and never offers immutable time or context controls', () => {
    render(
      <I18nProvider locale="en">
        <JournalEditFetchContext.Provider value={vi.fn()}>
          <JournalEditor detail={detail} onSaved={vi.fn()} />
        </JournalEditFetchContext.Provider>
      </I18nProvider>,
    );
    fireEvent.click(screen.getByText('Edit record'));
    fireEvent.change(document.querySelector('[data-edit-field="title"]')!, {
      target: { value: 'not saved' },
    });
    expect(document.querySelector('[data-edit-field="occurredAt"]')).toBeNull();
    expect(document.querySelector('[data-edit-field="timeZone"]')).toBeNull();
    expect(document.querySelector('[data-edit-field="decisionContext"]')).toBeNull();
    fireEvent.click(screen.getByText('Cancel'));
    fireEvent.click(screen.getByText('Edit record'));
    expect((document.querySelector('[data-edit-field="title"]') as HTMLTextAreaElement).value).toBe(
      'Original',
    );
  });
  const renderBoundary = (revision: number, sourceRevision: number) =>
    render(
      <I18nProvider locale="en">
        <JournalReadPortProvider
          port={{
            list: vi.fn(),
            detail: vi.fn().mockResolvedValue({ ok: true, data: { ...detail, revision } }),
          }}
        >
          <MemoryRouter initialEntries={[`/review/${id}?sourceRevision=${sourceRevision}`]}>
            <Routes>
              <Route
                path="/review/:id"
                element={
                  <JournalRevisionReviewBoundary>
                    <div>Bound result</div>
                  </JournalRevisionReviewBoundary>
                }
              />
            </Routes>
          </MemoryRouter>
        </JournalReadPortProvider>
      </I18nProvider>,
    );
  it('blocks stale revision-bound route before rendering an old result', async () => {
    renderBoundary(1, 0);
    await screen.findByText(
      'Changing a record requires a new review. Existing context and retrospective remain unchanged.',
    );
    expect(screen.queryByText('Bound result')).toBeNull();
  });
  it('accepts exact current revision only at the existing source seam', async () => {
    renderBoundary(1, 1);
    await screen.findByText('Bound result');
  });
});
