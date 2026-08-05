import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import {
  APP_ROUTE_PATHS,
  buildAppJournalDetailPath,
  buildAppJournalNewPath,
} from '@/constants/routes';
import type { JournalCreatePort } from '@/features/journal-new/model/journalCreatePort';
import { I18nProvider } from '@/i18n/I18nContext';
import { en } from '@/i18n/messages/en';
import { ko } from '@/i18n/messages/ko';
import { JournalNewPage } from '@/pages/JournalNewPage';

function renderPage(path: string, locale: 'ko' | 'en' = 'ko', createPort?: JournalCreatePort) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <I18nProvider locale={locale}>
        <Routes>
          <Route
            path={APP_ROUTE_PATHS.journalNew}
            element={<JournalNewPage createPort={createPort} />}
          />
          <Route path={APP_ROUTE_PATHS.journalDetail} element={<p>detail destination</p>} />
        </Routes>
      </I18nProvider>
    </MemoryRouter>,
  );
}

function fillInvestmentForm() {
  fireEvent.change(screen.getByLabelText('종목'), { target: { value: ' 기업 A ' } });
  fireEvent.change(screen.getByLabelText('기록 시각'), { target: { value: '2026-08-03T09:30' } });
  fireEvent.click(screen.getByLabelText('관심'));
  fireEvent.change(screen.getByLabelText('판단 이유'), { target: { value: ' 근거를 적는다. ' } });
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

  it('validates investment entries in place without saving or navigation', async () => {
    renderPage(buildAppJournalNewPath('investment'));
    fireEvent.click(screen.getByRole('button', { name: '입력 확인' }));
    expect(screen.getAllByRole('alert')).not.toHaveLength(0);
    await waitFor(() => expect(document.activeElement).toHaveAttribute('id', 'assetName'));
    fireEvent.change(screen.getByLabelText('종목'), { target: { value: '기업 A' } });
    fireEvent.change(screen.getByLabelText('기록 시각'), { target: { value: '2026-08-03T09:30' } });
    fireEvent.click(screen.getByLabelText('관심'));
    fireEvent.change(screen.getByLabelText('판단 이유'), { target: { value: '근거를 적는다.' } });
    fireEvent.click(screen.getByRole('button', { name: '입력 확인' }));
    expect(screen.getByRole('status')).toHaveTextContent('아직 저장되지 않았습니다');
  });

  it('focuses the first action radio when action is the first invalid field', async () => {
    renderPage(buildAppJournalNewPath('investment'));
    fireEvent.change(screen.getByLabelText('종목'), { target: { value: '기업 A' } });
    fireEvent.change(screen.getByLabelText('기록 시각'), { target: { value: '2026-08-03T09:30' } });
    fireEvent.click(screen.getByRole('button', { name: '입력 확인' }));
    await waitFor(() => expect(screen.getByLabelText('관심')).toHaveFocus());
  });

  it('maps study open questions by line and exposes no bottom navigation', () => {
    renderPage(buildAppJournalNewPath('study'));
    expect(screen.getByLabelText(/다음에 확인할 것/)).toHaveValue('');
    expect(screen.queryByRole('navigation', { name: '주요 화면 이동' })).not.toBeInTheDocument();
  });

  it('round-trips multi-line open questions through the controlled textarea', () => {
    renderPage(buildAppJournalNewPath('study'));
    const textarea = screen.getByLabelText(/다음에 확인할 것/);
    fireEvent.change(textarea, { target: { value: '질문 하나\n질문 둘' } });
    expect(textarea).toHaveValue('질문 하나\n질문 둘');
  });

  it('returns to pristine and switches type without confirm after open questions are fully cleared', () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    renderPage(buildAppJournalNewPath('study'));
    const textarea = screen.getByLabelText(/다음에 확인할 것/);
    fireEvent.change(textarea, { target: { value: '질문 하나' } });
    fireEvent.change(textarea, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: '투자 기록' }));
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(
      screen.getByRole('heading', { level: 1, name: ko.app.journalNew.investment }),
    ).toBeInTheDocument();
    confirmSpy.mockRestore();
  });

  it('keeps the current form on cancel and switches type on confirm', () => {
    const confirmSpy = vi
      .spyOn(window, 'confirm')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    renderPage(buildAppJournalNewPath('study'));
    fireEvent.change(screen.getByLabelText(/다음에 확인할 것/), { target: { value: '질문 하나' } });

    fireEvent.click(screen.getByRole('button', { name: '투자 기록' }));
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('heading', { level: 1, name: ko.app.journalNew.study }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/다음에 확인할 것/)).toHaveValue('질문 하나');

    fireEvent.click(screen.getByRole('button', { name: '투자 기록' }));
    expect(confirmSpy).toHaveBeenCalledTimes(2);
    expect(
      screen.getByRole('heading', { level: 1, name: ko.app.journalNew.investment }),
    ).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it('keeps the production flow validation-only when no port is injected', () => {
    renderPage(buildAppJournalNewPath('investment'));
    fillInvestmentForm();
    fireEvent.click(screen.getByRole('button', { name: '입력 확인' }));

    expect(screen.getByRole('status')).toHaveTextContent('아직 저장되지 않았습니다');
    expect(screen.queryByText('테스트 흐름이며 저장되지 않습니다.')).not.toBeInTheDocument();
  });

  it('submits a valid command once and navigates with the encoded result id', async () => {
    let resolveCreate: (result: { journalId: string }) => void;
    const create = vi.fn(
      () =>
        new Promise<{ journalId: string }>((resolve) => {
          resolveCreate = resolve;
        }),
    );
    renderPage(buildAppJournalNewPath('investment'), 'ko', { create });
    fillInvestmentForm();

    fireEvent.click(screen.getByRole('button', { name: '테스트 제출' }));
    fireEvent.submit(screen.getByRole('button', { name: '테스트 제출 중' }).closest('form')!);

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      type: 'investment',
      assetName: '기업 A',
      occurredAt: '2026-08-03T09:30',
      action: 'interest',
      reasoning: '근거를 적는다.',
      emotion: undefined,
    });
    await act(async () => resolveCreate!({ journalId: 'test/id' }));
    expect(screen.getByText('detail destination')).toBeInTheDocument();
    expect(buildAppJournalDetailPath('test/id')).toBe('/app/journal/test%2Fid');
  });

  it('preserves values and permits an explicit retry after test-port failure', async () => {
    const create = vi
      .fn()
      .mockRejectedValueOnce(new Error('nope'))
      .mockResolvedValueOnce({ journalId: 'id' });
    renderPage(buildAppJournalNewPath('investment'), 'ko', { create });
    fillInvestmentForm();
    fireEvent.click(screen.getByRole('button', { name: '테스트 제출' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('테스트 제출에 실패'));
    expect(screen.getByLabelText('종목')).toHaveValue(' 기업 A ');
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    await waitFor(() => expect(create).toHaveBeenCalledTimes(2));
  });
});
