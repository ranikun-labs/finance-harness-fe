# 프론트엔드 개발 로드맵 (Frontend Roadmap)

> 이 문서는 이후 Claude Code · Codex가 프론트엔드 작업을 시작할 때 읽는 **상위 실행
> 컨텍스트**다. 단순 체크리스트가 아니라, 지금 어느 단계인지 · 다음 작업은 무엇인지 ·
> 해당 단계에서 무엇을 해도 되고 무엇을 아직 하면 안 되는지 · 완료 판정 기준은
> 무엇인지 · 무엇이 선행되어야 하는지를 판단하기 위한 문서다.
>
> 제품 정책 단일 원본은 [`docs/product-policy.md`](./product-policy.md), 화면·라우트
> 기준 문서는 [`docs/nav-map.md`](./nav-map.md), 라우트 정의 단일 소스는
> [`src/constants/routes.ts`](../src/constants/routes.ts)다. 이 문서는 그 원본들을
> **복제하지 않고 참조**한다.

---

## 결론 먼저 — 현재 위치

- **완료:** STEP 0~9 (제품·정책 정리 / 네비게이션 설계 / 와이어프레임 확보 / React 스캐폴딩 / 와이어프레임 반입·매핑 / 공개 웹·앱 라우팅·Pre-render·SPA fallback / 한국어·영어 i18n 기반 / 디자인 시스템 / 핵심 화면 UI)
- **현재:** **STEP 9 완료** — 온보딩·Home·Ask·Journal 목록·상세·복기 UI와 public placeholder/pre-render 통합 Gate 통과
- **아직 안 함:** Journal New 실제 Form, 저장·수정·삭제, API·persistence, Auth, LLM runtime, 결제·개인화·실시간 데이터, 네이티브 프로젝트
- **다음 행동:** PR #14를 일반 Merge Commit으로 병합한 뒤 그 최종 master Merge
  Commit을 기준으로 Template을 추출하고, 그 다음 Journal New Form·경량 상태·모의
  데이터 흐름을 STEP 10 별도 PR에서 시작한다.

상태 표기: ✅ 완료 · 🔶 진행/현재 · ⬜ 예정 · 🔒 선행 조건 미충족

---

## 1. 문서 목적

- 프론트엔드 **전체 실행 순서**를 한 곳에서 관리한다.
- PR 간 **책임 경계**를 유지한다(한 PR에 이질적인 변경을 섞지 않는다).
- **선행 구현·과설계를 방지**한다(다음 단계 필요성을 현재 PR에 미리 넣지 않는다).
- **웹 · 웹앱 · Capacitor의 공통 방향**을 유지한다(별도 코드베이스가 아니다).
- **AI 작업 세션 간 컨텍스트 손실을 방지**한다(세션이 바뀌어도 이 문서로 복원).

---

## 2. 현재 제품 정의

이 프로젝트는 **React 기반의 단일 프론트엔드 코드베이스**이며, 하나의 코드에서 여러
표면(surface)으로 나간다.

```text
React 기반 하나의 프론트엔드 코드베이스
├─ 모바일 우선 웹서비스        (기본 제품)
├─ 데스크톱 웹                (같은 코드, 반응형)
├─ 검색·광고 유입을 위한 공개 웹 (마케팅/획득 표면)
└─ Capacitor로 패키징하는 iOS·Android 앱 (네이티브 패키징 계층)
```

- **웹서비스가 기본 제품**이다. Capacitor **전용 앱이 아니다.**
- **Capacitor는 웹 앱을 네이티브로 감싸는 패키징 계층**이며, 별도 코드베이스가 아니다.
- 따라서 앱 영역(`/app/*`)은 **서버 전용 기능에 의존하지 않아야** Capacitor에서 동일하게 동작한다.

---

## 3. 현재 완료 상태 (STEP 9 완료 기준)

아래는 **실제 로컬 저장소에서 확인된 완료 사항만** 기록한다. 미구현 항목을 완료로 적지 않는다.

