# AGENTS.md

이 레포에서 작업하기 전에 다음을 반드시 확인한다.

## 제품 정책

Finance Product/UX의 canonical source는 sibling repository인
`finance-harness-docs`의 `service-policy/finance-product-policy.md`와 관련
canonical UX contract다. 이 FE repository의 `docs/product-policy.md`는
route/navigation/accessibility/protected-contract 구현 guard만 소유하며 Product/UX
계약을 재정의하지 않는다. 작업 시작 전에 해당 canonical 문서와 이 FE-local guard를
함께 읽고 준수한다. 정책 전문을 복사하지 않는다.

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


## PR 작성 및 본문 갱신
- PR 생성 또는 본문 수정 전에 대상 base 브랜치의 `.github/PULL_REQUEST_TEMPLATE.md` 실제 내용을 확인한다.
- 저장소에 작업 유형별 전용 PR 템플릿이 있으면 현재 작업과 맞는 형식을 우선한다.
- `/핵심정리` 형식은 한국어로 `목적`, `변경`, `검증`, `Finding`, `Source Merge`, `Production Gate`, `참조`를 구분해 작성한다.
- 실제 실행한 검증과 근거만 기록하고, 실행하지 않은 항목은 `PASS`가 아니라 `NOT_RUN`으로 표시한다.
- 작성자(Writer)의 검증 결과와 독립 Reviewer의 판정을 구분한다. 독립 `PASS`는 검수한 코드 HEAD가 명시되고 근거가 일치할 때만 기록한다.
- 코드 HEAD, base 브랜치, 테스트 명령·결과·링크가 실제 ref와 실행 근거에 맞는지 확인한다.
- Source Merge 승인과 Production 배포 승인을 별도 Gate로 기록한다. PR 본문 작성만으로 Merge 승인을 간주하지 않는다.
- Secret, PII, 민감한 SQL 파라미터를 본문에 기록하지 않는다. 필요한 설명에는 비식별·마스킹한 예시만 사용한다.
