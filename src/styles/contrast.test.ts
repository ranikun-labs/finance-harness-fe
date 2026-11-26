import globalsCss from '@/styles/globals.css?raw';
import { describe, expect, it } from 'vitest';

function parseHexColor(value: string): [number, number, number] {
  const normalized = value.replace('#', '');
  return [0, 2, 4].map((offset) => parseInt(normalized.slice(offset, offset + 2), 16)) as [
    number,
    number,
    number,
  ];
}

function relativeLuminance(hex: string): number {
  const channels = parseHexColor(hex).map((channel) => channel / 255);
  const linear = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
}

type Theme = 'light' | 'dark';

function block(theme: Theme): string {
  const re = theme === 'light' ? /:root\s*\{([\s\S]*?)\n\}/ : /\n\.dark\s*\{([\s\S]*?)\n\}/;
  return globalsCss.match(re)?.[1] ?? '';
}

/** 테마 블록에서 토큰 hex를 읽는다. `var(--x)` 별칭은 같은 테마 → light 순서로 따라간다. */
function token(theme: Theme, name: string, depth = 0): string {
  if (depth > 5) return '';
  for (const source of theme === 'dark' ? [block('dark'), block('light')] : [block('light')]) {
    const value = source.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1]?.trim();
    if (!value) continue;
    const alias = value.match(/^var\(--([a-z-]+)\)$/);
    if (alias) return token(theme, alias[1], depth + 1);
    return value;
  }
  return '';
}

// 텍스트 4.5:1 기준. 배경은 하드코딩하지 않고 실제 globals.css의 배경 토큰을 읽는다.
const SURFACES = ['page', 'card', 'inset'] as const;
const TEXTS = ['foreground', 'text-body', 'text-secondary', 'text-tertiary', 'muted-foreground'];
const STATUSES = ['success', 'warning', 'danger', 'conflict', 'info'] as const;

describe.each(['light', 'dark'] as const)('Foundation v1 %s theme contrast (>= 4.5:1)', (theme) => {
  const pairs: [string, string, string][] = [];
  for (const text of TEXTS) {
    for (const surface of [...SURFACES, 'control']) {
      pairs.push([`${text} on ${surface}`, text, surface]);
    }
  }
  pairs.push(['primary on card', 'primary', 'card']);
  pairs.push(['primary on page', 'primary', 'page']);
  pairs.push(['brand-deep on brand-subtle', 'brand-deep', 'brand-subtle']);
  pairs.push(['brand-deep on card', 'brand-deep', 'card']);
  pairs.push(['primary-foreground on primary', 'primary-foreground', 'primary']);
  pairs.push(['on-danger-solid on danger-solid', 'on-danger-solid', 'danger-solid']);
  for (const status of STATUSES) {
    pairs.push([`${status} on ${status}-bg`, status, `${status}-bg`]);
    pairs.push([`${status} on card`, status, 'card']);
    pairs.push([`${status} on page`, status, 'page']);
    // Notice 본문은 foreground를 상태 면 위에 둔다.
    pairs.push([`foreground on ${status}-bg`, 'foreground', `${status}-bg`]);
  }

  it.each(pairs)('%s', (_name, foreground, background) => {
    const fg = token(theme, foreground);
    const bg = token(theme, background);
    expect(fg).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(bg).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('control/input outline is at least 3:1 on card (non-text contrast)', () => {
    expect(contrastRatio(token(theme, 'input'), token(theme, 'card'))).toBeGreaterThanOrEqual(3);
  });

  it('control/input outline is at least 3:1 on inset (TextField fill="inset")', () => {
    expect(contrastRatio(token(theme, 'input'), token(theme, 'inset'))).toBeGreaterThanOrEqual(3);
  });
});

// 포커스 표시(F3 X-01): 2px --ring(color.focus) 실선이 놓일 수 있는 모든 면 위에서 비텍스트 3:1 이상이어야 한다.
describe.each(['light', 'dark'] as const)(
  'Focus indicator (--ring) on %s surfaces (>= 3:1)',
  (theme) => {
    it.each(['page', 'card', 'inset', 'control', 'brand-subtle'])('ring on %s', (surface) => {
      const ring = token(theme, 'ring');
      const bg = token(theme, surface);
      expect(ring).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(contrastRatio(ring, bg)).toBeGreaterThanOrEqual(3);
    });
  },
);

describe('Foundation v1 token values (Finance)', () => {
  it.each([
    ['light', 'page', '#f2f4f6'],
    ['light', 'card', '#ffffff'],
    ['light', 'inset', '#f2f4f6'],
    ['light', 'control', '#e9ecef'],
    ['light', 'primary', '#1d64d8'],
    ['light', 'brand-deep', '#174fb0'],
    ['light', 'brand-subtle', '#e8f0fd'],
    ['dark', 'page', '#0f1114'],
    ['dark', 'card', '#1a1d21'],
    ['dark', 'primary', '#4f95ff'],
    ['dark', 'primary-foreground', '#0b1220'],
  ] as const)('%s %s = %s', (theme, name, expected) => {
    expect(token(theme, name).toLowerCase()).toBe(expected);
  });
});

// 내비 활성 라벨(F3 F-07): 하단 탭·rail 활성 항목은 `primary/10` 면 위에 놓인다. 면 색은 실제 합성값으로 잰다.
function blend(top: string, bottom: string, alpha: number): string {
  const a = parseHexColor(top);
  const b = parseHexColor(bottom);
  return `#${a
    .map((channel, i) => Math.round(channel * alpha + b[i] * (1 - alpha)))
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`;
}

describe.each(['light', 'dark'] as const)('Nav active label on %s (>= 4.5:1)', (theme) => {
  it.each([
    ['bottom tab / rail: brand-deep on primary/10 over page', 'page'],
    ['tablet top: brand-deep on page (active pill)', 'page-pill'],
    ['tablet top: brand-deep on control (bg-muted track)', 'control'],
  ])('%s', (_name, surface) => {
    const deep = token(theme, 'brand-deep');
    const page = token(theme, 'page');
    const primary = token(theme, 'primary');
    const background =
      surface === 'page-pill'
        ? page
        : surface === 'control'
          ? token(theme, 'control')
          : blend(primary, page, 0.1);
    expect(deep).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(contrastRatio(deep, background)).toBeGreaterThanOrEqual(4.5);
  });

  it('the old primary text color failed on the phone tab fill (guard against regression)', () => {
    // 회귀 기준: primary 글자 + primary/10 면 조합은 Light에서 4.5:1 미만이었다(F-07 원인).
    if (theme !== 'light') return;
    const background = blend(token(theme, 'primary'), token(theme, 'page'), 0.1);
    expect(contrastRatio(token(theme, 'primary'), background)).toBeLessThan(4.5);
  });
});
