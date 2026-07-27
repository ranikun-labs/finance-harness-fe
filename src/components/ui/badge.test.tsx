import { readFileSync } from 'node:fs';
import path from 'node:path';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from '@/components/ui/badge';

describe('Badge', () => {
  it('renders arbitrary children as the label', () => {
    render(<Badge>임의의 라벨</Badge>);
    expect(screen.getByText('임의의 라벨')).toBeInTheDocument();
  });

  it.each(['neutral', 'info', 'destructive'] as const)('applies the %s tone', (tone) => {
    render(<Badge tone={tone}>라벨</Badge>);
    expect(screen.getByText('라벨')).toBeInTheDocument();
  });

  it('merges a custom className', () => {
    render(<Badge className="uppercase">라벨</Badge>);
    expect(screen.getByText('라벨').className).toContain('uppercase');
  });

  it('does not import domain constants or i18n (stays a generic visual primitive)', () => {
    const source = readFileSync(path.resolve(__dirname, 'badge.tsx'), 'utf-8');
    const importLines = source
      .split('\n')
      .filter((line) => line.startsWith('import '))
      .join('\n');
    expect(importLines).not.toMatch(/constants\/policy/);
    expect(importLines).not.toMatch(/i18n/);
  });
});
