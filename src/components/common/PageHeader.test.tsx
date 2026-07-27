import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PageHeader } from '@/components/common/PageHeader';

describe('PageHeader', () => {
  it('renders the title', () => {
    render(<PageHeader title="일지 상세" backLabel="뒤로가기" />);
    expect(screen.getByRole('heading', { name: '일지 상세' })).toBeInTheDocument();
  });

  it('renders an accessible back action and calls onBack once when clicked', () => {
    const onBack = vi.fn();
    render(<PageHeader title="일지 상세" backLabel="뒤로가기" onBack={onBack} />);

    const backButton = screen.getByRole('button', { name: '뒤로가기' });
    fireEvent.click(backButton);

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('does not render a back button when onBack is not provided', () => {
    render(<PageHeader title="일지 상세" backLabel="뒤로가기" />);
    expect(screen.queryByRole('button', { name: '뒤로가기' })).toBeNull();
  });

  it('renders the trailing slot', () => {
    render(
      <PageHeader
        title="일지 상세"
        backLabel="뒤로가기"
        trailing={<button type="button">더보기</button>}
      />,
    );
    expect(screen.getByRole('button', { name: '더보기' })).toBeInTheDocument();
  });
});
