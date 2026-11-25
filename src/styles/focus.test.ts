import { describe, expect, it } from 'vitest';

import globalsCss from '@/styles/globals.css?raw';

// 포커스 표시 계약(F3 X-01): 반투명 ring(`ring-ring/50`)·개별 ring 유틸·`outline-none`으로 전역
// 포커스 표시(2px --ring + offset 2)를 끄지 않는다. 예외는 프로그램으로만 포커스를 받는 제목(`tabIndex`).
const sources = import.meta.glob<string>(['/src/**/*.{ts,tsx}', '!/src/**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

describe('focus indicator contract', () => {
  it('scans the app sources', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(50);
  });

  it.each(Object.entries(sources))('%s keeps the global focus indicator', (_path, source) => {
    expect(source).not.toMatch(/ring-ring\/\d+/);
    expect(source).not.toMatch(/focus(-visible|-within)?:ring-/);
    expect(source).not.toMatch(/focus-visible:outline-none/);
    const outlineNone = source
      .split('\n')
      .filter((line) => /(^|[\s"'`])outline-none/.test(line) && !/\*/.test(line.trimStart()[0]));
    // 허용: 프로그램 포커스 전용 제목(아래 한 곳). 조작 요소에는 쓰지 않는다.
    for (const line of outlineNone) {
      expect(line).toMatch(/tracking-tight outline-none/);
    }
  });

  it('pins the base outline colour to --ring so the first focus does not flash currentColor', () => {
    expect(globalsCss).toMatch(/\{\s*outline-color:\s*var\(--ring\);\s*\}/);
    expect(globalsCss).toMatch(/outline:\s*2px solid var\(--ring\);\s*outline-offset:\s*2px;/);
  });
});
