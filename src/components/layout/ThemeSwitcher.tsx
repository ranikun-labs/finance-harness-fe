import { Monitor, Moon, Sun } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import type { MessageKey } from '@/i18n/dictionary';
import { useTranslation } from '@/i18n/I18nContext';
import { THEME_PREFERENCES, type ThemePreference } from '@/theme/theme';
import { useTheme } from '@/theme/useTheme';

const OPTION_LABEL: Record<ThemePreference, MessageKey> = {
  system: 'theme.system',
  light: 'theme.light',
  dark: 'theme.dark',
};

const OPTION_ICON = { system: Monitor, light: Sun, dark: Moon } as const;

/**
 * 앱 화면 모드(시스템/라이트/다크) 선택. 선택은 즉시 적용되며(확인 버튼 없음) 이 브라우저의
 * `localStorage`에만 저장된다. DOM 클래스만 바꾸므로 열려 있는 화면의 입력·스크롤·상태는 유지된다.
 */
export function ThemeSwitcher() {
  const { t } = useTranslation();
  const { preference, setPreference } = useTheme();
  const [open, setOpen] = useState(false);
  const [persisted, setPersisted] = useState(true);
  const groupId = useId();
  const Icon = OPTION_ICON[preference];

  return (
    <>
      <Button
        type="button"
        variant="text-neutral"
        size="icon"
        aria-haspopup="dialog"
        aria-label={`${t('theme.trigger')}, ${t('theme.current', { mode: t(OPTION_LABEL[preference]) })}`}
        onClick={() => {
          setPersisted(true);
          setOpen(true);
        }}
        data-testid="theme-trigger"
      >
        <Icon aria-hidden="true" className="size-5" />
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t('theme.title')}
        description={t('theme.description')}
        cancelLabel={t('theme.close')}
      >
        <fieldset className="flex flex-col gap-2 border-0 p-0" data-testid="theme-options">
          <legend className="sr-only">{t('theme.title')}</legend>
          {THEME_PREFERENCES.map((option) => {
            const OptionIcon = OPTION_ICON[option];
            const inputId = `${groupId}-${option}`;
            const nameId = `${inputId}-name`;
            const hintId = `${inputId}-hint`;
            return (
              <label
                key={option}
                htmlFor={inputId}
                className="border-input has-[:checked]:border-primary has-[:checked]:bg-brand-subtle has-[:focus-visible]:outline-ring rounded-control flex min-h-12 cursor-pointer items-center gap-3 border px-3 py-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
              >
                <input
                  id={inputId}
                  type="radio"
                  name={`${groupId}-theme`}
                  value={option}
                  checked={preference === option}
                  aria-labelledby={nameId}
                  aria-describedby={option === 'system' ? hintId : undefined}
                  data-autofocus={preference === option ? '' : undefined}
                  onChange={() => setPersisted(setPreference(option).persisted)}
                  className="accent-primary size-5 shrink-0"
                />
                <OptionIcon aria-hidden="true" className="text-text-secondary size-5 shrink-0" />
                <span className="flex flex-col">
                  <span id={nameId} className="type-body text-foreground">
                    {t(OPTION_LABEL[option])}
                  </span>
                  {option === 'system' ? (
                    <span id={hintId} className="type-meta text-text-tertiary">
                      {t('theme.systemHint')}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}
          {persisted ? null : (
            <p role="status" className="type-meta text-warning">
              {t('theme.notPersisted')}
            </p>
          )}
        </fieldset>
      </Dialog>
    </>
  );
}
