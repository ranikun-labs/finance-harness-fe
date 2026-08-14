/* eslint-disable react-refresh/only-export-components -- the provider and its hook
   intentionally share one FE-local presentation boundary. */
import { createContext, useContext, type ReactNode } from 'react';

import type { AuthPresentationConsumer } from '@/features/auth/authPresentation';

const UNKNOWN_AUTH_PRESENTATION: AuthPresentationConsumer = { state: 'unknown' };

const AuthPresentationContext = createContext<AuthPresentationConsumer>(UNKNOWN_AUTH_PRESENTATION);

export function AuthPresentationProvider({
  value = UNKNOWN_AUTH_PRESENTATION,
  children,
}: {
  value?: AuthPresentationConsumer;
  children: ReactNode;
}) {
  return (
    <AuthPresentationContext.Provider value={value}>{children}</AuthPresentationContext.Provider>
  );
}

export function useAuthPresentation(): AuthPresentationConsumer {
  return useContext(AuthPresentationContext);
}
