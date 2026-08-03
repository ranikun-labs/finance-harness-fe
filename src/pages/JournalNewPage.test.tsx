import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';

import { APP_ROUTE_PATHS, buildAppJournalNewPath } from '@/constants/routes';
import { I18nProvider } from '@/i18n/I18nContext';
import { en } from '@/i18n/messages/en';
import { ko } from '@/i18n/messages/ko';
import { JournalNewPage } from '@/pages/JournalNewPage';

function renderPage(path: string, locale: 'ko' | 'en' = 'ko') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <I18nProvider locale={locale}>
        <Routes>
          <Route path={APP_ROUTE_PATHS.journalNew} element={<JournalNewPage />} />
        </Routes>
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe('JournalNewPage', () => {
  it.each([
    [buildAppJournalNewPath('investment'), ko.app.journalNew.investment],
    [buildAppJournalNewPath('study'), ko.app.journalNew.study],
  ])('keeps the valid %s placeholder title', (path, title) => {
    renderPage(path);

    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
  });

  it.each([
    `${APP_ROUTE_PATHS.journalNew}`,
    `${APP_ROUTE_PATHS.journalNew}?type=unknown`,
    `${APP_ROUTE_PATHS.journalNew}?type=investment&type=study`,
  ])('renders local invalid-type guidance for %s', (path) => {
    renderPage(path);

    expect(
      screen.getByRole('heading', { level: 1, name: ko.app.journalNew.invalidType.heading }),
    ).toBeInTheDocument();
    expect(screen.getByText(ko.app.journalNew.invalidType.description)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: ko.app.journalNew.invalidType.investmentAction }),
    ).toHaveAttribute('href', buildAppJournalNewPath('investment'));
    expect(
      screen.getByRole('link', { name: ko.app.journalNew.invalidType.studyAction }),
    ).toHaveAttribute('href', buildAppJournalNewPath('study'));
  });

  it('uses English invalid-type copy when the app locale is English', () => {
    renderPage(`${APP_ROUTE_PATHS.journalNew}?type=Investment`, 'en');

    expect(
      screen.getByRole('heading', { level: 1, name: en.app.journalNew.invalidType.heading }),
    ).toBeInTheDocument();
    expect(screen.getByText(en.app.journalNew.invalidType.description)).toBeInTheDocument();
  });

  it('validates investment entries in place without saving or navigation', () => {
    renderPage(buildAppJournalNewPath('investment'));
    fireEvent.click(screen.getByRole('button', { name: '입력 확인' }));
    expect(screen.getAllByRole('alert')).not.toHaveLength(0);
    expect(document.activeElement).toHaveAttribute('id', 'assetName');
    fireEvent.change(screen.getByLabelText('종목'), { target: { value: '기업 A' } });
    fireEvent.change(screen.getByLabelText('기록 시각'), { target: { value: '2026-08-03T09:30' } });
    fireEvent.click(screen.getByLabelText('관심'));
    fireEvent.change(screen.getByLabelText('판단 이유'), { target: { value: '근거를 적는다.' } });
    fireEvent.click(screen.getByRole('button', { name: '입력 확인' }));
    expect(screen.getByRole('status')).toHaveTextContent('아직 저장되지 않았습니다');
  });

  it('maps study open questions by line and exposes no bottom navigation', () => {
    renderPage(buildAppJournalNewPath('study'));
    expect(screen.getByLabelText(/다음에 확인할 것/)).toHaveValue('');
    expect(screen.queryByRole('navigation', { name: '주요 화면 이동' })).not.toBeInTheDocument();
  });
});
