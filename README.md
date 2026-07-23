# AI 투자 체크리스트 — Frontend

Capacitor 기반 iOS/Android 출시를 목표로 하는 Vite + React + TypeScript SPA.
SSR/Next.js/React Router Framework Mode는 사용하지 않는다.

이 시점은 **빌드 · 라우팅 · 모바일 레이아웃 골격**까지만 구현된 단계다. 실제
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

| 목적                           | 명령                    |
| ------------------------------ | ----------------------- |
| 개발 서버                      | `pnpm dev`              |
| 프로덕션 build                 | `pnpm build`            |
| build 결과 미리보기            | `pnpm preview`          |
| lint                           | `pnpm lint`             |
| 포맷 적용                      | `pnpm format`           |
| 포맷 검사만                    | `pnpm format:check`     |
| 타입체크                       | `pnpm typecheck`        |
| 유닛 테스트 (1회)              | `pnpm test`             |
| 유닛 테스트 (watch)            | `pnpm test:watch`       |
| E2E 테스트                     | `pnpm test:e2e`         |
| 전체 검증 (E2E 제외)           | `pnpm verify`           |
| 전체 검증 (E2E 포함)           | `pnpm verify:full`      |
| iOS 네이티브 프로젝트 생성     | `pnpm cap:add:ios`      |
| Android 네이티브 프로젝트 생성 | `pnpm cap:add:android`  |
| Capacitor sync                 | `pnpm cap:sync`         |
| iOS 프로젝트 열기              | `pnpm cap:open:ios`     |
| Android 프로젝트 열기          | `pnpm cap:open:android` |

`cap:add:ios`/`cap:add:android`는 공식 reverse-domain `appId` 확정과 각 플랫폼
개발 도구(Xcode/Android SDK) 설치 이후에만 실행한다 — 위 P0 항목 참고. `cap:sync`는
표준 `build` 스크립트(`tsc -b && vite build`, 타입체크 포함)를 재사용한 뒤 sync한다.

`verify`는 `format:check → lint → typecheck → test → build` 순으로 실행한다.
`verify:full`은 여기에 Playwright E2E를 더한다.

## E2E 테스트 준비

Playwright는 **Chromium만** 설치한다:

```bash
pnpm exec playwright install chromium
```

## 폴더 구조

```
src/
├── app/          # 라우터(AppRouter.tsx) — 유일한 라우트 트리 정의처
├── pages/        # 라우트 단위 페이지 컴포넌트 (현재는 전부 스켈레톤)
├── components/
│   ├── ui/       # shadcn/ui 컴포넌트
│   └── layout/   # AppShell, TabLayout, BottomNavigation 등
├── constants/    # routes, navigation(하단 탭), policy(감정 태그)
├── lib/          # 공통 utility (cn 등)
├── styles/       # globals.css(Tailwind v4 + 토큰), fonts.css
├── assets/fonts/ # Pretendard 가변 폰트(self-host)
└── test/         # Vitest 셋업
```

## 정책

제품 정책 원본은 [`docs/product-policy.md`](./docs/product-policy.md) 하나다.
`CLAUDE.md`/`AGENTS.md`는 이 문서를 참조만 한다.

## 라우트

라우트 목록의 기준 문서는 [`docs/nav-map.md`](./docs/nav-map.md)다.

| Path                  | 화면               | 하단 탭 |
| --------------------- | ------------------ | ------- |
| `/onboarding`         | 온보딩             | 없음    |
| `/`                   | Home               | 있음    |
| `/ask`                | Ask 결과           | 있음    |
| `/journal`            | 기록 목록          | 있음    |
| `/journal/new`        | 일지/공부노트 저장 | 없음    |
| `/journal/:id`        | 일지 상세          | 없음    |
| `/journal/:id/review` | 복기               | 없음    |
| `*`                   | NotFound           | 없음    |

## 배포 시 SPA Fallback 계약

이 앱은 `BrowserRouter`(`src/main.tsx`)를 사용한다. SSR도, 사전 렌더링도 하지
않으므로 배포 환경(정적 호스팅)이 다음을 반드시 보장해야 한다:

- `/journal/123`처럼 정적 파일이 아닌 경로로 직접 접근하거나 새로고침하면,
  호스팅이 해당 요청을 `index.html`로 rewrite하지 않는 한 **404가 발생한다.**
- rewrite 규칙은 정적 asset 경로(`/assets/*`, 파비콘, 폰트 등 실제 파일이 존재하는
  경로)는 제외하고, 그 외 비정적 경로만 `index.html`로 보내야 한다.
- `pnpm preview`(`vite preview`)가 로컬에서 성공적으로 동작하는 것은 이 rewrite
  설정이 실제 운영 호스팅에도 있다는 것을 보장하지 않는다 — `vite preview`는
  자체적으로 SPA fallback을 처리하기 때문이다. 실제 배포 대상 호스팅에서 직접
  경로 새로고침을 확인해야 한다.
- 특정 클라우드/호스팅 업체의 설정 파일은 이 저장소에 두지 않는다. 배포 대상이
  정해지면 그 업체의 rewrite 설정 문서를 따로 참고할 것.
- 향후 SSR, Pre-render, React Router Framework Mode 등으로 렌더링 아키텍처가
  바뀌면 이 fallback 계약도 함께 갱신해야 한다.
