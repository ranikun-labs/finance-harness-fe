import type { EmotionTag, RecordAction } from '@/constants/policy';
import type { JournalEntryType } from '@/constants/routes';
import { useTranslation } from '@/i18n/I18nContext';

type RecordTagTextProps =
  | { kind: 'emotion'; value: EmotionTag }
  | { kind: 'action'; value: RecordAction }
  | { kind: 'entryType'; value: JournalEntryType };

/**
 * domain tag(emotion/action/entryType) → i18n 라벨 텍스트만 렌더한다.
 * Foundation: 배지는 상태에만 쓰고 메타(유형·행동·감정)는 텍스트로 둔다. 색 의미(강조 tone)를
 * 일부러 두지 않는다 — FOMO·혼란 같은 감정을 위험색으로 칠하지 않기 위해서다.
 * `RecordTagBadge`와 같은 label key를 쓰므로 새 union 값은 아래 switch가 컴파일 에러로 잡는다.
 */
export function RecordTagText(props: RecordTagTextProps) {
  const { t } = useTranslation();

  switch (props.kind) {
    case 'entryType':
      return <>{t(`recordTags.entryType.${props.value}`)}</>;
    case 'action':
      return <>{t(`recordTags.action.${props.value}`)}</>;
    case 'emotion':
      return <>{t(`recordTags.emotion.${props.value}`)}</>;
  }
}
