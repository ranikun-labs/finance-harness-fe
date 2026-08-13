import { describe, expect, it } from 'vitest';

import {
  APP_BASE,
  APP_ROUTE_PATHS,
  AUTH_ROUTE_PATHS,
  DEFAULT_LOCALE,
  PUBLIC_ROUTE_PATHS,
  SUPPORTED_LOCALES,
  buildAppAskPath,
  buildAppJournalDetailPath,
  buildAppJournalNewPath,
  buildAppJournalReviewPath,
  buildFeaturesPath,
  buildLearnPath,
  buildLocaleHomePath,
  buildLocalePeerPath,
  getAppJournalRouteKind,
  isSupportedLocale,
  toRelativeUnder,
} from '@/constants/routes';

describe('locale single source of truth', () => {
  it('supports exactly ko and en', () => {
    expect(SUPPORTED_LOCALES).toEqual(['ko', 'en']);
  });

  it('defaults to ko', () => {
    expect(DEFAULT_LOCALE).toBe('ko');
    expect(SUPPORTED_LOCALES).toContain(DEFAULT_LOCALE);
  });

  it('accepts supported locales and rejects everything else', () => {
    expect(isSupportedLocale('ko')).toBe(true);
    expect(isSupportedLocale('en')).toBe(true);
    expect(isSupportedLocale('fr')).toBe(false);
    expect(isSupportedLocale('ja')).toBe(false);
    expect(isSupportedLocale('KO')).toBe(false);
    expect(isSupportedLocale('')).toBe(false);
    expect(isSupportedLocale(undefined)).toBe(false);
  });
});

describe('public path builders', () => {
  it('builds the locale home path', () => {
    expect(buildLocaleHomePath('ko')).toBe('/ko');
    expect(buildLocaleHomePath('en')).toBe('/en');
  });

  it('builds the features path', () => {
    expect(buildFeaturesPath('ko')).toBe('/ko/features');
    expect(buildFeaturesPath('en')).toBe('/en/features');
  });

  it('builds the learn base and nested paths', () => {
    expect(buildLearnPath('ko')).toBe('/ko/learn');
    expect(buildLearnPath('en', 'basics')).toBe('/en/learn/basics');
    expect(buildLearnPath('ko', 'a', 'b')).toBe('/ko/learn/a/b');
  });

  it('rejects an unsupported locale at build time', () => {
    // @ts-expect-error 런타임 방어를 위해 의도적으로 잘못된 locale을 전달
    expect(() => buildLocaleHomePath('fr')).toThrow();
  });
});

describe('buildLocalePeerPath', () => {
  it('swaps the locale segment on the home path', () => {
    expect(buildLocalePeerPath('/ko', 'en')).toBe('/en');
    expect(buildLocalePeerPath('/en', 'ko')).toBe('/ko');
  });

  it('swaps only the locale segment, preserving the rest of the path', () => {
    expect(buildLocalePeerPath('/ko/features', 'en')).toBe('/en/features');
    expect(buildLocalePeerPath('/ko/learn', 'en')).toBe('/en/learn');
    expect(buildLocalePeerPath('/ko/learn/basics', 'en')).toBe('/en/learn/basics');
    expect(buildLocalePeerPath('/en/learn/a/b', 'ko')).toBe('/ko/learn/a/b');
  });

  it('is a no-op when the target locale equals the current one', () => {
    expect(buildLocalePeerPath('/ko/features', 'ko')).toBe('/ko/features');
  });

  it('does not touch query string or hash — that is the caller’s responsibility', () => {
    // 이 함수는 pathname만 받는다; search/hash를 붙여 호출하면 그대로 세그먼트 취급된다는
    // 계약을 명시하기 위해 pathname만 넘겨야 함을 보여준다.
    expect(buildLocalePeerPath('/ko/learn/basics', 'en')).not.toContain('?');
    expect(buildLocalePeerPath('/ko/learn/basics', 'en')).not.toContain('#');
  });

  it('rejects an unsupported target locale', () => {
    // @ts-expect-error 런타임 방어를 위해 의도적으로 잘못된 locale을 전달
    expect(() => buildLocalePeerPath('/ko', 'fr')).toThrow();
  });

  it('rejects a pathname without a locale segment', () => {
    expect(() => buildLocalePeerPath('/', 'en')).toThrow();
  });

  it('rejects invalid pathname shapes (same guard as toRelativeUnder)', () => {
    expect(() => buildLocalePeerPath('', 'en')).toThrow();
    expect(() => buildLocalePeerPath('ko/features', 'en')).toThrow();
    expect(() => buildLocalePeerPath('/ko?x=1', 'en')).toThrow();
  });
});

