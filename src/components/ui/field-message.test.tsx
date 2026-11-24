import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FieldMessage } from '@/components/ui/field-message';

describe('FieldMessage', () => {
  it('renders a hint as plain text without an alert role', () => {
    render(<FieldMessage id="h">도움말이에요</FieldMessage>);
    expect(screen.getByText('도움말이에요')).toHaveAttribute('id', 'h');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('announces an error as an alert with an icon plus text (not color alone)', () => {
    render(
      <FieldMessage tone="error" id="e">
        입력해 주세요
      </FieldMessage>,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('입력해 주세요');
    expect(alert).toHaveAttribute('id', 'e');
    expect(alert.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
