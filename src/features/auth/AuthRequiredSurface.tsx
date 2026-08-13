import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router';

import { AUTH_ROUTE_PATHS } from '@/constants/routes';
import type { AuthEntryLocationState, AuthResumeIntent } from '@/features/auth/authPresentation';
import { useAuthPresentation } from '@/features/auth/AuthPresentationContext';
import { useTranslation } from '@/i18n/I18nContext';

interface Props {
  children: ReactNode;
  fallbackCancelTarget: string;
  fallbackCancelLabel: string;
  resumeIntent?: AuthResumeIntent;
}

/**
 * FE navigation/access presentation only. It does not enforce server
 * authorization and never treats an unknown state as an authenticated grant.
 */
export function AuthRequiredSurface({
  children,
  fallbackCancelTarget,
  fallbackCancelLabel,
  resumeIntent,
}: Props) {
  const { state } = useAuthPresentation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (state !== 'guest') return;

    const locationState: AuthEntryLocationState = {
      authResumeIntent: resumeIntent,
      fallbackCancelTarget,
      fallbackCancelLabel,
    };
    navigate(AUTH_ROUTE_PATHS.entry, { replace: true, state: locationState });
  }, [fallbackCancelLabel, fallbackCancelTarget, navigate, resumeIntent, state]);

  if (state === 'guest') {
    return (
      <p role="status" aria-live="polite" className="p-4 text-sm">
        {t('auth.entry.redirecting')}
      </p>
    );
  }

  // Preserve the existing layout DOM for unknown/authenticated preview
  // surfaces; the context state remains the presentation boundary.
  return <>{children}</>;
}
