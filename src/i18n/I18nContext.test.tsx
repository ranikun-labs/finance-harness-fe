import { render, renderHook, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { I18nProvider, useTranslation } from '@/i18n/I18nContext';

function Probe() {
  const { t, locale } = useTranslation();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="title">{t('public.home.title')}</span>
    </div>
  );
}

describe('useTranslation', () => {
  it('throws when called outside an I18nProvider (no implicit global fallback)', () => {
    expect(() => renderHook(() => useTranslation())).toThrow(/I18nProvider.*내부에서만/);
  });

  it('resolves ko messages inside a ko provider', () => {
    render(
      <I18nProvider locale="ko">
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByTestId('locale')).toHaveTextContent('ko');
    expect(screen.getByTestId('title')).toHaveTextContent('공개 웹 홈');
  });

  it('resolves en messages inside an en provider', () => {
    render(
      <I18nProvider locale="en">
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByTestId('title')).toHaveTextContent('Public Home');
  });

  it('interpolates {{param}} placeholders', () => {
    function Interpolated() {
      const { t } = useTranslation();
      return <span data-testid="out">{t('app.journalDetail.title', { id: 'abc-123' })}</span>;
    }
    render(
      <I18nProvider locale="ko">
        <Interpolated />
      </I18nProvider>,
    );
    expect(screen.getByTestId('out')).toHaveTextContent('일지 상세 — abc-123');
  });

  it('syncs document.documentElement.lang to the current locale and updates on change', async () => {
    function Wrapper({ locale }: { locale: 'ko' | 'en' }) {
      return (
        <I18nProvider locale={locale}>
          <Probe />
        </I18nProvider>
      );
    }
    const { rerender } = render(<Wrapper locale="ko" />);
    await waitFor(() => expect(document.documentElement.lang).toBe('ko'));

    rerender(<Wrapper locale="en" />);
    await waitFor(() => expect(document.documentElement.lang).toBe('en'));
  });
});
