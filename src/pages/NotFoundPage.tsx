import { Link } from 'react-router';

import { buttonVariants } from '@/components/ui/button';
import { ROUTE_PATHS } from '@/constants/routes';

export function NotFoundPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 p-4 pb-[env(safe-area-inset-bottom)] text-center">
      <h1 className="text-foreground text-lg font-semibold">페이지를 찾을 수 없어요</h1>
      <p className="text-text-tertiary text-sm">주소를 다시 확인해주세요.</p>
      <Link to={ROUTE_PATHS.home} className={buttonVariants({ variant: 'default' })}>
        홈으로
      </Link>
    </div>
  );
}