describe('app route paths', () => {
  it('prefixes every app route with APP_BASE', () => {
    for (const path of Object.values(APP_ROUTE_PATHS)) {
      expect(path === APP_BASE || path.startsWith(`${APP_BASE}/`)).toBe(true);
    }
  });

  it('exposes no unprefixed content routes', () => {
    for (const path of Object.values(APP_ROUTE_PATHS)) {
      expect(path.startsWith(APP_BASE)).toBe(true);
    }
    for (const path of Object.values(PUBLIC_ROUTE_PATHS)) {
      expect(path.startsWith('/:locale')).toBe(true);
    }
  });
});

describe('Auth Entry route', () => {
  it('owns a provider-neutral public path outside the app shell', () => {
    expect(AUTH_ROUTE_PATHS.entry).toBe('/auth');
    expect(AUTH_ROUTE_PATHS.entry.startsWith(`${APP_BASE}/`)).toBe(false);
  });
});

describe('app Journal route classification', () => {
  it.each([
    [APP_ROUTE_PATHS.journalList, 'list'],
    [APP_ROUTE_PATHS.journalNew, 'new'],
    [buildAppJournalDetailPath('journal-1'), 'detail'],
    [buildAppJournalReviewPath('journal-1'), 'review'],
  ] as const)('classifies %s as %s', (pathname, expected) => {
    expect(getAppJournalRouteKind(pathname)).toBe(expected);
  });

  it('does not classify the static New route as a Detail route', () => {
    expect(getAppJournalRouteKind(`${APP_ROUTE_PATHS.journalNew}`)).toBe('new');
    expect(getAppJournalRouteKind('/app/journal/new/')).toBeNull();
  });

  it('rejects non-canonical Journal shapes', () => {
    expect(getAppJournalRouteKind('/app/journal')).toBe('list');
    expect(getAppJournalRouteKind('/app/journal/')).toBeNull();
    expect(getAppJournalRouteKind('/app/journal/id/extra')).toBeNull();
    expect(getAppJournalRouteKind('/app/other/id')).toBeNull();
  });
});

describe('app path builders', () => {
  it('builds the ask path with a query', () => {
    expect(buildAppAskPath('삼성전자')).toBe('/app/ask?q=%EC%82%BC%EC%84%B1%EC%A0%84%EC%9E%90');
  });

  it('falls back to the base ask path without a query', () => {
    expect(buildAppAskPath()).toBe(APP_ROUTE_PATHS.ask);
    expect(buildAppAskPath()).toBe('/app/ask');
  });

  it('builds the journal/new path with the type query', () => {
    expect(buildAppJournalNewPath('investment')).toBe('/app/journal/new?type=investment');
    expect(buildAppJournalNewPath('study')).toBe('/app/journal/new?type=study');
  });

  it('builds the journal detail path', () => {
    expect(buildAppJournalDetailPath('abc123')).toBe('/app/journal/abc123');
  });

  it('builds the journal review path', () => {
    expect(buildAppJournalReviewPath('abc123')).toBe('/app/journal/abc123/review');
  });

  describe('dynamic id encoding (preserved under /app)', () => {
    it('encodes a plain alphanumeric id as-is', () => {
      expect(buildAppJournalDetailPath('abc123')).toBe('/app/journal/abc123');
      expect(buildAppJournalReviewPath('abc123')).toBe('/app/journal/abc123/review');
    });

    it('encodes an id containing a slash into a single path segment', () => {
      expect(buildAppJournalDetailPath('a/b')).toBe('/app/journal/a%2Fb');
      expect(buildAppJournalDetailPath('a/b')).not.toContain('/app/journal/a/b');
    });

    it('encodes an id containing a question mark so it is not read as a query string', () => {
      expect(buildAppJournalDetailPath('a?b=1')).toBe('/app/journal/a%3Fb%3D1');
    });

    it('encodes an id containing a hash so it is not read as a fragment', () => {
      expect(buildAppJournalDetailPath('a#b')).toBe('/app/journal/a%23b');
    });

    it('encodes an id containing whitespace', () => {
      expect(buildAppJournalDetailPath('a b')).toBe('/app/journal/a%20b');
    });

    it('encodes a Korean (unicode) id', () => {
      expect(buildAppJournalDetailPath('삼성전자')).toBe(
        '/app/journal/%EC%82%BC%EC%84%B1%EC%A0%84%EC%9E%90',
      );
    });

    it('rejects an empty id', () => {
      expect(() => buildAppJournalDetailPath('')).toThrow();
      expect(() => buildAppJournalReviewPath('')).toThrow();
    });

    it('rejects a whitespace-only id', () => {
      expect(() => buildAppJournalDetailPath('   ')).toThrow();
      expect(() => buildAppJournalReviewPath('   ')).toThrow();
    });

    it('builds the detail/review path for a special-character id', () => {
      expect(buildAppJournalDetailPath('일지 1/2?#')).toBe(
        '/app/journal/%EC%9D%BC%EC%A7%80%201%2F2%3F%23',
      );
      expect(buildAppJournalReviewPath('일지 1/2?#')).toBe(
        '/app/journal/%EC%9D%BC%EC%A7%80%201%2F2%3F%23/review',
      );
    });
  });

  describe('derivation from APP_ROUTE_PATHS', () => {
    it('derives the detail path by substituting :id in APP_ROUTE_PATHS.journalDetail', () => {
      const id = '일지 1/2?#';
      const expected = APP_ROUTE_PATHS.journalDetail.replace(':id', encodeURIComponent(id));
      expect(buildAppJournalDetailPath(id)).toBe(expected);
    });

    it('derives the review path by substituting :id in APP_ROUTE_PATHS.journalReview', () => {
      const id = '일지 1/2?#';
      const expected = APP_ROUTE_PATHS.journalReview.replace(':id', encodeURIComponent(id));
      expect(buildAppJournalReviewPath(id)).toBe(expected);
    });
  });
});

