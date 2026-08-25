import { describe, expect, it } from 'vitest';

import { getDocumentTitle } from '@/metadata/documentTitle';
import { PRERENDER_MANIFEST } from '@/prerender/manifest';

describe('STEP 12 prerender title source of truth', () => {
  it('stores the same route title mapping used by the client', () => {
    for (const entry of PRERENDER_MANIFEST) {
      expect(entry.title).toBe(getDocumentTitle(entry.path, entry.locale));
    }
  });
});
