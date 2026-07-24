import { Navigate } from 'react-router';

import { DEFAULT_LOCALE, buildLocaleHomePath } from '@/constants/routes';

/**
 * 루트 경로 `/`의 유일한 목적지. 콘텐츠를 렌더하지 않고 canonical 기본 로케일(`/ko`)로
 * replace redirect 한다. 정적 redirect 산출(호스팅)·언어 감지는 후속 STEP(6·7) 범위다.
 */
export function RootRedirect() {
  return <Navigate to={buildLocaleHomePath(DEFAULT_LOCALE)} replace />;
}
