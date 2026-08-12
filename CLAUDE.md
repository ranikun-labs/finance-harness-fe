# CLAUDE.md

이 레포에서 작업하기 전에 다음을 반드시 확인한다.

## 제품 정책

Finance Product/UX의 canonical source는 sibling repository인
`finance-harness-docs`의 `service-policy/finance-product-policy.md`와 관련
canonical UX contract다. 이 FE repository의 `docs/product-policy.md`는
route/navigation/accessibility/protected-contract 구현 guard만 소유한다. 작업을
시작하기 전에 central canonical 문서와 이 FE-local guard를 함께 읽고 준수한다.
정책 전문을 복사하지 않는다.

## 라우팅 / 네비게이션

- 라우트 정의의 유일한 소스는 `src/constants/routes.ts`이다. 경로 문자열을
  컴포넌트에 하드코딩하지 않는다.
- 라우트 목록의 기준 문서는 `docs/nav-map.md`이다.
- Primary navigation(검토/저널)은 `src/constants/navigation.ts`의 `BOTTOM_TABS` 하나로
  관리한다.

## 아키텍처 개요

- Vite + React + TypeScript SPA (Capacitor 8 기반 iOS/Android 출시 목표). SSR,
  Next.js, React Router Framework Mode는 사용하지 않는다.
- 도메인 로직(repository/service/store 등)이 아직 없으므로 임의로 추가하지 않는다.

## 로드맵

프론트엔드 전체 실행 순서·단계 경계·현재 위치는 `docs/frontend-roadmap.md`가 기준이다.
새 작업을 시작하기 전에 현재 STEP과 해당 단계에서 허용/금지되는 범위를 그 문서에서 확인한다.
