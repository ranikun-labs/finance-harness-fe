import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import { AppRouter } from '@/app/AppRouter';
import '@/styles/globals.css';

// Test-only presentation fixture. This file is served by the E2E dev server,
// is not an application route, and is excluded from the production build.
const requested = new URLSearchParams(window.location.search).get('path');
const path =
  requested === '/app/journal/new?type=study' ? requested : '/app/journal/new?type=investment';
createRoot(document.getElementById('root')!).render(
  <MemoryRouter initialEntries={[path]}>
    <AppRouter authPresentation={{ state: 'authenticated' }} />
  </MemoryRouter>,
);
