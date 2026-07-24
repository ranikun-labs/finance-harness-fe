import { NavLink } from 'react-router';

import { BOTTOM_TABS, type BottomTabConfig } from '@/constants/navigation';
import type { MessageKey } from '@/i18n/dictionary';
import { useTranslation } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';

/**
 * 번역 키 조회는 렌더 지점(여기)의 책임이다 — `navigation.ts`에는 번역된 문구나
 * 키를 두지 않는다.
 */
const NAV_LABEL_KEY: Record<BottomTabConfig['id'], MessageKey> = {
  home: 'nav.home',
  ask: 'nav.ask',
  journal: 'nav.journal',
};

export function BottomNavigation() {
  const { t } = useTranslation();
  return (
    <nav
      className="border-border bg-background flex shrink-0 border-t pb-[env(safe-area-inset-bottom)]"
      aria-label={t('nav.ariaLabel')}
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
              {t(NAV_LABEL_KEY[tab.id])}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
