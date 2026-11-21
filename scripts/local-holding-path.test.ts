import { describe, expect, it } from 'vitest';
import { isLocalHoldingPath } from './local-holding-path';

describe('disabled holding proxy path guard', () => {
  it.each([
    '/finance/local-holding',
    '/finance/local-holding/filing',
    '/finance/local-holding;v=1/filing',
    '/finance;v=1//local-holding;v=2//filing?x=1',
    '//finance///local-holding',
    '/finance%2flocal-holding',
  ])('matches %s', (path) => expect(isLocalHoldingPath(path)).toBe(true));
  it.each(['/finance/other', '/finance/local-holdings', '/other/local-holding'])(
    'preserves unrelated route %s',
    (path) => expect(isLocalHoldingPath(path)).toBe(false),
  );
  it('rejects malformed escaping', () =>
    expect(() => isLocalHoldingPath('/finance/%zz')).toThrow());
});
