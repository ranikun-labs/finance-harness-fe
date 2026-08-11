# 제품 정책 (Product Policy)

> 이 문서는 이 레포의 제품 정책 **원본(canonical source)**이다. `CLAUDE.md`와
> `AGENTS.md`는 이 문서를 참조만 하며 내용을 복사하지 않는다. 새 화면이나 기능을
> 구현하기 전에 반드시 이 문서를 먼저 확인할 것.

## Primary IA

웹앱 P0의 Primary IA는 다음 두 개로 고정한다.

- 검토 (`/app` = 검토 시작, `/app/ask` = 내부 검토 결과)
- 저널

Home dashboard와 홈/질문/기록 3-tab은 P0 Primary Surface로 복원하지 않는다. 사용자의
핵심 흐름은 `검토 → 판단 기록 → 복기 → 다음 검토 개선`이다.

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
