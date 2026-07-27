import type { ComponentProps } from 'react';

import { Badge } from '@/components/ui/badge';
import type { EmotionTag, RecordAction } from '@/constants/policy';
import type { JournalEntryType } from '@/constants/routes';
import { useTranslation } from '@/i18n/I18nContext';

type RecordTagBadgeProps =
  | { kind: 'emotion'; value: EmotionTag }
  | { kind: 'action'; value: RecordAction }
  | { kind: 'entryType'; value: JournalEntryType };

type BadgeTone = NonNullable<ComponentProps<typeof Badge>['tone']>;

function resolveEntryTypeTone(value: JournalEntryType): BadgeTone {
  switch (value) {
    case 'investment':
      return 'neutral';
    case 'study':
      return 'neutral';
  }
}

/**
 * `buy`/`sell`도 과거 행동을 나타내는 중립 라벨일 뿐이다 — 매수·매도 추천처럼 보이지
 * 않도록 `info`/`destructive` 같은 강조 tone을 주지 않는다(정책: docs/product-policy.md).
 */
function resolveActionTone(value: RecordAction): BadgeTone {
  switch (value) {
    case 'interest':
      return 'info';
    case 'watching':
      return 'neutral';
    case 'buy':
      return 'neutral';
    case 'sell':
      return 'neutral';
  }
}

function resolveEmotionTone(value: EmotionTag): BadgeTone {
  switch (value) {
    case 'FOMO':
      return 'destructive';
    case '불안':
      return 'neutral';
    case '확신':
      return 'info';
    case '관망':
      return 'neutral';
    case '혼란':
      return 'destructive';
  }
}

/**
 * domain tag(emotion/action/entryType) → i18n label + Badge tone mapping만 책임진다.
 * 화면 route나 page 이름을 알지 못하며, fallback 문자열이나 unknown value 렌더를
 * 허용하지 않는다 — 각 kind의 union이 늘어나면 아래 switch가 컴파일 에러로 잡는다.
 */
export function RecordTagBadge(props: RecordTagBadgeProps) {
  const { t } = useTranslation();

  switch (props.kind) {
    case 'entryType':
      return (
        <Badge tone={resolveEntryTypeTone(props.value)}>
          {t(`recordTags.entryType.${props.value}`)}
        </Badge>
      );
    case 'action':
      return (
        <Badge tone={resolveActionTone(props.value)}>{t(`recordTags.action.${props.value}`)}</Badge>
      );
    case 'emotion':
      return (
        <Badge tone={resolveEmotionTone(props.value)}>
          {t(`recordTags.emotion.${props.value}`)}
        </Badge>
      );
  }
}
