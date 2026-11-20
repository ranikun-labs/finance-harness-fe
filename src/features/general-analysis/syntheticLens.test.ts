import { describe, expect, it } from 'vitest';
import { syntheticLens } from './syntheticLens';
describe('synthetic next lens', () => {
  it('selects one strongest lens or stops for weak signals', () => {
    expect(syntheticLens(0.8, 0.7).next).toBe('Sector concentration');
    expect(syntheticLens(0.2, 0.8).next).toBe('Broad macro');
    expect(syntheticLens(0.2, 0.3).next).toBeNull();
    expect(syntheticLens(0.6, 0.6).next).toBe('Sector concentration');
    expect(syntheticLens(0.599, 0.601).facts).toEqual([
      'Synthetic sector concentration: 0.599',
      'Synthetic broad macro signal: 0.601',
    ]);
    expect(() => syntheticLens(NaN, 0)).toThrow();
  });
});
