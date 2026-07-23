import { describe, expect, it } from 'vitest';

import {
  ROUTE_PATHS,
  buildAskPath,
  buildJournalDetailPath,
  buildJournalNewPath,
  buildJournalReviewPath,
} from '@/constants/routes';

describe('routes', () => {
  it('builds the ask path with a query', () => {
    expect(buildAskPath('삼성전자')).toBe('/ask?q=%EC%82%BC%EC%84%B1%EC%A0%84%EC%9E%90');
  });

  it('falls back to the base ask path without a query', () => {
    expect(buildAskPath()).toBe(ROUTE_PATHS.ask);
  });

  it('builds the journal/new path with the type query', () => {
    expect(buildJournalNewPath('investment')).toBe('/journal/new?type=investment');
    expect(buildJournalNewPath('study')).toBe('/journal/new?type=study');
  });

  it('builds the journal detail path', () => {
    expect(buildJournalDetailPath('abc123')).toBe('/journal/abc123');
  });

  it('builds the journal review path', () => {
    expect(buildJournalReviewPath('abc123')).toBe('/journal/abc123/review');
  });
});
