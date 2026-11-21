/** Mirrors segment-based server routing for the disabled local holding proxy gate. */
export function isLocalHoldingPath(rawUrl: string): boolean {
  const pathname = decodeURIComponent(rawUrl.split(/[?#]/, 1)[0]);
  const segments: string[] = [];
  for (const rawSegment of pathname.split('/')) {
    const segment = rawSegment.split(';', 1)[0];
    if (!segment || segment === '.') continue;
    if (segment === '..') segments.pop();
    else segments.push(segment);
  }
  return segments[0] === 'finance' && segments[1] === 'local-holding';
}
