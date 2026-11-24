import { MAIN_LANDMARK_ID } from '@/constants/layout';
import { useTranslation } from '@/i18n/I18nContext';

/**
 * 키보드 사용자가 내비게이션 반복 없이 본문으로 건너뛰는 첫 번째 포커스 대상.
 * `href`는 `<main id="main">`을 가리키므로 JS 없이도 앵커로 동작한다. 하이드레이션 후에는
 * 라우터 hash를 건드리지 않도록 click을 가로채 `main`으로 직접 포커스를 옮긴다.
 * 포커스되기 전에는 화면 밖에 있다(`sr-only`), 포커스되면 최상단에 보인다.
 */
export function SkipLink() {
  const { t } = useTranslation();

  return (
    <a
      href={`#${MAIN_LANDMARK_ID}`}
      onClick={(event) => {
        const main = document.getElementById(MAIN_LANDMARK_ID);
        if (!main) return;
        event.preventDefault();
        if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
        main.focus();
        main.scrollIntoView?.({ block: 'start' });
      }}
      className="bg-card text-foreground focus:shadow-overlay sr-only z-50 rounded-md px-4 py-3 text-sm font-semibold focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
    >
      {t('nav.skipToContent')}
    </a>
  );
}
