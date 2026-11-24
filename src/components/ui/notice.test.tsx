import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';

describe('Notice', () => {
  it('is a static note by default with no icon', () => {
    const { container } = render(<Notice>정책 안내예요</Notice>);
    const note = screen.getByRole('note');
    expect(note).toHaveTextContent('정책 안내예요');
    expect(note).toHaveClass('bg-inset');
    expect(container.querySelector('svg')).toBeNull();
  });

  it.each([
    ['info', 'status'],
    ['success', 'status'],
    ['conflict', 'status'],
    ['warning', 'alert'],
    ['danger', 'alert'],
  ] as const)('maps tone %s to role %s with a decorative icon', (tone, role) => {
    const { container } = render(
      <Notice tone={tone} title="제목">
        본문
      </Notice>,
    );
    const el = screen.getByRole(role);
    expect(el).toHaveAttribute('data-tone', tone);
    expect(el).toHaveTextContent('제목');
    expect(container.querySelector('svg')?.parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('has no border or shadow classes and allows an action and a custom icon', () => {
    render(
      <Notice tone="info" icon={<span data-testid="i">i</span>} action={<Button>확인</Button>}>
        본문
      </Notice>,
    );
    const el = screen.getByRole('status');
    expect(el.className).not.toMatch(/border|shadow/);
    expect(screen.getByTestId('i')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
  });

  it('can hide the default icon with icon={null}', () => {
    const { container } = render(
      <Notice tone="warning" icon={null}>
        본문
      </Notice>,
    );
    expect(container.querySelector('svg')).toBeNull();
  });
});
