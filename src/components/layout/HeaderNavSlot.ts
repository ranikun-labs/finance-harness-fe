import { createContext, useContext } from 'react';

/**
 * 앱 헤더 안의 내비 자리(DOM 노드). 상단 내비 viewport(태블릿)에서 `TabLayout`이 primary
 * navigation을 이 자리로 옮겨 제품 이름 · 내비 · 로그인을 한 줄에 놓는다. 헤더가 없는 환경
 * (단독 렌더 등)에서는 `null`이라 내비는 제자리(본문 앞)에 그대로 렌더된다.
 */
export const HeaderNavSlotContext = createContext<HTMLElement | null>(null);

export const useHeaderNavSlot = () => useContext(HeaderNavSlotContext);
