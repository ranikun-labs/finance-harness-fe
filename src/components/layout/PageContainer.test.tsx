import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PageContainer, PAGE_CONTAINER_SIZE_CLASS } from '@/components/layout/PageContainer';
import { Stack } from '@/components/layout/Stack';
import { CONTENT_MAX_WIDTH_PX } from '@/constants/layout';

describe('PageContainer', () => {
  it('encodes the content width contract', () => {
    expect(PAGE_CONTAINER_SIZE_CLASS.reading).toBe(`max-w-[${CONTENT_MAX_WIDTH_PX.reading}px]`);
    expect(PAGE_CONTAINER_SIZE_CLASS.result).toBe(`max-w-[${CONTENT_MAX_WIDTH_PX.result}px]`);
  });

  it('centers a readable host by default and accepts the result size', () => {
    render(
      <>
        <PageContainer data-testid="a" />
        <PageContainer data-testid="b" size="result" className="extra" />
        <PageContainer data-testid="c" size="fluid" />
      </>,
    );
    expect(screen.getByTestId('a')).toHaveClass('mx-auto', 'w-full', 'max-w-[660px]');
    expect(screen.getByTestId('b')).toHaveClass('max-w-[760px]', 'extra');
    expect(screen.getByTestId('c').className).not.toContain('max-w-');
  });
});

describe('Stack', () => {
  it('uses the Foundation spacing scale in a single column', () => {
    render(<Stack data-testid="s" gap="section" />);
    expect(screen.getByTestId('s')).toHaveClass('flex', 'flex-col', 'gap-10');
  });
});
