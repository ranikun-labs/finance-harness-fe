import { NavLink } from 'react-router';

import { BOTTOM_TABS } from '@/constants/navigation';
import { cn } from '@/lib/utils';

export function BottomNavigation() {
  return (
    <nav
      className="border-border bg-background flex shrink-0 border-t pb-[env(safe-area-inset-bottom)]"
      aria-label="주요 화면 이동"
    >
      {BOTTOM_TABS.map((tab) => (
        <NavLink
          key={tab.id}
          to={tab.path}
          end={tab.end ?? false}
          className={({ isActive }) =>
            cn(
              'relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 text-xs',
              isActive ? 'text-primary font-semibold' : 'text-text-tertiary font-medium',
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  aria-hidden="true"
                  data-testid="bottom-tab-active-indicator"
                  className="bg-primary absolute top-0 h-0.5 w-6 rounded-full"
                />
              )}
              {tab.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
