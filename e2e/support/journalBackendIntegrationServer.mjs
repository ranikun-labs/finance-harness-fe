import { spawn } from 'node:child_process';

const HOST = '127.0.0.1';
const PORT = 4174;
const apiTarget = process.env.FINANCE_API_PROXY_TARGET ?? 'http://127.0.0.1:8081';

const vite = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', '--host', HOST, '--port', String(PORT), '--strictPort'],
  {
    env: { ...process.env, FINANCE_API_PROXY_TARGET: apiTarget },
    stdio: 'inherit',
  },
);

let stopping = false;
function stop(signal = 'SIGTERM') {
  if (stopping) return;
  stopping = true;
  vite.kill(signal);
}

process.once('SIGINT', () => stop('SIGINT'));
process.once('SIGTERM', () => stop('SIGTERM'));
vite.once('exit', (code) => {
  process.exitCode = code ?? 1;
});
