import { describe, expect, it } from 'vitest';
import {
  holdTransient,
  readTransient,
  resolveTransient,
  transientState,
} from './transientNavigation';

describe('transient navigation', () => {
  it('passes only an opaque reference through navigation and retains data in memory', () => {
    const question = 'private investment question';
    const state = transientState({ question });
    expect(JSON.stringify(state)).not.toContain(question);
    expect(resolveTransient<{ question: string }>(state)?.question).toBe(question);
    expect(resolveTransient({ transientRef: 'missing' })).toBeUndefined();
  });

  it('supports return navigation without putting the question in the address', () => {
    const question = 'private investment question';
    const ref = holdTransient(question);
    expect(ref).not.toContain(question);
    expect(readTransient(ref)).toBe(question);
  });
});
