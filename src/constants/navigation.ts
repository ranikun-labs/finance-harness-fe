import { ROUTE_PATHS } from '@/constants/routes';

export interface BottomTabConfig {
  id: 'home' | 'ask' | 'journal';
  label: string;
  path: string;
}

export const BOTTOM_TABS: readonly BottomTabConfig[] = [
  { id: 'home', label: '홈', path: ROUTE_PATHS.home },
  { id: 'ask', label: '질문', path: ROUTE_PATHS.ask },
  { id: 'journal', label: '기록', path: ROUTE_PATHS.journalList },
] as const;
