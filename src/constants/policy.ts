/**
 * 감정 태그 5종 — 고정 readonly 상수. 정책 원본: docs/product-policy.md
 * 이 목록 밖의 태그를 추가하지 말 것.
 */
export const EMOTION_TAGS = ['FOMO', '불안', '확신', '관망', '혼란'] as const;

export type EmotionTag = (typeof EMOTION_TAGS)[number];

/**
 * 행동 라벨(관심/관망/매수/매도) domain identifier — 고정 readonly 상수. 정책 원본:
 * docs/product-policy.md, docs/nav-map.md §정책 가드. 표시 문구가 아니라 "기록용
 * 선택"을 가리키는 식별자이므로 번역하지 않는다 — 화면에 보여줄 label은 i18n이
 * 담당하고, 여기서는 값을 추가/변경하지 않는다.
 */
export const RECORD_ACTIONS = ['interest', 'watching', 'buy', 'sell'] as const;

export type RecordAction = (typeof RECORD_ACTIONS)[number];
