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
});
