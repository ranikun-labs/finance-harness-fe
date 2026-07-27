import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { RecordTagBadge } from '@/components/common/RecordTagBadge';
import {
  EMOTION_TAGS,
  RECORD_ACTIONS,
  type EmotionTag,
  type RecordAction,
} from '@/constants/policy';
import type { JournalEntryType } from '@/constants/routes';
import { I18nProvider } from '@/i18n/I18nContext';
import { en } from '@/i18n/messages/en';
import { ko } from '@/i18n/messages/ko';

const ENTRY_TYPES: JournalEntryType[] = ['investment', 'study'];

function renderBadge(element: ReactElement, locale: 'ko' | 'en' = 'ko'): ReturnType<typeof render> {
  return render(<I18nProvider locale={locale}>{element}</I18nProvider>);
}

function badgeToneClass(container: HTMLElement): string {
  const badge = container.querySelector('[data-slot="badge"]');
  if (!badge) throw new Error('badge not found');
  return badge.className;
}

describe('RecordTagBadge', () => {
  describe('entryType', () => {
    for (const value of ENTRY_TYPES) {
      it(`renders ko/en label for "${value}"`, () => {
        const { unmount } = renderBadge(<RecordTagBadge kind="entryType" value={value} />, 'ko');
        expect(screen.getByText(ko.recordTags.entryType[value])).toBeInTheDocument();
        unmount();

        renderBadge(<RecordTagBadge kind="entryType" value={value} />, 'en');
        expect(screen.getByText(en.recordTags.entryType[value])).toBeInTheDocument();
      });
    }

    it('uses the neutral tone', () => {
      const { container } = renderBadge(<RecordTagBadge kind="entryType" value="investment" />);
      expect(badgeToneClass(container)).toContain('bg-muted');
    });
  });

  describe('action', () => {
    for (const value of RECORD_ACTIONS) {
      it(`renders ko/en label for "${value}"`, () => {
        const { unmount } = renderBadge(<RecordTagBadge kind="action" value={value} />, 'ko');
        expect(screen.getByText(ko.recordTags.action[value])).toBeInTheDocument();
        unmount();

        renderBadge(<RecordTagBadge kind="action" value={value} />, 'en');
        expect(screen.getByText(en.recordTags.action[value])).toBeInTheDocument();
      });
    }

    it('never uses a destructive tone (no buy/sell recommendation styling)', () => {
      for (const value of RECORD_ACTIONS) {
        const { container, unmount } = renderBadge(<RecordTagBadge kind="action" value={value} />);
        expect(badgeToneClass(container)).not.toContain('bg-destructive');
        unmount();
      }
    });

    it('gives "interest" the info tone', () => {
      const { container } = renderBadge(<RecordTagBadge kind="action" value="interest" />);
      expect(badgeToneClass(container)).toContain('bg-primary/10');
    });
  });

  describe('emotion', () => {
    for (const value of EMOTION_TAGS) {
      it(`renders ko/en label for "${value}"`, () => {
        const { unmount } = renderBadge(<RecordTagBadge kind="emotion" value={value} />, 'ko');
        expect(screen.getByText(ko.recordTags.emotion[value])).toBeInTheDocument();
        unmount();

        renderBadge(<RecordTagBadge kind="emotion" value={value} />, 'en');
        expect(screen.getByText(en.recordTags.emotion[value])).toBeInTheDocument();
      });
    }

    it('maps every emotion tag to a defined, non-neutral-only tone set', () => {
      const tones = new Set<string>();
      for (const value of EMOTION_TAGS) {
        const { container, unmount } = renderBadge(<RecordTagBadge kind="emotion" value={value} />);
        tones.add(badgeToneClass(container).includes('bg-primary/10') ? 'info' : 'other');
        unmount();
      }
      expect(tones.has('info')).toBe(true);
    });
  });

  it('rejects invalid kind/value combinations at compile time', () => {
    // @ts-expect-error emotion value is not a valid RecordAction
    const invalidAction = <RecordTagBadge kind="action" value={'확신' as EmotionTag} />;
    // @ts-expect-error action value is not a valid EmotionTag
    const invalidEmotion = <RecordTagBadge kind="emotion" value={'buy' as RecordAction} />;
    // @ts-expect-error entryType value is not a valid JournalEntryType
    const invalidEntryType = <RecordTagBadge kind="entryType" value="interest" />;
    expect([invalidAction, invalidEmotion, invalidEntryType]).toHaveLength(3);
  });
});
