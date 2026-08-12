import { StrictMode } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigationType } from 'react-router';
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
import { SAMPLE_DECISION_CONTEXT, type DecisionContextSnapshot } from '@/mocks/decisionContext';
import { JournalNewPage } from '@/pages/JournalNewPage';

function DetailDestination() {
  const location = useLocation();
  const context = (location.state as { decisionContext?: DecisionContextSnapshot } | null)
    ?.decisionContext;

  return (
    <>
      <p data-testid="detail-destination">detail destination:{useNavigationType()}</p>
      <output data-testid="detail-context-state">
        {context ? JSON.stringify(context) : 'none'}
      </output>
    </>
  );
}

function renderPage(
  path: string,
  locale: 'ko' | 'en' = 'ko',
  createPort?: JournalCreatePort,
  strict = false,
  state?: { decisionContext?: DecisionContextSnapshot },
) {
  const [pathname, search = ''] = path.split('?');
  const routes = (
    <Routes>
      <Route
        path={APP_ROUTE_PATHS.journalNew}
        element={<JournalNewPage createPort={createPort} />}
      />
      <Route path={APP_ROUTE_PATHS.journalDetail} element={<DetailDestination />} />
    </Routes>
  );
  return render(
    <MemoryRouter initialEntries={[{ pathname, search: search ? `?${search}` : '', state }]}>
      <I18nProvider locale={locale}>
        {strict ? <StrictMode>{routes}</StrictMode> : routes}
      </I18nProvider>
    </MemoryRouter>,
  );
}

function fillInvestmentForm() {
  fireEvent.change(screen.getByLabelText('대상'), { target: { value: ' 기업 A ' } });
  fireEvent.click(screen.getByLabelText('관심'));
  fireEvent.change(screen.getByLabelText('왜 그렇게 판단했나요?'), {
    target: { value: ' 근거를 적는다. ' },
  });
  fireEvent.click(screen.getByRole('button', { name: '기록 시점 변경' }));
  fireEvent.change(screen.getByLabelText('기록 시점'), {
    target: { value: '2026-08-03T09:30' },
  });
}

function fillStudyForm() {
  fireEvent.change(screen.getByLabelText('무엇을 배웠나요?'), {
    target: { value: ' 공부 제목 ' },
  });
  fireEvent.change(screen.getByLabelText('핵심 정리'), { target: { value: ' 핵심 내용 ' } });
  fireEvent.click(screen.getByRole('button', { name: '질문 추가' }));
  const firstQuestion = screen.getByLabelText(/더 확인할 것 확인할 질문 1/);
  fireEvent.change(firstQuestion, { target: { value: ' 질문 하나 ' } });
  fireEvent.click(screen.getByRole('button', { name: '질문 추가' }));
  fireEvent.change(screen.getByLabelText('확인할 질문 2'), { target: { value: '질문 둘' } });
  fireEvent.click(screen.getByRole('button', { name: '질문 추가' }));
  fireEvent.change(screen.getByLabelText('확인할 질문 3'), { target: { value: '질문 하나 ' } });
  fireEvent.click(screen.getByRole('button', { name: '기록 시점 변경' }));
  fireEvent.change(screen.getByLabelText('기록 시점'), {
    target: { value: '2026-08-03T09:30' },
  });
}

function deferredResult() {
  let resolve: (result: { journalId: string }) => void;
  let reject: (error: Error) => void;
  const promise = new Promise<{ journalId: string }>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return {
    promise,
    resolve: (result: { journalId: string }) => resolve!(result),
    reject: (error: Error) => reject!(error),
  };
}

