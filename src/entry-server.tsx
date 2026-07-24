/* eslint-disable react-refresh/only-export-components -- 이 파일은 브라우저 HMR
   대상이 아니라 build-only SSR 엔트리(vite build --ssr 전용)라 컴포넌트 전용
   export 제약이 적용되지 않는다. */
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';

import { AppRouter } from '@/app/AppRouter';
import { PRERENDER_MANIFEST } from '@/prerender/manifest';

/**
 * SSR 전용 렌더 엔트리. `vite build --ssr`로 별도 컴파일되어 build-only Node
 * 오케스트레이션 스크립트(`scripts/prerender.mjs`)가 동적 import한다. `main.tsx`
 * (BrowserRouter 기반 클라이언트 엔트리)와 무관하게 동일한 `AppRouter`를 재사용한다.
 *
 * `PRERENDER_MANIFEST`는 계산하지 않고 `src/prerender/manifest.ts`에서 그대로
 * 재-export한다 — plain Node 오케스트레이션 스크립트가 `@/` 별칭·TSX를 직접 해석할
 * 수 없으므로, 이 컴파일된 SSR 번들 하나에서 render 함수와 매니페스트를 동시에
 * 얻기 위함이다. 매니페스트 계산 로직 자체의 책임은 여전히 `manifest.ts`에 있다.
 */
export { PRERENDER_MANIFEST };

export function render(url: string): string {
  return renderToString(
    <StaticRouter location={url}>
      <AppRouter />
    </StaticRouter>,
  );
}
