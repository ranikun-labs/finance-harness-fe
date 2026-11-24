import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TextField } from '@/components/ui/text-field';

describe('TextField', () => {
  it('connects the label to a single-line input', () => {
    render(<TextField label="이름" />);
    const input = screen.getByRole('textbox', { name: '이름' });
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('renders a textarea when multiline', () => {
    render(<TextField multiline rows={4} label="질문" />);
    const field = screen.getByRole('textbox', { name: '질문' });
    expect(field.tagName).toBe('TEXTAREA');
    expect(field).toHaveAttribute('rows', '4');
  });

  it('describes the field by its hint when there is no error', () => {
    render(<TextField id="q" label="질문" hint="한 줄로 적어 주세요" />);
    const input = screen.getByRole('textbox', { name: '질문' });
    expect(input).toHaveAttribute('aria-describedby', 'q-hint');
    expect(input).toHaveAccessibleDescription('한 줄로 적어 주세요');
  });

  it('marks the field invalid and points the description at the error alert', () => {
    render(<TextField id="q" label="질문" hint="한 줄로 적어 주세요" error="입력해 주세요" />);
    const input = screen.getByRole('textbox', { name: '질문' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'q-error');
    expect(screen.getByRole('alert')).toHaveTextContent('입력해 주세요');
    // 도움말은 오류 중에도 계속 보인다.
    expect(screen.getByText('한 줄로 적어 주세요')).toBeVisible();
  });

  it('generates a stable id when none is given and keeps label/description wired', () => {
    render(<TextField label="메모" hint="선택" />);
    const input = screen.getByRole('textbox', { name: '메모' });
    expect(input.id).not.toBe('');
    expect(input.getAttribute('aria-describedby')).toBe(`${input.id}-hint`);
  });

  it('uses the surface fill tokens, not background/muted', () => {
    const { rerender } = render(<TextField label="a" />);
    expect(screen.getByRole('textbox')).toHaveClass('bg-card');
    rerender(<TextField label="a" fill="inset" />);
    expect(screen.getByRole('textbox')).toHaveClass('bg-inset');
    expect(screen.getByRole('textbox')).not.toHaveClass('bg-background', 'bg-muted');
  });

  it('passes native props through and stays keyboard-focusable', () => {
    const onChange = vi.fn();
    render(<TextField label="이름" placeholder="홍길동" onChange={onChange} disabled={false} />);
    const input = screen.getByRole('textbox', { name: '이름' });
    expect(input).toHaveAttribute('placeholder', '홍길동');
    fireEvent.change(input, { target: { value: 'x' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    input.focus();
    expect(input).toHaveFocus();
  });
});
