import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import { AppRouter } from '@/app/AppRouter';
import '@/styles/globals.css';

// Test-only fixture: 인증된 표시 상태로 앱 아무 경로(`?path=/app...`)에서 시작한다. 검토 → 기록 작성 같은
// 앱 안 흐름을 UI로 따라가 상태(검토 맥락 handoff)를 만들 때 쓴다. 프로덕션 번들에 포함되지 않는다.
const requested = new URLSearchParams(window.location.search).get('path');
const path = requested?.startsWith('/app') ? requested : '/app';
createRoot(document.getElementById('root')!).render(
  <MemoryRouter initialEntries={[path]}>
    <AppRouter authPresentation={{ state: 'authenticated' }} />
  </MemoryRouter>,
);
