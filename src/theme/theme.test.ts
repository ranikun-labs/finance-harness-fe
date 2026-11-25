import indexHtml from '../../index.html?raw';
import globalsCss from '@/styles/globals.css?raw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  THEME_COLOR,
  THEME_STORAGE_KEY,
  applyResolvedTheme,
  getResolvedTheme,
  getThemePreference,
  initTheme,
  isThemePreference,
  readStoredThemePreference,
  resolveTheme,
  setThemePreference,
  writeStoredThemePreference,
} from '@/theme/theme';

type Listener = (event: { matches: boolean }) => void;

function stubMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<Listener>();
  const media = {
    get matches() {
      return matches;
    },
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    removeEventListener: (_: string, l: Listener) => listeners.delete(l),
  };
  vi.stubGlobal('matchMedia', () => media);
  window.matchMedia = (() => media) as unknown as typeof window.matchMedia;
  return {
    set(next: boolean) {
      matches = next;
      listeners.forEach((l) => l({ matches }));
    },
    listenerCount: () => listeners.size,
  };
}

function resetDom() {
  document.documentElement.className = '';
  document.documentElement.removeAttribute('style');
  document.head
    .querySelectorAll('meta[name="color-scheme"],meta[name="theme-color"]')
    .forEach((m) => m.remove());
}

beforeEach(() => {
  window.localStorage.clear();
  resetDom();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('resolveTheme', () => {
  it.each([
    ['system', true, 'dark'],
    ['system', false, 'light'],
    ['light', true, 'light'],
    ['dark', false, 'dark'],
  ] as const)('%s + prefersDark=%s -> %s', (pref, dark, expected) => {
    expect(resolveTheme(pref, dark)).toBe(expected);
  });

  it('accepts only the three known preferences', () => {
    expect(['system', 'light', 'dark'].every(isThemePreference)).toBe(true);
    expect([null, 'auto', 'DARK', '', 1].some(isThemePreference)).toBe(false);
  });
});

describe('storage', () => {
  it('treats missing, corrupted and unsupported values as "no choice"', () => {
    expect(readStoredThemePreference()).toBeNull();
    window.localStorage.setItem(THEME_STORAGE_KEY, 'sepia');
    expect(readStoredThemePreference()).toBeNull();
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    expect(readStoredThemePreference()).toBe('dark');
  });

  it('does not throw and reports failure when localStorage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readStoredThemePreference()).toBeNull();
    expect(writeStoredThemePreference('dark')).toBe(false);
  });

  it('clears the key for "system" so it equals "never chose"', () => {
    writeStoredThemePreference('dark');
    writeStoredThemePreference('system');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });
});

describe('applyResolvedTheme', () => {
  it('syncs .dark, color-scheme and theme-color together', () => {
    applyResolvedTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(document.querySelector('meta[name="color-scheme"]')?.getAttribute('content')).toBe(
      'dark',
    );
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe(
      THEME_COLOR.dark,
    );
    applyResolvedTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe(
      THEME_COLOR.light,
    );
    expect(document.head.querySelectorAll('meta[name="theme-color"]')).toHaveLength(1);
  });

  it('theme-color matches the --page token of each theme', () => {
    const light = /:root\s*\{[\s\S]*?--page:\s*(#[0-9a-f]{6})/i.exec(globalsCss)?.[1];
    const dark = /\n\.dark\s*\{[\s\S]*?--page:\s*(#[0-9a-f]{6})/i.exec(globalsCss)?.[1];
    expect(THEME_COLOR.light).toBe(light);
    expect(THEME_COLOR.dark).toBe(dark);
  });
});

describe('initTheme / setThemePreference', () => {
  it('defaults to following the system and reacts to live system changes', () => {
    const media = stubMatchMedia(false);
    const stop = initTheme();
    expect(getThemePreference()).toBe('system');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    media.set(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(getResolvedTheme()).toBe('dark');
    media.set(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    stop();
    expect(media.listenerCount()).toBe(0);
  });

  it('an explicit choice ignores the system and is restored on next init', () => {
    const media = stubMatchMedia(false);
    const stop = initTheme();
    expect(setThemePreference('dark')).toEqual({ persisted: true });
    media.set(false);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    stop();

    resetDom();
    const stop2 = initTheme();
    expect(getThemePreference()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    stop2();
  });

  it('still applies for this session when saving fails, and says so', () => {
    stubMatchMedia(false);
    const stop = initTheme();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(setThemePreference('dark')).toEqual({ persisted: false });
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    stop();
  });

  it('follows a selection made in another tab', () => {
    stubMatchMedia(false);
    const stop = initTheme();
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY }));
    expect(getThemePreference()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    stop();
  });

  it('survives environments without matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined);
    window.matchMedia = undefined as unknown as typeof window.matchMedia;
    const stop = initTheme();
    expect(getResolvedTheme()).toBe('light');
    stop();
  });
});

describe('first-paint inline script in index.html', () => {
  const script = /<script>([\s\S]*?)<\/script>/.exec(indexHtml)?.[1] ?? '';

  function runInline() {
    new Function(script)();
  }
  function seedMetas() {
    document.head.insertAdjacentHTML(
      'beforeend',
      '<meta name="color-scheme" content="light"><meta name="theme-color" content="#f2f4f6">',
    );
  }

  it('is present and uses the same storage key as the module', () => {
    expect(script).toContain(`'${THEME_STORAGE_KEY}'`);
  });

  it.each([
    [null, true, 'dark'],
    [null, false, 'light'],
    ['light', true, 'light'],
    ['dark', false, 'dark'],
    ['garbage', true, 'dark'],
  ] as const)(
    'stored=%s systemDark=%s -> %s (same as resolveTheme)',
    (stored, systemDark, expected) => {
      stubMatchMedia(systemDark);
      seedMetas();
      if (stored) window.localStorage.setItem(THEME_STORAGE_KEY, stored);
      runInline();
      const pref = readStoredThemePreference() ?? 'system';
      expect(resolveTheme(pref, systemDark)).toBe(expected);
      expect(document.documentElement.classList.contains('dark')).toBe(expected === 'dark');
      expect(document.documentElement.style.colorScheme).toBe(expected);
      expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe(
        THEME_COLOR[expected],
      );
    },
  );

  it('does not throw when localStorage throws', () => {
    stubMatchMedia(true);
    seedMetas();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(runInline).not.toThrow();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
