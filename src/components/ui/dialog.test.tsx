import { fireEvent, render, screen, within } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Dialog } from '@/components/ui/dialog';

// jsdom에는 HTMLDialogElement.showModal이 없어 `open` 속성 폴백 경로를 검증한다.
// 배경 inert·top layer·native ESC·초점 복귀의 실제 브라우저 동작은 e2e/dialog.spec.ts가 검증한다.
function Harness({ destructive = false, onConfirm = vi.fn() }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        열기
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="기록 삭제"
        description="삭제하면 되돌릴 수 없습니다."
        cancelLabel="취소"
        confirmLabel="삭제"
        onConfirm={onConfirm}
        destructive={destructive}
      >
        <input aria-label="사유" />
      </Dialog>
    </>
  );
}

describe('Dialog', () => {
  it('is a labelled dialog with title and description when open', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: '열기' }));
    const dialog = screen.getByRole('dialog', { name: '기록 삭제' });
    expect(dialog).toHaveAccessibleDescription('삭제하면 되돌릴 수 없습니다.');
    expect(dialog.tagName).toBe('DIALOG');
  });

  it('renders nothing visible while closed', () => {
    render(<Harness />);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByText('기록 삭제')).toBeNull();
  });

  it('moves initial focus to the first focusable element for a non-destructive dialog', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: '열기' }));
    expect(screen.getByLabelText('사유')).toHaveFocus();
  });

  it('moves initial focus to Cancel and uses alertdialog for a destructive confirm', () => {
    render(<Harness destructive />);
    fireEvent.click(screen.getByRole('button', { name: '열기' }));
    expect(screen.getByRole('alertdialog', { name: '기록 삭제' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '취소' })).toHaveFocus();
  });

  it('puts Cancel on the left of the confirm action', () => {
    render(<Harness destructive />);
    fireEvent.click(screen.getByRole('button', { name: '열기' }));
    const buttons = within(screen.getByRole('alertdialog')).getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual(['취소', '삭제']);
  });

  it('cycles Tab from the last element to the first and Shift+Tab back', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: '열기' }));
    const dialog = screen.getByRole('dialog');
    const input = screen.getByLabelText('사유');
    const confirm = screen.getByRole('button', { name: '삭제' });

    confirm.focus();
    fireEvent.keyDown(confirm, { key: 'Tab' });
    expect(input).toHaveFocus();

    fireEvent.keyDown(input, { key: 'Tab', shiftKey: true });
    expect(confirm).toHaveFocus();
    expect(dialog).toBeInTheDocument();
  });

  it('closes on ESC and returns focus to the trigger', () => {
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: '열기' });
    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByLabelText('사유'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('closes via Cancel without confirming, and confirm calls onConfirm', () => {
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: '열기' }));
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('locks body scroll while open and restores it on close', () => {
    render(<Harness />);
    document.body.style.overflow = '';
    fireEvent.click(screen.getByRole('button', { name: '열기' }));
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(document.body.style.overflow).toBe('');
  });

  // 폼 안에 렌더돼도 취소·확인이 바깥 폼을 제출하지 않아야 한다(Button은 기본 type을 두지 않음).
  it('does not submit an enclosing form from cancel or confirm', () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Harness />
      </form>,
    );
    fireEvent.click(screen.getByRole('button', { name: '열기' }));
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
