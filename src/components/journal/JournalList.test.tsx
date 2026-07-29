import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { JournalList } from '@/components/journal/JournalList';
import { I18nProvider } from '@/i18n/I18nContext';
import type { JournalEntry } from '@/mocks/journalEntries';

const INVESTMENT_ENTRY: JournalEntry = {
  id: 'investment-1',
  type: 'investment',
  subjectKey: 'semiconductorCompanyA',
  action: 'interest',
  recordedAt: '2026-06-28',
  question: '반도체 기업 A 요즘 어때?',
  memo: 'HBM 수요 기대가 꺾이지 않았다.',
  emotion: '확신',
  checkedCount: 2,
  totalCount: 3,
  aiChecklist: ['반도체 업황을 확인한다.'],
  decisionChecks: [{ text: '반도체 업황을 확인했다.', checked: true }],
};

const STUDY_ENTRY: JournalEntry = {
  id: 'study-1',
  type: 'study',
  title: '월말 리밸런싱',
  recordedAt: '2026-06-27',
  question: '월말·분기말에 기관은 왜 리밸런싱하나?',
  memo: '펀드 벤치마크 대비 비중 조정이 필요하다.',
  checkedCount: 3,
  totalCount: 3,
  nextChecks: [{ text: '기관 수급을 확인한다.', checked: true }],
};

function renderList(entries: JournalEntry[]) {
  return render(
    <MemoryRouter>
      <I18nProvider locale="ko">
        <JournalList entries={entries} />
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe('JournalList', () => {
  it('renders exactly one h1', () => {
    renderList([]);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  describe('전체 entries 없음', () => {
    it('shows the empty-all message and an Ask CTA link, not the filter empty message', () => {
      renderList([]);
      expect(screen.getByText('아직 저장된 기록이 없어요')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /질문하러 가기/ })).toBeInTheDocument();
      expect(screen.queryByText('해당 유형의 기록이 아직 없어요')).not.toBeInTheDocument();
    });

    it('does not render the type filter', () => {
      renderList([]);
      expect(screen.queryByRole('group')).not.toBeInTheDocument();
    });
  });

  describe('populated', () => {
    it('renders all cards and the count when filter is "all"', () => {
      renderList([INVESTMENT_ENTRY, STUDY_ENTRY]);
      expect(screen.getByText('반도체 기업 A')).toBeInTheDocument();
      expect(screen.getByText('월말 리밸런싱')).toBeInTheDocument();
      expect(screen.getByText('2개의 기록')).toBeInTheDocument();
    });

    it('marks the "all" filter button as pressed initially', () => {
      renderList([INVESTMENT_ENTRY, STUDY_ENTRY]);
      expect(screen.getByRole('button', { name: '전체' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: '투자 기록' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });

    it('filters to investment entries only', () => {
      renderList([INVESTMENT_ENTRY, STUDY_ENTRY]);
      fireEvent.click(screen.getByRole('button', { name: '투자 기록' }));

      expect(screen.getByText('반도체 기업 A')).toBeInTheDocument();
      expect(screen.queryByText('월말 리밸런싱')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: '투자 기록' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByText('1개의 기록')).toBeInTheDocument();
    });

    it('filters to study entries only', () => {
      renderList([INVESTMENT_ENTRY, STUDY_ENTRY]);
      fireEvent.click(screen.getByRole('button', { name: '공부 노트' }));

      expect(screen.getByText('월말 리밸런싱')).toBeInTheDocument();
      expect(screen.queryByText('반도체 기업 A')).not.toBeInTheDocument();
    });
  });

  describe('필터 결과 없음', () => {
    it('shows the filter-empty message (not the empty-all message) and a reset button', () => {
      renderList([STUDY_ENTRY]);
      fireEvent.click(screen.getByRole('button', { name: '투자 기록' }));

      expect(screen.getByText('해당 유형의 기록이 아직 없어요')).toBeInTheDocument();
      expect(screen.queryByText('아직 저장된 기록이 없어요')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: '전체 보기' })).toBeInTheDocument();
    });

    it('resets the filter back to "all" via the reset action', () => {
      renderList([STUDY_ENTRY]);
      fireEvent.click(screen.getByRole('button', { name: '투자 기록' }));
      expect(screen.getByText('해당 유형의 기록이 아직 없어요')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: '전체 보기' }));

      expect(screen.getByText('월말 리밸런싱')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '전체' })).toHaveAttribute('aria-pressed', 'true');
    });
  });
});
