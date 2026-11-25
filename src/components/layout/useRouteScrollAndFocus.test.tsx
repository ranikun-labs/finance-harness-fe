import { act, render, screen, waitFor } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { MemoryRouter, Link, Route, Routes, useNavigate } from 'react-router';
import { describe, expect, it } from 'vitest';

import { useRouteScrollAndFocus } from '@/components/layout/useRouteScrollAndFocus';

const handle: { navigate?: ReturnType<typeof useNavigate> } = {};
const navigate = (to: string | number) => handle.navigate!(to as string);

function Screen() {
  const mainRef = useRef<HTMLElement>(null);
  useRouteScrollAndFocus(mainRef);
  const nav = useNavigate();
  useEffect(() => {
    handle.navigate = nav;
  }, [nav]);
  return (
    <>
      <nav>
        <Link to="/b">탭 B</Link>
      </nav>
      <main ref={mainRef} id="main">
        <Routes>
          <Route path="/a" element={<h1>화면 A</h1>} />
          <Route path="/b" element={<h1>화면 B</h1>} />
        </Routes>
      </main>
    </>
  );
}

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/a']}>
      <Screen />
    </MemoryRouter>,
  );
}

describe('useRouteScrollAndFocus', () => {
  it('첫 마운트는 포커스를 옮기지 않는다', () => {
    renderScreen();
    expect(document.body).toHaveFocus();
  });

  it('새 화면으로 가면 스크롤을 0으로 하고 제목에 포커스한다', async () => {
    renderScreen();
    const main = document.getElementById('main')!;
    main.scrollTop = 500;
    act(() => navigate('/b'));
    const heading = await screen.findByRole('heading', { name: '화면 B' });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(main.scrollTop).toBe(0);
    expect(heading).toHaveAttribute('tabindex', '-1');
  });

  it('내비 탭 같은 main 밖 포커스는 빼앗지 않는다', async () => {
    renderScreen();
    const tab = screen.getByRole('link', { name: '탭 B' });
    tab.focus();
    act(() => navigate('/b'));
    await screen.findByRole('heading', { name: '화면 B' });
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    expect(tab).toHaveFocus();
  });

  it('같은 화면으로의 이동(해시·같은 경로)은 건드리지 않는다', async () => {
    renderScreen();
    const main = document.getElementById('main')!;
    main.scrollTop = 120;
    act(() => navigate('/a'));
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    expect(main.scrollTop).toBe(120);
    expect(document.body).toHaveFocus();
  });

  it('뒤로 가기(POP)는 떠나기 전 스크롤 위치를 복원한다', async () => {
    renderScreen();
    const main = document.getElementById('main')!;
    main.scrollTop = 300;
    main.dispatchEvent(new Event('scroll'));
    act(() => navigate('/b'));
    await screen.findByRole('heading', { name: '화면 B' });
    await waitFor(() => expect(main.scrollTop).toBe(0));
    // jsdom은 레이아웃이 없어 scrollHeight가 0이다 — 복원 대기가 끝난 뒤 값이 들어가는지 본다.
    act(() => navigate(-1));
    await screen.findByRole('heading', { name: '화면 A' });
    await waitFor(() => expect(main.scrollTop).toBe(300), { timeout: 3000 });
  });
});
