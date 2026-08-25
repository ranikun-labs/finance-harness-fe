import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { AppRouter } from '@/app/AppRouter';
import { buildFeaturesPath, buildLearnPath, buildLocaleHomePath } from '@/constants/routes';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRouter />
    </MemoryRouter>,
  );
}

describe('STEP 12 A11Y-01 landmark contract', () => {
  it.each([
    buildLocaleHomePath('ko'),
    buildLocaleHomePath('en'),
    buildFeaturesPath('ko'),
    buildLearnPath('en'),
    '/fr',
    '/app/not-a-route',
  ])('%s has exactly one main and one level-one heading', async (path) => {
    renderAt(path);

    await waitFor(() => {
      expect(screen.queryAllByRole('main')).toHaveLength(1);
      expect(screen.queryAllByRole('heading', { level: 1 })).toHaveLength(1);
    });
  });
});
