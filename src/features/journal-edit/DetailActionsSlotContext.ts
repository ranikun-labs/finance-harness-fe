import { createContext } from 'react';

/**
 * 기록 상세의 앱바(머리 줄) 오른쪽 행동 자리.
 * - `undefined`: 자리를 제공하지 않는다(단독 렌더·테스트) → 행동은 제자리에 그려진다.
 * - `null`: 자리가 아직 마운트되지 않았다 → 한 프레임 비운다.
 * - 요소: 그 안으로 행동을 옮겨 그린다.
 */
export const DetailActionsSlotContext = createContext<HTMLElement | null | undefined>(undefined);
