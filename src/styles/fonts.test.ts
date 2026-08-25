import fontsCss from '@/styles/fonts.css?raw';
import { describe, expect, it } from 'vitest';

describe('STEP 12 PERF-01 font source', () => {
  it('uses the dependency variable unicode-range subset stylesheet', () => {
    expect(fontsCss).toContain(
      "@import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'",
    );
    expect(fontsCss).toContain('dynamic-subset');
    expect(fontsCss).not.toContain('PretendardVariable.woff2');
    expect(fontsCss).not.toContain('../assets/fonts/PretendardVariable.woff2');
  });
});
