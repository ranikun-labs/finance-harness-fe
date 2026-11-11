import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/I18nContext';
import { JournalEditFetchContext } from '@/features/journal-edit/JournalEditContext';
import { JournalDeleteControl, DeletedJournalList } from './JournalLifecycleControls';
import { createJournalLifecyclePort } from './journalLifecyclePort';
import { createFinanceReferenceJournalFetch } from '@/features/auth/financeReferenceAuth';
import { useJournalDetail } from '@/features/journal-read/model/useJournalDetail';
import { useJournalList } from '@/features/journal-read/model/useJournalList';
import type { JournalReadPort } from '@/features/journal-read/model/journalReadPort';
import { toJournalDetailViewModel } from '@/features/journal-read/model/journalReadViewModel';
const id = '550e8400-e29b-41d4-a716-446655440000';
const detail = toJournalDetailViewModel({
  journalId: id,
  type: 'study',
  revision: 0,
  title: 'private',
  keyContent: 'private-body',
  openQuestions: [],
  occurredAt: '2026-08-12T14:30:00.000',
  timeZone: 'Asia/Seoul',
  createdAt: '2026-08-12T05:30:00Z',
  updatedAt: '2026-08-12T05:30:00Z',
});
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
const deleted = () =>
  new CustomEvent('finance-journal-lifecycle', {
    detail: { journalId: id, revision: 1, state: 'deleted' },
  });

