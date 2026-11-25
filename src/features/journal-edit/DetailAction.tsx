import { useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { DetailActionsSlotContext } from './DetailActionsSlotContext';

/** 수정·삭제처럼 상세 앱바에 놓이는 텍스트 행동. 상태·핸들러는 호출한 컴포넌트가 그대로 소유한다. */
export function DetailAction({ children }: { children: ReactNode }) {
  const slot = useContext(DetailActionsSlotContext);
  if (slot === undefined) return <>{children}</>;
  if (slot === null) return null;
  return createPortal(children, slot);
}
