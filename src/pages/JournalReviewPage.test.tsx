import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import {
  APP_ROUTE_PATHS,
  buildAppJournalDetailPath,
  buildAppJournalReviewPath,
} from '@/constants/routes';
import { JournalReadPortProvider } from '@/features/journal-read/JournalReadPortContext';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { RetrospectiveDraftContext } from '@/components/layout/RetrospectiveDraftContext';
import { JournalEditFetchContext } from '@/features/journal-edit/JournalEditContext';
import { I18nProvider } from '@/i18n/I18nContext';
import { en } from '@/i18n/messages/en';
import { ko } from '@/i18n/messages/ko';
import { JOURNAL_ENTRIES, type JournalEntry } from '@/mocks/journalEntries';
import type { RetrospectiveSavePort } from '@/mocks/retrospective';
import { JournalReviewPage } from '@/pages/JournalReviewPage';

const PRIMARY_INVESTMENT_ID = 'journal-2026-06-28-01';
const SECOND_INVESTMENT_ID = 'journal-2026-06-24-01';
const STUDY_ID = 'journal-2026-06-27-01';

function NavigationDraftHarness({ children }: { children: ReactNode }) {
  const [dirty, setDirty] = useState(false);
  return (
    <RetrospectiveDraftContext.Provider value={{ dirty, setDirty }}>
      <BottomNavigation />
      {children}
    </RetrospectiveDraftContext.Provider>
  );
}

function renderPage(path: string, locale: 'ko' | 'en' = 'ko', savePort?: RetrospectiveSavePort) {
  return render(
    <JournalReadPortProvider
      port={{
        list: vi.fn(),
        detail: vi.fn().mockResolvedValue({ ok: false, error: { code: 'journal_not_found' } }),
      }}
    >
      <MemoryRouter initialEntries={[path]}>
        <I18nProvider locale={locale}>
          <Routes>
            <Route
              path={APP_ROUTE_PATHS.journalReview}
              element={<JournalReviewPage savePort={savePort} />}
            />
          </Routes>
        </I18nProvider>
      </MemoryRouter>
    </JournalReadPortProvider>,
  );
}