describe('JournalNewPage', () => {
  it('presents the immutable minimum Decision Context and keeps optional evidence separate', () => {
    renderPage(buildAppJournalNewPath('investment'), 'ko', undefined, false, {
      decisionContext: SAMPLE_DECISION_CONTEXT,
    });

    const panel = screen.getByTestId('decision-context-capture');
    const contextSwitch = within(panel).getByRole('switch');
    expect(contextSwitch).toHaveAttribute('aria-checked', 'true');
    expect(
      within(panel).getByText(ko.app.journalNew.decisionContext.originalQuestionLabel),
    ).toBeInTheDocument();
    expect(within(panel).getByText(SAMPLE_DECISION_CONTEXT.originalQuestion)).toBeInTheDocument();
    expect(within(panel).getAllByRole('checkbox')).toHaveLength(
      SAMPLE_DECISION_CONTEXT.optionalEvidence.length,
    );
    expect(within(panel).getAllByRole('listitem')).toHaveLength(
      SAMPLE_DECISION_CONTEXT.checklist.length,
    );
    expect(
      within(panel).getByText(ko.app.journalNew.decisionContext.immutableNotice),
    ).toBeInTheDocument();

    const firstEvidence = within(panel).getAllByRole('checkbox')[0];
    expect(firstEvidence).toBeChecked();
    fireEvent.click(firstEvidence);
    expect(firstEvidence).not.toBeChecked();

    fireEvent.click(contextSwitch);
    expect(contextSwitch).toHaveAttribute('aria-checked', 'false');
    expect(
      within(panel).queryByText(SAMPLE_DECISION_CONTEXT.originalQuestion),
    ).not.toBeInTheDocument();
    expect(within(panel).queryAllByRole('checkbox')).toHaveLength(0);

    fireEvent.click(contextSwitch);
    expect(contextSwitch).toHaveAttribute('aria-checked', 'true');
    expect(within(panel).getAllByRole('listitem')).toHaveLength(
      SAMPLE_DECISION_CONTEXT.checklist.length,
    );
    expect(within(panel).getAllByRole('checkbox')[0]).not.toBeChecked();
  });

  it('keeps the create command unchanged while carrying minimum context on ON navigation', async () => {
    const create = vi.fn().mockResolvedValue({ journalId: 'context-on' });
    renderPage(buildAppJournalNewPath('investment'), 'ko', { create }, false, {
      decisionContext: SAMPLE_DECISION_CONTEXT,
    });

    const panel = screen.getByTestId('decision-context-capture');
    fireEvent.click(within(panel).getAllByRole('checkbox')[0]);
    fillInvestmentForm();
    fireEvent.click(screen.getByRole('button', { name: '테스트 제출' }));

    await waitFor(() =>
      expect(screen.getByTestId('detail-destination')).toHaveTextContent('REPLACE'),
    );
    expect(create).toHaveBeenCalledWith({
      type: 'investment',
      assetName: '기업 A',
      occurredAt: '2026-08-03T09:30',
      action: 'interest',
      reasoning: '근거를 적는다.',
      emotion: undefined,
    });

    const savedContext = JSON.parse(screen.getByTestId('detail-context-state').textContent ?? '');
    expect(savedContext.originalQuestion).toBe(SAMPLE_DECISION_CONTEXT.originalQuestion);
    expect(savedContext.checklistVersion).toBe(SAMPLE_DECISION_CONTEXT.checklistVersion);
    expect(savedContext.checklist).toEqual(SAMPLE_DECISION_CONTEXT.checklist);
    expect(savedContext.capturedAt).toBe(SAMPLE_DECISION_CONTEXT.capturedAt);
    expect(savedContext.optionalEvidence[0].included).toBe(false);
  });

  it('omits Decision Context on OFF navigation without changing the create command', async () => {
    const create = vi.fn().mockResolvedValue({ journalId: 'context-off' });
    renderPage(buildAppJournalNewPath('investment'), 'ko', { create }, false, {
      decisionContext: SAMPLE_DECISION_CONTEXT,
    });

    fireEvent.click(screen.getByRole('switch'));
    fillInvestmentForm();
    fireEvent.click(screen.getByRole('button', { name: '테스트 제출' }));

    await waitFor(() =>
      expect(screen.getByTestId('detail-destination')).toHaveTextContent('REPLACE'),
    );
    expect(create).toHaveBeenCalledWith({
      type: 'investment',
      assetName: '기업 A',
      occurredAt: '2026-08-03T09:30',
      action: 'interest',
      reasoning: '근거를 적는다.',
      emotion: undefined,
    });
    expect(screen.getByTestId('detail-context-state')).toHaveTextContent('none');
  });

  it.each([
    [buildAppJournalNewPath('investment'), ko.app.journalNew.investment],
    [buildAppJournalNewPath('study'), ko.app.journalNew.study],
  ])('renders the focused %s editor title', (path, title) => {
    renderPage(path);

    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: ko.app.journalNew.typeChange.action }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: /^판단 기록$/,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: /^학습 노트$/,
      }),
    ).not.toBeInTheDocument();
  });

  it('keeps occurredAt secondary until the user opens its explicit editor', () => {
    renderPage(buildAppJournalNewPath('investment'));

    expect(screen.queryByLabelText('기록 시점')).not.toBeInTheDocument();
    expect(screen.getByText(ko.app.journalNew.form.investment.occurredAt.now)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '기록 시점 변경' }));
    const occurredAt = screen.getByLabelText('기록 시점');
    expect(occurredAt).toHaveAttribute('type', 'datetime-local');
    expect((occurredAt as HTMLInputElement).value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);

    fireEvent.change(occurredAt, { target: { value: '2025-01-02T03:04' } });
    expect(occurredAt).toHaveValue('2025-01-02T03:04');
  });

  it('presents a focused entry choice when no journal type is selected', () => {
    renderPage(APP_ROUTE_PATHS.journalNew);

    expect(
      screen.getByRole('heading', { level: 1, name: ko.app.journalNew.entryChoice.heading }),
    ).toBeInTheDocument();
    expect(screen.getByText(ko.app.journalNew.entryChoice.prompt)).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: new RegExp(ko.app.journalNew.entryChoice.investment.title),
      }),
    ).toHaveAttribute('href', buildAppJournalNewPath('investment'));
    expect(
      screen.getByRole('link', { name: new RegExp(ko.app.journalNew.entryChoice.study.title) }),
    ).toHaveAttribute('href', buildAppJournalNewPath('study'));
    expect(screen.queryByLabelText('대상')).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('link', {
        name: new RegExp(ko.app.journalNew.entryChoice.investment.title),
      }),
    );
    expect(screen.getByRole('heading', { name: ko.app.journalNew.investment })).toBeInTheDocument();
  });

  it('opens only the learning-note editor when that entry choice is selected', () => {
    renderPage(APP_ROUTE_PATHS.journalNew);
    fireEvent.click(
      screen.getByRole('link', { name: new RegExp(ko.app.journalNew.entryChoice.study.title) }),
    );

    expect(screen.getByRole('heading', { name: ko.app.journalNew.study })).toBeInTheDocument();
    expect(screen.getByLabelText('무엇을 배웠나요?')).toBeInTheDocument();
    expect(screen.queryByLabelText('대상')).not.toBeInTheDocument();
  });

  it.each([
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

  it('uses English entry-choice naming when the app locale is English', () => {
    renderPage(APP_ROUTE_PATHS.journalNew, 'en');

    expect(
      screen.getByRole('heading', { level: 1, name: en.app.journalNew.entryChoice.heading }),
    ).toBeInTheDocument();
    expect(screen.getByText(en.app.journalNew.entryChoice.prompt)).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: new RegExp(en.app.journalNew.entryChoice.investment.title),
      }),
    ).toHaveAttribute('href', buildAppJournalNewPath('investment'));
    expect(
      screen.getByRole('link', { name: new RegExp(en.app.journalNew.entryChoice.study.title) }),
    ).toHaveAttribute('href', buildAppJournalNewPath('study'));
  });

  it('validates investment entries in place without saving or navigation', async () => {
    renderPage(buildAppJournalNewPath('investment'));
    fireEvent.click(screen.getByRole('button', { name: '입력 확인' }));
    expect(screen.getAllByRole('alert')).not.toHaveLength(0);
    await waitFor(() => expect(document.activeElement).toHaveAttribute('id', 'assetName'));
    fireEvent.change(screen.getByLabelText('대상'), { target: { value: '기업 A' } });
    fireEvent.click(screen.getByLabelText('관심'));
    fireEvent.change(screen.getByLabelText('왜 그렇게 판단했나요?'), {
      target: { value: '근거를 적는다.' },
    });
    fireEvent.click(screen.getByRole('button', { name: '입력 확인' }));
    expect(screen.getByRole('status')).toHaveTextContent('아직 저장되지 않았습니다');
  });

  it('focuses the first action radio when action is the first invalid field', async () => {
    renderPage(buildAppJournalNewPath('investment'));
    fireEvent.change(screen.getByLabelText('대상'), { target: { value: '기업 A' } });
    fireEvent.click(screen.getByRole('button', { name: '입력 확인' }));
    await waitFor(() => expect(screen.getByLabelText('관심')).toHaveFocus());
  });

  it('maps study open questions by line and exposes no bottom navigation', () => {
    renderPage(buildAppJournalNewPath('study'));
    expect(screen.queryByLabelText(/더 확인할 것/)).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: '주요 화면 이동' })).not.toBeInTheDocument();
  });

  it('keeps ordered open question items in the controlled editor', () => {
    renderPage(buildAppJournalNewPath('study'));
    fireEvent.click(screen.getByRole('button', { name: '질문 추가' }));
    const firstQuestion = screen.getByLabelText(/더 확인할 것 확인할 질문 1/);
    fireEvent.change(firstQuestion, { target: { value: '질문 하나' } });
    fireEvent.click(screen.getByRole('button', { name: '질문 추가' }));
    const secondQuestion = screen.getByLabelText('확인할 질문 2');
    fireEvent.change(secondQuestion, { target: { value: '질문 둘' } });
    expect(firstQuestion).toHaveValue('질문 하나');
    expect(secondQuestion).toHaveValue('질문 둘');
  });

  it('returns to pristine and opens entry choice without confirm after open questions are cleared', () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    renderPage(buildAppJournalNewPath('study'));
    fireEvent.click(screen.getByRole('button', { name: '질문 추가' }));
    fireEvent.change(screen.getByLabelText(/더 확인할 것 확인할 질문 1/), {
      target: { value: '질문 하나' },
    });
    fireEvent.click(screen.getByRole('button', { name: '질문 1 삭제' }));
    fireEvent.click(screen.getByRole('button', { name: ko.app.journalNew.typeChange.action }));
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(
      screen.getByRole('heading', { name: ko.app.journalNew.entryChoice.heading }),
    ).toBeInTheDocument();
    confirmSpy.mockRestore();
  });

  it('keeps the current form on cancel and opens entry choice on confirm', () => {
    const confirmSpy = vi
      .spyOn(window, 'confirm')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    renderPage(buildAppJournalNewPath('study'));
    fireEvent.click(screen.getByRole('button', { name: '질문 추가' }));
    fireEvent.change(screen.getByLabelText(/더 확인할 것 확인할 질문 1/), {
      target: { value: '질문 하나' },
    });

    fireEvent.click(screen.getByRole('button', { name: ko.app.journalNew.typeChange.action }));
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('heading', { level: 1, name: ko.app.journalNew.study }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/더 확인할 것 확인할 질문 1/)).toHaveValue('질문 하나');

    fireEvent.click(screen.getByRole('button', { name: ko.app.journalNew.typeChange.action }));
    expect(confirmSpy).toHaveBeenCalledTimes(2);
    expect(
      screen.getByRole('heading', { name: ko.app.journalNew.entryChoice.heading }),
    ).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it('validates a blank open-question item and keeps its accessible error state', async () => {
    renderPage(buildAppJournalNewPath('study'));
    fireEvent.change(screen.getByLabelText('무엇을 배웠나요?'), { target: { value: '주제' } });
    fireEvent.change(screen.getByLabelText('핵심 정리'), { target: { value: '핵심' } });
    fireEvent.click(screen.getByRole('button', { name: '질문 추가' }));
    const question = screen.getByLabelText(/더 확인할 것 확인할 질문 1/);

    fireEvent.click(screen.getByRole('button', { name: '입력 확인' }));

    expect(question).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    await waitFor(() => expect(question).toHaveFocus());
  });

  it('limits open questions to ten without deduplicating user entries', () => {
    renderPage(buildAppJournalNewPath('study'));
    const addQuestion = () => fireEvent.click(screen.getByRole('button', { name: '질문 추가' }));
    for (let index = 0; index < 10; index += 1) addQuestion();

    expect(screen.getByText('10 / 10')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '질문 추가' })).toBeDisabled();
    expect(screen.getAllByRole('button', { name: /질문 \d+ 삭제/ })).toHaveLength(10);
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

    await waitFor(() => {
      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith({
        type: 'investment',
        assetName: '기업 A',
        occurredAt: '2026-08-03T09:30',
        action: 'interest',
        reasoning: '근거를 적는다.',
        emotion: undefined,
      });
    });
    await act(async () => resolveCreate!({ journalId: 'test/id' }));
    expect(screen.getByText('detail destination:REPLACE')).toBeInTheDocument();
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
    expect(screen.getByLabelText('대상')).toHaveValue(' 기업 A ');
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    await waitFor(() => expect(create).toHaveBeenCalledTimes(2));
  });

  it('recovers a synchronous create throw into failure and retries the current command once', async () => {
    let createAttempts = 0;
    const submittedCommands: Parameters<JournalCreatePort['create']>[0][] = [];
    const create = vi.fn((command: Parameters<JournalCreatePort['create']>[0]) => {
      submittedCommands.push(command);
      createAttempts += 1;
      if (createAttempts === 1) throw new Error('synchronous create failure');
      return Promise.resolve({ journalId: 'retry/id' });
    });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderPage(buildAppJournalNewPath('investment'), 'ko', { create });
    fillInvestmentForm();

    fireEvent.click(screen.getByRole('button', { name: '테스트 제출' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('테스트 제출에 실패'));
    expect(create).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('대상')).toHaveValue(' 기업 A ');
    expect(screen.getByLabelText('대상')).toBeEnabled();
    expect(screen.getByRole('button', { name: ko.app.journalNew.typeChange.action })).toBeEnabled();
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    await waitFor(() => expect(screen.getByText('detail destination:REPLACE')).toBeInTheDocument());
    expect(create).toHaveBeenCalledTimes(2);
    expect(submittedCommands[1]).toEqual({
      type: 'investment',
      assetName: '기업 A',
      occurredAt: '2026-08-03T09:30',
      action: 'interest',
      reasoning: '근거를 적는다.',
      emotion: undefined,
    });
    expect(screen.getAllByText('detail destination:REPLACE')).toHaveLength(1);
    expect(buildAppJournalDetailPath('retry/id')).toBe('/app/journal/retry%2Fid');
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('maps a valid study submission to its exact discriminated command', async () => {
    const pending = deferredResult();
    const create = vi.fn(() => pending.promise);
    renderPage(buildAppJournalNewPath('study'), 'ko', { create });
    fillStudyForm();
    fireEvent.click(screen.getByRole('button', { name: '테스트 제출' }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        type: 'study',
        title: '공부 제목',
        occurredAt: '2026-08-03T09:30',
        keyContent: '핵심 내용',
        openQuestions: ['질문 하나', '질문 둘', '질문 하나'],
      }),
    );
  });

  it('disables every submit control and type-change action while an injected create is pending', () => {
    const pending = deferredResult();
    renderPage(buildAppJournalNewPath('investment'), 'ko', { create: () => pending.promise });
    fillInvestmentForm();
    fireEvent.click(screen.getByRole('button', { name: '테스트 제출' }));

    expect(screen.getByRole('status')).toHaveTextContent('테스트 제출 중');
    expect(screen.getByLabelText('대상')).toBeDisabled();
    expect(screen.getByLabelText('관심')).toBeDisabled();
    expect(screen.getByLabelText('왜 그렇게 판단했나요?')).toBeDisabled();
    expect(
      screen.getByRole('button', { name: ko.app.journalNew.typeChange.action }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: '테스트 제출 중' })).toBeDisabled();
  });

  it('clears create failure on edit and retries the current input', async () => {
    const create = vi
      .fn()
      .mockRejectedValueOnce(new Error('expected'))
      .mockResolvedValueOnce({ journalId: 'created' });
    renderPage(buildAppJournalNewPath('investment'), 'ko', { create });
    fillInvestmentForm();
    fireEvent.click(screen.getByRole('button', { name: '테스트 제출' }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('왜 그렇게 판단했나요?'), {
      target: { value: ' 수정한 근거 ' },
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '테스트 제출' }));

    await waitFor(() => expect(create).toHaveBeenCalledTimes(2));
    expect(create.mock.calls[1][0]).toMatchObject({ reasoning: '수정한 근거' });
  });

  it('does not call the port when retry validation finds an edited invalid form', async () => {
    const create = vi.fn().mockRejectedValueOnce(new Error('expected'));
    renderPage(buildAppJournalNewPath('investment'), 'ko', { create });
    fillInvestmentForm();
    fireEvent.click(screen.getByRole('button', { name: '테스트 제출' }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('대상'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: '테스트 제출' }));

    expect(create).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByLabelText('대상')).toHaveFocus());
  });

  it('blocks type-change navigation without calling the dirty confirmation while submitting', () => {
    const pending = deferredResult();
    const confirmSpy = vi.spyOn(window, 'confirm');
    renderPage(buildAppJournalNewPath('investment'), 'ko', { create: () => pending.promise });
    fillInvestmentForm();
    fireEvent.click(screen.getByRole('button', { name: '테스트 제출' }));
    fireEvent.click(screen.getByRole('button', { name: ko.app.journalNew.typeChange.action }));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: ko.app.journalNew.investment })).toBeInTheDocument();
    confirmSpy.mockRestore();
  });

  it('treats blank result IDs as a generic failure without navigation', async () => {
    renderPage(buildAppJournalNewPath('investment'), 'ko', {
      create: () => Promise.resolve({ journalId: '   ' }),
    });
    fillInvestmentForm();
    fireEvent.click(screen.getByRole('button', { name: '테스트 제출' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('테스트 제출에 실패'));
    expect(screen.queryByText('detail destination')).not.toBeInTheDocument();
  });

  it('ignores resolve and reject results after unmount', async () => {
    const pending = deferredResult();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const page = renderPage(buildAppJournalNewPath('investment'), 'ko', {
      create: () => pending.promise,
    });
    fillInvestmentForm();
    fireEvent.click(screen.getByRole('button', { name: '테스트 제출' }));
    page.unmount();

    await act(async () => pending.resolve({ journalId: 'after-unmount' }));
    const rejected = deferredResult();
    const rejectedPage = renderPage(buildAppJournalNewPath('investment'), 'ko', {
      create: () => rejected.promise,
    });
    fillInvestmentForm();
    fireEvent.click(screen.getByRole('button', { name: '테스트 제출' }));
    rejectedPage.unmount();
    await act(async () => rejected.reject(new Error('after-unmount')));
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('submits with Enter and works under StrictMode after its lifecycle rehearsal', async () => {
    renderPage(
      buildAppJournalNewPath('investment'),
      'ko',
      { create: () => Promise.resolve({ journalId: 'strict-id' }) },
      true,
    );
    fillInvestmentForm();
    fireEvent.submit(screen.getByRole('button', { name: '테스트 제출' }).closest('form')!);

    await waitFor(() => expect(screen.getByText('detail destination:REPLACE')).toBeInTheDocument());
  });

  it('uses explicit English test-flow labels and accessible pending status', () => {
    const pending = deferredResult();
    renderPage(buildAppJournalNewPath('investment'), 'en', { create: () => pending.promise });
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Asset' } });
    fireEvent.click(screen.getByLabelText('Interested'));
    fireEvent.change(screen.getByLabelText('Why did you make that judgment?'), {
      target: { value: 'Reason' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Recorded at Change' }));
    fireEvent.change(screen.getByLabelText('Recorded at'), {
      target: { value: '2026-08-03T09:30' },
    });
    fireEvent.click(screen.getByRole('button', { name: en.app.journalNew.form.submitTest }));

    expect(screen.getByRole('status')).toHaveTextContent(en.app.journalNew.form.submitting);
  });
});
