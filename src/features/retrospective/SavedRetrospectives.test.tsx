import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { JournalEditFetchContext } from '@/features/journal-edit/JournalEditContext';
import { I18nProvider } from '@/i18n/I18nContext';
import { SavedRetrospectives } from './SavedRetrospectives';

function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('saved retrospectives', () => {
  it('preserves the draft and idempotency key on failed save, then reads persisted history', async () => {
    const item = {
      retrospectiveId: 'r1',
      journalId: 'j1',
      sourceRevision: 3,
      createdAt: '2026-11-20T00:00:00Z',
      body: '복기 내용',
      outcomeObservation: null,
      decisionQuality: null,
      nextCheck: null,
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(response({ items: [], hasMore: false }))
      .mockResolvedValueOnce(response({}, 503))
      .mockResolvedValueOnce(response(item, 201))
      .mockResolvedValueOnce(response({ items: [item], hasMore: false }));
    render(
      <JournalEditFetchContext.Provider value={fetchImpl}>
        <I18nProvider locale="ko">
          <SavedRetrospectives journalId="j1" revision={3} />
        </I18nProvider>
      </JournalEditFetchContext.Provider>,
    );
    await screen.findByText('아직 저장한 복기가 없어요.');
    fireEvent.change(screen.getByLabelText('지금 다시 보면, 무엇이 달라졌나요? *'), {
      target: { value: '복기 내용' },
    });
    fireEvent.click(screen.getByRole('button', { name: '복기 저장' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('입력을 유지');
    expect(screen.getByLabelText('지금 다시 보면, 무엇이 달라졌나요? *')).toHaveValue('복기 내용');
    fireEvent.click(screen.getByRole('button', { name: '복기 저장' }));
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(4));
    expect(await screen.findByRole('article')).toHaveTextContent('복기 내용');
    expect(screen.getByRole('status')).toHaveTextContent('복기를 저장했어요.');
    expect(screen.getByRole('article')).toHaveTextContent('복기 내용복기 내용');
    const savedEvent = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(savedEvent);
    expect(savedEvent.defaultPrevented).toBe(false);
    const first = fetchImpl.mock.calls[1][1] as RequestInit;
    const second = fetchImpl.mock.calls[2][1] as RequestInit;
    expect(first.headers).toEqual(second.headers);
    expect(first.body).toEqual(second.body);
    expect(JSON.parse(first.body as string).sourceRevision).toBe(3);
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });

  it('keeps drafts and stable request keys after HTML success and A/B/A retries', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(response({ items: [], hasMore: false }))
      .mockResolvedValueOnce(new Response('<html>fallback</html>', { status: 200 }))
      .mockResolvedValueOnce(response({}, 503))
      .mockResolvedValueOnce(new Response('<html>fallback</html>', { status: 200 }));
    render(
      <JournalEditFetchContext.Provider value={fetchImpl}>
        <I18nProvider locale="ko">
          <SavedRetrospectives journalId="j1" revision={3} />
        </I18nProvider>
      </JournalEditFetchContext.Provider>,
    );
    await screen.findByText('아직 저장한 복기가 없어요.');
    const field = screen.getByLabelText('지금 다시 보면, 무엇이 달라졌나요? *');
    fireEvent.change(field, { target: { value: 'A' } });
    fireEvent.click(screen.getByRole('button', { name: '복기 저장' }));
    await screen.findByRole('alert');
    expect(field).toHaveValue('A');
    fireEvent.change(field, { target: { value: 'B' } });
    fireEvent.click(screen.getByRole('button', { name: '복기 저장' }));
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(3));
    fireEvent.change(field, { target: { value: 'A' } });
    await waitFor(() => expect(screen.getByRole('button', { name: '복기 저장' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: '복기 저장' }));
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(4));
    await waitFor(() => expect(screen.getByRole('button', { name: '복기 저장' })).toBeEnabled());
    expect(field).toHaveValue('A');
    expect((fetchImpl.mock.calls[1][1] as RequestInit).headers).toEqual(
      (fetchImpl.mock.calls[3][1] as RequestInit).headers,
    );
    expect((fetchImpl.mock.calls[1][1] as RequestInit).headers).not.toEqual(
      (fetchImpl.mock.calls[2][1] as RequestInit).headers,
    );
  });

  it.each([
    { sourceRevision: {}, outcomeObservation: null },
    { sourceRevision: 1, outcomeObservation: {} },
    { sourceRevision: 1, outcomeObservation: null, createdAt: 'invalid' },
  ])('rejects malformed history instead of rendering it', async (overrides) => {
    const item = {
      retrospectiveId: 'r1',
      journalId: 'j1',
      sourceRevision: 1,
      createdAt: '2026-11-20T00:00:00Z',
      body: 'test',
      outcomeObservation: null,
      decisionQuality: null,
      nextCheck: null,
    };
    Object.assign(item, overrides);
    const fetchImpl = vi.fn().mockResolvedValue(response({ items: [item], hasMore: false }));
    render(
      <JournalEditFetchContext.Provider value={fetchImpl}>
        <I18nProvider locale="ko">
          <SavedRetrospectives journalId="j1" revision={3} />
        </I18nProvider>
      </JournalEditFetchContext.Provider>,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('불러오지 못했어요');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('warns before unloading an unsaved draft and removes the guard on unmount', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response({ items: [], hasMore: false }));
    const { unmount } = render(
      <JournalEditFetchContext.Provider value={fetchImpl}>
        <I18nProvider locale="ko">
          <SavedRetrospectives journalId="j1" revision={3} />
        </I18nProvider>
      </JournalEditFetchContext.Provider>,
    );
    await screen.findByText('아직 저장한 복기가 없어요.');
    fireEvent.click(screen.getByText('결과와 판단 과정 돌아보기 (선택)'));
    fireEvent.change(screen.getByLabelText('결과 관찰'), { target: { value: 'draft' } });
    const dirtyEvent = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(dirtyEvent);
    expect(dirtyEvent.defaultPrevented).toBe(true);
    unmount();
    const cleanEvent = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(cleanEvent);
    expect(cleanEvent.defaultPrevented).toBe(false);
  });

  it('retries a failed history fetch without showing an empty list', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(response({}, 503))
      .mockResolvedValueOnce(response({ items: [], hasMore: false }));
    render(
      <JournalEditFetchContext.Provider value={fetchImpl}>
        <I18nProvider locale="ko">
          <SavedRetrospectives journalId="j1" revision={3} />
        </I18nProvider>
      </JournalEditFetchContext.Provider>,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('불러오지 못했어요');
    expect(screen.queryByText('아직 저장한 복기가 없어요.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    await waitFor(() => expect(screen.getByText('아직 저장한 복기가 없어요.')).toBeInTheDocument());
  });
});
