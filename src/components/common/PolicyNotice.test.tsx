import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PolicyNotice } from '@/components/common/PolicyNotice';

describe('PolicyNotice', () => {
  it('renders without any i18n provider (pure UI shell)', () => {
    // I18nProvider로 감싸지 않는다 — 이 컴포넌트가 번역 훅을 호출하지 않는지 검증한다.
    expect(() => render(<PolicyNotice>정답이 아니라 확인할 항목이에요.</PolicyNotice>)).not.toThrow();
    expect(screen.getByText('정답이 아니라 확인할 항목이에요.')).toBeInTheDocument();
  });

  it('renders the icon and title slots', () => {
    render(
      <PolicyNotice icon={<span data-testid="icon">💡</span>} title="안내">
        본문
      </PolicyNotice>,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('안내')).toBeInTheDocument();
    expect(screen.getByText('본문')).toBeInTheDocument();
  });

  it.each(['neutral', 'destructive'] as const)('applies the %s tone', (tone) => {
    render(<PolicyNotice tone={tone}>본문</PolicyNotice>);
    expect(screen.getByRole('note')).toBeInTheDocument();
  });
});
