# 라우팅 경계 설계 (STEP 5) + Pre-render/SPA fallback 계약 (STEP 6)

> 이 문서는 `docs/frontend-roadmap.md`의 **STEP 5**(공개 웹/앱 URL 경계)와 **STEP 6**
> (Pre-render + `/app/*` SPA 렌더링/호스팅 fallback 계약) 산출물이다. STEP 5는 URL
> 소유권·라우트 트리 경계를, STEP 6은 그 경계를 실제 정적 산출물·hydration·
> provider-neutral fallback 계약으로 구현한다.
>
> 라우트 정의 단일 소스는 [`src/constants/routes.ts`](../src/constants/routes.ts), 화면·라우트
> 기준 문서는 [`docs/nav-map.md`](./nav-map.md)다. 이 문서는 그 원본들을 **복제하지 않고
> 참조**한다. 경로 문자열은 항상 `src/constants/routes.ts`가 canonical source다.
>
> §1~4는 STEP 5 산출물(경계 결정), **§5는 STEP 6 산출물(구현 완료)**이다.

## 1. URL 소유권 경계

URL은 세 갈래로 소유된다.

| 소유 도메인    | 경로                      | 렌더링                           | 레이아웃                                                 | NotFound             |
| -------------- | ------------------------- | -------------------------------- | -------------------------------------------------------- | -------------------- |
| 루트 redirect  | `/`                       | 콘텐츠 없음(redirect)            | —                                                        | —                    |
| 공개 웹        | `/:locale/*` (`ko`\|`en`) | 정적 Pre-render **목표**(STEP 6) | `PublicLayout`                                           | `PublicNotFoundPage` |
| 웹앱·Capacitor | `/app/*`                  | SPA                              | adaptive `AppShell` (+ primary navigation은 `TabLayout`) | `NotFoundPage`       |

STEP 5는 **`BrowserRouter` 기반 SPA를 유지**한다. Pre-render 라이브러리·호스팅 rewrite·정적
산출물 검증은 STEP 6에서 다룬다.

## 2. 목표 라우트 트리 (구현됨)

```text
/                         → RootRedirect → /ko (replace)

/:locale                  → PublicHomePage        (PublicLayout이 locale 검증)
/:locale/features         → FeaturesPage
/:locale/learn/*          → LearnPage
/:locale/*                → PublicNotFoundPage
  ※ 미지원 locale(/fr 등)도 PublicLayout에서 PublicNotFoundPage로 처리(redirect 아님)

/app                      → HomePage              (검토 시작 owner, index)
/app/ask                  → AskPage               (내부 검토 결과, ?q=)
/app/journal              → JournalListPage       (저널 Primary Surface)
/app/onboarding           → OnboardingPage        (하단 탭 X)
/app/journal/new          → JournalNewPage        (Phone 하단 탭 X; Tablet 이상 primary nav, ?type=investment|study)
/app/journal/:id          → JournalDetailPage     (Phone 하단 탭 X; Tablet 이상 primary nav)
/app/journal/:id/review   → JournalReviewPage     (Phone 하단 탭 X; Tablet 이상 primary nav)
/app/*                    → NotFoundPage(app)     (하단 탭 X)
```

정적 세그먼트 `/app`은 동적 `/:locale`보다 우선 매칭된다(단위 테스트로 고정).

## 3. 확정된 결정

### 3.1 루트 `/` 처리

- **결정:** `/`는 콘텐츠 없이 canonical 기본 로케일 `/ko`로 `<Navigate replace>` 한다.
- **근거:** 바 도메인은 검색·공유 유입(마케팅) 표면. 앱은 `/app` 뒤에 둔다. 로케일은 URL에
  항상 명시(프리픽스 없는 콘텐츠 경로 없음).
- **후속:** 정적 redirect 산출(호스팅)은 STEP 6. STEP 7에서 루트 `/`의 브라우저 언어
  자동 감지 도입 여부를 검토했으나 **도입하지 않기로 명시적으로 결정**했다(§6.1) —
  hosting provider 확정 후 서버/엣지 레벨에서 다루는 편이 낫다고 판단. native
  시작경로 `/app`은 STEP 13.

### 3.2 기존 프리픽스 없는 경로 (clean cutover)

