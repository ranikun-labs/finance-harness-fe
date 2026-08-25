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

function rootToken(name: string): string {
  const rootBlock = globalsCss.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  return rootBlock.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1] ?? '';
}

describe('STEP 12 A11Y-02 active light-theme contrast', () => {
  it.each([
    ['muted foreground on white', rootToken('muted-foreground'), '#ffffff'],
    ['muted foreground on muted surface', rootToken('muted-foreground'), '#f5f5f5'],
    ['tertiary text on white', rootToken('text-tertiary'), '#ffffff'],
    ['primary text on white', rootToken('primary'), '#ffffff'],
    ['primary CTA foreground on primary', '#ffffff', rootToken('primary')],
  ])('%s is at least 4.5:1', (_name, foreground, background) => {
    expect(foreground).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(background).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });
});
