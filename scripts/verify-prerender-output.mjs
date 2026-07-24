import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_DIR = join(ROOT, 'dist');
const DIST_SSR_DIR = join(ROOT, 'dist-ssr');
const ASSETS_DIR = join(DIST_DIR, 'assets');
const CLIENT_SHELL_PATH = join(DIST_DIR, 'index.html');
const MANIFEST_SNAPSHOT_PATH = join(ROOT, '.prerender-manifest.json');

const PRERENDER_MARKER = 'data-render-mode="prerender"';
const ASSET_TAG_PATTERN = /(?:src|href)="(\/assets\/[^"]+)"/g;

/**
 * `pnpm build` 파이프라인의 **현재 산출물만** 검증한다. 이 스크립트 자신은
 * `vite build`·`tsc -b` 등 어떤 build도 다시 호출하지 않는다(요청 명시) — 재귀적
 * build 실행 가능성을 원천 차단하기 위함이다. 두 번 연속 build 시 stale 산출물이
 * 남지 않는지는 별도 명령(`scripts/verify-build-idempotency.mjs`)의 책임이다.
 */
const failures = [];

function fail(message) {
  failures.push(message);
}

function readDist(relativePath) {
  const fullPath = join(DIST_DIR, relativePath);
  if (!existsSync(fullPath)) return null;
  return readFileSync(fullPath, 'utf-8');
}

function main() {
  if (!existsSync(MANIFEST_SNAPSHOT_PATH)) {
    fail(
      `매니페스트 스냅샷(${MANIFEST_SNAPSHOT_PATH})이 없습니다 — ` +
        'scripts/prerender.mjs가 먼저 실행되었는지 확인하세요.',
    );
    report();
    return;
  }
  const manifest = JSON.parse(readFileSync(MANIFEST_SNAPSHOT_PATH, 'utf-8'));

  if (!existsSync(ASSETS_DIR)) {
    fail(`${ASSETS_DIR}가 존재하지 않습니다.`);
  }
  const actualAssetFiles = existsSync(ASSETS_DIR) ? new Set(readdirSync(ASSETS_DIR)) : new Set();

  // 1) SPA shell: marker 없어야 함
  const shellHtml = readDist('index.html');
  if (shellHtml === null) {
    fail(`${CLIENT_SHELL_PATH}(SPA shell)가 존재하지 않습니다.`);
  } else if (shellHtml.includes(PRERENDER_MARKER)) {
    fail(`${CLIENT_SHELL_PATH}(SPA shell)에 prerender marker가 들어있으면 안 됩니다.`);
  }

  // 2) 매니페스트의 각 산출물: 존재 + marker 포함 + asset 경로 일치
  for (const { path, outFile } of manifest) {
    const html = readDist(outFile);
    if (html === null) {
      fail(`매니페스트 경로 "${path}"의 산출물 dist/${outFile}이 존재하지 않습니다.`);
      continue;
    }
    if (!html.includes(PRERENDER_MARKER)) {
      fail(`dist/${outFile}에 prerender marker가 없습니다(경로: ${path}).`);
    }

    const referencedAssets = [...html.matchAll(ASSET_TAG_PATTERN)].map((m) => m[1]);
    if (referencedAssets.length === 0) {
      fail(`dist/${outFile}에서 /assets/* 참조를 찾지 못했습니다(경로: ${path}).`);
    }
    for (const assetPath of referencedAssets) {
      const assetFileName = assetPath.replace(/^\/assets\//, '');
      if (!actualAssetFiles.has(assetFileName)) {
        fail(
          `dist/${outFile}이 참조하는 "${assetPath}"가 dist/assets/에 없습니다(해시 불일치 가능성).`,
        );
      }
    }
  }

  // 3) 로케일 하위 디렉터리에 asset이 복제되지 않았는지
  const localeDirs = new Set(manifest.map(({ outFile }) => outFile.split('/')[0]));
  for (const localeDir of localeDirs) {
    const candidateAssetsDir = join(DIST_DIR, localeDir, 'assets');
    if (existsSync(candidateAssetsDir)) {
      fail(`dist/${localeDir}/assets/가 존재합니다 — asset이 복제되면 안 됩니다.`);
    }
  }

  // 4) dist-ssr 정리 확인
  if (existsSync(DIST_SSR_DIR)) {
    fail(`${DIST_SSR_DIR}가 정리되지 않았습니다(임시 산출물이 남아있음).`);
  }

  report();
}

function report() {
  if (failures.length > 0) {
    console.error('[verify-prerender-output] 실패:');
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log('[verify-prerender-output] 통과: Pre-render 산출물이 계약대로 생성되었습니다.');
}

main();
