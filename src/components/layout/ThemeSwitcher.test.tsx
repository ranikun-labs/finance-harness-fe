import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import { I18nProvider } from '@/i18n/I18nContext';
import { THEME_STORAGE_KEY, initTheme } from '@/theme/theme';

let stop: () => void;

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.className = '';
  stop = initTheme();
});
afterEach(() => {
  stop();
  vi.restoreAllMocks();
});

function setup(locale: 'ko' | 'en' = 'ko') {
  return render(
    <I18nProvider locale={locale}>
      <input aria-label="draft" />
      <ThemeSwitcher />
    </I18nProvider>,
  );
}

describe('ThemeSwitcher', () => {
  it('shows the current preference in the trigger name and offers three modes', () => {
    setup();
    const trigger = screen.getByRole('button', { name: /화면 모드, 현재: 시스템 설정 따름/ });
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: '화면 모드' });
    const radios = within(dialog).getAllByRole('radio');
    expect(radios.map((r) => (r as HTMLInputElement).value)).toEqual(['system', 'light', 'dark']);
    expect(within(dialog).getByRole('radio', { name: /시스템 설정 따름/ })).toBeChecked();
    // 문구는 실제 동작(이 브라우저에만 저장)만 말한다.
    expect(dialog).toHaveTextContent('이 기기의 이 브라우저에만 저장돼요');
  });

  it('applies immediately, persists locally, and keeps unrelated page state', () => {
    setup();
    fireEvent.change(screen.getByLabelText('draft'), { target: { value: '작성 중인 내용' } });
    fireEvent.click(screen.getByTestId('theme-trigger'));
    fireEvent.click(screen.getByRole('radio', { name: '다크' }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(screen.getByLabelText('draft')).toHaveValue('작성 중인 내용');

    fireEvent.click(screen.getByRole('radio', { name: '라이트' }));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    fireEvent.click(screen.getByRole('radio', { name: /시스템 설정 따름/ }));
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('tells the user when saving is blocked, while still applying', () => {
    setup();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    fireEvent.click(screen.getByTestId('theme-trigger'));
    fireEvent.click(screen.getByRole('radio', { name: '다크' }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(screen.getByRole('status')).toHaveTextContent('지금 화면에만 적용');
  });

  it('renders English copy', () => {
    setup('en');
    fireEvent.click(screen.getByRole('button', { name: /Appearance, Current: Follow system/ }));
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeInTheDocument();
  });
});
