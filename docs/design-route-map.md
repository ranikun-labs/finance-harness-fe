# 디자인 원본 ↔ 라우트 매핑 (STEP 4)

> 이 문서는 `docs/frontend-roadmap.md`의 **STEP 4** 산출물이다. 반입한 Claude Design
> 원본(`design/claude-export/`)의 화면을 현재 라우트(`src/constants/routes.ts`의
> `ROUTE_PATHS` 7종)에 매핑하고, `docs/nav-map.md`와의 차이를 식별해 **STEP 5(라우팅
> 경계 설계)의 입력**을 만든다.
>
> 라우트 정의 단일 소스는 [`src/constants/routes.ts`](../src/constants/routes.ts),
> 화면·라우트 기준 문서는 [`docs/nav-map.md`](./nav-map.md), 반입 원본의 출처·해시는
> [`design/PROVENANCE.md`](../design/PROVENANCE.md)에 있다. 이 문서는 그 원본들을
> **복제하지 않고 참조**한다.
>
> 이 문서는 **매핑·식별만** 한다. 라우트 변경, UI 구현, `/app/*` 전환, 원본 재설계는
> 이번 단계 범위 밖이다.
>
> **⚠️ STEP 5 반영:** STEP 5(라우팅 경계 설계)에서 실제 경로가 `/app/*`로 이동하고 path
> builder도 `buildApp*`(예: `buildAppAskPath`)로 바뀌었다. **현재 라우트 계약은
> [`docs/route-architecture.md`](./route-architecture.md)와
> [`src/constants/routes.ts`](../src/constants/routes.ts)가 원본**이다. 아래 2절 표는
> **STEP 4 매핑 시점의 기록**(프리픽스 없는 경로·구 빌더명)이며, 화면↔라우트 매핑 관계
> 자체는 그대로 유효하다.

## 1. 반입 화면 인벤토리 (`design/claude-export/project/`, 15개 `.dc.html`)

| 분류             | 파일                                                                                               | 성격                                    |
| ---------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 코어 화면 (9)    | 온보딩, Home, Ask 결과, 일지 저장, 공부 노트 저장, 일지 상세, 기록 목록, 기록 목록 - 빈 상태, 복기 | 라우트에 매핑됨 (2절)                   |
| 참조 (1)         | 디자인 시스템                                                                                      | 라우트 아님 → STEP 8 디자인 시스템 입력 |
| 프로토타입 (2)   | 프로토타입, 프로토타입 v2                                                                          | 화면 집합 컨테이너, `v2`가 primary      |
| print 산출물 (3) | Ask 결과-print-ispnc, Home-print-fg5s8s, 프로토타입-print-1j2616q                                  | print 렌더, 화면 아님                   |

> 번들 README(`design/claude-export/README.md`)는 `프로토타입 v2`를 사용자가 마지막에
> 연 primary 디자인으로 지목한다.

## 2. ROUTE_PATHS 7종 매핑표

현재 라우트는 `/app` 프리픽스가 없는 상태다(STEP 4 시점). 프리픽스·경계 전환은 STEP 5에서
다룬다.

| 디자인 화면         | `ROUTE_PATHS` 키 | 경로 (빌더)                                            | 비고                          |
| ------------------- | ---------------- | ------------------------------------------------------ | ----------------------------- |
| 온보딩              | `onboarding`     | `/onboarding`                                          | 1:1                           |
| Home                | `home`           | `/`                                                    | 1:1                           |
| Ask 결과            | `ask`            | `/ask` (`buildAskPath`, `?q=`)                         | 1:1                           |
| 일지 저장           | `journalNew`     | `/journal/new?type=investment` (`buildJournalNewPath`) | 2 화면 → 1 라우트             |
| 공부 노트 저장      | `journalNew`     | `/journal/new?type=study`                              | 동일 라우트, `type` 쿼리 토글 |
| 기록 목록           | `journalList`    | `/journal`                                             | 2 화면 → 1 라우트             |
| 기록 목록 - 빈 상태 | `journalList`    | `/journal`                                             | 빈 상태, 동일 라우트          |
| 일지 상세           | `journalDetail`  | `/journal/:id` (`buildJournalDetailPath`)              | 1:1                           |
| 복기                | `journalReview`  | `/journal/:id/review` (`buildJournalReviewPath`)       | 1:1                           |

