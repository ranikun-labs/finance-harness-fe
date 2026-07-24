import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { APP_ROUTE_PATHS } from '@/constants/routes';

describe('BottomNavigation', () => {
  it('marks the active tab with aria-current and a dedicated indicator, and not the others', () => {
    render(
      <MemoryRouter initialEntries={[APP_ROUTE_PATHS.ask]}>
        <BottomNavigation />
      </MemoryRouter>,
    );

    const homeLink = screen.getByRole('link', { name: '홈' });
    const askLink = screen.getByRole('link', { name: '질문' });
    const journalLink = screen.getByRole('link', { name: '기록' });

    expect(askLink).toHaveAttribute('aria-current', 'page');
    expect(homeLink).not.toHaveAttribute('aria-current');
    expect(journalLink).not.toHaveAttribute('aria-current');

    expect(within(askLink).getByTestId('bottom-tab-active-indicator')).toBeInTheDocument();
    expect(within(homeLink).queryByTestId('bottom-tab-active-indicator')).toBeNull();
    expect(within(journalLink).queryByTestId('bottom-tab-active-indicator')).toBeNull();
  });

  it('moves the active indicator when the active route changes', () => {
    render(
      <MemoryRouter initialEntries={[APP_ROUTE_PATHS.appHome]}>
        <BottomNavigation />
      </MemoryRouter>,
    );

    const homeLink = screen.getByRole('link', { name: '홈' });
    const askLink = screen.getByRole('link', { name: '질문' });

    expect(homeLink).toHaveAttribute('aria-current', 'page');
    expect(within(homeLink).getByTestId('bottom-tab-active-indicator')).toBeInTheDocument();
    expect(askLink).not.toHaveAttribute('aria-current');
    expect(within(askLink).queryByTestId('bottom-tab-active-indicator')).toBeNull();
  });

  it('keeps the home tab inactive on nested journal routes (end matching)', () => {
    render(
      <MemoryRouter initialEntries={[APP_ROUTE_PATHS.journalList]}>
        <BottomNavigation />
      </MemoryRouter>,
    );

    const homeLink = screen.getByRole('link', { name: '홈' });
    const journalLink = screen.getByRole('link', { name: '기록' });

    // 홈 탭 경로(/app)가 /app/journal의 접두어지만 end=true라 활성되면 안 된다.
    expect(homeLink).not.toHaveAttribute('aria-current');
    expect(journalLink).toHaveAttribute('aria-current', 'page');
  });
});
