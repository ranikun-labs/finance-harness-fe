import { describe, expect, it } from 'vitest';

import { SUPPORTED_LOCALES } from '@/constants/routes';
import { LOCALE_LABELS, MESSAGES } from '@/i18n/dictionary';
import { en } from '@/i18n/messages/en';
import { ko } from '@/i18n/messages/ko';

function collectKeyPaths(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    collectKeyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe('MESSAGES', () => {
  it('has exactly one entry per SUPPORTED_LOCALES', () => {
    expect(Object.keys(MESSAGES).sort()).toEqual([...SUPPORTED_LOCALES].sort());
  });

  it('ko and en have identical key shapes (recursive)', () => {
    expect(collectKeyPaths(ko).sort()).toEqual(collectKeyPaths(en).sort());
  });

  it('has no empty string values in either locale', () => {
    for (const path of collectKeyPaths(ko)) {
      const [locale, keys] = [ko, path.split('.')];
      let value: unknown = locale;
      for (const key of keys) value = (value as Record<string, unknown>)[key];
      expect(value, `ko.${path}`).not.toBe('');
    }
    for (const path of collectKeyPaths(en)) {
      let value: unknown = en;
      for (const key of path.split('.')) value = (value as Record<string, unknown>)[key];
      expect(value, `en.${path}`).not.toBe('');
    }
  });
});

describe('LOCALE_LABELS', () => {
  it('has exactly one label per SUPPORTED_LOCALES', () => {
    expect(Object.keys(LOCALE_LABELS).sort()).toEqual([...SUPPORTED_LOCALES].sort());
  });

  it('labels are non-empty strings', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(LOCALE_LABELS[locale].length).toBeGreaterThan(0);
    }
  });
});
