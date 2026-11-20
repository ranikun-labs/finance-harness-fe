import { useCallback, useMemo, useState } from 'react';
import { matchPath, Outlet, useLocation } from 'react-router';

import { APP_ROUTE_PATHS, getAppJournalRouteKind } from '@/constants/routes';
import { useTranslation } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { JournalListPage } from '@/pages/JournalListPage';

/**
 * Shared List | Detail presentation for landscape/tablet-wide surfaces. The route
 * still owns the actual Detail element, so direct links and refreshes remain safe.
 */
export function JournalWorkspace() {
  const { pathname, key } = useLocation();
  const [selectionState, setSelectionState] = useState({ key, available: false });
  const setHasSelectableRecords = useCallback(
    (available: boolean) => setSelectionState({ key, available }),
    [key],
  );
  const outletContext = useMemo(() => ({ setHasSelectableRecords }), [setHasSelectableRecords]);
  const hasSelectableRecords = selectionState.key === key && selectionState.available;
  const { t } = useTranslation();
  const routeKind = getAppJournalRouteKind(pathname);
  const isDetailRoute = routeKind === 'detail';
  const detailMatch = isDetailRoute
    ? matchPath({ path: APP_ROUTE_PATHS.journalDetail, end: true }, pathname)
    : null;
  const selectedId = detailMatch?.params.id;

  return (
    <div
      className={cn('journal-workspace', isDetailRoute && 'is-detail-route', !isDetailRoute && !hasSelectableRecords && 'is-list-only')}
      data-testid="journal-workspace"
    >
      <aside
        className="journal-workspace-list-pane min-w-0"
        aria-label={t('app.journalWorkspace.listPaneLabel')}
      >
        {isDetailRoute ? (
          <JournalListPage selectedId={selectedId} />
        ) : (
          <Outlet context={outletContext} />
        )}
      </aside>

      <section
        className="journal-workspace-detail-pane min-w-0"
        aria-label={t('app.journalWorkspace.detailPaneLabel')}
      >
        {isDetailRoute ? (
          <Outlet />
        ) : hasSelectableRecords ? (
          <div className="flex min-h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <h2 className="text-foreground text-lg font-bold">
              {t('app.journalWorkspace.detailPrompt.heading')}
            </h2>
            <p className="text-muted-foreground max-w-sm text-sm leading-6">
              {t('app.journalWorkspace.detailPrompt.description')}
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
