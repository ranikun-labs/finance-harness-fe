import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '@/components/ui/button';

describe('Button', () => {
  it.each(['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const)(
    'renders the %s variant',
    (variant) => {
      render(<Button variant={variant}>Action</Button>);
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    },
  );

  it.each(['default', 'sm', 'lg', 'icon'] as const)('renders the %s size', (size) => {
    render(
      <Button size={size} aria-label="Action">
        {size === 'icon' ? '✓' : 'Action'}
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('is disabled and non-interactive when disabled is set', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Action
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Action' });
    expect(button).toBeDisabled();
    expect(button.className).toContain('disabled:pointer-events-none');
  });

  it('keeps the focus-visible ring contract on the base class', () => {
    render(<Button>Action</Button>);
    const button = screen.getByRole('button', { name: 'Action' });
    expect(button.className).toContain('focus-visible:ring-ring/50');
  });

  it('merges a custom className without dropping variant classes', () => {
    render(<Button className="w-full">Action</Button>);
    const button = screen.getByRole('button', { name: 'Action' });
    expect(button.className).toContain('w-full');
    expect(button.className).toContain('bg-primary');
  });

  // 디자인 원본(design/claude-export/project/디자인 시스템.dc.html) 기준 높이·글자 크기 회귀.
  it.each([
    ['sm', 'h-9', 'text-[13px]'],
    ['default', 'h-[46px]', 'text-[15px]'],
    ['lg', 'h-[54px]', 'text-[17px]'],
  ] as const)('matches the design scale for the %s size', (size, heightClass, textClass) => {
    render(
      <Button size={size} aria-label="Action">
        Action
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Action' });
    expect(button.className).toContain(heightClass);
    expect(button.className).toContain(textClass);
  });
});
