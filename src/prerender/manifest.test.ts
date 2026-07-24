import { describe, expect, it } from 'vitest';

import { PRERENDER_MANIFEST, buildPrerenderManifest } from '@/prerender/manifest';
import { SUPPORTED_LOCALES } from '@/constants/routes';

describe('PRERENDER_MANIFEST', () => {
  it('contains exactly locale-count × 3 fixed entries (home, features, learn index)', () => {
    expect(PRERENDER_MANIFEST).toHaveLength(SUPPORTED_LOCALES.length * 3);
  });

  it('stays in sync with SUPPORTED_LOCALES (derived, not hardcoded)', () => {
    const manifest = buildPrerenderManifest();
    const localesRepresented = new Set(
      manifest.map(({ path }) => path.split('/')[1]).filter(Boolean),
    );
    expect(localesRepresented).toEqual(new Set(SUPPORTED_LOCALES));
  });

  it('includes exactly the expected paths for ko and en', () => {
    const paths = PRERENDER_MANIFEST.map((entry) => entry.path).sort();
    expect(paths).toEqual(
      ['/ko', '/ko/features', '/ko/learn', '/en', '/en/features', '/en/learn'].sort(),
    );
  });

  it('never includes wildcard learn sub-paths', () => {
    for (const { path } of PRERENDER_MANIFEST) {
      expect(path).not.toMatch(/\/learn\/.+/);
    }
  });

  it('never includes app routes', () => {
    for (const { path, outFile } of PRERENDER_MANIFEST) {
      expect(path.startsWith('/app')).toBe(false);
      expect(outFile.startsWith('app')).toBe(false);
    }
  });

  it('never includes the root redirect path "/"', () => {
    const paths = PRERENDER_MANIFEST.map((entry) => entry.path);
    expect(paths).not.toContain('/');
  });

  it('has no duplicate paths', () => {
    const paths = PRERENDER_MANIFEST.map((entry) => entry.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('has no duplicate output files', () => {
    const outFiles = PRERENDER_MANIFEST.map((entry) => entry.outFile);
    expect(new Set(outFiles).size).toBe(outFiles.length);
  });

  it('maps each path to an outFile under its own locale directory', () => {
    for (const { path, outFile } of PRERENDER_MANIFEST) {
      const locale = path.split('/')[1];
      expect(outFile.startsWith(`${locale}/`)).toBe(true);
      expect(outFile.endsWith('index.html')).toBe(true);
    }
  });

  it('carries an explicit locale field matching the path and outFile', () => {
    for (const { path, outFile, locale } of PRERENDER_MANIFEST) {
      expect(path.split('/')[1]).toBe(locale);
      expect(outFile.startsWith(`${locale}/`)).toBe(true);
      expect(SUPPORTED_LOCALES).toContain(locale);
    }
  });
});
