import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { BottomNavigation } from '@/components/layout/BottomNavigation';
import {
  APP_ROUTE_PATHS,
  buildAppJournalDetailPath,
  buildAppJournalNewPath,
  buildAppJournalReviewPath,
} from '@/constants/routes';
import { I18nProvider } from '@/i18n/I18nContext';

// useTranslation()은 provider 없이 호출되면 throw하므로(암묵적 fallback 없음),
// 이 컴포넌트를 단독 렌더하는 모든 테스트는 명시적으로 <I18nProvider>로 감싼다.
function renderWithLocale(entry: string, locale: 'ko' | 'en' = 'ko') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <I18nProvider locale={locale}>
        <BottomNavigation />
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe('BottomNavigation', () => {
  it('exposes only the Review and Journal primary destinations', () => {
    renderWithLocale(APP_ROUTE_PATHS.ask);

    const links = screen.getAllByRole('link');
    const reviewLink = screen.getByRole('link', { name: '검토' });
    const journalLink = screen.getByRole('link', { name: '저널' });

    expect(links).toHaveLength(2);
    expect(reviewLink).toHaveAttribute('href', APP_ROUTE_PATHS.appHome);
    expect(journalLink).toHaveAttribute('href', APP_ROUTE_PATHS.journalList);
    expect(screen.queryByRole('link', { name: '홈' })).toBeNull();
    expect(screen.queryByRole('link', { name: '질문' })).toBeNull();
  });

  it('keeps Review active for the internal Review Result route', () => {
    renderWithLocale(APP_ROUTE_PATHS.ask);

    const navigation = screen.getByRole('navigation', { name: '주요 화면 이동' });
    const reviewLink = screen.getByRole('link', { name: '검토' });
    const journalLink = screen.getByRole('link', { name: '저널' });

    expect(navigation).toHaveClass('hidden', 'md:flex');
    expect(reviewLink).toHaveAttribute('aria-current', 'page');
    expect(journalLink).not.toHaveAttribute('aria-current');
    expect(within(reviewLink).getByTestId('bottom-tab-active-indicator')).toBeInTheDocument();
    expect(within(journalLink).queryByTestId('bottom-tab-active-indicator')).toBeNull();
  });

  it('moves the active state to Journal on the journal list route', () => {
    renderWithLocale(APP_ROUTE_PATHS.journalList);

    const reviewLink = screen.getByRole('link', { name: '검토' });
    const journalLink = screen.getByRole('link', { name: '저널' });

    expect(reviewLink).not.toHaveAttribute('aria-current');
    expect(journalLink).toHaveAttribute('aria-current', 'page');
  });

  it.each([
    buildAppJournalNewPath('investment'),
    buildAppJournalDetailPath('journal-2026-06-28-01'),
    buildAppJournalReviewPath('journal-2026-06-28-01'),
  ])('keeps Journal active on nested journal route %s', (path) => {
    renderWithLocale(path);

    expect(screen.getByRole('link', { name: '저널' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '검토' })).not.toHaveAttribute('aria-current');
  });

  it('renders the matching English labels from the same structural config', () => {
    renderWithLocale(APP_ROUTE_PATHS.appHome, 'en');

    expect(screen.getByRole('link', { name: 'Review' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Journal' })).toBeInTheDocument();
  });
});
