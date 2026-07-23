import { Outlet } from 'react-router';

import { BottomNavigation } from '@/components/layout/BottomNavigation';

/** 본문(스크롤 가능)과 하단 탭바(고정)의 스크롤 책임을 분리하는 레이아웃. */
export function TabLayout() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
}
