# 라우팅 경계 설계 (STEP 5)

> 이 문서는 `docs/frontend-roadmap.md`의 **STEP 5** 산출물이다. 공개 웹과 웹앱(`/app/*`)의
> URL 소유권·라우트 트리 경계를 확정하고, STEP 6(Pre-render + SPA)이 안전하게 진행될 입력
> 계약을 기록한다.
>
> 라우트 정의 단일 소스는 [`src/constants/routes.ts`](../src/constants/routes.ts), 화면·라우트
> 기준 문서는 [`docs/nav-map.md`](./nav-map.md)다. 이 문서는 그 원본들을 **복제하지 않고
> 참조**한다. 경로 문자열은 항상 `src/constants/routes.ts`가 canonical source다.

## 1. URL 소유권 경계

URL은 세 갈래로 소유된다.

| 소유 도메인    | 경로                      | 렌더링                           | 레이아웃                             | NotFound             |
| -------------- | ------------------------- | -------------------------------- | ------------------------------------ | -------------------- |
| 루트 redirect  | `/`                       | 콘텐츠 없음(redirect)            | —                                    | —                    |
| 공개 웹        | `/:locale/*` (`ko`\|`en`) | 정적 Pre-render **목표**(STEP 6) | `PublicLayout`                       | `PublicNotFoundPage` |
| 웹앱·Capacitor | `/app/*`                  | SPA                              | `AppShell` (+ 하단 탭은 `TabLayout`) | `NotFoundPage`       |

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

/app                      → HomePage              (index, 하단 탭 O)
/app/ask                  → AskPage               (하단 탭 O, ?q=)
/app/journal              → JournalListPage       (하단 탭 O)
/app/onboarding           → OnboardingPage        (하단 탭 X)
/app/journal/new          → JournalNewPage        (하단 탭 X, ?type=investment|study)
/app/journal/:id          → JournalDetailPage     (하단 탭 X)
/app/journal/:id/review   → JournalReviewPage     (하단 탭 X)
/app/*                    → NotFoundPage(app)     (하단 탭 X)
```

정적 세그먼트 `/app`은 동적 `/:locale`보다 우선 매칭된다(단위 테스트로 고정).

## 3. 확정된 결정

### 3.1 루트 `/` 처리

- **결정:** `/`는 콘텐츠 없이 canonical 기본 로케일 `/ko`로 `<Navigate replace>` 한다.
- **근거:** 바 도메인은 검색·공유 유입(마케팅) 표면. 앱은 `/app` 뒤에 둔다. 로케일은 URL에
  항상 명시(프리픽스 없는 콘텐츠 경로 없음).
- **후속:** 정적 redirect 산출(호스팅)은 STEP 6, `navigator.language` 감지는 STEP 7,
  native 시작경로 `/app`은 STEP 13.

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
- **비도입:** i18n 라이브러리, `navigator.language` 감지(STEP 7 범위).

### 3.4 라우트 상수·path builder

- `ROUTE_PATHS`를 `PUBLIC_ROUTE_PATHS` / `APP_ROUTE_PATHS`로 분리(같은 파일).
- 앱 프리픽스는 `APP_BASE`(`/app`) 한 곳에서만 정의. 앱 경로는 이를 조합해 파생.
- Path builder: 공개(`buildLocaleHomePath`/`buildFeaturesPath`/`buildLearnPath`),
  앱(`buildAppAskPath`/`buildAppJournalNewPath`/`buildAppJournalDetailPath`/
  `buildAppJournalReviewPath`). 쿼리(`?q=`, `?type=`)·id 인코딩 계약 보존.
- 중첩 라우트 상대경로는 `toRelativeUnder(base, absolute)`로 파생(문자열 중복 방지).

### 3.5 레이아웃·NotFound 경계

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
