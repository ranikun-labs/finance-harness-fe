import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';

import { AppShell, APP_SHELL_MAX_WIDTH } from '@/components/layout/AppShell';
import { TabLayout } from '@/components/layout/TabLayout';
import { APP_BASE, APP_ROUTE_PATHS, toRelativeUnder } from '@/constants/routes';

function renderShell(path: string = APP_ROUTE_PATHS.appHome) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={APP_BASE} element={<AppShell />}>
          <Route element={<TabLayout />}>
            <Route index element={<h1>Review Start</h1>} />
            <Route
              path={toRelativeUnder(APP_BASE, APP_ROUTE_PATHS.ask)}
              element={<h1>Review Result</h1>}
            />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('adaptive app shell', () => {
  it('uses the approved desktop maximum without retaining the global 480px frame', () => {
    renderShell();

    const host = screen.getByTestId('app-shell-host');
    expect(APP_SHELL_MAX_WIDTH).toBe('1360px');
    expect(host).toHaveStyle({ maxWidth: '1360px' });
    expect(host).not.toHaveStyle({ maxWidth: '480px' });
  });

  it('keeps one scroll-owning main and a readable tablet portrait content host', () => {
    renderShell();

    const main = screen.getByRole('main');
    const contentHost = screen.getByTestId('adaptive-content-host');

    expect(main).toHaveClass('overflow-y-auto', 'md:order-2');
    expect(contentHost).toHaveClass('max-w-[660px]');
    expect(contentHost).not.toHaveClass('lg:max-w-none');
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
  });

  it('keeps Review Result inside Review IA while hiding phone bottom navigation', () => {
    renderShell(APP_ROUTE_PATHS.ask);

    const navigation = screen.getByRole('navigation', { name: '주요 화면 이동' });
    expect(navigation).toHaveClass('hidden', 'md:flex');
    expect(screen.getByTestId('adaptive-content-host')).toHaveClass('max-w-[760px]');
    expect(screen.getByRole('link', { name: '검토' })).toHaveAttribute('aria-current', 'page');
  });
});
