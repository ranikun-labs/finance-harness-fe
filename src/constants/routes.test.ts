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

  describe('dynamic id encoding', () => {
    it('encodes a plain alphanumeric id as-is', () => {
      expect(buildJournalDetailPath('abc123')).toBe('/journal/abc123');
      expect(buildJournalReviewPath('abc123')).toBe('/journal/abc123/review');
    });

    it('encodes an id containing a slash into a single path segment', () => {
      expect(buildJournalDetailPath('a/b')).toBe('/journal/a%2Fb');
      expect(buildJournalDetailPath('a/b')).not.toContain('/journal/a/b');
    });

    it('encodes an id containing a question mark so it is not read as a query string', () => {
      expect(buildJournalDetailPath('a?b=1')).toBe('/journal/a%3Fb%3D1');
    });

    it('encodes an id containing a hash so it is not read as a fragment', () => {
      expect(buildJournalDetailPath('a#b')).toBe('/journal/a%23b');
    });

    it('encodes an id containing whitespace', () => {
      expect(buildJournalDetailPath('a b')).toBe('/journal/a%20b');
    });

    it('encodes a Korean (unicode) id', () => {
      expect(buildJournalDetailPath('삼성전자')).toBe(
        '/journal/%EC%82%BC%EC%84%B1%EC%A0%84%EC%9E%90',
      );
    });

    it('rejects an empty id', () => {
      expect(() => buildJournalDetailPath('')).toThrow();
      expect(() => buildJournalReviewPath('')).toThrow();
    });

    it('rejects a whitespace-only id', () => {
      expect(() => buildJournalDetailPath('   ')).toThrow();
      expect(() => buildJournalReviewPath('   ')).toThrow();
    });

    it('builds the detail path for a special-character id', () => {
      expect(buildJournalDetailPath('일지 1/2?#')).toBe(
        '/journal/%EC%9D%BC%EC%A7%80%201%2F2%3F%23',
      );
    });

    it('builds the review path for a special-character id', () => {
      expect(buildJournalReviewPath('일지 1/2?#')).toBe(
        '/journal/%EC%9D%BC%EC%A7%80%201%2F2%3F%23/review',
      );
    });
  });
});
