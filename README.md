# AI 투자 체크리스트 — Frontend

Capacitor 기반 iOS/Android 출시를 목표로 하는 Vite + React + TypeScript SPA.
SSR/Next.js/React Router Framework Mode는 사용하지 않는다.

이 시점은 **빌드 · 라우팅(공개 웹/앱 URL 경계) · 모바일 레이아웃 골격 · 공개 웹
Pre-render/SPA fallback 계약 · 한국어·영어 i18n 기반**까지 구현된 단계다. 실제
와이어프레임 UI, API 연동, 데이터, 정책 로직 구현은 다음 단계에서 진행한다.

단계별 실행 순서와 PR 경계는 [`docs/frontend-roadmap.md`](./docs/frontend-roadmap.md)를 따른다.

## ⚠️ P0 — 출시 전 반드시 처리해야 할 항목

1. **공식 Capacitor `appId`(reverse-domain) 확정.** 확정 전까지 `ios/`,
   `android/` 네이티브 프로젝트를 생성하지 않는다.
2. `appId` 확정 후 `capacitor.config.ts`에 `appId` 필드를 추가한다.
3. 그 다음에만 `pnpm cap:add:ios` / `pnpm cap:add:android`를 실행한다.

## 런타임 요구사항

- Node.js **`>=22.22.0 <23`** (`package.json.engines`, `.node-version`, `.nvmrc` 동일 기준)
- 패키지 매니저: **pnpm** (`packageManager: pnpm@11.15.1`). 다른 매니저의
  lockfile을 커밋하지 않는다.

버전 매니저(nvm/fnm/mise/asdf 등)가 없는 환경에서는 Homebrew로 설치할 수 있다
(전역 `node` 심볼릭은 변경하지 않는 keg-only 설치):

```bash
brew install node@22
NODE22_BIN="$(brew --prefix node@22)/bin"
"$NODE22_BIN/node" --version   # >=22.22.0 <23 확인
```

**`corepack enable`은 실행하지 않는다** — Node 바이너리 인접 경로에 전역
shim/심볼릭을 만들 수 있기 때문이다. 대신 Corepack을 매번 직접 경유해서
`package.json`의 `packageManager` 필드가 지정하는 pnpm 버전으로 실행한다:

```bash
"$NODE22_BIN/corepack" pnpm install
"$NODE22_BIN/corepack" pnpm run dev
```

(이미 PATH에 Node `>=22.22.0 <23`이 잡혀 있다면 `corepack pnpm ...`처럼 짧게 써도 된다.)

## Scripts

| 목적                            | 명령                            |
| ------------------------------- | ------------------------------- |
| 개발 서버                       | `pnpm dev`                      |
| 프로덕션 build                  | `pnpm build`                    |
| build 결과 미리보기             | `pnpm preview`                  |
| lint                            | `pnpm lint`                     |
| 포맷 적용                       | `pnpm format`                   |
| 포맷 검사만                     | `pnpm format:check`             |
| 타입체크                        | `pnpm typecheck`                |
| 유닛 테스트 (1회)               | `pnpm test`                     |
| 유닛 테스트 (watch)             | `pnpm test:watch`               |
| E2E 테스트                      | `pnpm test:e2e`                 |
| 전체 검증 (E2E 제외)            | `pnpm verify`                   |
| 전체 검증 (E2E 포함)            | `pnpm verify:full`              |
| build 2회 실행 stale 검증(별도) | `pnpm verify:build-idempotency` |
| iOS 네이티브 프로젝트 생성      | `pnpm cap:add:ios`              |
| Android 네이티브 프로젝트 생성  | `pnpm cap:add:android`          |
| Capacitor sync                  | `pnpm cap:sync`                 |
| iOS 프로젝트 열기               | `pnpm cap:open:ios`             |
| Android 프로젝트 열기           | `pnpm cap:open:android`         |

`cap:add:ios`/`cap:add:android`는 공식 reverse-domain `appId` 확정과 각 플랫폼
개발 도구(Xcode/Android SDK) 설치 이후에만 실행한다 — 위 P0 항목 참고. `cap:sync`는
표준 `build` 스크립트를 재사용한 뒤 sync한다.

`verify`는 `format:check → lint → typecheck → test → build` 순으로 실행한다.
`verify:full`은 여기에 Playwright E2E를 더한다. `build`는 타입체크·클라이언트
빌드에 더해 공개 웹 Pre-render 파이프라인(SSR 빌드 → 정적 HTML 생성 → 자동 산출물
검증)까지 실행한다 — 자세한 단계는
[`docs/route-architecture.md`](./docs/route-architecture.md) §5.1 참고.
`verify:build-idempotency`는 `build`를 두 번 연속 실행해 stale 산출물이 없는지
확인하는 **별도** 명령이며, `verify`/`verify:full` 기본 체인에는 포함하지 않는다
(build를 반복 호출하는 코드를 이 명령 하나로 한정하기 위함).

## E2E 테스트 준비

Playwright는 **Chromium만** 설치한다:

```bash
pnpm exec playwright install chromium
```

## 폴더 구조

