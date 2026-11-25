import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { APP_ROUTE_PATHS, buildAppJournalDetailPath } from '@/constants/routes';
import { JournalEditFetchContext } from '@/features/journal-edit/JournalEditContext';
import type { JournalEditFetch } from '@/features/journal-edit/journalEditPort';
import type { JournalReadPort } from '@/features/journal-read/model/journalReadPort';
import { I18nProvider } from '@/i18n/I18nContext';
import { ko } from '@/i18n/messages/ko';
import { JournalDetailPage } from '@/pages/JournalDetailPage';
import { JournalListPage } from '@/pages/JournalListPage';

// 수정·삭제·복원 UI 배치(F3 F-05): 앱바 텍스트 행동, 삭제 안내는 확인 Dialog 안, 삭제한 기록은 목록 끝.
// fetch는 fixture이며 실제 백엔드 검증이 아니다.
const ID = '550e8400-e29b-41d4-a716-446655440000';
const DETAIL = {
  journalId: ID,
  type: 'investment' as const,
  revision: 3,
  occurredAt: '2026-08-12T14:30:15.123',
  timeZone: 'Asia/Seoul',
  createdAt: '2026-08-12T05:31:02.123Z',
  updatedAt: '2026-08-12T05:31:02.123Z',
  assetName: 'ETF',
  action: 'buy' as const,
  reasoning: 'thesis',
  emotion: null,
};
const port = (): JournalReadPort => ({
  list: vi.fn().mockResolvedValue({
    ok: true,
    data: {
      items: [
        {
          journalId: ID,
          type: 'investment' as const,
          occurredAt: DETAIL.occurredAt,
          timeZone: DETAIL.timeZone,
          assetName: 'ETF',
          action: 'buy' as const,
        },
      ],
      nextCursor: null,
    },
  }),
  detail: vi.fn().mockResolvedValue({ ok: true, data: DETAIL }),
});

function renderDetail(fetchImpl?: JournalEditFetch) {
  return render(
    <MemoryRouter initialEntries={[buildAppJournalDetailPath(ID)]}>
      <I18nProvider locale="ko">
        <JournalEditFetchContext.Provider value={fetchImpl}>
          <Routes>
            <Route
              path={APP_ROUTE_PATHS.journalDetail}
              element={<JournalDetailPage readPort={port()} />}
            />
          </Routes>
        </JournalEditFetchContext.Provider>
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe('기록 상세의 수정·삭제', () => {
  it('앱바(머리 줄)에 텍스트 행동으로 놓이고, 본문의 첫 요소는 기록 머리다', async () => {
    const { container } = renderDetail(vi.fn());
    const header = await waitFor(() => {
      const node = container.querySelector('header');
      expect(node).not.toBeNull();
      expect(within(node as HTMLElement).getByRole('button', { name: '기록 수정' })).toBeVisible();
      return node as HTMLElement;
    });
    expect(within(header).getByRole('button', { name: '기록 삭제' })).toBeVisible();
    // 상세 루트의 첫 자식이 머리이고, 삭제 안내 문단은 어디에도 먼저 나오지 않는다.
    expect(container.querySelector('.journal-detail-page')!.firstElementChild).toBe(header);
    expect(screen.queryByText(ko.journalLifecycle.retained)).toBeNull();
    // 조작 영역 높이 44.
    for (const name of ['기록 수정', '기록 삭제']) {
      expect(within(header).getByRole('button', { name })).toHaveClass('h-11');
    }
  });

  it('삭제 안내는 확인 Dialog 안에서 말하고, 취소하면 요청 없이 기록이 유지된다', async () => {
    const fetchImpl = vi.fn();
    renderDetail(fetchImpl);
    const remove = await screen.findByRole('button', { name: '기록 삭제' });
    // 실제 브라우저의 클릭은 버튼에 포커스를 준다(jsdom은 주지 않는다).
    remove.focus();
    fireEvent.click(remove);

    const dialog = screen.getByRole('alertdialog', { name: '기록 삭제' });
    expect(dialog).toHaveAccessibleDescription(ko.journalLifecycle.retained);
    // 안전한 쪽(취소)이 초기 포커스를 받는다.
    expect(within(dialog).getByRole('button', { name: '취소' })).toHaveFocus();
    fireEvent.click(within(dialog).getByRole('button', { name: '취소' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(screen.getByText('ETF', { selector: 'h2, h1, p, span' })).toBeInTheDocument();
    expect(remove).toHaveFocus();
  });

  it('플래그(편집 fetch)가 없으면 행동이 하나도 나오지 않는다', async () => {
    const { container } = renderDetail(undefined);
    await screen.findAllByText('ETF');
    expect(screen.queryByRole('button', { name: '기록 수정' })).toBeNull();
    expect(screen.queryByRole('button', { name: '기록 삭제' })).toBeNull();
    expect(container.querySelector('header')!.querySelectorAll('button')).toHaveLength(0);
  });

  it('수정을 열면 폼이 카드 안에 있고 저장·취소가 스타일된 버튼이다', async () => {
    renderDetail(vi.fn());
    fireEvent.click(await screen.findByRole('button', { name: '기록 수정' }));
    const form = screen.getByTestId('journal-edit-form');
    expect(form.closest('[data-slot="card"]')).not.toBeNull();
    for (const button of within(form).getAllByRole('button')) {
      expect(button.getAttribute('data-slot')).toBe('button');
    }
    // 수정 중에는 앱바의 수정 행동을 숨긴다(중복 진입 방지).
    expect(
      within(document.querySelector('header')!).queryByRole('button', { name: '기록 수정' }),
    ).toBeNull();
  });
});

describe('삭제한 기록', () => {
  it('목록 끝의 텍스트 링크이고 첫 줄은 목록 머리다', async () => {
    const { container } = render(
      <MemoryRouter>
        <I18nProvider locale="ko">
          <JournalEditFetchContext.Provider value={vi.fn()}>
            <JournalListPage readPort={port()} />
          </JournalEditFetchContext.Provider>
        </I18nProvider>
      </MemoryRouter>,
    );
    const toggle = await screen.findByRole('button', { name: '삭제한 기록' });
    expect(toggle).toHaveClass('h-11');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const section = toggle.closest('section')!;
    // 목록 안내가 모두 section 앞에 오고, 삭제한 기록이 마지막 형제다.
    expect(section.nextElementSibling).toBeNull();
    expect(container.firstElementChild).not.toBe(section);
  });
});
