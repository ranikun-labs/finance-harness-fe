import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Checkbox } from '@/components/ui/checkbox';

describe('Checkbox', () => {
  it('is a native checkbox named by its label', () => {
    render(<Checkbox label="약관에 동의" />);
    const box = screen.getByRole('checkbox', { name: '약관에 동의' });
    expect(box.tagName).toBe('INPUT');
    expect(box).toHaveAttribute('type', 'checkbox');
  });

  // Space 키 토글은 브라우저 기본 동작(native input)이라 jsdom에서 재현되지 않는다 — 라벨 클릭만 검증.
  it('toggles when the label text is clicked and is keyboard-focusable', () => {
    const onChange = vi.fn();
    render(<Checkbox label="확인" onChange={onChange} />);
    const box = screen.getByRole('checkbox', { name: '확인' });

    fireEvent.click(screen.getByText('확인'));
    expect(box).toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(1);

    box.focus();
    expect(box).toHaveFocus();
    expect(box).not.toHaveAttribute('tabindex', '-1');
  });

  it('links the description with aria-describedby', () => {
    render(<Checkbox label="알림" description="매일 한 번" />);
    expect(screen.getByRole('checkbox', { name: '알림' })).toHaveAccessibleDescription(
      '매일 한 번',
    );
  });

  it('is natively disabled (not focusable, skipped by Tab)', () => {
    render(<Checkbox label="잠금" disabled />);
    const box = screen.getByRole('checkbox', { name: '잠금' });
    expect(box).toBeDisabled();
  });
});
