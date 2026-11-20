/** Invented normalized signals; not market data. Ties choose sector. */
export function syntheticLens(sector: number, macro: number) {
  if (![sector, macro].every((n) => Number.isFinite(n) && n >= 0 && n <= 1))
    throw new Error('Signals must be between 0 and 1.');
  return {
    facts: [`Synthetic sector concentration: ${sector}`, `Synthetic broad macro signal: ${macro}`],
    interpretation:
      sector < 0.6 && macro < 0.6
        ? 'Both signals are weak.'
        : sector >= macro
          ? 'The sector signal is stronger or tied.'
          : 'The macro signal is stronger.',
    next:
      sector < 0.6 && macro < 0.6 ? null : sector >= macro ? 'Sector concentration' : 'Broad macro',
  };
}
