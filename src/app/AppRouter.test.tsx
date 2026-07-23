import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { AppRouter } from '@/app/AppRouter';

describe('AppRouter', () => {
  it('renders the Home page at /', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRouter />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
  });

  it('renders NotFound for an unknown path', () => {
    render(
      <MemoryRouter initialEntries={['/does-not-exist']}>
        <AppRouter />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: '페이지를 찾을 수 없어요' })).toBeInTheDocument();
  });

  describe('bottom tab visibility', () => {
    const bottomNav = () => screen.queryByRole('navigation', { name: '주요 화면 이동' });

    it.each([
      ['/', 'Home'],
      ['/ask', 'Ask 결과'],
      ['/journal', '기록 목록'],
    ])('shows the bottom tab bar on %s', (path) => {
      render(
        <MemoryRouter initialEntries={[path]}>
          <AppRouter />
        </MemoryRouter>,
      );

      expect(bottomNav()).not.toBeNull();
    });

    it.each([
      ['/onboarding', '온보딩'],
      ['/journal/new?type=investment', '일지 저장 (투자 기록)'],
      ['/journal/sample-id', /일지 상세/],
      ['/journal/sample-id/review', /복기/],
      ['/does-not-exist', '페이지를 찾을 수 없어요'],
    ])('hides the bottom tab bar on %s', (path, heading) => {
      render(
        <MemoryRouter initialEntries={[path]}>
          <AppRouter />
        </MemoryRouter>,
      );

      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
      expect(bottomNav()).toBeNull();
    });
  });
});