describe('JournalReviewPage', () => {
  it('keeps a saved retrospective draft when the original record is collapsed and reopened', async () => {
    vi.stubEnv('VITE_FINANCE_RETROSPECTIVE_ENABLED', 'true');
    try {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const detail = vi.fn().mockResolvedValue({
        ok: true,
        data: {
          journalId: id,
          revision: 3,
          type: 'investment',
          assetName: '기록 대상',
          action: 'interest',
          reasoning: '원래 판단의 이유',
          emotion: null,
          occurredAt: '2026-08-12T14:30:15.123',
          timeZone: 'Asia/Seoul',
          createdAt: '2026-08-12T05:31:02.123Z',
          updatedAt: '2026-08-12T05:31:02.123Z',
        },
      });
      const fetchImpl = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ items: [], hasMore: false }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      render(
        <JournalEditFetchContext.Provider value={fetchImpl}>
          <JournalReadPortProvider port={{ list: vi.fn(), detail }}>
            <MemoryRouter initialEntries={[buildAppJournalReviewPath(id)]}>
              <I18nProvider locale="ko">
                <NavigationDraftHarness>
                  <Routes>
                    <Route path={APP_ROUTE_PATHS.journalReview} element={<JournalReviewPage />} />
                  </Routes>
                </NavigationDraftHarness>
              </I18nProvider>
            </MemoryRouter>
          </JournalReadPortProvider>
        </JournalEditFetchContext.Provider>,
      );
      const field = await screen.findByLabelText('지금 다시 보면, 무엇이 달라졌나요? *');
      fireEvent.change(field, { target: { value: '새 복기 초안' } });
      const disclosure = screen.getByText('당시 기록 자세히 보기');
      fireEvent.click(disclosure);
      fireEvent.click(disclosure);
      expect(field).toHaveValue('새 복기 초안');
      expect(screen.getByText('원래 판단의 이유')).toBeInTheDocument();
      const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
      try {
        const links = screen.getAllByRole('link', { name: /기록 상세/ });
        expect(links).toHaveLength(2);
        for (const link of links) {
          for (const modifier of [
            { ctrlKey: true },
            { metaKey: true },
            { shiftKey: true },
            { altKey: true },
            { button: 1 },
          ]) {
            fireEvent.click(link, modifier);
            expect(confirm).not.toHaveBeenCalled();
            expect(field).toHaveValue('새 복기 초안');
          }
          fireEvent.click(link);
          expect(confirm).toHaveBeenCalledTimes(1);
          expect(field).toHaveValue('새 복기 초안');
          confirm.mockClear();
        }
        for (const name of ['검토', '저널']) {
          const link = screen.getByRole('link', { name });
          fireEvent.click(link, { ctrlKey: true });
          expect(confirm).not.toHaveBeenCalled();
          fireEvent.click(link);
          expect(confirm).toHaveBeenCalledTimes(1);
          expect(field).toHaveValue('새 복기 초안');
          confirm.mockClear();
        }
        confirm.mockReturnValue(true);
        fireEvent.click(screen.getByRole('link', { name: '검토' }));
        expect(confirm).toHaveBeenCalledTimes(1);
        expect(
          screen.queryByLabelText('지금 다시 보면, 무엇이 달라졌나요? *'),
        ).not.toBeInTheDocument();
      } finally {
        confirm.mockRestore();
      }
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('reads a saved record from the configured port and does not offer mock persistence', async () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const detail = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        journalId: id,
        type: 'investment',
        assetName: '실제 기록 대상',
        action: 'interest',
        reasoning: '원래 기록의 판단 이유',
        emotion: null,
        occurredAt: '2026-08-12T14:30:15.123',
        timeZone: 'Asia/Seoul',
        createdAt: '2026-08-12T05:31:02.123Z',
        updatedAt: '2026-08-12T05:31:02.123Z',
      },
    });
    render(
      <JournalReadPortProvider port={{ list: vi.fn(), detail }}>
        <MemoryRouter initialEntries={[buildAppJournalReviewPath(id)]}>
          <I18nProvider locale="ko">
            <Routes>
              <Route path={APP_ROUTE_PATHS.journalReview} element={<JournalReviewPage />} />
            </Routes>
          </I18nProvider>
        </MemoryRouter>
      </JournalReadPortProvider>,
    );
    expect(await screen.findByText('실제 기록 대상')).toBeInTheDocument();
    expect(screen.getByText('원래 기록의 판단 이유')).toBeInTheDocument();
    expect(screen.getByText(ko.app.journalReview.saveUnavailable)).toBeInTheDocument();
    expect(screen.queryByTestId('retrospective-editor')).not.toBeInTheDocument();
    expect(detail).toHaveBeenCalledWith(id, expect.any(AbortSignal));
  });

  it('preserves the existing parameterized title contract', () => {
    expect(ko.app.journalReview.title).toBe('복기 — {{id}}');
    expect(en.app.journalReview.title).toBe('Review — {{id}}');
  });

  it('renders the primary investment fixture with one h1 and ordered sections', () => {
    renderPage(buildAppJournalReviewPath(PRIMARY_INVESTMENT_ID));

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole('heading', { level: 1, name: ko.app.journalReview.headerTitle }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent),
    ).toEqual([
      ko.app.journalReview.retrospective.originalHeading,
      ko.app.journalReview.summary.heading,
      ko.app.journalReview.investment.questionHeading,
      ko.app.journalReview.investment.memoHeading,
      ko.app.journalReview.investment.statusHeading,
      ko.app.journalDetail.decisionContext.heading,
      ko.app.journalReview.investment.reflectionHeading,
      ko.app.journalReview.retrospective.editorHeading,
    ]);
    expect(screen.getByText(ko.app.journalReview.policyNotice)).toBeInTheDocument();
  });

  it('renders the second investment fixture with its own action, emotion, and check states', () => {
    renderPage(buildAppJournalReviewPath(SECOND_INVESTMENT_ID));

    expect(screen.getByText(ko.app.journalList.subjects.batteryCompanyC)).toBeInTheDocument();
    expect(screen.getByText('관망')).toBeInTheDocument();
    expect(screen.getByText('불안')).toBeInTheDocument();
    expect(screen.getAllByText(ko.app.journalReview.status.checked)).toHaveLength(1);
    expect(screen.getAllByText(ko.app.journalReview.status.unchecked)).toHaveLength(3);
  });

  it('renders the study structure without investment action, emotion, or prompts', () => {
    renderPage(buildAppJournalReviewPath(STUDY_ID));

    expect(screen.getByText('월말 리밸런싱')).toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent),
    ).toEqual([
      ko.app.journalReview.retrospective.originalHeading,
      ko.app.journalReview.summary.heading,
      ko.app.journalReview.study.questionHeading,
      ko.app.journalReview.study.memoHeading,
      ko.app.journalReview.study.statusHeading,
      ko.app.journalReview.study.reflectionHeading,
      ko.app.journalReview.retrospective.editorHeading,
    ]);
    expect(screen.queryByText(ko.app.journalReview.metadata.pastAction)).not.toBeInTheDocument();
    expect(screen.queryByText(ko.app.journalReview.metadata.pastEmotion)).not.toBeInTheDocument();
    expect(
      screen.queryByText(ko.app.journalReview.investment.prompts.assumption),
    ).not.toBeInTheDocument();
    expect(screen.getByText(ko.app.journalReview.study.prompts.nextQuestion)).toBeInTheDocument();
  });

  it('uses semantic metadata, date, status list, and reflection list structures', () => {
    const { container } = renderPage(buildAppJournalReviewPath(PRIMARY_INVESTMENT_ID));

    const metadata = container.querySelector('dl');
    expect(metadata).not.toBeNull();
    expect(metadata!.querySelectorAll('dt')).toHaveLength(4);
    expect(metadata!.querySelectorAll('dd')).toHaveLength(4);
    expect(container.querySelector('time')).toHaveAttribute('datetime', '2026-06-28');

    const statusSection = screen
      .getByRole('heading', { name: ko.app.journalReview.investment.statusHeading })
      .closest('section')!;
    expect(within(statusSection).getByRole('list').tagName).toBe('UL');
    expect(within(statusSection).getAllByRole('listitem')).toHaveLength(3);

    const reflectionSection = screen
      .getByRole('heading', { name: ko.app.journalReview.investment.reflectionHeading })
      .closest('section')!;
    expect(within(reflectionSection).getByRole('list').tagName).toBe('UL');
    expect(within(reflectionSection).getAllByRole('listitem')).toHaveLength(4);
  });

  it('uses the canonical fixture id for both detail return links', () => {
    renderPage(buildAppJournalReviewPath(PRIMARY_INVESTMENT_ID));
    const expectedHref = buildAppJournalDetailPath(PRIMARY_INVESTMENT_ID);

    const detailLinks = screen.getAllByRole('link', {
      name: ko.app.journalReview.navigation.detail,
    });
    expect(detailLinks).toHaveLength(1);
    for (const link of detailLinks) {
      expect(link).toHaveAttribute('href', expectedHref);
    }
  });

  it('looks up an encoded route param without decoding it again', () => {
    const encodedPath = `${APP_ROUTE_PATHS.journalList}/journal%2D2026%2D06%2D28%2D01/review`;
    renderPage(encodedPath);

    expect(screen.getByText(ko.app.journalList.subjects.semiconductorCompanyA)).toBeInTheDocument();
  });

  it('renders Not Found from the read port for an unknown id', async () => {
    const unknownId = 'private-unknown-record-id';
    renderPage(buildAppJournalReviewPath(unknownId));

    expect(
      await screen.findByRole('heading', { level: 1, name: ko.app.journalReview.notFound.heading }),
    ).toBeInTheDocument();
    expect(screen.queryByText(unknownId)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: ko.app.journalReview.navigation.detail }),
    ).not.toBeInTheDocument();
    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('href', APP_ROUTE_PATHS.journalList);
    }
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('renders Not Found for a malformed encoded id without throwing', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      expect(() => renderPage(`${APP_ROUTE_PATHS.journalList}/%E0%A4%A/review`)).not.toThrow();
      expect(
        await screen.findByRole('heading', {
          level: 1,
          name: ko.app.journalReview.notFound.heading,
        }),
      ).toBeInTheDocument();
    } finally {
      warning.mockRestore();
    }
  });

  it('renders matching English labels while preserving fixture-authored text', () => {
    renderPage(buildAppJournalReviewPath(PRIMARY_INVESTMENT_ID), 'en');

    expect(
      screen.getByRole('heading', { level: 1, name: en.app.journalReview.headerTitle }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: en.app.journalReview.investment.questionHeading,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('반도체 기업 A 요즘 어때?')).toHaveLength(2);
    expect(screen.getByText(en.app.journalReview.policyNotice)).toBeInTheDocument();
  });

  it('renders HTML-like fixture content as inert text', () => {
    const htmlEntry: JournalEntry = {
      id: 'html-like-review-entry',
      type: 'study',
      title: '<strong>Study title</strong>',
      recordedAt: '2026-06-20',
      question: '<script>alert(1)</script>',
      memo: '<img src=x onerror=alert(1)>',
      checkedCount: 0,
      totalCount: 1,
      nextChecks: [{ text: '<button>not interactive</button>', checked: false }],
    };
    JOURNAL_ENTRIES.push(htmlEntry);
    try {
      const { container } = renderPage(buildAppJournalReviewPath(htmlEntry.id));
      expect(screen.getByText(htmlEntry.title)).toBeInTheDocument();
      expect(screen.getByText(htmlEntry.question)).toBeInTheDocument();
      expect(screen.getByText(htmlEntry.memo)).toBeInTheDocument();
      expect(screen.getByText(htmlEntry.nextChecks[0].text)).toBeInTheDocument();
      expect(container.querySelector('script, img')).toBeNull();
    } finally {
      JOURNAL_ENTRIES.pop();
    }
  });

  it('exposes a retrospective form without mutation or recommendation controls', () => {
    const { container } = renderPage(buildAppJournalReviewPath(PRIMARY_INVESTMENT_ID));

    expect(screen.getByTestId('retrospective-editor')).toBeInTheDocument();
    expect(screen.getByLabelText(ko.app.journalReview.retrospective.bodyLabel)).toBeInTheDocument();
    expect(container.querySelector('input')).toBeNull();
    for (const label of ['저장', '제출', '수정', '삭제', '지금 매수', '지금 매도']) {
      expect(screen.queryByRole('link', { name: label })).not.toBeInTheDocument();
    }
    expect(screen.getAllByRole('note')).toHaveLength(1);
  });

  it('blocks empty and whitespace-only retrospective submissions and preserves the body', () => {
    const save = vi.fn<RetrospectiveSavePort['save']>();
    renderPage(buildAppJournalReviewPath(PRIMARY_INVESTMENT_ID), 'ko', { save });
    const body = screen.getByLabelText(ko.app.journalReview.retrospective.bodyLabel);
    const saveButton = screen.getByRole('button', {
      name: ko.app.journalReview.retrospective.save,
    });

    fireEvent.click(saveButton);
    expect(screen.getByRole('alert')).toHaveTextContent(
      ko.app.journalReview.retrospective.validationRequired,
    );
    expect(body).toHaveAttribute('aria-invalid', 'true');
    expect(save).not.toHaveBeenCalled();

    fireEvent.change(body, { target: { value: '   ' } });
    fireEvent.click(saveButton);
    expect(body).toHaveValue('   ');
    expect(screen.getByRole('alert')).toHaveTextContent(
      ko.app.journalReview.retrospective.validationRequired,
    );
    expect(save).not.toHaveBeenCalled();

    fireEvent.change(body, { target: { value: '복기 내용을 입력했다.' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('transitions from Saving to Saved with a separate timestamped record', async () => {
    let resolveSave!: () => void;
    const save = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        }),
    );
    renderPage(buildAppJournalReviewPath(PRIMARY_INVESTMENT_ID), 'ko', { save });
    fireEvent.change(screen.getByLabelText(ko.app.journalReview.retrospective.bodyLabel), {
      target: { value: '저장 전 판단을 다시 읽었다.' },
    });
    fireEvent.click(screen.getByRole('button', { name: ko.app.journalReview.retrospective.save }));

    expect(screen.getByRole('status')).toHaveTextContent(ko.app.journalReview.retrospective.saving);
    expect(
      screen.getByRole('button', { name: ko.app.journalReview.retrospective.saving }),
    ).toBeDisabled();
    expect(save).toHaveBeenCalledTimes(1);

    resolveSave();
    await waitFor(() => expect(screen.getByTestId('retrospective-saved')).toBeInTheDocument());
    expect(
      screen.getByRole('heading', { name: ko.app.journalReview.retrospective.savedHeading }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('retrospective-saved').querySelector('time')).toHaveAttribute(
      'datetime',
      '2026-08-11T09:00:00+09:00',
    );
    expect(screen.getByText('저장 전 판단을 다시 읽었다.')).toBeInTheDocument();
    expect(
      screen.getByText(ko.app.journalReview.retrospective.separateRecordNotice),
    ).toBeInTheDocument();
  });

  it('preserves optional fields and the Original Journal through Save Error → Retry → Saved', async () => {
    const save = vi
      .fn<RetrospectiveSavePort['save']>()
      .mockRejectedValueOnce(new Error('fixture failure'))
      .mockResolvedValueOnce(undefined);
    renderPage(buildAppJournalReviewPath(PRIMARY_INVESTMENT_ID), 'ko', { save });

    const body = screen.getByLabelText(ko.app.journalReview.retrospective.bodyLabel);
    fireEvent.change(body, { target: { value: '원본을 바꾸지 않고 배움을 적는다.' } });
    fireEvent.click(screen.getByRole('button', { name: /결과 관찰/ }));
    fireEvent.change(screen.getByLabelText(ko.app.journalReview.retrospective.outcomeLabel), {
      target: { value: '실적 발표는 예상에 부합했다.' },
    });
    fireEvent.change(screen.getByLabelText(ko.app.journalReview.retrospective.qualityLabel), {
      target: { value: '반대 근거를 더 먼저 확인해야 했다.' },
    });
    fireEvent.change(screen.getByLabelText(ko.app.journalReview.retrospective.nextCheckLabel), {
      target: { value: '다음에는 확인 시점을 먼저 정한다.' },
    });

    fireEvent.click(screen.getByRole('button', { name: ko.app.journalReview.retrospective.save }));
    await waitFor(() => expect(screen.getByTestId('retrospective-save-error')).toBeInTheDocument());
    expect(body).toHaveValue('원본을 바꾸지 않고 배움을 적는다.');
    expect(screen.getByLabelText(ko.app.journalReview.retrospective.outcomeLabel)).toHaveValue(
      '실적 발표는 예상에 부합했다.',
    );
    expect(screen.getByLabelText(ko.app.journalReview.retrospective.qualityLabel)).toHaveValue(
      '반대 근거를 더 먼저 확인해야 했다.',
    );
    expect(screen.getByRole('button', { name: /결과 관찰/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText('관심')).toBeInTheDocument();
    expect(screen.getByText('확신')).toBeInTheDocument();
    expect(
      screen.getByText(
        'HBM 수요 기대가 꺾이지 않았고, 외국인 누적 매수가 며칠째 이어지고 있어서 지켜보기로 했다.',
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: ko.app.journalReview.retrospective.retry }));
    await waitFor(() => expect(screen.getByTestId('retrospective-saved')).toBeInTheDocument());
    expect(save).toHaveBeenCalledTimes(2);
    expect(screen.getByText('원본을 바꾸지 않고 배움을 적는다.')).toBeInTheDocument();
    expect(screen.getByText('실적 발표는 예상에 부합했다.')).toBeInTheDocument();
    expect(screen.getByText('반대 근거를 더 먼저 확인해야 했다.')).toBeInTheDocument();
    expect(screen.getByText('다음에는 확인 시점을 먼저 정한다.')).toBeInTheDocument();
    expect(screen.getByText('관심')).toBeInTheDocument();
    expect(screen.getByText('확신')).toBeInTheDocument();
  });
});
