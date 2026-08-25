import { useEffect } from 'react';
import { useLocation } from 'react-router';

import {
  APP_BASE,
  APP_ROUTE_PATHS,
  AUTH_ROUTE_PATHS,
  buildFeaturesPath,
  buildLearnPath,
  buildLocaleHomePath,
  getAppJournalRouteKind,
  type Locale,
} from '@/constants/routes';
import { resolveJournalType } from '@/features/journal-new/model/journalType';
import { useTranslation } from '@/i18n/I18nContext';
import { getMessages } from '@/i18n/dictionary';

/**
 * Client and pre-render title consumers share this route-to-existing-copy mapping.
 * It deliberately returns the same wording already used by headings/navigation;
 * this is route metadata, not a new product-copy surface.
 */
export function getDocumentTitle(pathname: string, locale: Locale, search = ''): string {
  const messages = getMessages(locale);
  const normalizedPathname = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

  if (normalizedPathname === buildLocaleHomePath(locale)) return messages.public.home.title;
  if (normalizedPathname === buildFeaturesPath(locale)) return messages.public.features.title;

  const learnPath = buildLearnPath(locale);
  if (normalizedPathname === learnPath || normalizedPathname.startsWith(`${learnPath}/`)) {
    return messages.public.learn.title;
  }

  if (normalizedPathname === AUTH_ROUTE_PATHS.entry) return messages.auth.entry.heading;
  if (normalizedPathname === APP_ROUTE_PATHS.appHome) return messages.app.home.hero.heading;
  if (normalizedPathname === APP_ROUTE_PATHS.ask) return messages.app.ask.header.title;
  if (normalizedPathname === APP_ROUTE_PATHS.onboarding) return messages.app.onboarding.hero.title;

  if (normalizedPathname.startsWith(`${APP_BASE}/`)) {
    switch (getAppJournalRouteKind(normalizedPathname)) {
      case 'list':
        return messages.app.journalList.title;
      case 'new': {
        const resolution = resolveJournalType(new URLSearchParams(search));
        return resolution.ok
          ? resolution.type === 'investment'
            ? messages.app.journalNew.investment
            : messages.app.journalNew.study
          : messages.app.journalNew.entryChoice.heading;
      }
      case 'detail':
        return messages.app.journalDetail.headerTitle;
      case 'review':
        return messages.app.journalReview.headerTitle;
      default:
        return messages.app.notFound.heading;
    }
  }

  return messages.public.notFound.heading;
}

/** Hydrated route metadata effect; the mapping itself remains shared with SSR. */
export function RouteDocumentTitle() {
  const { pathname, search } = useLocation();
  const { locale } = useTranslation();
  const title = getDocumentTitle(pathname, locale, search);

  useEffect(() => {
    document.title = title;
  }, [title]);

  return null;
}
