import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';

import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { I18nProvider } from '@/i18n/I18nContext';

function renderAt(pathname: string, search = '', hash = '') {
  return render(
    <MemoryRouter initialEntries={[`${pathname}${search}${hash}`]}>
      <Routes>
        <Route
          path="/:locale/*"
          element={
            <I18nProvider locale={pathname.startsWith('/en') ? 'en' : 'ko'}>
              <LocaleSwitcher />
            </I18nProvider>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LocaleSwitcher', () => {
  it('renders exactly two links, one per supported locale', () => {
    renderAt('/ko');
    expect(screen.getByRole('link', { name: '한국어' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'English' })).toBeInTheDocument();
  });

  it('marks the current locale with aria-current and not the other one', () => {
    renderAt('/ko');
    expect(screen.getByRole('link', { name: '한국어' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: 'English' })).not.toHaveAttribute('aria-current');
  });

  it('flips aria-current when the current locale is en', () => {
    renderAt('/en');
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: '한국어' })).not.toHaveAttribute('aria-current');
  });

  it('swaps only the locale segment for a nested path (features)', () => {
    renderAt('/ko/features');
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute('href', '/en/features');
  });

  it('preserves a learn sub-slug', () => {
    renderAt('/ko/learn/basics');
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute(
      'href',
      '/en/learn/basics',
    );
  });

  it('preserves query string and hash', () => {
    renderAt('/ko/learn/basics', '?x=1', '#y');
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute(
      'href',
      '/en/learn/basics?x=1#y',
    );
  });
});