- **결정:** `/onboarding`·`/ask`·`/journal`·`/journal/new`·`/journal/:id`·
  `/journal/:id/review`는 **삭제**한다. alias·redirect를 만들지 않는다. 유일한 신규
  redirect는 `/`→`/ko`뿐이다.
- **근거:** 외부 사용자·SEO 자산이 없는 스켈레톤 경로. alias는 영구 유지비이자 경계 침범
  요인.
- **결과:** 삭제된 경로는 공개 NotFound로 떨어진다(redirect도, 앱 화면 렌더도 아님 —
  테스트로 고정).

### 3.3 로케일

- **결정:** 지원 로케일은 `ko`, `en` 두 개뿐. `SUPPORTED_LOCALES`(as const)·`Locale` 타입·
  `isSupportedLocale`·`DEFAULT_LOCALE`이 단일 원본(`src/constants/routes.ts`).
- **미지원 locale:** `PublicLayout`에서 검증해 `PublicNotFoundPage` 렌더(redirect 아님).
- **STEP 5 시점 비도입, STEP 7에서 결정됨:** i18n 라이브러리(§6.4 — 결과적으로도
  도입하지 않음, 신규 dependency 0개), `navigator.language` 감지(§6.2 — 결과적으로
  앱(`/app/*`) locale 우선순위에만 도입, 공개 웹 URL locale·루트 `/`에는 적용하지
  않음).

### 3.4 라우트 상수·path builder

- `ROUTE_PATHS`를 `PUBLIC_ROUTE_PATHS` / `APP_ROUTE_PATHS`로 분리(같은 파일).
- 앱 프리픽스는 `APP_BASE`(`/app`) 한 곳에서만 정의. 앱 경로는 이를 조합해 파생.
- Path builder: 공개(`buildLocaleHomePath`/`buildFeaturesPath`/`buildLearnPath`),
  앱(`buildAppAskPath`/`buildAppJournalNewPath`/`buildAppJournalDetailPath`/
  `buildAppJournalReviewPath`). 쿼리(`?q=`, `?type=`)·id 인코딩 계약 보존.
- 중첩 라우트 상대경로는 `toRelativeUnder(base, absolute)`로 파생(문자열 중복 방지).

### 3.5 레이아웃·NotFound 경계

> 아래 3-tab/480px 설명은 STEP 5 당시 구현 이력이다. 현재 adaptive presentation
> contract는 §7이 supersede한다.

- **앱 URL 경계(`/app/*` = `AppShell`)와 하단 탭 셸 경계(`TabLayout`)는 동일하지 않다.**
  하단 탭은 `TabLayout` 하위 3개(home/ask/journal)에만 붙는다. `onboarding`·journal
  신규/상세/복기는 `AppShell` 직속이라 `BottomNavigation`을 상속하지 않는다. 이 노출 여부는
  `docs/nav-map.md`·디자인 원본 기준이며 STEP 5에서 재설계하지 않았다.
- public NotFound(`PublicNotFoundPage`, 복귀 링크 `/ko`)와 app NotFound(`NotFoundPage`,
  복귀 링크 `/app`)는 분리한다.

### 3.6 BrowserRouter · Capacitor

- **결정:** `BrowserRouter` 유지, HashRouter로 바꾸지 않음, basename 기본(`/`).
- **근거:** clean URL은 공개 웹 Pre-render/SEO/공유에 필수. 공개·앱 동일 origin.
- **STEP 13로 미룸:** Capacitor 네이티브 시작경로(`/app`), deep link, 네이티브 새로고침
  fallback(`appId` 확정 이후).

## 4. STEP 6으로 넘길 입력 계약

- **Pre-render 대상:** `SUPPORTED_LOCALES` × `PUBLIC_ROUTE_PATHS` 파생 — `/ko`, `/en`,
  `/ko/features`, `/en/features`, `/ko/learn`, `/en/learn`.
- **SPA fallback:** 정적 asset과 **정확히 생성된 Pre-render 결과물**(위 목록)은 항상
  우선 제공한다. 그 외 모든 프론트엔드 document 요청 — `/app/*`, `/`, 미지원 locale
  (`/fr` 등), Pre-render되지 않은 `/:locale/*` 하위 경로 포함 — 은 호스팅이 자체 404로
  끝내지 않고 `index.html`로 rewrite해 `BrowserRouter`가 처리하게 한다. 이래야 직접
  진입·새로고침에서도 `PublicNotFoundPage`/`NotFoundPage` 계약(호스팅 404가 아니라
  앱이 렌더하는 NotFound)이 유지된다.
