# AI 투자 체크리스트 — Frontend

## 서비스 핵심

Finance는 투자 질문을 체크리스트로 점검하고, 당시 판단과 학습 내용을 기록해 나중에 돌아볼 수 있게 하는 서비스입니다. 이 저장소는 질문·검토, 저널 작성·조회, 별도 복기 화면을 담당합니다.

## 대표 사용자 흐름

| 사용자 행동 | 화면과 유지보수 시작점 |
| --- | --- |
| 투자 질문을 입력하고 확인할 항목을 살핀다 | [Ask 화면](src/pages/AskPage.tsx)에서 질문 전달, 체크리스트, 검토 결과 상태를 확인합니다. |
| 판단 기록 또는 학습 노트를 작성한다 | [저널 작성](src/pages/JournalNewPage.tsx)에서 두 기록 유형의 폼과 진입 조건을 확인합니다. |
| 저장 기록을 다시 열고 당시 판단을 돌아본다 | [저널 목록](src/pages/JournalListPage.tsx)에서 기록을 찾고 [저널 상세](src/pages/JournalDetailPage.tsx)에서 원래 기록과 후속 복기 흐름을 확인합니다. |

질문·체크 상태 임시저장과 이어쓰기는 설계 단계입니다. 실행 중인 앱의 데이터 연결 범위는 화면 구현과 함께 확인하세요. [라우트 지도](docs/nav-map.md) · [제품 정책](https://github.com/ranikun-labs/finance-harness-docs/blob/main/service-policy/finance-product-policy.md) · [Finance BE](https://github.com/ranikun-labs/finance-harness-be)
