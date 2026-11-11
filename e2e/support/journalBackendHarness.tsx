import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import { AppRouter } from '@/app/AppRouter';
import { buildAppJournalNewPath } from '@/constants/routes';
import { createProductionJournalCreatePort } from '@/features/journal-new/adapter/productionJournalCreatePort';
import '@/styles/globals.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Journal backend integration root is missing.');

window.history.replaceState(null, '', buildAppJournalNewPath('investment'));

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <AppRouter
        authPresentation={{ state: 'authenticated' }}
        journalCreatePort={createProductionJournalCreatePort()}
        journalCreateMode="production"
      />
    </BrowserRouter>
  </StrictMode>,
);
