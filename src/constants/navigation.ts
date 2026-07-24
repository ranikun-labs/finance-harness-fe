import { APP_ROUTE_PATHS } from '@/constants/routes';

export interface BottomTabConfig {
  id: 'home' | 'ask' | 'journal';
  label: string;
  path: string;
  /** NavLink의 `end`. 홈 탭처럼 하위 경로에서 활성 표시되면 안 되는 탭에 true. */
  end?: boolean;
}

export const BOTTOM_TABS: readonly BottomTabConfig[] = [
  { id: 'home', label: '홈', path: APP_ROUTE_PATHS.appHome, end: true },
  { id: 'ask', label: '질문', path: APP_ROUTE_PATHS.ask },
  { id: 'journal', label: '기록', path: APP_ROUTE_PATHS.journalList },
] as const;
