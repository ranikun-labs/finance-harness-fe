import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { I18nProvider } from '@/i18n/I18nContext';
import { en } from '@/i18n/messages/en';
import { ko } from '@/i18n/messages/ko';
import { JournalListPage } from '@/pages/JournalListPage';

function renderPage(locale: 'ko' | 'en') {
  return render(
    <MemoryRouter>
      <I18nProvider locale={locale}>
        <JournalListPage />
      </I18nProvider>
    </MemoryRouter>,
  );
}

const FORBIDDEN_POLICY_TEXT = ['목표가', '손절가', '수익률 보장', '매수하기', '매도하기'];

describe('JournalListPage', () => {
  it('renders the ko heading', () => {
    renderPage('ko');
    expect(
      screen.getByRole('heading', { level: 1, name: ko.app.journalList.title }),
    ).toBeInTheDocument();
  });

  it('renders the en heading', () => {
    renderPage('en');
    expect(
      screen.getByRole('heading', { level: 1, name: en.app.journalList.title }),
    ).toBeInTheDocument();
  });

  it('renders the ko sample subject names from mock fixtures', () => {
    renderPage('ko');
    expect(screen.getByText(ko.app.journalList.subjects.semiconductorCompanyA)).toBeInTheDocument();
    expect(screen.getByText(ko.app.journalList.subjects.batteryCompanyC)).toBeInTheDocument();
  });

  it('renders the en sample subject names from mock fixtures', () => {
    renderPage('en');
    expect(screen.getByText(en.app.journalList.subjects.semiconductorCompanyA)).toBeInTheDocument();
    expect(screen.getByText(en.app.journalList.subjects.batteryCompanyC)).toBeInTheDocument();
  });

  it('contains no policy-forbidden phrases', () => {
    renderPage('ko');
    const text = document.body.textContent ?? '';
    for (const forbidden of FORBIDDEN_POLICY_TEXT) {
      expect(text).not.toContain(forbidden);
    }
  });

  it('does not expose "매수하기"/"매도하기" (buy-now/sell-now) as an actionable CTA accessible name', () => {
    // 메모 본문에 "매수"라는 단어가 서술형으로 등장할 수는 있지만(과거 기록),
    // 실행형 CTA 문구("매수하기"/"매도하기")로는 어떤 interactive element에도
    // 노출되지 않아야 한다.
    renderPage('ko');
    expect(screen.queryByRole('link', { name: /매수하기/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /매도하기/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /매수하기/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /매도하기/ })).not.toBeInTheDocument();
  });
});
