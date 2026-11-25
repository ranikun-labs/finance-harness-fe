import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { AppRouter } from '@/app/AppRouter';
import '@/styles/globals.css';

// Test-only fixture: 실제 브라우저 history(BrowserRouter)와 인증된 표시 상태로 앱을 연다.
// MemoryRouter 하네스는 `page.goBack()`을 검증할 수 없어 따로 둔다. 앱 라우트가 아니며 프로덕션 빌드에 없다.
// 시작 경로는 `?path=/app/...`로 받고, 주소창은 곧바로 그 앱 경로로 바꾼다.
const requested = new URLSearchParams(window.location.search).get('path');
if (requested?.startsWith('/app')) window.history.replaceState(null, '', requested);
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AppRouter authPresentation={{ state: 'authenticated' }} />
  </BrowserRouter>,
);
