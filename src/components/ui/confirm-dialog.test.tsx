import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';

function setup(destructive?: boolean) {
  const onStay = vi.fn();
  const onConfirm = vi.fn();
  render(
    <ConfirmDialog
      open
      title="작성 중인 내용이 사라져요"
      description="지금 나가면 다시 볼 수 없어요."
      stayLabel="계속 작성"
      confirmLabel="나가기"
      onStay={onStay}
      onConfirm={onConfirm}
      destructive={destructive}
    />,
  );
  return { onStay, onConfirm };
}

describe('ConfirmDialog', () => {
  it('기본은 파괴적 확인이다: alertdialog, 초기 포커스는 머무르는 쪽', () => {
    setup();
    const dialog = screen.getByRole('alertdialog', { name: '작성 중인 내용이 사라져요' });
    expect(dialog).toHaveAccessibleDescription('지금 나가면 다시 볼 수 없어요.');
    expect(screen.getByRole('button', { name: '계속 작성' })).toHaveFocus();
  });

  it('머무르기와 확인이 각각 콜백을 부른다', () => {
    const { onStay, onConfirm } = setup();
    fireEvent.click(screen.getByRole('button', { name: '계속 작성' }));
    expect(onStay).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: '나가기' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('파괴적이지 않으면 일반 dialog다', () => {
    setup(false);
    expect(screen.getByRole('dialog', { name: '작성 중인 내용이 사라져요' })).toBeInTheDocument();
  });
});
