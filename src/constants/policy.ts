/**
 * 감정 태그 5종 — 고정 readonly 상수. 정책 원본: docs/product-policy.md
 * 이 목록 밖의 태그를 추가하지 말 것.
 */
export const EMOTION_TAGS = ['FOMO', '불안', '확신', '관망', '혼란'] as const;

export type EmotionTag = (typeof EMOTION_TAGS)[number];
