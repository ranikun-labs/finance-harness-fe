import { describe, expect, it } from 'vitest';

import { RECORD_ACTIONS, type RecordAction } from '@/constants/policy';

describe('RECORD_ACTIONS', () => {
  it('is exactly interest/watching/buy/sell, in order', () => {
    expect(RECORD_ACTIONS).toEqual(['interest', 'watching', 'buy', 'sell']);
  });

  it('every value satisfies the RecordAction type', () => {
    const values: readonly RecordAction[] = RECORD_ACTIONS;
    expect(values).toHaveLength(4);
  });
});
