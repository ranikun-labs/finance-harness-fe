import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import { getDocumentTitle, RouteDocumentTitle } from '@/metadata/documentTitle';
import { I18nProvider } from '@/i18n/I18nContext';
import { en } from '@/i18n/messages/en';
import { ko } from '@/i18n/messages/ko';

afterEach(() => {
  document.title = '';
});

describe('STEP 12 META-01 route and locale-aware titles', () => {
  it.each([
    ['/ko', 'ko', ko.public.home.title],
    ['/ko/features', 'ko', ko.public.features.title],
    ['/ko/learn', 'ko', ko.public.learn.title],
    ['/en', 'en', en.public.home.title],
    ['/en/features', 'en', en.public.features.title],
    ['/en/learn', 'en', en.public.learn.title],
  ] as const)('maps %s to existing %s wording', (path, locale, expected) => {
    expect(getDocumentTitle(path, locale)).toBe(expected);
  });

  it('keeps unsupported public fallback title in the fallback locale', () => {
    expect(getDocumentTitle('/fr', 'ko')).toBe(ko.public.notFound.heading);
  });

  it('sets the same title on the hydrated client from the shared mapping', async () => {
    render(
      <MemoryRouter initialEntries={['/en/features']}>
        <I18nProvider locale="en">
          <RouteDocumentTitle />
        </I18nProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(document.title).toBe(en.public.features.title));
  });
});
