import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { BottomNavigation } from '@/components/layout/BottomNavigation';

describe('BottomNavigation', () => {
  it('marks the active tab with aria-current and a dedicated indicator, and not the others', () => {
    render(
      <MemoryRouter initialEntries={['/ask']}>
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
      <MemoryRouter initialEntries={['/']}>
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
});