**커버리지:** `ROUTE_PATHS` **7종 전부** 매핑됨. `journalNew`와 `journalList`는 각각
**2개의 디자인 상태**(투자/공부, 목록/빈 상태)를 하나의 라우트에서 표현한다.

디자인 화면의 버튼 라벨(`동의하고 시작하기`, `질문하기`/`짚어보기`, `기록하기`,
`투자 기록으로 저장`/`공부 노트로 저장`, `추가 질문하기`, `AI와 복기하기`,
`복기 내용 저장`, `질문하러 가기`)은 `docs/nav-map.md`의 네비게이션 트리거 표와 **일치**한다.

## 3. `docs/nav-map.md`와의 차이

| 항목               | nav-map                 | 디자인 원본 / 현재 라우트                  | 판정                                |
| ------------------ | ----------------------- | ------------------------------------------ | ----------------------------------- |
| 화면 수 표기       | 헤더 "화면 목록 (10개)" | 표 본문 9행 / 코어 화면 9개                | **불일치** — 실제 9개 (4절 참고)    |
| 디자인 시스템      | 없음                    | `디자인 시스템.dc.html` 존재               | 원본에만 있음, 라우트 아님 (STEP 8) |
| 프로토타입(v1/v2)  | 없음                    | `프로토타입`, `프로토타입 v2` 존재         | 화면 집합 컨테이너, 라우트 아님     |
| print 산출물       | 없음                    | print 3종 존재                             | 화면 아님, export 산출물            |
| 쿼리 파라미터 구조 | `?type=`, `?q=` 사용    | `routes.ts` 빌더(`buildAskPath` 등)와 일치 | **일치** (충돌 없음)                |

## 4. 미매핑 · 중복 · 불명확

- **미매핑 (의도적):**
  - `디자인 시스템` — 라우트가 아닌 디자인 토큰·컴포넌트 참조. STEP 8(디자인 시스템) 입력.
  - `프로토타입`, `프로토타입 v2` — 개별 화면이 아니라 화면들을 묶은 집합 컨테이너.
- **중복 / 파생:**
  - print 3종(`Ask 결과-print`, `Home-print`, `프로토타입-print`)은 각각 Home / Ask 결과 /
    프로토타입의 print 렌더 파생본이다.
- **불명확 (기록만, 이번 PR에서 원본·nav-map 수정 안 함):**
  - `docs/nav-map.md` 헤더는 "화면 목록 (10개)"라 쓰였으나 실제 표는 9행이고 디자인 코어
    화면도 9개다. → **실제 9개**로 해석. nav-map 본문 수정은 이 PR 범위 밖(STEP 1 문서).
  - `기록 목록.dc.html`에는 "카드 탭 → 일지 상세" 이동을 나타내는 텍스트 라벨이 없다(JS
    처리로 추정). nav-map은 해당 이동을 명시하므로 매핑 자체에는 영향 없음. STEP 5/9에서
    상호작용 확정 시 확인 필요.

## 5. STEP 5(라우팅 경계 설계) 입력 정리

- 매핑된 화면은 7종 라우트로 충분히 표현된다. **한 라우트가 여러 디자인 상태**를 갖는
  경우(`journalNew`=투자/공부, `journalList`=목록/빈 상태)를 STEP 5 경계 설계에서 상태
  분기 방식으로 다룬다.
- `디자인 시스템`·`프로토타입`은 라우트 대상이 아니므로 STEP 5 라우트 경계에서 제외하고,
  각각 STEP 8·참조용으로 남긴다.
- `/app/*` 프리픽스 전환 및 공개 웹/앱 경계는 STEP 5에서 별도로 결정한다. 이 문서는 현재
  프리픽스 없는 `ROUTE_PATHS` 기준 매핑만 확정한다.