describe('toRelativeUnder', () => {
  it('returns an empty string for the base itself (index route)', () => {
    expect(toRelativeUnder(APP_BASE, APP_ROUTE_PATHS.appHome)).toBe('');
    expect(toRelativeUnder('/:locale', PUBLIC_ROUTE_PATHS.localeHome)).toBe('');
  });

  it('strips the base prefix from nested paths', () => {
    expect(toRelativeUnder(APP_BASE, APP_ROUTE_PATHS.journalDetail)).toBe('journal/:id');
    expect(toRelativeUnder('/:locale', PUBLIC_ROUTE_PATHS.features)).toBe('features');
    expect(toRelativeUnder('/:locale', PUBLIC_ROUTE_PATHS.learn)).toBe('learn/*');
  });

  it('throws when the path is not under the base', () => {
    expect(() => toRelativeUnder(APP_BASE, '/ko/features')).toThrow();
  });

  it('continues to allow route pattern tokens (:id, *, /:locale, /app)', () => {
    expect(toRelativeUnder('/app', '/app/journal/:id/review')).toBe('journal/:id/review');
    expect(toRelativeUnder('/:locale', '/:locale/learn/*')).toBe('learn/*');
  });

  describe('input contract (pathname pattern only)', () => {
    it('rejects an empty base', () => {
      expect(() => toRelativeUnder('', '/app')).toThrow();
    });

    it('rejects an empty absolutePath', () => {
      expect(() => toRelativeUnder(APP_BASE, '')).toThrow();
    });

    it('rejects a base that does not start with "/"', () => {
      expect(() => toRelativeUnder('app', '/app/ask')).toThrow();
    });

    it('rejects an absolutePath that does not start with "/"', () => {
      expect(() => toRelativeUnder(APP_BASE, 'app/ask')).toThrow();
    });

    it('rejects a base containing "?"', () => {
      expect(() => toRelativeUnder('/app?x=1', '/app?x=1/ask')).toThrow();
    });

    it('rejects an absolutePath containing "?"', () => {
      expect(() => toRelativeUnder(APP_BASE, '/app/ask?q=1')).toThrow();
    });

    it('rejects a base containing "#"', () => {
      expect(() => toRelativeUnder('/app#frag', '/app#frag/ask')).toThrow();
    });

    it('rejects an absolutePath containing "#"', () => {
      expect(() => toRelativeUnder(APP_BASE, '/app/ask#frag')).toThrow();
    });
  });
});
