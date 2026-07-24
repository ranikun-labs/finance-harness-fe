import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';

import type { Locale } from '@/constants/routes';
import type { MessageKey } from '@/i18n/dictionary';
import { getMessages } from '@/i18n/dictionary';

interface I18nContextValue {
  locale: Locale;
  t: (key: MessageKey, params?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveMessage(key: MessageKey, locale: Locale): string {
  const value: unknown = key
    .split('.')
    .reduce<unknown>(
      (acc, segment) => (acc as Record<string, unknown> | undefined)?.[segment],
      getMessages(locale),
    );
  if (typeof value !== 'string') {
    throw new Error(`i18n: 존재하지 않는 키 "${key}" (locale: "${locale}")`);
  }
  return value;
}

function interpolate(template: string, params?: Record<string, string>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? params[name] : match,
  );
}

interface I18nProviderProps {
  locale: Locale;
  children: ReactNode;
}

/**
 * 공개 웹(`PublicLayout`/`PublicNotFoundFallback`)과 앱(`AppLocaleProvider`)이
 * 공유하는 유일한 i18n provider. `document.documentElement.lang` 동기화 책임도
 * 이 한 곳에만 있다 — 호출부는 `locale`만 넘기고 위임한다. effect는 브라우저에서만
 * 실행되므로(React가 `renderToString` 중에는 호출하지 않음) SSR/Pre-render 단계에서
 * `document`를 참조하지 않는다.
 */
export function I18nProvider({ locale, children }: I18nProviderProps) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t: (key, params) => interpolate(resolveMessage(key, locale), params),
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * `<I18nProvider>` 밖에서 호출되면 반드시 throw한다 — 암묵적 전역(예: 한국어)
 * fallback을 숨겨서 provider 누락을 조용히 통과시키지 않는다.
 */
export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext);
  if (context === null) {
    throw new Error('useTranslation()은 <I18nProvider> 내부에서만 사용할 수 있습니다.');
  }
  return context;
}