| 영역         | 완료 내용                                                                                                                                                                                                                                                                                                                                                 | 상태          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 빌드 스택    | Vite 8 · React 19 · TypeScript 6                                                                                                                                                                                                                                                                                                                          | ✅            |
| 라우팅 골격  | `react-router` 8 SPA, `BrowserRouter`([`src/main.tsx`](../src/main.tsx)), 라우트 트리 단일 정의처 [`AppRouter.tsx`](../src/app/AppRouter.tsx)                                                                                                                                                                                                             | ✅            |
| 라우트 계약  | 라우트 정의 단일 소스 [`routes.ts`](../src/constants/routes.ts) — 공개 웹 `PUBLIC_ROUTE_PATHS`(`/:locale`, `/:locale/features`, `/:locale/learn/*`)와 웹앱 `APP_ROUTE_PATHS`(`/app` 프리픽스 7종)로 분리. 루트 `/`는 `/ko` redirect. 경계 설계는 [`route-architecture.md`](./route-architecture.md)                                                       | ✅            |
| NotFound     | 공개(`PublicNotFoundPage`)·앱(`NotFoundPage`) NotFound 분리. `*` catch-all은 **`AppRouter.tsx`의 라우트**이며 `PUBLIC_ROUTE_PATHS`/`APP_ROUTE_PATHS`에는 포함되지 않는다                                                                                                                                                                                  | ✅            |
| 하단 탭      | [`BOTTOM_TABS`](../src/constants/navigation.ts) 3개(홈/질문/기록) 단일 소스                                                                                                                                                                                                                                                                               | ✅            |
| 레이아웃     | 모바일 AppShell · TabLayout · BottomNavigation                                                                                                                                                                                                                                                                                                            | ✅            |
| 화면         | 앱 Home·Onboarding·Ask(결과/빈 상태)·Journal List·Detail·Review 실 UI 완료. Journal New는 STEP 10 전까지 의도된 placeholder 유지. 공개 Home·Features·Learn은 locale별 placeholder 유지                                                                                                                                                                    | ✅(STEP 9)    |
| 디자인 토큰  | Tailwind v4 + shadcn/ui, Pretendard self-host, 토큰(`globals.css`)                                                                                                                                                                                                                                                                                        | ✅            |
| Capacitor    | Capacitor 8 기본 설정([`capacitor.config.ts`](../capacitor.config.ts)). **`appId` 미확정**, `ios/`·`android/` 미생성, `loggingBehavior: 'debug'` 고정                                                                                                                                                                                                     | ✅(설정 한정) |
| Pre-render   | 공개 고정 경로 6개(`/ko`, `/en`, `/:locale/features`, `/:locale/learn`) 정적 HTML 생성. Vite 코어 `--ssr`([`entry-server.tsx`](../src/entry-server.tsx)) + `renderToString`, 매니페스트는 [`prerender/manifest.ts`](../src/prerender/manifest.ts)에서 파생(하드코딩 없음), 신규 dependency 0개                                                            | ✅            |
| Hydration    | Pre-render 결과는 `hydrateRoot`, 그 외(`/app/*` 포함)는 `createRoot` — root의 `data-render-mode` marker로 분기([`main.tsx`](../src/main.tsx), [`shouldHydrate.ts`](../src/prerender/shouldHydrate.ts))                                                                                                                                                    | ✅            |
| SPA fallback | provider-neutral clean URL 계약(자산 우선 → directory-index → asset 404 → HTML document fallback → 404)을 [`route-architecture.md`](./route-architecture.md) §5.4에 명시, `e2e/support/fixtureServer.ts`로 검증                                                                                                                                           | ✅            |
| 문서         | 제품 정책·화면/라우트 기준 문서, README의 Pre-render/SPA fallback 계약                                                                                                                                                                                                                                                                                    | ✅            |
| 검증         | Vitest 유닛 5종 + Playwright 3종(`e2e/`), `verify`/`verify:full` 스크립트 + 자동 build 검증(`scripts/verify-prerender-output.mjs`) + 별도 idempotency 명령(`pnpm verify:build-idempotency`)                                                                                                                                                               | ✅            |
| 품질 회귀    | 모바일 스크롤·접근성·라우트 안전성 e2e                                                                                                                                                                                                                                                                                                                    | ✅            |
| i18n 기반    | 신규 dependency 0개(React Context + 타입 안전 로컬 dictionary, [`src/i18n/`](../src/i18n)). 공개 웹은 URL `:locale`이 유일 기준(`PublicLayout` 주입), 앱(`/app/*`)은 `localStorage`→`navigator.language`→`DEFAULT_LOCALE` 우선순위로 독립 저장·복원. Pre-render 6개 산출물의 `<html lang>` 정합성, `document.documentElement.lang` 클라이언트 동기화 포함 | ✅            |

