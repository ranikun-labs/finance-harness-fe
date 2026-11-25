import { useState, type ReactNode } from 'react';
import { createMemoryRouter, RouterProvider, type InitialEntry } from 'react-router';

/**
 * `MemoryRouter` 대체 테스트 헬퍼. 이탈 보호(`useBlocker`)는 data router에서만 동작하므로
 * 앱과 같은 방식(splat 라우트 하나가 `<Routes>` 트리를 감싼다)으로 연다.
 */
export function DataMemoryRouter({
  initialEntries,
  children,
}: {
  initialEntries: InitialEntry[];
  children: ReactNode;
}) {
  const [router] = useState(() =>
    createMemoryRouter([{ path: '*', element: children }], { initialEntries }),
  );
  return <RouterProvider router={router} />;
}
