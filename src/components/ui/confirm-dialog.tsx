import * as React from 'react';

import { Dialog } from '@/components/ui/dialog';

type ConfirmDialogProps = {
  open: boolean;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** 머무르는 쪽(취소·ESC). 열릴 때 초기 포커스가 여기에 간다. */
  stayLabel: string;
  /** 진행하는 쪽. 되돌릴 수 없는 결과면 `destructive`로 위험색 확인 버튼이 된다. */
  confirmLabel: string;
  onStay: () => void;
  onConfirm: () => void;
  destructive?: boolean;
};

/**
 * 이탈·되돌릴 수 없는 행동 앞의 확인 Dialog(F3 X-03). 새 컴포넌트가 아니라 공통 `Dialog`의
 * 확인 전용 모양이다 — 포커스 순환·복귀·ESC·스크롤 잠금은 `Dialog`가 보장한다.
 * 파괴적일 때는 안전한 쪽(머무르기)이 초기 포커스를 받아 Enter 한 번으로 데이터를 잃지 않는다.
 */
function ConfirmDialog({
  open,
  title,
  description,
  stayLabel,
  confirmLabel,
  onStay,
  onConfirm,
  destructive = true,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onStay}
      title={title}
      description={description}
      cancelLabel={stayLabel}
      confirmLabel={confirmLabel}
      onConfirm={onConfirm}
      destructive={destructive}
    />
  );
}

export { ConfirmDialog };
