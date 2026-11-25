/**
 * DEV-only acceptance switches. Each is default OFF and is never effective in a production build,
 * regardless of the flag value.
 */
export function isFinanceJournalCreateDevEnabled(flag: string | undefined, production: boolean) {
  return flag === 'true' && !production;
}
