# Finance FE Implementation Policy Guard

> Product/UX의 canonical source는 sibling repository인
> [`finance-harness-docs/service-policy/finance-product-policy.md`](../../finance-harness-docs/service-policy/finance-product-policy.md)와
> [`finance-ux-delta-auth-journal-handoff.md`](../../finance-harness-docs/service-policy/finance-ux-delta-auth-journal-handoff.md)다.
> 이 문서는 Finance FE의 route/navigation/accessibility/protected-contract 구현 guard만
> 소유하며 Product/UX 결정을 새로 만들거나 canonical contract를 복제하지 않는다.
> 새 화면이나 기능을 구현하기 전에 canonical source와 이 guard를 함께 확인한다.

## Primary IA

웹앱 P0의 Primary IA는 다음 두 개로 고정한다.

- 검토 (`/app` = 검토 시작, `/app/ask` = 내부 검토 결과)
- 저널

Home dashboard와 legacy three-destination navigation은 P0 Primary Surface로 복원하지
않는다. 사용자의 핵심 흐름은 `검토 → 판단 기록 → 복기 → 다음 검토 개선`이다.

## Adaptive Surface

- Phone은 단일 column과 검토/저널 2-item Bottom Navigation을 사용한다.
- Tablet Portrait는 phone frame으로 제한하지 않고 읽기 쉬운 단일 column을 사용한다.
- Tablet Landscape와 Desktop은 맥락이 필요한 화면에서만 최대 2개 major surface를 쓴다.
- 승인된 2-pane은 Journal List | Detail, Original Journal | Retrospective뿐이다.
- Review Question | Result 강제 2-pane, 3-pane, trading-terminal 밀도는 만들지 않는다.

## 금지 UI

다음과 같이 보이는 UI를 어떤 화면에서도 만들지 않는다:

- 매수 추천 UI
- 매도 추천 UI
- 목표가 추천 UI
- 손절가 추천 UI
- 수량 또는 비중 추천 UI
- 정책에 없는 투자 행동 CTA(정책에 명시되지 않은 임의의 실행 버튼)

`docs/nav-map.md`의 행동 라벨(관심/관망/매수/매도)은 **"기록용 선택"**이며, 실행
버튼처럼 강조하지 않는다.

## 감정 태그

감정 태그는 다음 5개로 고정한다. 추가/변경하지 않는다.

- FOMO
- 불안
- 확신
- 관망
- 혼란

코드에서는 `src/constants/policy.ts`의 `EMOTION_TAGS` 상수 하나만을 유일한 소스로
사용한다.

## Ask 답변 톤

검토 결과(`/app/ask`)의 AI 답변은 단정형("~입니다")이 아니라 **확인형**("~확인하세요")
톤을 유지한다.

## Capacitor / 배포 정책

- 공식 reverse-domain `appId`가 확정되기 전까지 `ios/`, `android/` 네이티브
  프로젝트를 생성하지 않는다. (`capacitor.config.ts` 참고)
- 프로덕션 빌드에서 로그가 항상 노출되지 않도록 `loggingBehavior`는 `'debug'`를
  유지한다 (`'production'` 금지 — 이름과 달리 빌드 타입과 무관하게 항상 로그를
  출력하는 옵션이기 때문).

## DEV 참조 인증·저널 생성 acceptance guard (STEP 11, DEV-only)

> Product/UX canonical은 `finance-harness-docs/service-policy/finance-product-policy.md`와
> `finance-ux-delta-auth-journal-handoff.md`다. Auth Entry는 OAuth-first이며 Login/Signup을
> 별도 primary journey로 나누지 않는다. 이 절은 DEV 검증용 구현 guard만 정의하고 canonical을
> 복제하지 않는다.

- 참조 패널(`VITE_FINANCE_REFERENCE_AUTH_ENABLED`), DEV 계정 생성
  (`VITE_FINANCE_REFERENCE_SIGNUP_ENABLED`), 저널 생성(`VITE_FINANCE_JOURNAL_CREATE_ENABLED`)은
  모두 기본 OFF다. 세 값은 `dev-acceptance` 빌드 모드(`pnpm build:dev-acceptance`)에서만 효력이 있다.
  분기 기준은 `import.meta.env.MODE`이며 `PROD`는 쓰지 않는다(acceptance 빌드도 `PROD=true`다).
  운영 빌드와 `pnpm dev`에서는 값과 무관하게 무효다.
- 계정 생성은 참조 패널 안에서만 노출되며 로그인 토큰을 발급하지 않는다. 운영 Auth Entry의
  OAuth-first 경로와 production 문구는 변하지 않는다.
- 액세스 토큰은 메모리에만 둔다(localStorage/sessionStorage 금지). 새로고침 후에는 재로그인한다.
- Finance API 기준 경로는 `VITE_FINANCE_API_BASE`로 정한다(기본 `/finance`, DEV `/api/finance`).
  same-origin 절대 경로만 허용하며 모든 빌드에 적용된다. 값이 잘못되면 `vite.config.ts`가 build를 실패시킨다.
  단일 원본은 `src/features/finance-api/financeApiBasePolicy.ts`(검증), `financeApiBase.ts`(상수)다.
- 열린 항목: 중복 가입 409가 이메일 존재 여부를 노출한다. 공개 DEV 배포 전에 검토가 필요하다
  (platform `FinanceReferenceSignupController`의 주석과 같은 조건). 상세는
  [`frontend-roadmap.md`](./frontend-roadmap.md)의 STEP 11 DEV-only acceptance slice를 본다.