> **아직 완료가 아닌 것:** 공개 웹 실제 UI(현재 placeholder), Journal New 실제 Form,
> 저장·수정·삭제와 데이터 흐름, API 연동, 네이티브 프로젝트 생성, 출시 설정,
> hosting provider 확정(공개 웹/앱 라우팅 경계·Pre-render/SPA fallback 계약·i18n
> 기반 자체는 STEP 5·6·7에서 완료됨 — 위 표 참고).

---

## 4. 목표 아키텍처 (STEP 5·6에서 구현 완료)

> ⚠️ 아래 라우트 트리는 STEP 5에서, **렌더링 방향(Pre-render/SPA fallback)은 STEP 6에서
> 구현 완료**되었다(`BrowserRouter` SPA + 공개 웹 6개 고정 경로 Pre-render). 실제
> hosting provider 설정·i18n·실 UI는 아직 후속 단계다.

```text
공개 웹 (정적 Pre-render 완료 — /:locale/learn/*는 인덱스만, 하위 slug는 SPA fallback)
├─ /ko
├─ /en
├─ /ko/features
├─ /en/features
└─ /ko/learn, /en/learn  (/:locale/learn/* 하위 slug는 콘텐츠 manifest 도입 후)

웹앱·Capacitor 공통 (SPA)
├─ /app
├─ /app/onboarding
├─ /app/ask
├─ /app/journal
├─ /app/journal/new
├─ /app/journal/:id
└─ /app/journal/:id/review
```

렌더링 방향(구현 완료):

- 공개 웹은 **정적 Pre-render**로 동작한다(고정 경로 6개, `src/entry-server.tsx` +
  `scripts/prerender.mjs`).
- `/app/*`는 **SPA**로 동작한다.
- **요청별 SSR 서버는 도입하지 않았다.** 향후 **필요성이 실제로 검증될 때만** 검토한다.
- `/app/*`는 **Capacitor에서도 동작해야 하므로 서버 전용 기능에 의존하지 않는다.**

> STEP 5에서 라우트가 위 트리(`/app/*` + `/:locale`)로 전환되었고 `ROUTE_PATHS`는
> `PUBLIC_ROUTE_PATHS`/`APP_ROUTE_PATHS`로 분리되었다. STEP 6에서 렌더링 설정
> (Pre-render/hydration/fallback)까지 이어졌다 — 자세한 내용은
> [`docs/route-architecture.md`](./route-architecture.md) §5.

---

## 5. 전체 작업 단계

> STEP 5와 STEP 6은 구현 시 같은 PR로 묶일 수 있으나, 이 문서에서는 **의사결정(경계
> 설계)** 과 **렌더링 설정** 책임을 구분해 기록한다. 모든 STEP의 규모가 동일하지 않으며,
> **실제 개발량은 화면 구현(STEP 9)과 API 연동(STEP 11)에 집중**된다.

