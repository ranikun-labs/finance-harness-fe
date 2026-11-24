import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '@/components/ui/button';

describe('Button', () => {
  it.each([
    'strong',
    'subtle',
    'neutral',
    'text',
    'text-neutral',
    'danger-text',
    'danger-strong',
    // 호환 alias
    'default',
    'destructive',
    'outline',
    'secondary',
    'ghost',
    'link',
  ] as const)('renders the %s variant', (variant) => {
    render(<Button variant={variant}>Action</Button>);
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

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

  it('does not suppress the global focus-visible outline', () => {
    render(<Button>Action</Button>);
    const button = screen.getByRole('button', { name: 'Action' });
    // 전역 :focus-visible(2px brand + offset 2)을 쓰므로 outline을 끄지 않는다.
    expect(button.className).not.toContain('outline-none');
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
    ['default', 'h-12', 'text-[15px]'],
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

  it('keeps the alias variants visually identical to their Foundation emphasis', () => {
    const classesOf = (variant: 'strong' | 'default' | 'danger-strong' | 'destructive') => {
      const { unmount } = render(<Button variant={variant}>V</Button>);
      const value = screen.getByRole('button', { name: 'V' }).className;
      unmount();
      return value;
    };
    expect(classesOf('default')).toBe(classesOf('strong'));
    expect(classesOf('destructive')).toBe(classesOf('danger-strong'));
  });

  it('gives the small button a 44px interaction area (36 visual + ::after, min width 44)', () => {
    render(<Button size="sm">Small</Button>);
    const { className } = screen.getByRole('button', { name: 'Small' });
    expect(className).toContain('h-9');
    expect(className).toContain('after:-inset-y-1');
    expect(className).toContain('min-w-11');
  });

  it('uses 44px for the icon button touch target', () => {
    render(<Button size="icon" aria-label="Icon" />);
    expect(screen.getByRole('button', { name: 'Icon' }).className).toContain('size-11');
  });

  it('does not add a default type (submit behaviour of existing callers is unchanged)', () => {
    render(<Button>Action</Button>);
    expect(screen.getByRole('button', { name: 'Action' })).not.toHaveAttribute('type');
  });
});
