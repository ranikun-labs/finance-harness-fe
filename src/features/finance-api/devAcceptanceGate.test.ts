import { describe, expect, it } from 'vitest';

import { isDevAcceptanceFlagEnabled } from '@/features/finance-api/devAcceptanceGate';

describe('isDevAcceptanceFlagEnabled', () => {
  it('is OFF unless the flag is exactly "true" in the dev-acceptance mode', () => {
    expect(isDevAcceptanceFlagEnabled('true', 'dev-acceptance')).toBe(true);
    expect(isDevAcceptanceFlagEnabled(undefined, 'dev-acceptance')).toBe(false);
    expect(isDevAcceptanceFlagEnabled('false', 'dev-acceptance')).toBe(false);
    expect(isDevAcceptanceFlagEnabled('TRUE', 'dev-acceptance')).toBe(false);
  });

  it.each(['production', 'development', 'test', undefined])(
    'never enables in mode %s, even with the flag set',
    (mode) => {
      expect(isDevAcceptanceFlagEnabled('true', mode)).toBe(false);
    },
  );
});
