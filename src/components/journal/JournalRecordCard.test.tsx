import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { JournalRecordCard } from '@/components/journal/JournalRecordCard';
import { buildAppJournalDetailPath } from '@/constants/routes';
import { I18nProvider } from '@/i18n/I18nContext';
import type { JournalEntry } from '@/mocks/journalEntries';

const INVESTMENT_ENTRY: JournalEntry = {
  id: 'journal-2026-06-28-01',
  type: 'investment',
  subjectKey: 'semiconductorCompanyA',
  action: 'interest',
  recordedAt: '2026-06-28',
  question: '반도체 기업 A 요즘 어때?',
  memo: 'HBM 수요 기대가 꺾이지 않았고, 외국인 누적 매수가 며칠째 이어지고 있어서 지켜보기로 했다.',
  emotion: '확신',
  checkedCount: 2,
  totalCount: 3,
};

const STUDY_ENTRY_NO_EMOTION: JournalEntry = {
  id: 'journal-2026-06-27-01',
  type: 'study',
  title: '월말 리밸런싱',
  recordedAt: '2026-06-27',
  question: '월말·분기말에 기관은 왜 리밸런싱하나?',
  memo: '펀드 벤치마크 대비 비중 조정이 필요해 월말에 기관 수급이 크게 튀는 경향이 있다.',
  checkedCount: 3,
  totalCount: 3,
};

const ENTRY_WITH_ENCODABLE_ID: JournalEntry = {
  ...STUDY_ENTRY_NO_EMOTION,
  id: 'journal entry/needs encoding',
};

function renderCard(entry: JournalEntry) {
  return render(
    <MemoryRouter>
      <I18nProvider locale="ko">
        <JournalRecordCard entry={entry} />
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe('JournalRecordCard', () => {
  it('renders the sample subject name for investment entries', () => {
    renderCard(INVESTMENT_ENTRY);
    expect(screen.getByText('반도체 기업 A')).toBeInTheDocument();
  });

  it('renders the title for study entries', () => {
    renderCard(STUDY_ENTRY_NO_EMOTION);
    expect(screen.getByText('월말 리밸런싱')).toBeInTheDocument();
  });

  it('renders the question and memo', () => {
    renderCard(INVESTMENT_ENTRY);
    expect(screen.getByText(INVESTMENT_ENTRY.question)).toBeInTheDocument();
    expect(screen.getByText(INVESTMENT_ENTRY.memo)).toBeInTheDocument();
  });

  it('renders the localized date, not the raw ISO string', () => {
    renderCard(INVESTMENT_ENTRY);
    expect(screen.queryByText('2026-06-28')).not.toBeInTheDocument();
  });

  it('renders entryType and action badges for investment entries', () => {
    renderCard(INVESTMENT_ENTRY);
    expect(screen.getByText('투자 기록')).toBeInTheDocument();
    expect(screen.getByText('관심')).toBeInTheDocument();
  });

  it('renders the checked progress as text', () => {
    renderCard(INVESTMENT_ENTRY);
    expect(screen.getByText('체크 완료 2/3')).toBeInTheDocument();
  });

  it('renders the emotion badge when present', () => {
    renderCard(INVESTMENT_ENTRY);
    expect(screen.getByText('확신')).toBeInTheDocument();
  });

  it('renders a no-emotion fallback text when emotion is absent, not an empty badge', () => {
    renderCard(STUDY_ENTRY_NO_EMOTION);
    expect(screen.getByText('감정 태그 없음')).toBeInTheDocument();
  });

  it('links to the encoded detail route using the raw id', () => {
    renderCard(INVESTMENT_ENTRY);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', buildAppJournalDetailPath(INVESTMENT_ENTRY.id));
  });

  it('url-encodes ids that need encoding', () => {
    renderCard(ENTRY_WITH_ENCODABLE_ID);
    const link = screen.getByRole('link');
    const href = link.getAttribute('href')!;
    expect(href).toBe(buildAppJournalDetailPath(ENTRY_WITH_ENCODABLE_ID.id));
    expect(href).not.toContain(' ');
    expect(href).not.toContain('/needs');
  });

  it('renders exactly one interactive element (no nested button/link)', () => {
    const { container } = renderCard(INVESTMENT_ENTRY);
    expect(container.querySelectorAll('a, button')).toHaveLength(1);
  });

  it("the card's accessible name includes the subject/title", () => {
    renderCard(INVESTMENT_ENTRY);
    const link = screen.getByRole('link', { name: /반도체 기업 A/ });
    expect(link).toBeInTheDocument();
  });
});