- **`/` redirect:** STEP 6에서 정적 emit로 보강, canonical=`/ko`.
- **로케일 계약:** `DEFAULT_LOCALE`·`SUPPORTED_LOCALES`·`isSupportedLocale`이 STEP 6/7 단일
  소스.
- **native:** 시작경로 `/app`, deep link/새로고침 fallback은 STEP 13(`appId` 확정 이후).

## 5. STEP 6 구현 (완료)

### 5.1 렌더 파이프라인

```
1) tsc -b
2) vite build                                          → dist/ (SPA shell + 해시 asset, 무변경)
3) vite build --ssr src/entry-server.tsx --outDir dist-ssr  (Vite 코어 --ssr, 서드파티 플러그인 아님)
4) node scripts/prerender.mjs                           → dist/ko/*, dist/en/* 6개 정적 HTML
5) node scripts/verify-prerender-output.mjs             → 산출물 자동 검증(빌드 실패로 이어짐)
```

- `src/prerender/manifest.ts` — 순수 모듈. `SUPPORTED_LOCALES` × {home, features,
  learn-index}에서 6개 고정 경로를 파생(하드코딩 없음). Vitest가 SSR 빌드 없이
  직접 단위 테스트한다(`manifest.test.ts`).
- `src/entry-server.tsx` — `StaticRouter`+`AppRouter`+`renderToString`으로 `render(url)`을
  export하고, `manifest.ts`의 `PRERENDER_MANIFEST`를 재-export(계산 로직 없음).
- `scripts/prerender.mjs` — `dist/index.html`(클라이언트 템플릿)을 읽어 매니페스트
  경로마다 `<div id="root" data-render-mode="prerender">…</div>`로 감싼 결과를
  `dist/<locale>/...`에 쓰고, 매니페스트 스냅샷(`.prerender-manifest.json`, 배포
  대상 아님)을 남긴 뒤 `dist-ssr/`를 정리한다. **`<noscript>` meta refresh 등 root
  redirect 삽입은 하지 않는다**(5.3 참고).
- `scripts/verify-prerender-output.mjs` — build를 다시 호출하지 않고 **현재 dist/
  산출물만** 검증(marker 존재, SPA shell엔 marker 없음, asset 경로 일치, `dist-ssr`
  정리, asset 미복제). 위반 시 build 자체를 실패시킨다.
- `scripts/verify-build-idempotency.mjs` — **별도 명령**(`pnpm verify:build-idempotency`).
  `pnpm build`를 두 번 연속 실행해 `dist/` 파일 목록이 동일한지(stale 산출물 없음)
  확인한다. `pnpm verify`/`pnpm verify:full` 기본 체인에는 포함하지 않는다 — build를
  재귀적으로 실행할 수 있는 코드를 이 파일 하나로 한정하기 위함이다.

### 5.2 Hydration

서버는 `renderToString`(hydration 가능한 HTML)을 쓰고, 클라이언트(`src/main.tsx`)는
root element의 `data-render-mode="prerender"` 속성 값만으로(자식 DOM 유무 추론 아님)
`hydrateRoot`/`createRoot`를 분기한다(`src/prerender/shouldHydrate.ts`, 순수 술어,
단위 테스트 가능). Pre-render된 공개 경로는 `hydrateRoot`로 재사용하고, `/app/*`와
그 외 SPA fallback(marker 없음)은 기존과 동일하게 `createRoot`로 렌더한다.

### 5.3 root `/` — 두 계약의 분리

- **STEP 6 애플리케이션 계약(구현됨):** JavaScript 활성 환경에서 `/` → `/ko`
  (`RootRedirect`, React Router 레벨). `dist/index.html`은 순수 SPA shell로 유지하며
  `<noscript>` meta refresh 등 어떤 redirect 삽입도 하지 않는다 — 공용 shell에 넣으면
  `/app/*`·`/fr`·`/ko/missing` 등 다른 fallback 대상까지 함께 `/ko`로 튕기는 부작용이
  있기 때문이다.
- **배포 provider 계약(미구현, 의도된 범위 밖):** JavaScript 실행 전/비활성 환경의
  `/` redirect는 hosting provider 확정 후 provider-specific redirect rule로 구현한다.

### 5.4 SPA fallback / clean URL 계약 (provider-neutral)

