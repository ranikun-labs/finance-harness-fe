import { APP_ROUTE_PATHS } from '@/constants/routes';

/** Navigation context exists only for the lifetime of this browser tab's JS runtime. */
const values = new Map<string, unknown>();

export function holdTransient(value: unknown): string {
  const key = crypto.randomUUID();
  if (values.size >= 100) {
    const oldest = values.keys().next().value;
    if (oldest) values.delete(oldest);
  }
  values.set(key, value);
  return key;
}

export function readTransient<T>(key: unknown): T | undefined {
  return typeof key === 'string' ? (values.get(key) as T | undefined) : undefined;
}

export function transientState(value: unknown): { transientRef: string } {
  return { transientRef: holdTransient(value) };
}

export function resolveTransient<T>(state: unknown): T | undefined {
  if (!state || typeof state !== 'object' || !('transientRef' in state)) return undefined;
  return readTransient<T>((state as { transientRef?: unknown }).transientRef);
}

/** Keep supported review view context while removing legacy free-text query parameters. */
export function safeReviewReturn(target: string): string {
  let parsed: URL;
  try {
    parsed = new URL(target, 'https://navigation.invalid');
  } catch {
    return APP_ROUTE_PATHS.ask;
  }
  if (parsed.origin !== 'https://navigation.invalid' || parsed.pathname !== APP_ROUTE_PATHS.ask) {
    return APP_ROUTE_PATHS.ask;
  }
  const params = new URLSearchParams();
  const ref = parsed.searchParams.get('ref');
  if (ref && typeof readTransient(ref) === 'string') params.set('ref', ref);
  const fixture = parsed.searchParams.get('fixture');
  if (fixture === 'partial' || fixture === 'error') params.set('fixture', fixture);
  const query = params.toString();
  const hash = parsed.hash === '#result' ? '#result' : '';
  return `${APP_ROUTE_PATHS.ask}${query ? `?${query}` : ''}${hash}`;
}
