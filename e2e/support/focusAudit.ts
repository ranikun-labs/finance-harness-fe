import { expect, type Page } from '@playwright/test';

// 포커스 표시 감사(F3 F-06, X-01): Tab으로 도는 모든 요소의 포커스 표시를 실제 렌더 결과(computed style)로 잰다.
// 표시는 2px 실선 + offset 2, 반투명·글자색 금지, 바로 뒤 바탕(조상 알파 합성)과 3:1 이상이어야 한다.

export type Violation = { path: string; stop: string; reason: string };

export async function walkTabStops(
  page: Page,
  label: string,
  minStops = 2,
  limit = 70,
): Promise<{ violations: Violation[]; stops: number }> {
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    window.scrollTo(0, 0);
  });
  const violations: Violation[] = [];
  const seen = new Set<string>();
  let bodyStops = 0;
  for (let index = 0; index < limit; index += 1) {
    await page.keyboard.press('Tab');
    const result = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      if (!active || active === document.body) return { body: true } as const;
      // 한 바퀴를 돌아 처음 요소로 돌아오면 끝낸다(표시용 이름은 겹칠 수 있어 요소에 표식을 단다).
      if (active.dataset.focusAudit === '1') return { end: true } as const;
      active.dataset.focusAudit = '1';

      const parse = (value: string) => {
        const m = value.match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const [r, g, b, a = '1'] = m[1].split(/[ ,/]+/).filter(Boolean);
        return [Number(r), Number(g), Number(b), Number(a)] as const;
      };
      const lin = (c: number) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      };
      const lum = (rgb: readonly number[]) =>
        0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
      const ratio = (a: readonly number[], b: readonly number[]) => {
        const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
        return (hi + 0.05) / (lo + 0.05);
      };
      // 바탕은 조상 방향으로 알파를 합성해 구한다(투명이면 위로 올라간다).
      const backdrop = (from: Element | null): number[] => {
        const layers: (readonly number[])[] = [];
        for (let node = from; node; node = node.parentElement) {
          const c = parse(getComputedStyle(node).backgroundColor);
          if (c && c[3] > 0) {
            layers.push(c);
            if (c[3] >= 1) break;
          }
        }
        let [r, g, b] = [255, 255, 255];
        if (!layers.some((layer) => layer[3] >= 1)) {
          const root = parse(getComputedStyle(document.body).backgroundColor);
          if (root) [r, g, b] = root;
        }
        for (const layer of layers.reverse()) {
          r = layer[0] * layer[3] + r * (1 - layer[3]);
          g = layer[1] * layer[3] + g * (1 - layer[3]);
          b = layer[2] * layer[3] + b * (1 - layer[3]);
        }
        return [r, g, b];
      };

      // 보이는 표시는 포커스된 요소 자신이거나(전역 규칙), 숨긴 입력을 감싼 라벨·형제다. 8px 미만(sr-only)은 제외한다.
      const indicators = [...document.querySelectorAll<HTMLElement>('body *')].filter((el) => {
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return (
          style.outlineStyle !== 'none' &&
          parseFloat(style.outlineWidth) > 0 &&
          rect.width >= 8 &&
          rect.height >= 8
        );
      });
      const name =
        `${active.tagName.toLowerCase()}` +
        `${active.id ? `#${active.id}` : ''}` +
        `[${(active.getAttribute('aria-label') ?? active.textContent ?? '').trim().slice(0, 24)}]`;
      if (indicators.length === 0) return { name, issues: ['포커스 표시 없음'] } as const;
      const issues: string[] = [];
      for (const el of indicators) {
        const style = getComputedStyle(el);
        const color = parse(style.outlineColor);
        const width = parseFloat(style.outlineWidth);
        const offset = parseFloat(style.outlineOffset);
        if (style.outlineStyle !== 'solid') issues.push(`선 모양 ${style.outlineStyle}`);
        if (width < 2) issues.push(`두께 ${width}px`);
        if (offset !== 2) issues.push(`offset ${offset}px`);
        if (!color || color[3] < 1) issues.push(`반투명/해석 불가 색 ${style.outlineColor}`);
        else {
          const against = backdrop(el.parentElement);
          const value = ratio(color, against);
          if (value < 3)
            issues.push(
              `대비 ${value.toFixed(2)}:1 (${el.tagName.toLowerCase()} outline ${style.outlineColor} on ${against.map(Math.round).join(',')})`,
            );
        }
      }
      return { name, issues } as const;
    });
    if ('body' in result) {
      // 화면 첫머리·브라우저 UI로 빠진 경우다. 연속으로 빠지면 한 바퀴를 돈 것으로 본다.
      bodyStops += 1;
      if (bodyStops >= 3) break;
      continue;
    }
    bodyStops = 0;
    if ('end' in result) break;
    seen.add(`${index}:${result.name}`);
    for (const reason of result.issues) {
      violations.push({ path: label, stop: result.name, reason });
    }
  }
  expect(seen.size, `${label}: Tab으로 도달한 요소 수`).toBeGreaterThanOrEqual(minStops);
  return { violations, stops: seen.size };
}
