import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { JournalList } from '@/components/journal/JournalList';
import type { JournalListStatus } from '@/features/journal-read/model/journalListState';
import type { JournalListItemViewModel } from '@/features/journal-read/model/journalReadViewModel';
import { I18nProvider } from '@/i18n/I18nContext';

const INVESTMENT_ID = '550e8400-e29b-41d4-a716-446655440000';
const STUDY_ID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

const INVESTMENT_ENTRY: JournalListItemViewModel = {
  journalId: INVESTMENT_ID,
  type: 'investment',
  occurredAt: '2026-08-12T14:30:15.123' as JournalListItemViewModel['occurredAt'],
  timeZone: 'Asia/Seoul',
  assetName: 'ETF',
  action: 'interest',
};

const STUDY_ENTRY: JournalListItemViewModel = {
  journalId: STUDY_ID,
  type: 'study',
  occurredAt: '2026-08-12T14:30:00.000' as JournalListItemViewModel['occurredAt'],
  timeZone: 'Asia/Seoul',
  title: '월말 리밸런싱',
};

function renderList(
  entries: JournalListItemViewModel[],
  options: {
    selectedId?: string;
    status?: JournalListStatus;
    nextCursor?: string | null;
    error?: { code: 'read_failed' | 'invalid_result' | 'invalid_request'; status?: number } | null;
    errorPhase?: 'initial' | 'load-more' | null;
    onRetry?: () => void;
    onLoadMore?: () => void;
  } = {},
) {
  return render(
    <MemoryRouter>
      <I18nProvider locale="ko">
        <JournalList entries={entries} {...options} />
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe('JournalList', () => {
  it('renders exactly one h1', () => {
    renderList([]);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('uses a pane heading for the selected list in the detail workspace', () => {
    renderList([INVESTMENT_ENTRY], { selectedId: INVESTMENT_ENTRY.journalId });
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '저널' })).toBeInTheDocument();
  });

  it('shows the empty-all message and an Ask CTA link', () => {
    renderList([], { status: 'empty' });
    expect(screen.getByText('아직 저장된 기록이 없어요')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /질문하러 가기/ })).toBeInTheDocument();
  });

  it('renders only investment/study summary data and no client-side type filter', () => {
    renderList([INVESTMENT_ENTRY, STUDY_ENTRY]);
    expect(screen.getByText('ETF')).toBeInTheDocument();
    expect(screen.getByText('월말 리밸런싱')).toBeInTheDocument();
    expect(screen.getByText('판단 기록')).toBeInTheDocument();
    expect(screen.getByText('학습 노트')).toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(screen.queryByText('2개의 기록')).not.toBeInTheDocument();
  });

  it('renders loading, initial error, and retry states', () => {
    renderList([], { status: 'loading' });
    expect(screen.getByRole('status')).toHaveTextContent('저널을 불러오는 중이에요');
    cleanup();

    const onRetry = vi.fn();
    renderList([], {
      status: 'error',
      error: { code: 'read_failed' },
      errorPhase: 'initial',
      onRetry,
    });
    expect(screen.getByText('저널을 불러오지 못했어요')).toBeInTheDocument();
    screen.getByRole('button', { name: '다시 시도' }).click();
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('renders continuation and keeps loaded items visible when loading more fails', () => {
    const onLoadMore = vi.fn();
    renderList([INVESTMENT_ENTRY], { nextCursor: 'opaque-next', onLoadMore });
    screen.getByRole('button', { name: '더 불러오기' }).click();
    expect(onLoadMore).toHaveBeenCalledOnce();
    cleanup();

    const onRetry = vi.fn();
    renderList([INVESTMENT_ENTRY], {
      status: 'error',
      nextCursor: 'opaque-next',
      error: { code: 'read_failed' },
      errorPhase: 'load-more',
      onRetry,
    });
    expect(screen.getAllByText('ETF')).toHaveLength(1);
    expect(screen.getByText('다음 기록을 불러오지 못했어요')).toBeInTheDocument();
    screen.getByRole('button', { name: '다시 시도' }).click();
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('renders terminal state when nextCursor is null', () => {
    renderList([INVESTMENT_ENTRY], { nextCursor: null });
    expect(screen.getByText('모든 기록을 확인했어요.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '더 불러오기' })).not.toBeInTheDocument();
  });
});
