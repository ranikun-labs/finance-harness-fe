import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  APP_LOCALE_STORAGE_KEY,
  normalizeBrowserLocale,
  readStoredAppLocale,
  resolveInitialAppLocale,
  writeStoredAppLocale,
} from '@/i18n/appLocale';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('normalizeBrowserLocale', () => {
  it('normalizes region-tagged locales to their supported primary subtag', () => {
    expect(normalizeBrowserLocale(['ko-KR'])).toBe('ko');
    expect(normalizeBrowserLocale(['en-US'])).toBe('en');
  });

  it('returns undefined for unsupported locales', () => {
    expect(normalizeBrowserLocale(['fr-FR'])).toBeUndefined();
    expect(normalizeBrowserLocale(['ja'])).toBeUndefined();
    expect(normalizeBrowserLocale([])).toBeUndefined();
  });

  it('falls through to the next candidate when the first is unsupported', () => {
    expect(normalizeBrowserLocale(['fr-FR', 'en-GB'])).toBe('en');
  });
});

describe('readStoredAppLocale', () => {
  it('returns null when nothing is stored', () => {
    expect(readStoredAppLocale()).toBeNull();
  });

  it('returns the stored locale when it is valid', () => {
    window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, 'en');
    expect(readStoredAppLocale()).toBe('en');
  });

  it('returns null for a corrupted/unsupported stored value', () => {
    window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, 'xx');
    expect(readStoredAppLocale()).toBeNull();
  });

  it('returns null (does not throw) when localStorage access throws', () => {
    vi.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(() => {
      throw new Error('access blocked');
    });
    expect(() => readStoredAppLocale()).not.toThrow();
    expect(readStoredAppLocale()).toBeNull();
  });
});

describe('writeStoredAppLocale', () => {
  it('persists a valid locale', () => {
    writeStoredAppLocale('en');
    expect(window.localStorage.getItem(APP_LOCALE_STORAGE_KEY)).toBe('en');
  });

  it('does not throw when localStorage access throws', () => {
    vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    expect(() => writeStoredAppLocale('en')).not.toThrow();
  });
});

describe('resolveInitialAppLocale priority', () => {
  it('prefers a valid stored locale over the browser locale', () => {
    window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, 'en');
    vi.stubGlobal('navigator', { language: 'ko-KR', languages: ['ko-KR'] });
    expect(resolveInitialAppLocale()).toBe('en');
  });

  it('falls back to the normalized browser locale when nothing is stored', () => {
    vi.stubGlobal('navigator', { language: 'en-US', languages: ['en-US'] });
    expect(resolveInitialAppLocale()).toBe('en');
  });

  it('falls back to DEFAULT_LOCALE when nothing is stored and the browser locale is unsupported', () => {
    vi.stubGlobal('navigator', { language: 'fr-FR', languages: ['fr-FR'] });
    expect(resolveInitialAppLocale()).toBe('ko');
  });

  it('falls back to DEFAULT_LOCALE when the stored value is invalid and the browser locale is unsupported', () => {
    window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, 'xx');
    vi.stubGlobal('navigator', { language: 'fr-FR', languages: ['fr-FR'] });
    expect(resolveInitialAppLocale()).toBe('ko');
  });
});
