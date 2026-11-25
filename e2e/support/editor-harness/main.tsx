import { createRoot } from 'react-dom/client';
import { createBrowserRouter, createMemoryRouter, RouterProvider } from 'react-router';
import { AppRouter } from '@/app/AppRouter';
import '@/styles/globals.css';

// Test-only presentation fixture. This file is served by the E2E dev server,
// is not an application route, and is excluded from the production build.
// 라우터는 앱(`main.tsx`)과 같은 data router다 — 이탈 보호(useBlocker)가 거기서만 동작한다.
// `?history=browser`이면 실제 브라우저 history(`page.goBack()` 검증용), 아니면 MemoryRouter다.
const params = new URLSearchParams(window.location.search);
const requested = params.get('path');
const path =
  requested === '/app/journal/new?type=study' ? requested : '/app/journal/new?type=investment';
const element = <AppRouter authPresentation={{ state: 'authenticated' }} />;

let router;
if (params.get('history') === 'browser' && requested?.startsWith('/app')) {
  window.history.replaceState(null, '', requested);
  router = createBrowserRouter([{ path: '*', element }]);
} else {
  router = createMemoryRouter([{ path: '*', element }], { initialEntries: [path] });
}
createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
