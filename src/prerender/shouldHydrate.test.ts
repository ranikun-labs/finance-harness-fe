import { describe, expect, it } from 'vitest';

import {
  PRERENDER_MARKER_ATTRIBUTE,
  PRERENDER_MARKER_VALUE,
  shouldHydrate,
} from '@/prerender/shouldHydrate';

function createElement(attributeValue?: string): Element {
  const el = document.createElement('div');
  el.id = 'root';
  if (attributeValue !== undefined) {
    el.setAttribute(PRERENDER_MARKER_ATTRIBUTE, attributeValue);
  }
  return el;
}

describe('shouldHydrate', () => {
  it('returns true when the prerender marker attribute is present with the expected value', () => {
    expect(shouldHydrate(createElement(PRERENDER_MARKER_VALUE))).toBe(true);
  });

  it('returns false when the attribute is absent (SPA shell)', () => {
    expect(shouldHydrate(createElement())).toBe(false);
  });

  it('returns false when the attribute has an unexpected value', () => {
    expect(shouldHydrate(createElement('something-else'))).toBe(false);
  });

  it('does not infer from child DOM presence — only the explicit attribute matters', () => {
    const withChildNoMarker = createElement();
    withChildNoMarker.innerHTML = '<span>content</span>';
    expect(shouldHydrate(withChildNoMarker)).toBe(false);

    const emptyWithMarker = createElement(PRERENDER_MARKER_VALUE);
    expect(shouldHydrate(emptyWithMarker)).toBe(true);
  });
});
