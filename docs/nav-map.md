# Finance Harness — 네비게이션 맵

> 현재 앱 화면·이동 관계의 canonical 문서다. 경로 문자열의 단일 원본은
> [`src/constants/routes.ts`](../src/constants/routes.ts), 제품 정책은
> [`docs/product-policy.md`](./product-policy.md)다.

## Primary IA

P0 Primary IA는 **검토 / 저널** 두 개다. `/app`은 Home dashboard가 아니라 검토 시작을
소유하고, `/app/ask`는 검토 결과를 유지하는 내부 route다. 홈/질문/기록 3-tab은 사용하지
않는다.

```text
검토 → 판단 기록 → 복기 → 다음 검토 개선
```

## 화면과 라우트

| 화면 | 경로 | 역할 |
| --- | --- | --- |
| 검토 시작 | `/app` | 판단 전 질문을 시작하는 Primary Surface |
| 검토 결과 | `/app/ask?q={query}` | 구조화된 검토 결과의 내부 route |
| 온보딩 | `/app/onboarding` | 첫 진입 안내 |
| 저널 목록/빈 상태 | `/app/journal` | 판단·학습 기록 목록 |
| 판단/학습 기록 작성 | `/app/journal/new?type=investment\|study` | 동일 route의 type 전환 form |
| 저널 상세 | `/app/journal/:id` | 저장된 원래 기록의 읽기 전용 view |
| 복기 | `/app/journal/:id/review` | 원래 기록을 바꾸지 않고 별도 복기를 작성하는 view |

공개 웹 `/:locale/*`와 루트 `/`→`/ko` 경계는
[`docs/route-architecture.md`](./route-architecture.md)를 따른다.

## Primary Navigation

`src/constants/navigation.ts`의 `BOTTOM_TABS`가 검토/저널 두 destination의 구조적 단일
원본이다. 표시 label은 ko/en dictionary에서 렌더 시점에 가져온다.

| Viewport | Primary navigation | Content contract |
| --- | --- | --- |
| Phone | 하단 검토/저널 | 단일 column. 검토 결과·작성·상세·복기는 context back navigation 사용 |
| Tablet Portrait | 상단 검토/저널 | 480px phone cap 없는 readable single column |
| Tablet Landscape | 좌측 rail 검토/저널 | 필요한 맥락에서만 2-pane |
| Desktop | 좌측 rail 검토/저널, Bottom Navigation 없음 | 최대 2 major surfaces |

Tablet Portrait·Landscape·Desktop에서는 저널 목록뿐 아니라 저널 신규·상세·복기 화면에도
동일한 `BOTTOM_TABS` 기반 검토/저널 primary navigation을 유지한다. Phone의 내부 결과·작성·
상세·복기 화면은 context navigation을 사용하고 Bottom Navigation을 노출하지 않는다.

승인된 2-pane은 Journal List | Detail과 Original Journal | Retrospective뿐이다. Review
Question | Result를 강제 2-pane으로 만들거나 3-pane을 만들지 않는다.

## 이동 관계

| 출발 | 트리거 | 도착 |
| --- | --- | --- |
| 온보딩 | 시작 CTA | 검토 시작 |
| 검토 시작 | 질문 제출 | 검토 결과 |
| 검토 시작 | Primary navigation `저널` | 저널 목록 |
| 검토 결과 | 다시 검토 | 검토 시작 |
| 검토 결과 | 판단/학습 기록으로 이어가기 | 기록 작성 |
| 기록 작성 | 저장 성공 | 생성된 저널 상세 |
| 기록 작성 | 뒤로 | 검토 결과 또는 이전 화면 |
| 저널 목록 | 기록 선택 | 저널 상세 |
| 저널 상세 | 복기하기 | 복기 |
| 복기 | 저장 성공 또는 뒤로 | 저널 상세 |
| 저널 Primary navigation | `검토` | 검토 시작 |

라우트 이동은 `src/constants/routes.ts`의 상수와 builder만 사용하며 component에 경로
문자열을 하드코딩하지 않는다.

## 정책 가드

- 추천·예측·목표가·손절가·수량·비중·position sizing UI를 만들지 않는다.
- 검토 결과는 확인형 문체를 유지한다.
- 행동 label은 관심/관망/매수/매도 기록용 선택이며 실행 CTA처럼 강조하지 않는다.
- 감정 tag는 FOMO/불안/확신/관망/혼란만 사용한다.
- AI 결과 전체 자동 저장 expectation을 만들지 않는다.
- 복기는 Original Journal을 덮어쓰지 않는다.