```
src/
├── app/          # 라우터(AppRouter.tsx) — 유일한 라우트 트리 정의처
├── entry-server.tsx  # SSR 전용 렌더 엔트리(Vite --ssr 빌드 대상, 신규 dependency 없음)
├── pages/        # 라우트 단위 페이지 컴포넌트 (현재는 전부 스켈레톤/placeholder)
├── prerender/    # Pre-render 매니페스트(manifest.ts) + hydrate 판별(shouldHydrate.ts), 순수 모듈
├── components/
│   ├── ui/       # shadcn/ui 컴포넌트
│   └── layout/   # AppShell, TabLayout, BottomNavigation, PublicLayout 등
├── constants/    # routes(공개/앱 분리), navigation(하단 탭), policy(감정 태그)
├── lib/          # 공통 utility (cn 등)
├── styles/       # globals.css(Tailwind v4 + 토큰), fonts.css
├── assets/fonts/ # Pretendard 가변 폰트(self-host)
└── test/         # Vitest 셋업

scripts/          # build 파이프라인 스크립트(전부 순수 Node, 신규 dependency 없음)
├── prerender.mjs                  # SSR 결과 → 정적 HTML 조립, dist-ssr 정리
├── verify-prerender-output.mjs    # 현재 dist/ 산출물만 검증(build 재호출 없음)
└── verify-build-idempotency.mjs   # build 2회 실행 후 stale 여부 확인(별도 명령)

e2e/support/fixtureServer.ts  # provider-neutral SPA fallback 계약을 구현한 테스트 전용 정적 서버
```

## 정책

제품 정책 원본은 [`docs/product-policy.md`](./docs/product-policy.md) 하나다.
`CLAUDE.md`/`AGENTS.md`는 이 문서를 참조만 한다.

## 라우트

라우트 목록의 기준 문서는 [`docs/nav-map.md`](./docs/nav-map.md), 공개 웹/앱 경계 설계는
[`docs/route-architecture.md`](./docs/route-architecture.md)다. 경로 정의 단일 소스는
[`src/constants/routes.ts`](./src/constants/routes.ts)다.

URL은 공개 웹(`/:locale/*`)과 웹앱(`/app/*`)으로 분리된다. 루트 `/`는 콘텐츠 없이
기본 로케일 `/ko`로 redirect된다.

**공개 웹 (`/:locale`, `locale` ∈ `ko`·`en`)**

| Path                | 화면            | 비고                              |
| ------------------- | --------------- | --------------------------------- |
| `/`                 | (redirect)      | `/ko`로 replace redirect          |
| `/:locale`          | 공개 웹 홈      | placeholder (실제 UI는 후속 STEP) |
| `/:locale/features` | 기능 소개       | placeholder                       |
| `/:locale/learn/*`  | 학습            | placeholder                       |
| `/:locale/*`        | Public NotFound | 미지원 locale도 여기로 처리       |

**웹앱 (`/app/*`)**

| Path                      | 화면               | 하단 탭 |
| ------------------------- | ------------------ | ------- |
| `/app`                    | Home               | 있음    |
| `/app/ask`                | Ask 결과           | 있음    |
| `/app/journal`            | 기록 목록          | 있음    |
| `/app/onboarding`         | 온보딩             | 없음    |
| `/app/journal/new`        | 일지/공부노트 저장 | 없음    |
| `/app/journal/:id`        | 일지 상세          | 없음    |
| `/app/journal/:id/review` | 복기               | 없음    |
| `/app/*`                  | App NotFound       | 없음    |

## Pre-render + 배포 시 SPA Fallback 계약 (STEP 6)

공개 웹 고정 경로(`/ko`, `/en`, `/ko/features`, `/en/features`, `/ko/learn`,
`/en/learn`)는 `pnpm build` 시점에 정적 HTML로 생성된다(`scripts/prerender.mjs`,
Vite 코어 `--ssr` 빌드 + `renderToString`, 신규 dependency 없음). `/app/*`는 여전히
`BrowserRouter`(`src/main.tsx`) 기반 SPA다. Pre-render된 결과는 클라이언트가
`hydrateRoot`로 재사용하고(root의 `data-render-mode="prerender"` marker 기준), 그 외
(`/app/*` 포함)는 `createRoot`로 렌더한다. 자세한 파이프라인·계약은
[`docs/route-architecture.md`](./docs/route-architecture.md) §5 참고.

배포 환경(정적 호스팅)은 다음 우선순위를 반드시 보장해야 한다:

1. **실제 정적 파일**(`/assets/*` 등)은 그대로 제공.
2. **`<path>/index.html`**이 존재하면 그 파일을 제공(trailing slash 포함 — `/ko`와
   `/ko/` 모두 `dist/ko/index.html`로 resolve).
3. **asset으로 판별된 요청인데 파일이 없으면 404** — `index.html`로 새지 않는다(MIME
   오류 방지).
4. **그 외 HTML document 요청**(`Accept: text/html`)만 `dist/index.html`로 fallback —
   `/app/*`, `/`, 미지원 locale(`/fr` 등), 아직 Pre-render되지 않은 `/:locale/*` 하위
   경로가 모두 여기 포함된다. 이 rewrite가 없으면 `/app/journal/123`처럼 정적 파일이
   아닌 경로를 직접 열거나 새로고침할 때 호스팅 자체 404로 끝나 앱의
   `PublicNotFoundPage`/`NotFoundPage` 계약이 무너진다.
