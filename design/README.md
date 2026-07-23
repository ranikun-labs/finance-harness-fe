# design/ — 외부 디자인 원본 (신뢰 경계)

이 디렉터리는 **외부에서 생성된 디자인 원본**을 저장소로 반입한 곳이다. 애플리케이션
소스가 아니다.

## 읽기 전용 원칙

- `design/claude-export/**`는 **외부 산출물의 byte-for-byte 사본**이다. 포맷팅,
  리네이밍, 내용 수정을 하지 않는다. 원본 상태 그대로 보존한다.
- 이 디렉터리는 **빌드·타입체크·번들 대상이 아니다.** `tsconfig.app.json`의
  `include`(`src`, `e2e`)와 ESLint의 `files`(`src/**/*.{ts,tsx}`) 스코프 밖이며,
  Vite 엔트리(`index.html`)에서도 참조되지 않는다.
- `design/claude-export/`는 `.prettierignore`에 등재되어 Prettier 포맷 검증에서
  제외된다. 이 디렉터리의 우리 문서(`README.md`, `PROVENANCE.md`)는 Prettier 검증
  대상으로 남는다.

## 구현 시 사용법

- 디자인 원본은 **HTML/CSS/JS 프로토타입**이다. 프로덕션 코드가 아니다. 구현할 때는
  **시각적 결과를 재현**하되 프로토타입의 내부 구조를 그대로 복사하지 않는다.
- 화면 ↔ 라우트 매핑과 nav-map 대비 차이는 [`docs/design-route-map.md`](../docs/design-route-map.md)에
  정리되어 있다. 라우트 정의 단일 소스는 [`src/constants/routes.ts`](../src/constants/routes.ts),
  화면·라우트 기준 문서는 [`docs/nav-map.md`](../docs/nav-map.md)다.

## 출처

반입 출처·무결성 해시·경로명 차이는 [`PROVENANCE.md`](./PROVENANCE.md)에 기록되어 있다.
