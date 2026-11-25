import { useCallback, useEffect, useRef } from 'react';
import { useBlocker, type BlockerFunction } from 'react-router';

export type LeaveGuardWhen = boolean | (() => boolean);

/**
 * 입력이 남아 있을 때 화면 이탈을 막는다(F3 X-03). React Router `useBlocker`로 내비·링크·
 * 브라우저 뒤로/앞으로 가기를 한 경로로 잡는다. 같은 주소로의 이동(상태만 바뀌는 replace)은 막지 않는다.
 *
 * `when`을 함수로 주면 이동 시점의 값을 읽는다 — 저장 직후의 이동처럼 렌더가 따라오기 전에
 * 보호를 풀어야 할 때(ref 읽기) 쓴다.
 *
 * `useBlocker`는 data router(`createBrowserRouter`·`createMemoryRouter`)에서만 동작한다.
 * 앱은 `main.tsx`가 data router로 연다. 그렇지 않은 라우터(StaticRouter 등)에서는 `LeaveGuard`가 아무것도 하지 않는다.
 */
export function useLeaveGuard(when: LeaveGuardWhen) {
  const whenRef = useRef(when);
  useEffect(() => {
    whenRef.current = when;
  }, [when]);

  const shouldBlock = useCallback<BlockerFunction>(({ currentLocation, nextLocation }) => {
    const active = typeof whenRef.current === 'function' ? whenRef.current() : whenRef.current;
    if (!active) return false;
    return (
      currentLocation.pathname !== nextLocation.pathname ||
      currentLocation.search !== nextLocation.search
    );
  }, []);

  const blocker = useBlocker(shouldBlock);
  return {
    blocked: blocker.state === 'blocked',
    /** 계속 작성. 이동을 취소하고 입력·포커스는 그대로 둔다. */
    stay: () => blocker.state === 'blocked' && blocker.reset(),
    /** 나가기. 막아 둔 이동을 이어서 진행한다. */
    leave: () => blocker.state === 'blocked' && blocker.proceed(),
  };
}
