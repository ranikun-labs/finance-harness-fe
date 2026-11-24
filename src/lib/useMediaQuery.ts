import { useSyncExternalStore } from 'react';

/**
 * CSS가 아니라 **DOM 순서**가 viewport에 따라 달라져야 할 때만 쓴다(스타일은 CSS가 소유).
 * `matchMedia`가 없는 환경(jsdom 등)에서는 `false`로 시작한다.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return () => undefined;
      }
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia(query).matches,
    () => false,
  );
}
