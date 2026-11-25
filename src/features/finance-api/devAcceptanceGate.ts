/**
 * DEV acceptance gate. Only the dedicated `dev-acceptance` build mode can enable a DEV switch.
 *
 * Keyed on `MODE`, not `PROD`: the acceptance build runs with NODE_ENV=production (minified,
 * same as PROD), so a `!PROD` check would not separate it from production.
 */
export const DEV_ACCEPTANCE_MODE = 'dev-acceptance';

export function isDevAcceptanceFlagEnabled(flag: string | undefined, mode: string | undefined) {
  return mode === DEV_ACCEPTANCE_MODE && flag === 'true';
}
