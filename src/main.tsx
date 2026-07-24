import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import { AppRouter } from '@/app/AppRouter';
import { shouldHydrate } from '@/prerender/shouldHydrate';

import '@/styles/globals.css';

const rootElement = document.getElementById('root')!;

const tree = (
  <StrictMode>
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  </StrictMode>
);

/**
 * 공개 웹 Pre-render 산출물(root에 `data-render-mode="prerender"` marker 포함)은
 * `hydrateRoot`로 재사용해 전체 DOM을 지웠다 다시 그리지 않는다. 그 외(SPA shell,
 * `/app/*` 포함)는 기존과 동일하게 `createRoot`로 처음부터 렌더한다.
 */
if (shouldHydrate(rootElement)) {
  hydrateRoot(rootElement, tree);
} else {
  createRoot(rootElement).render(tree);
}
