import { Outlet } from 'react-router';

/** 데스크톱에서 앱 프레임을 중앙 정렬할 때 쓰는 단일 max-width 토큰. */
export const APP_FRAME_MAX_WIDTH = '480px';

export function AppShell() {
  return (
    <div className="bg-muted flex min-h-dvh w-full justify-center overflow-x-hidden">
      <div
        className="bg-background flex min-h-dvh w-full flex-col overflow-x-hidden pt-[env(safe-area-inset-top)]"
        style={{ maxWidth: APP_FRAME_MAX_WIDTH }}
      >
        <Outlet />
      </div>
    </div>
  );
}
