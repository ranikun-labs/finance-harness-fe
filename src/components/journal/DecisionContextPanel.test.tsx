import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DecisionContextCapturePanel } from '@/components/journal/DecisionContextPanel';
import { I18nProvider } from '@/i18n/I18nContext';
import { ko } from '@/i18n/messages/ko';
import { SAMPLE_DECISION_CONTEXT } from '@/mocks/decisionContext';

function renderPanel(enabled = true) {
  const onEnabledChange = vi.fn();
  const onEvidenceChange = vi.fn();
  render(
    <I18nProvider locale="ko">
      <DecisionContextCapturePanel
        context={SAMPLE_DECISION_CONTEXT}
        enabled={enabled}
        onEnabledChange={onEnabledChange}
        onEvidenceChange={onEvidenceChange}
      />
    </I18nProvider>,
  );
  return { onEnabledChange, onEvidenceChange };
}

describe('DecisionContextCapturePanel', () => {
  it('폰(matchMedia 없음)에서는 본문이 접히고 한 줄 요약에 개수가 보인다', () => {
    renderPanel();
    const details = screen.getByTestId('decision-context-capture').querySelector('details');
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute('open');
    expect(
      screen.getByText(
        ko.app.journalNew.decisionContext.detailsSummary
          .replace('{{checklist}}', String(SAMPLE_DECISION_CONTEXT.checklist.length))
          .replace(
            '{{included}}',
            String(SAMPLE_DECISION_CONTEXT.optionalEvidence.filter((item) => item.included).length),
          ),
      ),
    ).toBeInTheDocument();
  });

  it('접힌 요약의 사실 개수는 포함으로 선택된 사실만 센다(선택을 바꾸면 갱신)', () => {
    const included = SAMPLE_DECISION_CONTEXT.optionalEvidence.filter(
      (item) => item.included,
    ).length;
    const total = SAMPLE_DECISION_CONTEXT.optionalEvidence.length;
    expect(included).not.toBe(total);
    const label = (count: number) =>
      ko.app.journalNew.decisionContext.detailsSummary
        .replace('{{checklist}}', String(SAMPLE_DECISION_CONTEXT.checklist.length))
        .replace('{{included}}', String(count));
    const { unmount } = render(
      <I18nProvider locale="ko">
        <DecisionContextCapturePanel
          context={SAMPLE_DECISION_CONTEXT}
          enabled
          onEnabledChange={vi.fn()}
          onEvidenceChange={vi.fn()}
        />
      </I18nProvider>,
    );
    expect(screen.getByText(label(included))).toBeInTheDocument();
    expect(screen.queryByText(label(total))).toBeNull();
    unmount();
  });

  it('꺼져 있으면 본문 Disclosure가 없다', () => {
    renderPanel(false);
    expect(screen.getByTestId('decision-context-capture').querySelector('details')).toBeNull();
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('스위치의 터치 영역은 44×44이고 누르면 전환을 알린다', () => {
    const { onEnabledChange } = renderPanel();
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveClass('size-11');
    fireEvent.click(toggle);
    expect(onEnabledChange).toHaveBeenCalledWith(false);
  });

  it('선택 사실은 공통 Checkbox(라벨 전체가 44 이상 터치 영역)로 고르고 라벨로 접근된다', () => {
    const { onEvidenceChange } = renderPanel();
    const panel = screen.getByTestId('decision-context-capture');
    const boxes = within(panel).getAllByRole('checkbox');
    expect(boxes).toHaveLength(SAMPLE_DECISION_CONTEXT.optionalEvidence.length);
    expect(boxes[0].closest('label')).toHaveClass('min-h-11');
    fireEvent.click(boxes[0]);
    expect(onEvidenceChange).toHaveBeenCalledWith(SAMPLE_DECISION_CONTEXT.optionalEvidence[0].id);
  });
});
