import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Production bundle guard. Builds production with every DEV acceptance switch forced ON and
 * asserts the DEV-only signup endpoint never reaches the output. The switches are on so the check
 * proves the production mode gate, not merely the absence of flags.
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'node_modules', '.cache', 'prod-bundle-guard');
const FORBIDDEN = ['finance-reference/signup'];

rmSync(OUT_DIR, { recursive: true, force: true });
execFileSync(
  process.execPath,
  [
    join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'),
    'build',
    '--outDir',
    OUT_DIR,
    '--emptyOutDir',
  ],
  {
    cwd: ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      VITE_FINANCE_REFERENCE_AUTH_ENABLED: 'true',
      VITE_FINANCE_REFERENCE_SIGNUP_ENABLED: 'true',
      VITE_FINANCE_JOURNAL_CREATE_ENABLED: 'true',
    },
  },
);

function listFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

const files = listFiles(OUT_DIR).filter((file) => /\.(js|mjs|html|css|map|json)$/.test(file));
const scannedJs = files.filter((file) => file.endsWith('.js'));
if (scannedJs.length === 0) {
  console.error(`verify-prod-bundle: no JavaScript emitted under ${OUT_DIR}`);
  process.exit(1);
}

const hits = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const needle of FORBIDDEN) {
    if (text.includes(needle)) hits.push(`${needle} <- ${file}`);
  }
}

if (hits.length > 0) {
  console.error('verify-prod-bundle: DEV-only string found in production output:');
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}
console.log(
  `verify-prod-bundle: ok (${files.length} files scanned, ${scannedJs.length} JS, no forbidden strings)`,
);
