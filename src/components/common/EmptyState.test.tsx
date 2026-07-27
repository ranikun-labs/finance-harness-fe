import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EmptyState } from '@/components/common/EmptyState';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="아직 저장된 기록이 없어요" description="첫 기록을 남겨보세요." />);
    expect(screen.getByText('아직 저장된 기록이 없어요')).toBeInTheDocument();
    expect(screen.getByText('첫 기록을 남겨보세요.')).toBeInTheDocument();
  });

  it('renders the icon and action slots', () => {
    render(
      <EmptyState
        icon={<span data-testid="icon">✦</span>}
        title="아직 저장된 기록이 없어요"
        action={<button type="button">질문하러 가기</button>}
      />,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '질문하러 가기' })).toBeInTheDocument();
  });

  it('does not render an empty action container when action is omitted', () => {
    const { container } = render(<EmptyState title="아직 저장된 기록이 없어요" />);
    expect(container.querySelectorAll('button')).toHaveLength(0);
    // title/description 그룹 다음에 action용 빈 wrapper가 추가되지 않아야 한다.
    expect(container.firstElementChild?.children).toHaveLength(1);
  });
});