describe('explicit own Journal lifecycle', () => {
  it('sends exact original revision once and never retries stale or uncertain commands', async () => {
    const fetch = vi.fn().mockResolvedValue(json({}, 409));
    await expect(
      createJournalLifecyclePort(fetch).transition({ journalId: id, revision: 7 }, 'delete'),
    ).rejects.toMatchObject({ code: 'conflict' });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0]?.[0]).toBe(`/finance/journals/${id}/delete`);
    expect(JSON.parse(fetch.mock.calls[0]?.[1].body)).toEqual({ expectedRevision: 7 });
    expect(fetch.mock.calls[0]?.[1].credentials).toBe('omit');
  });
  it('retains tombstone metadata only and restores only the selected deleted revision', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        json({
          items: [
            {
              journalId: id,
              revision: 3,
              type: 'study',
              deletedAt: '2026-11-11T07:00:00Z',
              title: 'must-drop',
            },
          ],
          hasMore: false,
        }),
      )
      .mockResolvedValueOnce(json({ journalId: id, revision: 4, state: 'active' }));
    const port = createJournalLifecyclePort(fetch);
    const list = await port.list();
    expect(list.items[0]).not.toHaveProperty('title');
    await expect(port.transition(list.items[0]!, 'restore')).resolves.toMatchObject({
      revision: 4,
      state: 'active',
    });
    expect(JSON.parse(fetch.mock.calls[1]?.[1].body)).toEqual({ expectedRevision: 3 });
  });
  it('requires explicit confirmation and does not adopt a newer rendered revision after conflict', async () => {
    const fetch = vi.fn().mockResolvedValue(json({}, 409));
    const reload = vi.fn();
    render(
      <I18nProvider locale="ko">
        <JournalEditFetchContext.Provider value={fetch}>
          <JournalDeleteControl detail={detail} onReload={reload} />
        </JournalEditFetchContext.Provider>
      </I18nProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: '기록 삭제' }));
    expect(fetch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '이 기록 삭제 확인' }));
    await screen.findByRole('alert');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: '기록 삭제' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '최신 기록 다시 읽기' }));
    expect(reload).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('does not republish a delayed command after the consumer unmounts', async () => {
    let resolve!: (r: Response) => void;
    const fetch = vi.fn().mockImplementation(
      () =>
        new Promise<Response>((r) => {
          resolve = r;
        }),
    );
    const listener = vi.fn();
    window.addEventListener('finance-journal-lifecycle', listener);
    const ui = render(
      <I18nProvider locale="ko">
        <JournalEditFetchContext.Provider value={fetch}>
          <JournalDeleteControl detail={detail} onReload={() => {}} />
        </JournalEditFetchContext.Provider>
      </I18nProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: '기록 삭제' }));
    fireEvent.click(screen.getByRole('button', { name: '이 기록 삭제 확인' }));
    ui.unmount();
    await act(async () => {
      resolve(json({ journalId: id, revision: 1, state: 'deleted' }));
    });
    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener('finance-journal-lifecycle', listener);
  });
  it('discards a slow detail result after confirmed deletion', async () => {
    let resolve!: (v: unknown) => void;
    const port = {
      list: vi.fn(),
      detail: vi.fn().mockImplementation(
        () =>
          new Promise((r) => {
            resolve = r;
          }),
      ),
    } as JournalReadPort;
    const hook = renderHook(() => useJournalDetail(port, id));
    await waitFor(() => expect(port.detail).toHaveBeenCalledTimes(1));
    act(() => window.dispatchEvent(deleted()));
    await act(async () => {
      resolve({ ok: true, data: detail });
    });
    expect(hook.result.current.state.data).toBeNull();
    expect(hook.result.current.state.error?.code).toBe('journal_not_found');
    hook.unmount();
  });
  it('discards an already pending extra page after confirmed deletion', async () => {
    let resolve!: (v: unknown) => void;
    const summary = {
      journalId: id,
      type: 'study',
      title: 'private',
      occurredAt: detail.occurredAt,
      timeZone: detail.timeZone,
    };
    const port = {
      detail: vi.fn(),
      list: vi
        .fn()
        .mockResolvedValueOnce({ ok: true, data: { items: [summary], nextCursor: 'next' } })
        .mockImplementationOnce(
          () =>
            new Promise((r) => {
              resolve = r;
            }),
        ),
    } as JournalReadPort;
    const hook = renderHook(() => useJournalList({ port }));
    await waitFor(() => expect(hook.result.current.state.items).toHaveLength(1));
    act(() => hook.result.current.loadMore());
    await waitFor(() => expect(port.list).toHaveBeenCalledTimes(2));
    act(() => window.dispatchEvent(deleted()));
    await act(async () => {
      resolve({ ok: true, data: { items: [summary], nextCursor: null } });
    });
    expect(hook.result.current.state.items).toHaveLength(0);
    hook.unmount();
  });
  it('shows a body-free deleted list and explicit restore without automatic retry', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        json({
          items: [{ journalId: id, revision: 1, type: 'study', deletedAt: '2026-11-11T07:00:00Z' }],
          hasMore: false,
        }),
      )
      .mockResolvedValueOnce(json({ journalId: id, revision: 2, state: 'active' }));
    const ui = render(
      <I18nProvider locale="ko">
        <JournalEditFetchContext.Provider value={fetch}>
          <DeletedJournalList />
        </JournalEditFetchContext.Provider>
      </I18nProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: '삭제한 기록' }));
    fireEvent.click(await screen.findByRole('button', { name: '직접 복원' }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(JSON.parse(fetch.mock.calls[1]?.[1].body)).toEqual({ expectedRevision: 1 });
    await screen.findByText('삭제한 기록이 없습니다.');
    ui.unmount();
  });
  it('attaches bearer only to exact new lifecycle paths and blocks extra methods', async () => {
    const fetch = vi.fn().mockResolvedValue(json({}));
    const session = { accessToken: 'public-fixture', expiresAt: Date.now() + 60000, epoch: 1 };
    const auth = createFinanceReferenceJournalFetch(fetch, () => session, vi.fn());
    for (const action of ['delete', 'restore'])
      await auth(`/finance/journals/${id}/${action}`, { method: 'POST' });
    await auth('/finance/journals/deleted');
    expect(new Headers(fetch.mock.calls[0]?.[1].headers).get('Authorization')).toBe(
      'Bearer public-fixture',
    );
    await expect(
      auth(`/finance/journals/${id}/delete`, { method: 'DELETE' }),
    ).rejects.toMatchObject({ code: 'external_request' });
    await expect(
      auth(`/finance/journals/${id}/restore/`, { method: 'POST' }),
    ).rejects.toMatchObject({ code: 'external_request' });
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it('keeps pending restore from closing and stranding the list busy', async () => {
    let resolve!: (r: Response) => void;
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        json({
          items: [{ journalId: id, revision: 1, type: 'study', deletedAt: '2026-11-11T07:00:00Z' }],
          hasMore: false,
        }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<Response>((r) => {
            resolve = r;
          }),
      );
    const ui = render(
      <I18nProvider locale="ko">
        <JournalEditFetchContext.Provider value={fetch}>
          <DeletedJournalList />
        </JournalEditFetchContext.Provider>
      </I18nProvider>,
    );
    const toggle = screen.getByRole('button', { name: '삭제한 기록' });
    fireEvent.click(toggle);
    fireEvent.click(await screen.findByRole('button', { name: '직접 복원' }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    const blocked = (toggle as HTMLButtonElement).disabled;
    fireEvent.click(toggle);
    await act(async () => {
      resolve(json({ journalId: id, revision: 2, state: 'active' }));
    });
    expect(blocked).toBe(true);
    expect(toggle).not.toBeDisabled();
    expect(screen.getByRole('button', { name: '최신 기록 다시 읽기' })).not.toBeDisabled();
    await screen.findByText('삭제한 기록이 없습니다.');
    fireEvent.click(toggle);
    expect(screen.queryByRole('button', { name: '직접 복원' })).not.toBeInTheDocument();
    ui.unmount();
  });
});
