import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { APP_LOCALE_STORAGE_KEY } from '@/i18n/appLocale';
import { AppLocaleProvider, useAppLocale } from '@/i18n/AppLocaleProvider';
import { useTranslation } from '@/i18n/I18nContext';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

function Probe() {
  const { locale, setLocale } = useAppLocale();
  const { t } = useTranslation();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="title">{t('app.home.title')}</span>
      <button onClick={() => setLocale('en')}>switch to en</button>
    </div>
  );
}

describe('useAppLocale', () => {
  it('throws when called outside an AppLocaleProvider (no implicit fallback)', () => {
    // useAppLocale()은 내부적으로 useTranslation()도 쓰므로, provider가 전혀 없으면
    // 그 하위 guard(useTranslation)가 먼저 던진다 — 어느 쪽이든 조용히 통과하지 않는다.
    expect(() => renderHook(() => useAppLocale())).toThrow();
  });

  it('resolves the initial locale from a valid stored value', () => {
    window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, 'en');
    render(
      <AppLocaleProvider>
        <Probe />
      </AppLocaleProvider>,
    );
    expect(screen.getByTestId('locale')).toHaveTextContent('en');
  });

  it('falls back to DEFAULT_LOCALE when storage is invalid and the browser locale is unsupported', () => {
    window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, 'xx');
    vi.stubGlobal('navigator', { language: 'fr-FR', languages: ['fr-FR'] });
    render(
      <AppLocaleProvider>
        <Probe />
      </AppLocaleProvider>,
    );
    expect(screen.getByTestId('locale')).toHaveTextContent('ko');
  });

  it('updates state immediately in the same tab and persists to storage', () => {
    render(
      <AppLocaleProvider>
        <Probe />
      </AppLocaleProvider>,
    );
    expect(screen.getByTestId('locale')).toHaveTextContent('ko');

    fireEvent.click(screen.getByRole('button', { name: 'switch to en' }));

    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(window.localStorage.getItem(APP_LOCALE_STORAGE_KEY)).toBe('en');
  });
});
