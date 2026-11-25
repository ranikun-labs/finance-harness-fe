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

## 시각 표기

사용자에게 보이는 날짜·시각 표기 규칙은 하나다. 규칙의 코드 소유자는 [`src/lib/date.ts`](../src/lib/date.ts)
한 곳이며, 화면 코드는 `Intl.DateTimeFormat`·`toLocale*`를 직접 부르지 않는다(`date.test.ts`가 소스를 대조한다).

| 항목        | 규칙                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 날짜        | 숫자 `YYYY. MM. DD.`(ko) / `MM/DD/YYYY`(en), 월·일 2자리                                                                                                                        |
| 시각        | 날짜 뒤 `HH:mm`(분까지, 초 없음), 시간 주기는 locale 기본(ko 오전/오후, en AM/PM)                                                                                               |
| 적용 범위   | 기록 시점 · 생성/수정 · 복기 저장 시각 · 검토 결과·맥락 시점 · 목록 행 — 화면 전체                                                                                              |
| 읽는 시간대 | 기록 시점은 저장된 벽시계 그대로. instant(생성/수정·복기 저장)는 소속 기록의 시간대, 소속 기록이 없는 값(검토 결과·맥락 시점)은 서비스 기본 시간대(`DEFAULT_DISPLAY_TIME_ZONE`) |
| 시간대 이름 | 화면에 노출하지 않는다(IANA·약어·오프셋 모두. F1-05 공통 AC 5)                                                                                                                  |
| 불변        | 저장 시각·도메인 값·`<time dateTime>` 원본은 바꾸지 않는다. 해석 불가 값은 던지지 않고 원문을 보인다                                                                            |

## 화면 모드 (시스템/라이트/다크)

Product 정책에 화면 모드 규칙은 없다(무언급). 구현 guard는 다음 하나다.

- 기본은 시스템 설정(`prefers-color-scheme`) 추종이고, 앱 헤더의 화면 모드 선택(시스템/라이트/다크)이 이를 덮어쓴다.
- 선택은 이 브라우저의 `localStorage`(`finance-harness:theme`)에만 저장한다. 서버 API·계정 동기화를 만들지 않으며, 화면 문구도 "이 기기의 이 브라우저에만 저장"이라는 실제 동작만 말한다.
- 규칙의 코드 소유자는 [`src/theme/theme.ts`](../src/theme/theme.ts) 한 곳이고, `index.html`의 첫 페인트 인라인 스크립트가 같은 키·규칙을 복제한다(`theme.test.ts`가 대조).
- Dark 색 값은 Foundation v1.0.0 값을 그대로 쓴다.

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
