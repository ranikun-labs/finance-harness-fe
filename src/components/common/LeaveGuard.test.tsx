import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { createMemoryRouter, Link, MemoryRouter, RouterProvider, useNavigate } from 'react-router';
import { describe, expect, it } from 'vitest';

import { LeaveGuard } from '@/components/common/LeaveGuard';
import { I18nProvider } from '@/i18n/I18nContext';
import { ko } from '@/i18n/messages/ko';

function Editor({ guard = true, byRef }: { guard?: boolean; byRef?: { current: boolean } }) {
  const [value, setValue] = useState('');
  const navigate = useNavigate();
  return (
    <I18nProvider locale="ko">
      <LeaveGuard when={byRef ? () => value !== '' && !byRef.current : guard && value !== ''} />
      <label>
        내용
        <input value={value} onChange={(event) => setValue(event.target.value)} />
      </label>
      <Link to="/other">다른 화면</Link>
      <button type="button" onClick={() => navigate('/', { replace: true, state: { again: 1 } })}>
        같은 주소로 교체
      </button>
    </I18nProvider>
  );
}

function renderEditor(props: Parameters<typeof Editor>[0] = {}) {
  const router = createMemoryRouter(
    [
      { path: '/', element: <Editor {...props} /> },
      { path: '/other', element: <p>다른 화면입니다</p> },
    ],
    { initialEntries: ['/other', '/'], initialIndex: 1 },
  );
  render(<RouterProvider router={router} />);
  return router;
}

const dialog = () => screen.queryByRole('alertdialog', { name: ko.common.leaveGuard.title });

describe('LeaveGuard', () => {
  it('입력이 없으면 이동을 막지 않는다', async () => {
    renderEditor();
    fireEvent.click(screen.getByRole('link', { name: '다른 화면' }));
    expect(await screen.findByText('다른 화면입니다')).toBeInTheDocument();
    expect(dialog()).toBeNull();
  });

  it('링크 이동에 확인을 띄우고, 계속 작성하면 입력과 포커스가 그대로다', async () => {
    renderEditor();
    const input = screen.getByLabelText('내용');
    fireEvent.change(input, { target: { value: '쓰던 내용' } });
    input.focus();
    fireEvent.click(screen.getByRole('link', { name: '다른 화면' }));
    await waitFor(() => expect(dialog()).toBeInTheDocument());
    expect(dialog()).toHaveAccessibleDescription(ko.common.leaveGuard.description);
    // 안전한 쪽(계속 작성)이 초기 포커스를 받는다.
    expect(
      within(dialog()!).getByRole('button', { name: ko.common.leaveGuard.stay }),
    ).toHaveFocus();

    fireEvent.click(within(dialog()!).getByRole('button', { name: ko.common.leaveGuard.stay }));
    await waitFor(() => expect(dialog()).toBeNull());
    expect(input).toHaveValue('쓰던 내용');
    expect(screen.queryByText('다른 화면입니다')).toBeNull();
  });

  it('브라우저 뒤로 가기(history 이동)에도 같은 확인을 띄운다', async () => {
    const router = renderEditor();
    fireEvent.change(screen.getByLabelText('내용'), { target: { value: '쓰던 내용' } });
    await act(async () => {
      await router.navigate(-1);
    });
    await waitFor(() => expect(dialog()).toBeInTheDocument());
    expect(router.state.location.pathname).toBe('/');

    fireEvent.click(within(dialog()!).getByRole('button', { name: ko.common.leaveGuard.stay }));
    await waitFor(() => expect(dialog()).toBeNull());
    expect(screen.getByLabelText('내용')).toHaveValue('쓰던 내용');
    expect(router.state.location.pathname).toBe('/');

    await act(async () => {
      await router.navigate(-1);
    });
    await waitFor(() => expect(dialog()).toBeInTheDocument());
    fireEvent.click(within(dialog()!).getByRole('button', { name: ko.common.leaveGuard.leave }));
    expect(await screen.findByText('다른 화면입니다')).toBeInTheDocument();
  });

  it('같은 주소로의 교체(상태만 바뀜)는 이탈이 아니다', async () => {
    renderEditor();
    fireEvent.change(screen.getByLabelText('내용'), { target: { value: '쓰던 내용' } });
    fireEvent.click(screen.getByRole('button', { name: '같은 주소로 교체' }));
    await act(async () => {});
    expect(dialog()).toBeNull();
    expect(screen.getByLabelText('내용')).toHaveValue('쓰던 내용');
  });

  it('when을 함수로 주면 이동 시점의 값을 읽는다(저장 직후 이동은 막지 않는다)', async () => {
    const saved = { current: false };
    renderEditor({ byRef: saved });
    fireEvent.change(screen.getByLabelText('내용'), { target: { value: '저장한 내용' } });
    saved.current = true;
    fireEvent.click(screen.getByRole('link', { name: '다른 화면' }));
    expect(await screen.findByText('다른 화면입니다')).toBeInTheDocument();
    expect(dialog()).toBeNull();
  });

  it('data router가 아니면 아무것도 하지 않는다(렌더 오류 없음)', () => {
    render(
      <MemoryRouter>
        <I18nProvider locale="ko">
          <LeaveGuard when />
        </I18nProvider>
      </MemoryRouter>,
    );
    expect(dialog()).toBeNull();
  });
});
