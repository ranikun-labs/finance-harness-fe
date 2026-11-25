import { useSyncExternalStore } from 'react';

import {
  getResolvedTheme,
  getThemePreference,
  setThemePreference,
  subscribeTheme,
  type ResolvedTheme,
  type ThemePreference,
} from '@/theme/theme';

/** 화면 모드 선택과 현재 적용 결과. 시스템 설정 변화도 구독해 `resolved`가 즉시 따라간다. */
export function useTheme(): {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: typeof setThemePreference;
} {
  const preference = useSyncExternalStore(
    subscribeTheme,
    getThemePreference,
    () => 'system' as const,
  );
  const resolved = useSyncExternalStore(subscribeTheme, getResolvedTheme, () => 'light' as const);
  return { preference, resolved, setPreference: setThemePreference };
}
