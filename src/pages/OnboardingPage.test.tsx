import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { APP_ROUTE_PATHS } from '@/constants/routes';
import { I18nProvider } from '@/i18n/I18nContext';
import { en } from '@/i18n/messages/en';
import { ko } from '@/i18n/messages/ko';
import { OnboardingPage } from '@/pages/OnboardingPage';

function renderPage(locale: 'ko' | 'en') {
  return render(
    <MemoryRouter>
      <I18nProvider locale={locale}>
        <OnboardingPage />
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe('OnboardingPage', () => {
  it('renders the ko information hierarchy', () => {
    renderPage('ko');

    expect(
      screen.getByRole('heading', { level: 1, name: ko.app.onboarding.hero.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(ko.app.onboarding.tagline)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: ko.app.onboarding.notProvided.heading }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: ko.app.onboarding.provided.heading }),
    ).toBeInTheDocument();
  });

  it('renders the en heading and tagline', () => {
    renderPage('en');

    expect(
      screen.getByRole('heading', { level: 1, name: en.app.onboarding.hero.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(en.app.onboarding.tagline)).toBeInTheDocument();
  });

  it('renders two semantic four-item capability lists', () => {
    renderPage('ko');

    const lists = screen.getAllByRole('list');
    expect(lists).toHaveLength(2);
    expect(within(lists[0]).getAllByRole('listitem')).toHaveLength(4);
    expect(within(lists[1]).getAllByRole('listitem')).toHaveLength(4);
    expect(
      screen.getByText(ko.app.onboarding.notProvided.items.allocation.title),
    ).toBeInTheDocument();
    expect(screen.getByText(ko.app.onboarding.provided.items.review.title)).toBeInTheDocument();
  });

  it('links the clearly named CTA to app home without rendering a bottom navigation', () => {
    renderPage('ko');

    const cta = screen.getByRole('link', { name: ko.app.onboarding.cta });
    expect(cta).toHaveAttribute('href', APP_ROUTE_PATHS.appHome);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('uses PolicyNotice for the disclaimer and hides decorative symbols from the accessibility tree', () => {
    const { container } = renderPage('ko');

    expect(screen.getByRole('note')).toHaveTextContent(ko.app.onboarding.disclaimer);
    const decorativeSymbols = container.querySelectorAll('[aria-hidden="true"]');
    expect(decorativeSymbols).toHaveLength(9);
    decorativeSymbols.forEach((symbol) => expect(symbol).toHaveAttribute('aria-hidden', 'true'));
  });

  it('does not expose policy-forbidden execution CTAs', () => {
    renderPage('ko');

    for (const label of ['매수하기', '매도하기', '목표가 보기', '손절가 보기']) {
      expect(screen.queryByRole('button', { name: label })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: label })).not.toBeInTheDocument();
    }
  });
});
