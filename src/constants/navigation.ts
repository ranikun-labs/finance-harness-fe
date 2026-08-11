import { APP_ROUTE_PATHS } from '@/constants/routes';

/**
 * 구조적 metadata만 담는다 — 번역된 표시 문구(또는 그 키)는 여기 두지 않는다.
 * label 번역은 `BottomNavigation`이 렌더 시점에 `id`로 조회한다
 * (`src/components/layout/BottomNavigation.tsx`의 `NAV_LABEL_KEY`).
 */
export interface BottomTabConfig {
  id: 'review' | 'journal';
  path: string;
}

export const BOTTOM_TABS: readonly BottomTabConfig[] = [
  { id: 'review', path: APP_ROUTE_PATHS.appHome },
  { id: 'journal', path: APP_ROUTE_PATHS.journalList },
] as const;
