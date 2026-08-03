import { describe, expect, it } from 'vitest';

import type {
  InvestmentJournalFormState,
  JournalFormState,
  StudyJournalFormState,
} from '@/features/journal-new/model/journalFormTypes';
import {
  validateInvestmentJournalForm,
  validateStudyJournalForm,
} from '@/features/journal-new/model/journalFormValidation';

const validInvestment: InvestmentJournalFormState = {
  type: 'investment',
  assetName: '반도체 기업 A',
  occurredAt: '2026-08-03T09:30',
  action: 'watching',
  reasoning: '수요와 실적 전제를 더 확인한 뒤 판단을 기록한다.',
  emotion: '관망',
};

const validStudy: StudyJournalFormState = {
  type: 'study',
  title: '리밸런싱의 의미',
  occurredAt: '2026-08-03T09:30',
  keyContent: '벤치마크 대비 비중 조정의 배경을 정리한다.',
  openQuestions: ['실제 수급과 어떻게 구분할까?'],
};

function errorsFor(result: ReturnType<typeof validateInvestmentJournalForm>): string[] {
  return result.errors.map((error) => error.field);
}

describe('journal form validation contract', () => {
  it('narrows discriminated form state by type', () => {
    const describeState = (state: JournalFormState) =>
      state.type === 'investment' ? state.assetName : state.title;

    expect(describeState(validInvestment)).toBe('반도체 기업 A');
    expect(describeState(validStudy)).toBe('리밸런싱의 의미');
  });

  it('returns required investment field errors for blank values', () => {
    const result = validateInvestmentJournalForm({
      ...validInvestment,
      assetName: '   ',
      occurredAt: '',
      action: '',
      reasoning: '\n',
    });

    expect(result).toMatchObject({ valid: false });
    expect(errorsFor(result)).toEqual(['assetName', 'occurredAt', 'action', 'reasoning']);
  });

  it('returns required study field errors for trim-only values', () => {
    const result = validateStudyJournalForm({
      ...validStudy,
      title: ' ',
      occurredAt: '\t',
      keyContent: '  ',
    });

    expect(result).toMatchObject({ valid: false });
    expect(result.errors.map((error) => error.field)).toEqual([
      'title',
      'occurredAt',
      'keyContent',
    ]);
  });

  it('accepts investment fields at their maximum lengths', () => {
    const result = validateInvestmentJournalForm({
      ...validInvestment,
      assetName: 'a'.repeat(120),
      reasoning: 'r'.repeat(4000),
    });

    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('rejects investment fields beyond their maximum lengths', () => {
    const result = validateInvestmentJournalForm({
      ...validInvestment,
      assetName: 'a'.repeat(121),
      reasoning: 'r'.repeat(4001),
    });

    expect(errorsFor(result)).toEqual(['assetName', 'reasoning']);
  });

  it('accepts study fields at their maximum lengths', () => {
    const result = validateStudyJournalForm({
      ...validStudy,
      title: 't'.repeat(120),
      keyContent: 'k'.repeat(6000),
    });

    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('rejects study fields beyond their maximum lengths', () => {
    const result = validateStudyJournalForm({
      ...validStudy,
      title: 't'.repeat(121),
      keyContent: 'k'.repeat(6001),
    });

    expect(result.errors.map((error) => error.field)).toEqual(['title', 'keyContent']);
  });

  it('accepts valid investment and study raw form states', () => {
    expect(validateInvestmentJournalForm(validInvestment)).toEqual({ valid: true, errors: [] });
    expect(validateStudyJournalForm(validStudy)).toEqual({ valid: true, errors: [] });
  });

  it('rejects unsupported investment action and emotion identifiers', () => {
    const result = validateInvestmentJournalForm({
      ...validInvestment,
      action: 'recommend' as InvestmentJournalFormState['action'],
      emotion: 'excited' as InvestmentJournalFormState['emotion'],
    });

    expect(errorsFor(result)).toEqual(['action', 'emotion']);
  });

  it('accepts a valid local occurredAt datetime', () => {
    const result = validateStudyJournalForm({ ...validStudy, occurredAt: '2026-08-03T09:30' });

    expect(result).toEqual({ valid: true, errors: [] });
  });

  it.each([
    ['timezone offset', '2026-08-03T09:30+09:00'],
    ['UTC suffix', '2026-08-03T09:30Z'],
    ['malformed timezone offset', '2026-08-03T09:30+99:99'],
    ['nonexistent calendar date', '2026-02-30T09:30'],
    ['invalid hour', '2026-08-03T24:00'],
    ['invalid minute', '2026-08-03T09:60'],
  ])('rejects an occurredAt datetime with %s', (_reason, occurredAt) => {
    const result = validateStudyJournalForm({ ...validStudy, occurredAt });

    expect(result).toMatchObject({ valid: false });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'occurredAt', code: 'invalid_datetime' }),
    );
  });

  it('does not mutate validator input', () => {
    const state: InvestmentJournalFormState = {
      ...validInvestment,
      assetName: '  반도체 기업 A  ',
    };
    const before = structuredClone(state);

    validateInvestmentJournalForm(state);

    expect(state).toEqual(before);
  });

  it('does not mutate study input or open questions', () => {
    const state: StudyJournalFormState = {
      ...validStudy,
      openQuestions: ['첫 번째 질문', '두 번째 질문'],
    };
    const before = structuredClone(state);

    validateStudyJournalForm(state);

    expect(state).toEqual(before);
    expect(state.openQuestions).toEqual(['첫 번째 질문', '두 번째 질문']);
  });
});
