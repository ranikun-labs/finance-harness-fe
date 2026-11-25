import { CircleCheckBig, NotebookText } from 'lucide-react';
import { useEffect, useRef, type RefObject } from 'react';
import { Link, matchPath, useLocation } from 'react-router';

import { BOTTOM_TABS, type BottomTabConfig } from '@/constants/navigation';
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

export type NavFocusMemory = RefObject<BottomTabConfig['id'] | null>;

/**
 * `focusMemory`: 768 경계(회전·리사이즈)에서 TabLayout이 내비를 다른 DOM 위치(본문 앞/뒤)로
 * 다시 마운트할 때, 직전에 포커스가 내비 링크에 있었다면 새 인스턴스에서 같은 탭으로 복원한다.
 * DOM 순서 = 시각 순서 계약 때문에 remount 자체는 피할 수 없어, 유실만 완화한다.
 */
export function BottomNavigation({
  focusMemory,
  placement,
}: {
  focusMemory?: NavFocusMemory;
  /**
   * `'header'`: 상단 내비 viewport에서 앱 헤더 안(제품 이름과 로그인 사이)에 놓이는 한 줄 셸용.
   * 자체 막대(테두리·높이)를 갖지 않고 헤더 줄을 그대로 쓴다. 생략하면 viewport별 기본 배치
   * (폰 하단 탭 · 태블릿 단독 상단 막대 · rail)다.
   */
  placement?: 'header';
}) {
  const inHeader = placement === 'header';
  const rootRef = useRef<HTMLElement>(null);
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const mobileVisible =
    pathname === APP_ROUTE_PATHS.appHome || pathname === APP_ROUTE_PATHS.journalList;
  const isJournalRoute =
    pathname === APP_ROUTE_PATHS.journalList ||
    pathname === APP_ROUTE_PATHS.journalNew ||
    matchPath({ path: APP_ROUTE_PATHS.journalDetail, end: true }, pathname) !== null ||
    matchPath({ path: APP_ROUTE_PATHS.journalReview, end: true }, pathname) !== null;
  const activeTab: BottomTabConfig['id'] = isJournalRoute ? 'journal' : 'review';

  useEffect(() => {
    const remembered = focusMemory?.current;
    if (!remembered) return;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    rootRef.current?.querySelector<HTMLElement>(`[data-nav-tab="${remembered}"]`)?.focus();
  }, [focusMemory]);

  return (
    <nav
      ref={rootRef}
      className={cn(
        inHeader
          ? 'flex shrink-0 items-center'
          : [
              'adaptive-primary-navigation border-border bg-background shrink-0',
              'order-2 border-t pb-[env(safe-area-inset-bottom)]',
              'md:order-1 md:min-h-16 md:items-center md:justify-end md:border-t-0 md:border-b md:px-6 md:py-1',
              'lg:h-full lg:w-56 lg:flex-col lg:items-stretch lg:justify-start lg:border-r lg:border-b-0 lg:px-4 lg:py-5',
              mobileVisible ? 'flex' : 'hidden md:flex',
            ],
      )}
      aria-label={t('nav.ariaLabel')}
      data-testid="primary-navigation"
    >
      <div
        className={cn(
          inHeader
            ? 'bg-muted flex w-auto rounded-xl p-1'
            : 'md:bg-muted flex w-full md:w-auto md:rounded-xl md:p-1 lg:w-full lg:flex-col lg:gap-1 lg:bg-transparent lg:p-0',
        )}
      >
        {BOTTOM_TABS.map((tab) => (
          <Link
            key={tab.id}
            to={tab.path}
            data-nav-tab={tab.id}
            onFocus={() => {
              if (focusMemory) focusMemory.current = tab.id;
            }}
            onBlur={(event) => {
              // 다른 요소로 포커스가 옮겨간 경우만 기억을 지운다(요소 제거에 의한 blur는 relatedTarget이 없다).
              if (focusMemory && event.relatedTarget) focusMemory.current = null;
            }}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            className={cn(
              'relative flex items-center justify-center rounded-lg',
              inHeader
                ? 'min-h-11 flex-none flex-row gap-1 px-5 py-0 text-sm'
                : [
                    'min-h-[56px] flex-1 flex-col gap-1 py-2 text-xs',
                    'md:min-h-11 md:flex-none md:flex-row md:px-5 md:py-0 md:text-sm',
                    'lg:min-h-11 lg:w-full lg:justify-start lg:gap-3 lg:px-3',
                  ],
              activeTab === tab.id
                ? [
                    'text-primary font-semibold',
                    inHeader
                      ? 'bg-background shadow-sm'
                      : 'bg-primary/10 md:bg-background lg:bg-primary/10 md:shadow-sm lg:shadow-none',
                  ]
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
              return (
                <Icon
                  aria-hidden="true"
                  className={inHeader ? 'size-4' : 'size-5 md:size-4'}
                  strokeWidth={2}
                />
              );
            })()}
            <span>{t(NAV_LABEL_KEY[tab.id])}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
