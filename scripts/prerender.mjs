import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_DIR = join(ROOT, 'dist');
const DIST_SSR_DIR = join(ROOT, 'dist-ssr');
const CLIENT_TEMPLATE_PATH = join(DIST_DIR, 'index.html');
const SSR_ENTRY_PATH = join(DIST_SSR_DIR, 'entry-server.js');
/**
 * `verify-prerender-output.mjs`가 build를 재호출하지 않고도 "무엇이 생성되어야
 * 하는지" 알 수 있도록 남기는 매니페스트 스냅샷. `dist/` 밖(배포 대상 아님)에
 * 기록하고 `.gitignore`에 등록된 build 산출물이다.
 */
const MANIFEST_SNAPSHOT_PATH = join(ROOT, '.prerender-manifest.json');

const ROOT_DIV_PLACEHOLDER = '<div id="root"></div>';
/**
 * 클라이언트 템플릿(`index.html`)의 기본 lang. 모든 Pre-render 산출물은 이 값을
 * 자신의 로케일로 치환한다 — 그대로 두면 `dist/en/*.html`도 `lang="ko"`로 나가
 * 실제 표시 언어와 어긋난다(STEP 7 i18n 도입으로 처음 드러나는 문제).
 */
const LANG_ATTR_PLACEHOLDER = '<html lang="ko">';

/**
 * build 후처리 오케스트레이션. `dist/index.html`(SPA shell)은 절대 수정하지 않고
 * 그대로 둔 채, 컴파일된 SSR 번들(`dist-ssr/entry-server.js`)에서 매니페스트와
 * render 함수를 가져와 공개 웹 고정 경로마다 별도 정적 HTML을 만든다. 매 반복은
 * 항상 불변인 `template` 원본에서 새로 파생하므로(누적 치환 아님), 로케일별 산출물이
 * 서로의 상태를 오염시키지 않는다.
 *
 * `<noscript>` meta refresh 등 root redirect 관련 삽입은 하지 않는다 — `/`의
 * JS 비활성 redirect는 이번 STEP 범위 밖(호스팅 provider 결정 이후)이다.
 */
async function main() {
  const template = readFileSync(CLIENT_TEMPLATE_PATH, 'utf-8');
  if (!template.includes(ROOT_DIV_PLACEHOLDER)) {
    throw new Error(
      `${CLIENT_TEMPLATE_PATH}에서 "${ROOT_DIV_PLACEHOLDER}" placeholder를 찾을 수 없습니다.`,
    );
  }
  if (!template.includes(LANG_ATTR_PLACEHOLDER)) {
    throw new Error(
      `${CLIENT_TEMPLATE_PATH}에서 "${LANG_ATTR_PLACEHOLDER}" placeholder를 찾을 수 없습니다.`,
    );
  }

  const { render, PRERENDER_MANIFEST } = await import(SSR_ENTRY_PATH);

  for (const { path, outFile, locale } of PRERENDER_MANIFEST) {
    const innerHtml = render(path);
    const markedRoot = `<div id="root" data-render-mode="prerender">${innerHtml}</div>`;
    const html = template
      .replace(ROOT_DIV_PLACEHOLDER, markedRoot)
      .replace(LANG_ATTR_PLACEHOLDER, `<html lang="${locale}">`);

    const outPath = join(DIST_DIR, outFile);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, html, 'utf-8');
    console.log(`[prerender] ${path} -> dist/${outFile} (lang=${locale})`);
  }

  writeFileSync(MANIFEST_SNAPSHOT_PATH, JSON.stringify(PRERENDER_MANIFEST, null, 2), 'utf-8');
  rmSync(DIST_SSR_DIR, { recursive: true, force: true });
  console.log(`[prerender] ${PRERENDER_MANIFEST.length}개 경로 생성 완료, dist-ssr 정리됨.`);
}

main().catch((error) => {
  console.error('[prerender] 실패:', error);
  process.exitCode = 1;
});
