import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_DIR = join(ROOT, 'dist');

/**
 * `pnpm build`를 **두 번 연속 실행**해 stale 산출물이 남지 않는지 확인하는 전용
 * 명령. `scripts/verify-prerender-output.mjs`(단일 build 산출물만 검증, build를
 * 재호출하지 않음)와 의도적으로 분리되어 있다 — build를 재귀적으로 실행할 수
 * 있는 코드는 이 파일 하나로 한정한다. `pnpm verify`/`pnpm verify:full`의 기본
 * 체인에는 포함하지 않고, 필요할 때 수동/CI에서 별도로 호출한다.
 */
function listDistFiles() {
  const results = [];
  function walk(dir, prefix) {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      const relPath = prefix ? `${prefix}/${entry}` : entry;
      if (statSync(fullPath).isDirectory()) {
        walk(fullPath, relPath);
      } else {
        results.push(relPath);
      }
    }
  }
  walk(DIST_DIR, '');
  return results.sort();
}

function runBuild() {
  execFileSync('pnpm', ['run', 'build'], { cwd: ROOT, stdio: 'inherit' });
}

function main() {
  console.log('[verify-build-idempotency] 1차 build 실행...');
  runBuild();
  const firstFileList = listDistFiles();

  console.log('[verify-build-idempotency] 2차 build 실행...');
  runBuild();
  const secondFileList = listDistFiles();

  const onlyInFirst = firstFileList.filter((f) => !secondFileList.includes(f));
  const onlyInSecond = secondFileList.filter((f) => !firstFileList.includes(f));

  if (onlyInFirst.length > 0 || onlyInSecond.length > 0) {
    console.error('[verify-build-idempotency] 실패: 두 build의 dist/ 파일 목록이 다릅니다.');
    if (onlyInFirst.length > 0) console.error('  1차에만 존재:', onlyInFirst);
    if (onlyInSecond.length > 0) console.error('  2차에만 존재(stale 가능성):', onlyInSecond);
    process.exitCode = 1;
    return;
  }

  console.log(
    `[verify-build-idempotency] 통과: 두 build 모두 동일한 ${firstFileList.length}개 파일을 산출했습니다(stale 없음).`,
  );
}

main();
