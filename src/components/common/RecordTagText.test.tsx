import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RecordTagText } from '@/components/common/RecordTagText';
import { EMOTION_TAGS, RECORD_ACTIONS } from '@/constants/policy';
import { I18nProvider } from '@/i18n/I18nContext';
import { en } from '@/i18n/messages/en';
import { ko } from '@/i18n/messages/ko';

describe('RecordTagText', () => {
  it.each(['investment', 'study'] as const)(
    'renders ko/en entryType label "%s" as text',
    (value) => {
      const { container, unmount } = render(
        <I18nProvider locale="ko">
          <RecordTagText kind="entryType" value={value} />
        </I18nProvider>,
      );
      expect(screen.getByText(ko.recordTags.entryType[value])).toBeInTheDocument();
      expect(container.querySelector('[data-slot="badge"]')).toBeNull();
      unmount();

      render(
        <I18nProvider locale="en">
          <RecordTagText kind="entryType" value={value} />
        </I18nProvider>,
      );
      expect(screen.getByText(en.recordTags.entryType[value])).toBeInTheDocument();
    },
  );

  it.each(RECORD_ACTIONS)('renders action label "%s" without badge or tone', (value) => {
    const { container } = render(
      <I18nProvider locale="ko">
        <RecordTagText kind="action" value={value} />
      </I18nProvider>,
    );
    expect(container).toHaveTextContent(ko.recordTags.action[value]);
    expect(container.querySelector('[data-slot="badge"]')).toBeNull();
    expect(container.querySelector('[class]')).toBeNull();
  });

  it.each(EMOTION_TAGS)('renders emotion label "%s" without danger color', (value) => {
    const { container } = render(
      <I18nProvider locale="ko">
        <RecordTagText kind="emotion" value={value} />
      </I18nProvider>,
    );
    expect(container).toHaveTextContent(ko.recordTags.emotion[value]);
    expect(container.querySelector('[class]')).toBeNull();
  });
});
