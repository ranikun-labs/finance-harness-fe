import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DecisionContextCapturePanel } from '@/components/journal/DecisionContextPanel';
import { I18nProvider } from '@/i18n/I18nContext';
import { en } from '@/i18n/messages/en';
import { ko } from '@/i18n/messages/ko';
import { SAMPLE_DECISION_CONTEXT } from '@/mocks/decisionContext';

function renderPanel(locale: 'ko' | 'en' = 'ko') {
  const onEnabledChange = vi.fn();
  const onEvidenceChange = vi.fn();
  render(
    <I18nProvider locale={locale}>
      <DecisionContextCapturePanel
        context={SAMPLE_DECISION_CONTEXT}
        enabled
        onEnabledChange={onEnabledChange}
        onEvidenceChange={onEvidenceChange}
      />
    </I18nProvider>,
  );
  return { onEnabledChange, onEvidenceChange };
}

const panel = () => screen.getByTestId('decision-context-capture');

describe('DecisionContextCapturePanel 문구 계약 (F-04)', () => {
  it('저장을 암시하는 문구가 없다', () => {
    const forbidden = ['함께 남', '남깁니다', '남길 사실', '저장 시점', '저장 당시'];
    const dc = ko.app.journalNew.decisionContext;
    for (const value of Object.values(dc)) {
      for (const phrase of forbidden) {
        expect(String(value)).not.toContain(phrase);
      }
    }
    renderPanel();
    expect(panel().textContent).not.toMatch(/함께 남|남깁니다|저장 시점/);
  });

  it('참고 표시와 저장 여부를 구분해 보여 준다', () => {
    renderPanel();
    expect(
      screen.getByRole('heading', { name: ko.app.journalNew.decisionContext.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(ko.app.journalNew.decisionContext.enabledDescription),
    ).toBeInTheDocument();
    expect(screen.getByText(ko.app.journalNew.decisionContext.minimumLabel)).toBeInTheDocument();
    expect(screen.getByText(ko.app.journalNew.decisionContext.optionalLabel)).toBeInTheDocument();
    expect(
      screen.getByText(ko.app.journalNew.decisionContext.optionalDescription),
    ).toBeInTheDocument();
  });

  it('저장 포함 선택(사실 체크박스)은 비활성이라 누를 수 없다', () => {
    renderPanel();
    const boxes = within(panel()).getAllByRole('checkbox');
    expect(boxes.length).toBeGreaterThan(0);
    for (const box of boxes) {
      expect(box).toBeDisabled();
    }
  });

  it('표시 전환 스위치는 참고 화면만 바꾸므로 눌러 숨기고 다시 켤 수 있다', () => {
    const { onEnabledChange } = renderPanel();
    fireEvent.click(screen.getByRole('switch'));
    expect(onEnabledChange).toHaveBeenCalledWith(false);
    expect(
      screen.getByRole('switch', { name: ko.app.journalNew.decisionContext.switchLabel }),
    ).toBeEnabled();
  });

  it('영문 문구도 저장 포함을 암시하지 않는다', () => {
    const forbidden = ['keep', 'saved at', 'will be saved'];
    for (const value of Object.values(en.app.journalNew.decisionContext)) {
      for (const phrase of forbidden) {
        expect(String(value).toLowerCase()).not.toContain(phrase);
      }
    }
  });
});

describe('검토 → 기록 안내 문구 계약 (F-04)', () => {
  it('작성 안내는 검토 맥락이 아직 저장되지 않는다고 밝힌다', () => {
    expect(ko.app.ask.handoff.investment.description).toContain('저장되지 않아요');
    expect(en.app.ask.handoff.investment.description).toMatch(/not saved/);
    expect(ko.app.ask.handoff.investment.description).not.toContain('함께 남');
    expect(en.app.ask.handoff.investment.description).not.toMatch(/keep the review/);
  });
});
