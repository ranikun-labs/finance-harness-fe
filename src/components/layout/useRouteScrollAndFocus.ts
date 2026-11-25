import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { useLocation, useNavigationType } from 'react-router';

/** 지연 로딩된 화면의 제목·본문 높이를 기다리는 최대 프레임 수(약 1초). */
const MAX_WAIT_FRAMES = 60;

/** 2-pane 목록에서 행을 눌러 상세로 이동할 때 포커스가 남아 있을 수 있는 영역. */
const LIST_PANE_SELECTOR = '.journal-workspace-list-pane';

const DETAIL_HEADING_SELECTOR = '.journal-workspace-detail-pane h1';

/** 포커스를 새 화면으로 옮겨도 되는 상태인가. 내비 탭 등 main 밖에 있는 포커스는 빼앗지 않는다. */
function mayMoveFocus(main: HTMLElement): boolean {
  const active = document.activeElement;
  if (!active || active === document.body || active === document.documentElement) return true;
  if (!active.isConnected) return true;
  if (!main.contains(active)) return false;
  // 목록 행에서 상세를 고른 경우만 옮긴다. 새 화면이 스스로 맞춘 포커스(복귀 안내 등)는 그대로 둔다.
  return active.closest(LIST_PANE_SELECTOR) !== null;
}

/**
 * 화면(경로)이 바뀔 때 `main`의 스크롤·포커스를 계약대로 처리한다(F3 F-01·F-10, X-04).
 * - 새 화면(PUSH/REPLACE): 스크롤 0, 제목(`h1`)으로 포커스.
 * - 브라우저 뒤로·앞으로(POP): 그 화면을 떠날 때의 스크롤 위치 복원.
 * 첫 마운트는 건드리지 않는다. `main#main`이 화면 사이에 재사용되기 때문에 필요한 처리다.
 */
export function useRouteScrollAndFocus(mainRef: RefObject<HTMLElement | null>) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(new Map<string, number>());
  const currentKey = useRef(location.key);
  const previousScreen = useRef<string | null>(null);
  const isNewScreen = useRef(false);
  const screen = `${location.pathname}${location.search}`;

  // 현재 화면의 스크롤 위치를 계속 기억한다(화면을 떠난 뒤에는 이미 0이라 떠날 때 읽을 수 없다).
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const remember = () => positions.current.set(currentKey.current, main.scrollTop);
    main.addEventListener('scroll', remember, { passive: true });
    return () => main.removeEventListener('scroll', remember);
  }, [mainRef]);

  useLayoutEffect(() => {
    currentKey.current = location.key;
  }, [location.key]);

  // 새 화면(PUSH/REPLACE)은 그릴 때 이미 0이어야 이전 화면의 위치가 한 프레임도 보이지 않는다.
  useLayoutEffect(() => {
    const main = mainRef.current;
    const previous = previousScreen.current;
    previousScreen.current = screen;
    if (!main || previous === null || previous === screen) {
      isNewScreen.current = false;
      return;
    }
    isNewScreen.current = true;
    if (navigationType !== 'POP') main.scrollTop = 0;
  }, [screen, navigationType, mainRef]);

  useEffect(() => {
    const main = mainRef.current;
    if (!main || !isNewScreen.current) return;

    const restoreTo = navigationType === 'POP' ? (positions.current.get(location.key) ?? 0) : 0;
    let frame = 0;
    let raf = 0;
    let scrolled = false;
    let focused = false;

    const step = () => {
      frame += 1;
      if (!scrolled) {
        // 복원할 높이가 아직 없으면(지연 로딩) 프레임을 더 기다린다. 새 화면의 0은 위에서 이미 맞췄다.
        const reachable = main.scrollHeight - main.clientHeight;
        if (restoreTo > 0) main.scrollTop = restoreTo;
        scrolled = restoreTo === 0 || reachable >= restoreTo || frame >= MAX_WAIT_FRAMES;
      }
      if (!focused) {
        // 2-pane에서는 오른쪽 상세의 제목이 우선이다(목록 제목은 그대로 둔다).
        const heading =
          main.querySelector<HTMLElement>(DETAIL_HEADING_SELECTOR) ??
          main.querySelector<HTMLElement>('h1');
        if (heading) {
          if (mayMoveFocus(main)) {
            if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
            heading.focus({ preventScroll: true });
          }
          focused = true;
        } else if (frame >= MAX_WAIT_FRAMES) {
          focused = true;
        }
      }
      if (!(scrolled && focused)) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [screen, location.key, navigationType, mainRef]);
}
