import { Link } from 'react-router';

import { buttonVariants } from '@/components/ui/button';
import { DEFAULT_LOCALE, buildLocaleHomePath } from '@/constants/routes';

/**
 * 공개 웹 표면 전용 NotFound. 앱 NotFound(`NotFoundPage`)와 분리되어 있으며, 복귀
 * 링크는 앱(`/app`)이 아니라 공개 웹 기본 로케일 홈(`/ko`)을 가리킨다.
 */
export function PublicNotFoundPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 p-4 pb-[env(safe-area-inset-bottom)] text-center">
      <h1 className="text-foreground text-lg font-semibold">공개 페이지를 찾을 수 없어요</h1>
      <p className="text-text-tertiary text-sm">주소를 다시 확인해주세요.</p>
      <Link
        to={buildLocaleHomePath(DEFAULT_LOCALE)}
        className={buttonVariants({ variant: 'default' })}
      >
        홈으로
      </Link>
    </div>
  );
}
