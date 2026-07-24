import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { APP_ROUTE_PATHS } from '@/constants/routes';
import { I18nProvider } from '@/i18n/I18nContext';

// useTranslation()은 provider 없이 호출되면 throw하므로(암묵적 fallback 없음),
// 이 컴포넌트를 단독 렌더하는 모든 테스트는 명시적으로 <I18nProvider>로 감싼다.
function renderWithLocale(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <I18nProvider locale="ko">
        <BottomNavigation />
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe('BottomNavigation', () => {
  it('marks the active tab with aria-current and a dedicated indicator, and not the others', () => {
    renderWithLocale(APP_ROUTE_PATHS.ask);

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
    renderWithLocale(APP_ROUTE_PATHS.appHome);

    const homeLink = screen.getByRole('link', { name: '홈' });
    const askLink = screen.getByRole('link', { name: '질문' });

    expect(homeLink).toHaveAttribute('aria-current', 'page');
    expect(within(homeLink).getByTestId('bottom-tab-active-indicator')).toBeInTheDocument();
    expect(askLink).not.toHaveAttribute('aria-current');
    expect(within(askLink).queryByTestId('bottom-tab-active-indicator')).toBeNull();
  });

  it('keeps the home tab inactive on nested journal routes (end matching)', () => {
    renderWithLocale(APP_ROUTE_PATHS.journalList);

    const homeLink = screen.getByRole('link', { name: '홈' });
    const journalLink = screen.getByRole('link', { name: '기록' });

    // 홈 탭 경로(/app)가 /app/journal의 접두어지만 end=true라 활성되면 안 된다.
    expect(homeLink).not.toHaveAttribute('aria-current');
    expect(journalLink).toHaveAttribute('aria-current', 'page');
  });
});
