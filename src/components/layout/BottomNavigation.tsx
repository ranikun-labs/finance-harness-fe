import { CircleCheckBig, NotebookText } from 'lucide-react';
import { Link, matchPath, useLocation } from 'react-router';

import { BOTTOM_TABS, type BottomTabConfig } from '@/constants/navigation';
import { useRetrospectiveDraft } from '@/components/layout/RetrospectiveDraftContext';
import { APP_ROUTE_PATHS } from '@/constants/routes';
import type { MessageKey } from '@/i18n/dictionary';
import { useTranslation } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';

/**
 * 번역 키 조회는 렌더 지점(여기)의 책임이다 — `navigation.ts`에는 번역된 문구나
 * 키를 두지 않는다.
 */
const NAV_LABEL_KEY: Record<BottomTabConfig['id'], MessageKey> = {
  review: 'nav.review',
  journal: 'nav.journal',
};

const NAV_ICON = {
  review: CircleCheckBig,
  journal: NotebookText,
} satisfies Record<BottomTabConfig['id'], typeof CircleCheckBig>;

export function BottomNavigation() {
  const { t, locale } = useTranslation();
  const { dirty } = useRetrospectiveDraft();
  const { pathname } = useLocation();
  const mobileVisible =
    pathname === APP_ROUTE_PATHS.appHome || pathname === APP_ROUTE_PATHS.journalList;
  const isJournalRoute =
    pathname === APP_ROUTE_PATHS.journalList ||
    pathname === APP_ROUTE_PATHS.journalNew ||
    matchPath({ path: APP_ROUTE_PATHS.journalDetail, end: true }, pathname) !== null ||
    matchPath({ path: APP_ROUTE_PATHS.journalReview, end: true }, pathname) !== null;
  const activeTab: BottomTabConfig['id'] = isJournalRoute ? 'journal' : 'review';

  return (
    <nav
      className={cn(
        'adaptive-primary-navigation border-border bg-background shrink-0',
        'order-2 border-t pb-[env(safe-area-inset-bottom)]',
        'md:order-1 md:min-h-16 md:items-center md:justify-end md:border-t-0 md:border-b md:px-6 md:py-2',
        'lg:h-full lg:w-56 lg:flex-col lg:items-stretch lg:justify-start lg:border-r lg:border-b-0 lg:px-4 lg:py-5',
        mobileVisible ? 'flex' : 'hidden md:flex',
      )}
      aria-label={t('nav.ariaLabel')}
      data-testid="primary-navigation"
    >
      <div className="md:bg-muted flex w-full md:w-auto md:rounded-xl md:p-1 lg:w-full lg:flex-col lg:gap-1 lg:bg-transparent lg:p-0">
        {BOTTOM_TABS.map((tab) => (
          <Link
            key={tab.id}
            to={tab.path}
            onClick={(event) => {
              if (
                !dirty ||
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey ||
                (event.currentTarget.target && event.currentTarget.target !== '_self')
              )
                return;
              if (
                !window.confirm(
                  locale === 'ko'
                    ? '작성 중인 내용이 사라집니다. 이동할까요?'
                    : 'Your unsaved work will be lost. Leave this page?',
                )
              )
                event.preventDefault();
            }}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            className={cn(
              'relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 text-xs',
              'focus-visible:ring-ring/50 rounded-lg outline-none focus-visible:ring-3',
              'md:min-h-10 md:flex-none md:flex-row md:px-5 md:py-0 md:text-sm',
              'lg:min-h-11 lg:w-full lg:justify-start lg:gap-3 lg:px-3',
              activeTab === tab.id
                ? 'text-primary bg-primary/10 md:bg-background lg:bg-primary/10 font-semibold md:shadow-sm lg:shadow-none'
                : 'text-text-tertiary font-medium',
            )}
          >
            {activeTab === tab.id && (
              <span
                aria-hidden="true"
                data-testid="bottom-tab-active-indicator"
                className="bg-primary absolute top-0 h-0.5 w-6 rounded-full md:hidden"
              />
            )}
            {(() => {
              const Icon = NAV_ICON[tab.id];
              return <Icon aria-hidden="true" className="size-5 md:size-4" strokeWidth={2} />;
            })()}
            <span>{t(NAV_LABEL_KEY[tab.id])}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