5. **그 밖의 요청**(예: `Accept: application/json`)은 404 — SPA fallback을 적용하지
   않는다.

- 루트 `/`는 **JavaScript 활성 환경에서만** `/ko`로 이동한다(`RootRedirect`). JS 실행
  전/비활성 환경의 redirect는 이번 STEP 범위 밖이며, hosting provider 확정 후
  provider-specific 설정으로 보강한다(`docs/route-architecture.md` §5.3).
- `pnpm preview`(`vite preview`)가 로컬에서 성공적으로 동작하는 것은 이 rewrite
  설정이 실제 운영 호스팅에도 있다는 것을 보장하지 않는다 — `vite preview`는
  자체적으로 SPA fallback을 처리하기 때문이다. 위 규칙은
  `e2e/support/fixtureServer.ts`(provider-neutral, 신규 dependency 없음)로 별도
  검증한다(`e2e/prerender.spec.ts`). 실제 배포 대상 호스팅에서도 직접 경로
  새로고침을 확인해야 한다.
- 특정 클라우드/호스팅 업체의 설정 파일은 이 저장소에 두지 않는다. 배포 대상이
  정해지면 그 업체의 rewrite 설정 문서를 따로 참고할 것(provider 자체는 아직
  미확정).

## i18n 기반 (STEP 7)

지원 언어는 `ko`·`en` 두 개뿐이다(`src/constants/routes.ts`의 `SUPPORTED_LOCALES`가
단일 원본). 구현은 신규 dependency 없이 React Context + 타입 안전 로컬 dictionary로
한다(`src/i18n/`) — `i18next` 등은 도입하지 않았다.

- **공개 웹(`/:locale`):** URL의 `:locale`이 유일한 source of truth다.
  `PublicLayout`이 locale을 검증한 뒤 `I18nProvider`로 주입하고, 하위 페이지는
  `useTranslation()`만 사용한다(반복 `useParams` 없음). 저장된 앱 locale이나
  `navigator.language`로 URL locale을 대체하지 않는다. `LocaleSwitcher`
  (`src/components/layout/LocaleSwitcher.tsx`)가 최소 텍스트 링크 2개로 현재
  route의 대응 locale 경로로 이동한다(query string·hash·learn 하위 slug 보존,
  `aria-current`로 현재 locale 표시). 미지원 locale(`/fr` 등)은 여전히 redirect
  없이 `PublicNotFoundPage`를 렌더하되, 유효한 URL locale이 없는 두 지점
  (`PublicLayout`의 unsupported-locale 분기, `AppRouter`의 최상위 `*` catch-all)은
  `PublicNotFoundFallback`이 `DEFAULT_LOCALE`(ko) provider를 스스로 소유해 렌더한다
  — 저장된 앱 locale이나 `navigator.language`로 추측하지 않는다.
- **앱(`/app/*`):** URL에는 locale prefix가 없다. `AppShell`이 제공하는
  `AppLocaleProvider`(`src/i18n/AppLocaleProvider.tsx`)가 `localStorage`(검증된 값만
  신뢰) → 정규화된 `navigator.language` → `DEFAULT_LOCALE` 우선순위로 초기 locale을
  동기 계산한다(원격 로딩이 없어 별도 loading shell 불필요). 서버 세션·cookie에는
  의존하지 않아 Capacitor WebView에서도 동일하게 동작한다. `useAppLocale()`이
  `{ locale, setLocale }` API를 제공하며, 같은 탭에서 즉시 반영되고 best-effort로
  저장된다(저장 실패해도 크래시하지 않고 세션 내 상태만 유지). 공개 URL locale과는
  완전히 독립적이다 — `/en` 방문이 앱 저장 locale을 바꾸지 않고, 앱 locale 변경도
  공개 URL에 영향을 주지 않는다.
- **루트 `/`:** 여전히 `/ko` 고정이다. 브라우저 언어 자동 감지는 이번 STEP에서
  도입하지 않았다 — hosting provider 확정 이후 서버/엣지 레벨에서 다루기로
  명시적으로 미뤘다.
- **`document.documentElement.lang` 동기화:** 초기 Pre-render HTML의 `lang`은 빌드
  시점에 로케일별로 정확히 생성된다(`scripts/prerender.mjs`). 이후 클라이언트에서
  locale이 바뀌는 모든 경로(LocaleSwitcher 전환, 앱 locale 복원/변경)는
  `I18nProvider` 하나가 `useEffect`로 `document.documentElement.lang`을 동기화한다 —
  SSR/Pre-render 중에는 `document`/`window`를 참조하지 않는다.
- **번역 리소스:** `src/i18n/messages/{ko,en}.ts`가 `src/i18n/dictionary.ts`의
  `Messages` 인터페이스를 각각 만족해야 하므로, 키 누락·shape 불일치는
  `pnpm typecheck`에서 컴파일 에러로 즉시 잡힌다.