| STEP | 단계명                  | 목적                                        | 주요 산출물                      | 선행 조건                | 완료 조건                       | 상태 | 예상 PR 경계            | 이번 단계에서 하지 않는 것 |
| ---- | ----------------------- | ------------------------------------------- | -------------------------------- | ------------------------ | ------------------------------- | ---- | ----------------------- | -------------------------- |
| 0    | 제품·정책 정리          | 제품 정의·금지 UI·톤 확정                   | `docs/product-policy.md`         | —                        | 정책 단일 원본 존재             | ✅   | 정책 PR                 | 화면 구현                  |
| 1    | 네비게이션 설계         | 화면 이동 관계 확정                         | `docs/nav-map.md`, `BOTTOM_TABS` | STEP 0                   | 화면·라우트 기준 문서 존재      | ✅   | 문서 PR                 | 실제 라우팅 코드           |
| 2    | 와이어프레임 확보       | 화면 시안 확보                              | Claude Design 와이어프레임(외부) | STEP 1                   | 시안 확보                       | ✅   | (외부 산출물)           | 저장소 반입                |
| 3    | React 스캐폴딩          | 빌드·라우팅·레이아웃 골격                   | 현재 저장소(PR #1)               | STEP 1                   | `verify` green, 스켈레톤 라우팅 | ✅   | PR #1                   | 실 UI·API                  |
| 4    | 와이어프레임 반입·매핑  | 시안 원본을 저장소에 반입, 화면↔라우트 매핑 | 와이어프레임 자산, 매핑 문서     | STEP 3                   | 매핑 표 확정, 자산 반입         | ✅   | 자산·매핑 문서 PR       | 실 UI 구현·라우팅 전환     |
| 5    | 라우팅 경계 설계        | 공개 웹/앱 경계·`/app/*` 결정               | 라우팅 경계 설계 + 라우트 코드   | STEP 4                   | 경계·라우트 계약 합의·구현      | ✅   | 라우팅 경계 PR          | Pre-render 설정            |
| 6    | Pre-render·SPA 구성     | 공개 웹 Pre-render + `/app/*` SPA 설정      | 렌더링 설정, fallback 갱신       | STEP 5                   | 공개 웹 정적 산출, SPA 동작     | ✅   | 렌더링 설정 PR          | 번역·실 UI                 |
| 7    | i18n 기반               | 한국어·영어 기반                            | i18n 로딩·locale 라우팅 기반     | STEP 5, 6                | ko/en 전환 동작                 | ✅   | i18n PR                 | 번역 SaaS·실 UI            |
| 8    | 디자인 시스템·공통 UI   | 공통 컴포넌트 구체화                        | 확장된 UI 세트                   | STEP 4                   | 핵심 공통 컴포넌트 구비         | ✅   | 디자인 시스템 PR        | 화면별 로직                |
| 9    | 핵심 화면 UI 구현       | 실제 화면 UI                                | 온보딩·Home·Ask·Journal 등       | STEP 8, 4                | 화면별 UI·정책 준수             | ✅   | **화면/흐름별 다수 PR** | API 연동                   |
| 10   | 폼·상태·데이터 흐름     | 입력·상태·클라이언트 데이터 흐름            | 폼·상태 설계                     | STEP 9                   | 흐름 동작(모의 데이터)          | ⬜   | 상태/폼 PR              | 백엔드 연동                |
| 11   | 백엔드 API 연동         | 실데이터 연동                               | API 클라이언트·연동              | STEP 10, 백엔드 계약     | 실데이터 왕복                   | ⬜   | **API 연동 다수 PR**    | 범용 추상 계층 선구현      |
| 12   | 접근성·SEO·성능         | 웹 품질 보강                                | a11y·메타·성능 개선              | STEP 9                   | 목표 지표 충족                  | ⬜   | 품질 PR                 | 네이티브                   |
| 13   | Capacitor 네이티브 구성 | iOS·Android 프로젝트                        | `ios/`·`android/`                | **공식 `appId` 확정** 🔒 | 네이티브 빌드 성공              | ⬜🔒 | 네이티브 PR             | 출시 설정과 혼재           |
| 14   | 통합·회귀·실기기 테스트 | 실기기·회귀 검증                            | 테스트 결과                      | STEP 13, 11              | 핵심 시나리오 통과              | ⬜   | 테스트 PR               | 신규 기능                  |
| 15   | 웹·앱 배포·출시 준비    | 배포·출시 설정                              | 호스팅·스토어 설정               | STEP 12, 14              | 배포 파이프라인 동작            | ⬜   | 출시 설정 PR            | 신규 기능                  |

---

## 6. 단계 그룹

전체 STEP을 세 그룹으로 본다. **모든 STEP이 같은 규모가 아니며, 실제 개발량은 화면 구현
(STEP 9)과 API 연동(STEP 11)에 집중**된다.

### Foundation — STEP 0~7

구조와 정책을 확정하는 구간. 라우팅 경계, 렌더링, i18n 기반까지 "무엇을 어떻게 지을지"를 정한다.

### V1 Product — STEP 8~11

사용자가 실제로 사용하는 화면과 기능을 만드는 구간. **개발량의 대부분이 여기 있다.**

### Release Readiness — STEP 12~15

배포·운영·웹·네이티브 품질을 확보하는 구간.

---

## 7. PR 전략

예상 PR 흐름(책임 순서). **아직 생성되지 않은 PR 번호는 확정처럼 쓰지 않는다** — 순서와 책임만 기록한다.

- ✅ **PR #1** — React SPA 초기 골격
- ✅ **문서 PR** — 프론트엔드 로드맵 정리
- ✅ **와이어프레임 원본 반입·화면 매핑**
- ✅ **라우팅 경계 설계 (STEP 5)** — 공개 웹/앱 URL 경계·라우트 코드
- ✅ **Pre-render + `/app/*` SPA 렌더링·fallback 계약 (STEP 6)**
- ✅ **한국어·영어 i18n 기반 (STEP 7)**
- ✅ **디자인 시스템·공통 UI 기반 (STEP 8, 이 PR)**
- ✅ 화면 또는 사용자 흐름별 UI 구현(다수)
- ⬜ API·상태 연동(다수)
- ⬜ 출시 품질 보강

**한 PR에 섞지 않는다:**

- [ ] 아키텍처 전환
- [ ] 번역 인프라
- [ ] 실제 UI
- [ ] API 연동
- [ ] 네이티브 프로젝트 생성
- [ ] 출시 설정

---

## 8. V1 우선순위 (P0 / P1 / P2)

- **P0** — V1 기능 및 안전한 배포에 반드시 필요
- **P1** — 출시 품질을 높이지만 시점 조정 가능
- **P2** — 사용자·트래픽·운영 요구가 확인된 뒤 진행

| 작업                                  | 분류  | 비고                          |
| ------------------------------------- | ----- | ----------------------------- |
| 와이어프레임 반입·화면 매핑           | P0    | 완료                          |
| 공개 웹/앱 라우팅 경계·`/app/*`       | P0    | 구조 결정                     |
| 공개 웹 Pre-render + `/app/*` SPA     | P0    | SSR 아님                      |
| 핵심 화면 UI(온보딩·Home·Ask·Journal) | P0    | 개발량 집중                   |
| 폼·상태·데이터 흐름(경량)             | P0    | 과한 전역 상태 지양           |
| 백엔드 API 연동(실데이터)             | P0    | 계약 확정 후                  |
| 한국어·영어 i18n 기반                 | P1    | SaaS 없이 시작                |
| 디자인 시스템 확장                    | P1    | 필요 범위만                   |
| 접근성·SEO·성능 보강                  | P1    | 지표 기반                     |
| Capacitor 네이티브 프로젝트           | P1 🔒 | **공식 `appId` 확정 전 금지** |
| 실기기·회귀 테스트                    | P1    | 핵심 시나리오 우선            |
| 요청별 SSR 서버                       | P2    | 필요성 검증 후                |
| 복잡한 전역 상태관리 라이브러리       | P2    | 실제 필요 확인 후             |
| 번역 SaaS                             | P2    | 규모 확인 후                  |
| 범용 API 추상 계층(실데이터 없이)     | P2    | 선구현 금지                   |
| 전 브라우저·전 기기 조합 테스트       | P2    | 트래픽 확인 후                |
| 과도한 디자인 시스템 추상화           | P2    | 근거 기반                     |

> **근거 없이 P0로 올리지 않는다:** 요청별 SSR 서버, 복잡한 전역 상태관리, 번역 SaaS,
> 과도한 디자인 추상화, `appId` 확정 전 네이티브 프로젝트, 실데이터 없는 범용 API 계층,
> 모든 브라우저·모든 기기 조합 테스트.

---

## 9. 단계별 Gate

각 주요 단계는 아래 Gate를 만족해야 다음으로 넘어간다.

- [ ] **Source of truth** — 라우트=`src/constants/routes.ts`, 하단 탭=`src/constants/navigation.ts`, 정책=`docs/product-policy.md`, 화면·라우트=`docs/nav-map.md`. 경로 문자열을 컴포넌트에 하드코딩하지 않는다.
- [ ] **테스트** — 관련 Vitest/Playwright 추가·통과(`pnpm test` / `pnpm test:e2e`).
- [ ] **접근성** — 모바일 스크롤·포커스·라벨 회귀 유지.
- [ ] **모바일·데스크톱** — 두 폭 모두에서 깨지지 않음.
- [ ] **정책 준수** — 금지 UI 없음, 감정 태그 5개 고정, Ask 답변 확인형 톤([`docs/product-policy.md`](./product-policy.md)).
- [ ] **빌드** — `pnpm build` 성공(타입체크 포함).
- [ ] **PR 독립 리뷰** — 한 PR이 단일 책임으로 독립 리뷰 가능.
- [ ] **working tree clean** — 커밋 후 잔여 변경 없음.
- [ ] **Merge 전 필수 조건** — `pnpm verify`(필요 시 `verify:full`) green.

---

## 10. 변경 관리 원칙

- 이 로드맵은 **방향 문서**다. 세부 구현을 영구 고정하지 않는다.
- 중요한 변경은 **이유·대안·영향**을 함께 기록한다.
- 이미 완료된 단계를 **조용히 재설계하지 않는다.**
- 다음 단계의 필요성을 **현재 PR에 선행 구현하지 않는다.**
- 신규 요구가 생기면 기존 단계에 억지로 끼우지 않고, **로드맵과 PR 경계를 먼저 갱신**한다.
- 실제 **사용자·운영 데이터가 없는 최적화는 후순위**다.
- 제품 정책은 **`docs/product-policy.md`가 단일 원본**이다(여기에 복제하지 않는다).
- 화면과 라우트 계약이 바뀌면 **관련 문서(`nav-map.md`, `routes.ts` 등)를 함께 갱신**한다.

---

## 11. 현재 위치와 다음 행동

**STEP 9 완료 기준:**

- ✅ STEP 0~9 완료
- ✅ 완료 화면: Home, Onboarding, Ask 결과·빈 상태, Journal List·Detail·Review
- Journal New 실제 Form은 STEP 10으로 보류
- 다음 순서: **PR #14 Merge → Template 추출 → STEP 10**
- API 연동·hosting provider 확정은 **아직 구현하지 않음**

**STEP 5 산출물:**

- [x] 공개 웹(`/:locale`)·웹앱(`/app/*`) URL 경계 확정, 루트 `/`→`/ko` redirect
- [x] `ROUTE_PATHS` → `PUBLIC_ROUTE_PATHS`/`APP_ROUTE_PATHS` 분리, path builder·locale 검증 단일 원본
- [x] public/app 레이아웃·NotFound 분리, 라우팅 경계 설계 문서([`docs/route-architecture.md`](./route-architecture.md))
- [x] 라우트 우선순위·clean cutover·쿼리 계약 Vitest/Playwright 테스트

**STEP 6 산출물:**

- [x] 공개 웹 고정 경로 6개 Pre-render(`vite build --ssr` + `renderToString`, 신규
      dependency 0개), `/app/*` SPA 유지
- [x] `hydrateRoot`/`createRoot` marker 기반 client 분기, root `/` 두 계약(애플리케이션
      vs 배포 provider) 분리
- [x] provider-neutral clean URL fallback 계약 + fixture 서버, 자동 build 검증
      (`scripts/verify-prerender-output.mjs`) + 별도 idempotency 명령
- [x] manifest·hydrate predicate 단위 테스트, Pre-render "실제 제공" 증명 e2e

**STEP 7 산출물:**

- [x] 신규 dependency 없이 React Context + 타입 안전 로컬 dictionary로 i18n 구현
      ([`src/i18n/`](../src/i18n))
- [x] 공개 웹(`/:locale`) locale은 URL이 유일 기준, `LocaleSwitcher`로 전환
      (query/hash/learn slug 보존, `aria-current`)
- [x] 앱(`/app/*`) locale은 `localStorage`(검증)→`navigator.language`→`DEFAULT_LOCALE`
      우선순위로 독립 저장·복원, `useAppLocale()` API
- [x] `PublicNotFoundPage`가 provider 없이 렌더되는 지점 제거(`PublicNotFoundFallback`)
- [x] Pre-render 6개 산출물의 `<html lang>` 정합성 + `document.documentElement.lang`
      클라이언트 동기화(`I18nProvider` 단일 지점)
- [x] 기존 STEP 5·6 라우팅·Pre-render·hydration·fallback 계약 회귀 없음(기존
      Vitest/Playwright 전부 통과)

**STEP 8 산출물:**

- [x] `Button`(`src/components/ui/button.tsx`) 기존 variant(`default`/`destructive`/
      `outline`/`secondary`/`ghost`/`link`)·size(`default`/`sm`/`lg`/`icon`) API를
      유지한 채, 디자인 원본(`design/claude-export/project/디자인 시스템.dc.html`)
      기준으로 높이·radius·타이포를 조정. 원본의 "Subtle" 버튼은 기존 `secondary`
      variant로 이미 표현 가능해 신규 `subtle` variant는 추가하지 않음
- [x] Card(`src/components/ui/card.tsx`) — surface background·border·radius·기본
      text color만 책임지는 최소 shell(`Card`/`CardHeader`/`CardTitle`/
      `CardDescription`/`CardContent`/`CardFooter`)
- [x] Badge(`src/components/ui/badge.tsx`) — 도메인 enum·i18n을 모르는 범용 시각
      primitive. tone은 디자인 원본에서 실제 확인된 `neutral`/`info`/`destructive`
      3종만 제공(원본에 없는 success/warning 색상 계열은 추가하지 않음)
- [x] `PageHeader`/`PolicyNotice`/`EmptyState`(`src/components/common/`) — 뒤로가기·
      제목·trailing slot, 정책 문구 shell(문구는 호출부 i18n 책임), 빈 상태 shell.
      route path·페이지명·i18n key 하드코딩 없음
- [x] 신규 dependency 0개(기존 CVA·clsx·tailwind-merge만 사용)
- [x] 기존 STEP 5~7 라우팅·Pre-render·hydration·fallback·i18n 계약 회귀 없음(기존
      Vitest/Playwright 전부 통과)

> **STEP 8에서 만들지 않은 것(STEP 9 이후 실사용처 확인 후 판단):** `AppCard`,
> `ActionCard`, `StatusBadge`, `EmotionBadge`, `SectionHeader`, `SegmentedControl`,
> `FormField`, checklist item, Loading/Error shell, 화면별 실 UI.

**STEP 9 완료 기준 (RPL-29 Final Gate):**

- [x] 앱 화면: Home, Onboarding, Ask 결과/빈 상태, Journal List·Detail·Review 완료.
      Journal New의 `investment`·`study` 진입은 제목만 표시하는 placeholder이며 실제
      Form·save·submit·persistence는 STEP 10으로 보류
- [x] 공개 화면: `/ko`, `/en`, locale별 Features·Learn과 unsupported locale
      NotFound를 ko/en으로 검증. 고정 Pre-render는 `/ko`, `/en`, `/ko/features`,
      `/en/features`, `/ko/learn`, `/en/learn` 6개
- [x] route/shell: `BrowserRouter`, `/`→`/ko` replace, locale allowlist, encoded
      Journal ID·query helper 유지. Bottom Navigation은 Home·Ask·Journal만 포함하고
      Onboarding·Journal New·Detail·Review에는 표시하지 않음. 탭 화면은 `TabLayout`
      main, 그 외 앱 화면은 `AppShell`이 단일 실제 스크롤 표면이며 데스크톱 앱 frame은
      480px
- [x] i18n: ko/en dictionary contract와 화면 label 번역, public URL locale, app
      `localStorage`→`navigator.language`→default locale, `<html lang>` 동기화 검증.
      fixture 작성자 텍스트는 locale 전환 시 자동 번역하지 않음
- [x] 접근성·모바일: 화면별 h1 하나, heading/semantic navigation, accessible name,
      `aria-current`, focus-visible·44px 이상 target, 긴 문자열 wrapping, 375×812,
      480×812, 1024px viewport 회귀 검증
- [x] 정책: 추천·목표가·손절가·비중·수익률 예측·판단 대행·실시간 시세·개인화 UI
      없음. 과거 행동 label은 기록 metadata로만 표시하며 감정 값은 정책의 5개 고정
- [x] Node 22.23.1·pnpm 11.15.1의 최종 unchanged Head에서 `pnpm verify:full`
      통과(94초, exit 0): Prettier, TypeScript, Vitest 27 files/279 tests, client
      build, SSR build, 6-path Pre-render, Playwright 223 passed/15 skipped. ESLint는
      errors 0, 기존 Fast Refresh warnings 3. retry·flaky·timeout·browser crash 없음.
      Production 코드와 package/lockfile 변경 없음
- [x] Gate 이력: 초기 `verify:full` 통과 → 문서 추가 후 실행이 Prettier 불일치에서
      중단 → 문서 포맷 보정 → 최종 unchanged Head `verify:full` 통과. 최종 판정 A

React Template extraction 기준은 PR #14가 **일반 Merge Commit**으로 병합된 후
생성되는 최종 master Merge Commit SHA다. 아직 Merge Commit은 생성되지 않았으며,
Template 추출은 STEP 10 구현 전에 수행한다.

**다음 실행 항목:**

1. [ ] PR #14를 일반 Merge Commit으로 병합
2. [ ] 최종 master Merge Commit SHA를 기준으로 Template 추출
3. [ ] STEP 10 — Journal New Form·경량 상태·모의 데이터 흐름을 별도 PR로 구현
