# CLAUDE.md

이 레포에서 작업하기 전에 다음을 반드시 확인한다.

## 제품 정책

이 프로젝트의 제품 정책 원본은 **`docs/product-policy.md`** 하나뿐이다. 작업을
시작하기 전에 반드시 그 문서를 읽고 준수한다. 여기에 정책 전문을 복사하지 않는다 —
항상 원본 문서를 읽을 것.

## 라우팅 / 네비게이션

- 라우트 정의의 유일한 소스는 `src/constants/routes.ts`이다. 경로 문자열을
  컴포넌트에 하드코딩하지 않는다.
- 라우트 목록의 기준 문서는 `docs/nav-map.md`이다.
- 하단 탭(홈/질문/기록)은 `src/constants/navigation.ts`의 `BOTTOM_TABS` 하나로
  관리한다.

## 아키텍처 개요

- Vite + React + TypeScript SPA (Capacitor 8 기반 iOS/Android 출시 목표). SSR,
  Next.js, React Router Framework Mode는 사용하지 않는다.
- 도메인 로직(repository/service/store 등)이 아직 없으므로 임의로 추가하지 않는다.
