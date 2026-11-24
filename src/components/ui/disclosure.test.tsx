import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Disclosure } from '@/components/ui/disclosure';

describe('Disclosure', () => {
  it('renders a native details whose summary text is the visible label', () => {
    const { container } = render(<Disclosure summary="선택 항목">본문</Disclosure>);
    const details = container.querySelector('details');
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute('open');
    expect(details!.querySelector('summary')).toHaveTextContent('선택 항목');
  });

  it('can start open and forwards summary clicks', () => {
    const onSummaryClick = vi.fn();
    const { container } = render(
      <Disclosure open summary="자세히 보기" onSummaryClick={onSummaryClick}>
        본문
      </Disclosure>,
    );
    expect(container.querySelector('details')).toHaveAttribute('open');
    fireEvent.click(screen.getByText('자세히 보기'));
    expect(onSummaryClick).toHaveBeenCalledTimes(1);
  });

  it('separates with hairlines instead of a box (no rounded border, no shadow)', () => {
    const { container } = render(<Disclosure summary="구분">본문</Disclosure>);
    const classes = container.querySelector('details')!.className;
    expect(classes).toContain('border-y');
    expect(classes).not.toMatch(/rounded|shadow|ring/);
  });
});