우선순위: ① 실제 정적 파일 → ② `<path>/index.html`(trailing slash 포함, 예:
`/ko`·`/ko/` 모두 `dist/ko/index.html`) → ③ asset인데 없으면 404(fallback 금지) →
④ `Accept: text/html`인 document 요청만 `dist/index.html`로 fallback → ⑤ 그 외 404.
이 규칙은 `e2e/support/fixtureServer.ts`(Node 내장 모듈만 사용, 신규 dependency 없음)
로 그대로 구현되어 `e2e/prerender.spec.ts`가 검증한다 — `vite preview`는 자체 SPA
fallback을 갖고 있어 이 계약(특히 "없는 asset은 절대 index.html로 새지 않음")을
provider와 동일하게 검증하지 못할 수 있기 때문이다. 이 fixture는 각 스펙이
`test.beforeAll`/`afterAll`에서 직접 기동·종료하며, `playwright.config.ts`의 기존
프로젝트/webServer 구성은 변경하지 않았다.

### 5.5 dist 구조(실제)

```
dist/
├─ index.html                 ← SPA shell (marker 없음, /와 /app/*의 fallback)
├─ ko/{index,features/index,learn/index}.html   ← Pre-render, marker 포함
├─ en/{index,features/index,learn/index}.html   ← Pre-render, marker 포함
└─ assets/*                   ← 해시 파일명, 절대경로(`/assets/...`) 참조 — base 미변경
```

## 6. i18n 계약 (STEP 7 산출물)

> §1~~5는 STEP 5·6 산출물이다. §6은 그 위에 얹은 STEP 7(i18n 기반) 계약이며, §1~~5의
> 어떤 라우트 트리·Pre-render·hydration·fallback 계약도 변경하지 않는다.

### 6.1 공개 웹(`/:locale`) — URL이 유일한 source of truth

**루트 `/` 정책(변경 없음):** `/`는 여전히 §3.1 그대로 `/ko` 고정 redirect다.
브라우저 언어 자동 감지 도입 여부를 STEP 7에서 검토했으나 도입하지 않기로
명시적으로 결정했다 — hosting provider가 아직 미확정이라 서버 사이드로 제대로
할 수 없고, 클라이언트 전용 휴리스틱은 canonical URL의 예측 가능성만 낮춘다.
필요해지면 hosting provider 확정 이후 서버/엣지 레벨에서 다시 검토한다.

`PublicLayout`(`src/components/layout/PublicLayout.tsx`)이 §3.3의 locale 검증
choke point 역할에 더해 `I18nProvider`(`src/i18n/I18nContext.tsx`) 주입 지점도
겸한다: 검증을 통과하면 그 locale로 하위 트리(`LocaleSwitcher` + `Outlet`)를
감싸고, 실패하면 `PublicNotFoundFallback`을 렌더한다. 저장된 앱 locale이나
`navigator.language`가 URL locale을 대체하는 경로는 없다.

`PublicNotFoundFallback`(`src/pages/public/PublicNotFoundPage.tsx`)은 유효한 URL
locale이 없는 두 지점 전용이다 — `PublicLayout`의 unsupported-locale 분기, 그리고
`AppRouter.tsx` 최상위 `<Route path="*">`(어느 브랜치에도 속하지 않는 경로, 예:
빈 첫 세그먼트를 만드는 `//nope` 같은 malformed path). 이 두 곳은 `DEFAULT_LOCALE`
provider를 스스로 소유해 렌더한다 — `useTranslation()`은 provider 없이 호출되면
항상 throw하며, 암묵적 전역 fallback은 두지 않는다.

`LocaleSwitcher`(`src/components/layout/LocaleSwitcher.tsx`)는 `SUPPORTED_LOCALES`를
순회해 현재 pathname의 locale 세그먼트만 `buildLocalePeerPath`(`src/constants/
routes.ts`)로 치환하고, `useLocation()`의 search·hash는 `<Link to={{...}}>` 객체로
그대로 보존한다. 현재 locale 링크는 `aria-current="true"`. 스타일은 없다(STEP 8에서
추가).

### 6.2 앱(`/app/*`) — localStorage 기반, 공개 웹과 독립

