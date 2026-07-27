import { APP_ROUTE_PATHS } from '@/constants/routes';

/**
 * 구조적 metadata만 담는다 — 번역된 표시 문구(또는 그 키)는 여기 두지 않는다.
 * label 번역은 `BottomNavigation`이 렌더 시점에 `id`로 조회한다
 * (`src/components/layout/BottomNavigation.tsx`의 `NAV_LABEL_KEY`).
 */
export interface BottomTabConfig {
  id: 'home' | 'ask' | 'journal';
  path: string;
  /** NavLink의 `end`. 홈 탭처럼 하위 경로에서 활성 표시되면 안 되는 탭에 true. */
  end?: boolean;
}

export const BOTTOM_TABS: readonly BottomTabConfig[] = [
  { id: 'home', path: APP_ROUTE_PATHS.appHome, end: true },
  { id: 'ask', path: APP_ROUTE_PATHS.ask },
  { id: 'journal', path: APP_ROUTE_PATHS.journalList },
] as const;