`AppShell`이 `AppLocaleProvider`(`src/i18n/AppLocaleProvider.tsx`)로 하위 전체를
감싼다 — `PublicLayout`과 대칭 구조다. 초기 locale은 `resolveInitialAppLocale()`
(`src/i18n/appLocale.ts`)이 동기적으로 `localStorage`(저장 키 소유,
`isSupportedLocale` 검증) → 정규화된 `navigator.language`/`navigator.languages` →
`DEFAULT_LOCALE` 순으로 계산한다. 서버 세션·cookie에 의존하지 않으므로 Capacitor
WebView에서도 동일하게 동작한다(§2 "서버 전용 기능에 의존하지 않는다" 원칙 준수).
`localStorage` 접근 실패(읽기/쓰기)는 예외를 던지지 않고 조용히 저하한다 — 읽기
실패는 저장값 없음과 동일 취급, 쓰기 실패는 세션 내 state만 유지된다.

`useAppLocale()`이 `{ locale, setLocale }` API를 제공한다. 공개 URL locale과는
완전히 독립이다 — `/en` 방문이 앱 저장 locale을 바꾸지 않고, 앱 locale 변경이
공개 URL을 바꾸지 않는다. 설정 화면은 아직 없다(STEP 8/9 UI 작업).

### 6.3 `document.documentElement.lang` 동기화

초기 Pre-render HTML의 `lang`은 `scripts/prerender.mjs`가 빌드 시점에 로케일별로
정확히 생성한다(§5.1 파이프라인의 후처리 단계 — `PRERENDER_MANIFEST` 각 엔트리의
`locale` 필드를 그대로 사용, 문자열 파싱 없음). 그 이후 클라이언트에서 locale이
바뀌는 모든 경로(LocaleSwitcher 클라이언트 사이드 전환, 앱 locale 복원/변경)는
`I18nProvider` **한 곳**의 `useEffect`가 `document.documentElement.lang`을
동기화한다 — `PublicLayout`/`PublicNotFoundFallback`/`AppLocaleProvider`는 모두
`locale`만 넘기고 위임한다. effect는 브라우저에서만 실행되므로
`entry-server.tsx`/SSR 경로에서는 `document`/`window`를 참조하지 않는다.

### 6.4 번역 리소스

`src/i18n/messages/{ko,en}.ts`가 `src/i18n/dictionary.ts`의 `Messages` 인터페이스를
각각 명시적으로 만족해야 한다(`typeof` 파생이 아님 — 리터럴 타입 widening 문제
회피). 키 누락·shape 불일치는 `pnpm typecheck`에서 컴파일 에러로 즉시 잡힌다.
`BOTTOM_TABS`(`src/constants/navigation.ts`)에는 번역된 문구나 키를 두지 않는다 —
`id`/`path` 같은 구조적 metadata만 유지하고, label 번역 조회는
`BottomNavigation`이 렌더 시점에 한다. route path·query key·journal type
(`investment`/`study`) 같은 도메인 식별자는 번역 대상이 아니다.

## 7. RPL-68 Adaptive P0 Presentation Contract

RPL-68은 STEP 5·6의 URL 소유권, BrowserRouter, Pre-render, SPA fallback을 바꾸지 않고
앱 presentation contract만 갱신한다.

- `/app`은 검토 시작의 canonical owner다. Home dashboard route가 아니다.
- `/app/ask`는 deep link와 query 계약을 유지하는 내부 검토 결과 route다.
- Primary IA는 검토/저널 두 개이며 `BOTTOM_TABS`도 이 두 destination만 가진다.
- Phone은 단일 column과 검토/저널 Bottom Navigation을 사용한다. 내부 결과·작성·상세·
  복기에서는 context navigation을 사용하며 Bottom Navigation은 숨긴다.
- Tablet Portrait는 480px frame을 사용하지 않고 최대 760px readable content host를
  가진다. 검토/저널 primary navigation은 상단에 유지된다.
- Tablet Landscape와 Desktop은 rail navigation foundation을 사용한다. 내부 저널 신규·
  상세·복기 화면도 동일한 primary navigation을 유지한다. 앱 host는 viewport를 사용하되
  Desktop에서 최대 1360px다.
- 허용된 2-pane은 Journal List | Detail과 Original Journal | Retrospective뿐이며 이후
  RPL-68 Slice에서 구현한다. Review Question | Result 강제 2-pane과 3-pane은 금지한다.

이 변경은 route path, path builder, locale ownership, NotFound, hydration, fallback,
Capacitor 경계를 변경하지 않는다.
