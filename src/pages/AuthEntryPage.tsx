import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { buttonVariants } from '@/components/ui/button';
import { APP_ROUTE_PATHS } from '@/constants/routes';
import type {
  AuthEntryLocationState,
  AuthPresentationDriver,
  AuthResumeIntent,
} from '@/features/auth/authPresentation';
import type { FinanceReferenceCredentials } from '@/features/auth/financeReferenceAuth';
import type { MessageKey } from '@/i18n/dictionary';
import { useTranslation } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';

type AuthPhase = 'idle' | 'loading' | 'failure' | 'unavailable';

interface AuthEntryPageProps {
  /** Explicit test/fixture driver. Production composition intentionally omits it. */
  driver?: AuthPresentationDriver;
  /** Explicit nonproduction diagnostic login only. Production OAuth-first copy is unchanged. */
  financeReferenceAuth?: {
    enabled: boolean;
    login: (credentials: FinanceReferenceCredentials, signal?: AbortSignal) => Promise<void>;
  };
  fallbackCancelTarget?: string;
  fallbackCancelLabel?: string;
}

function readLocationState(value: unknown): AuthEntryLocationState {
  if (!value || typeof value !== 'object') return {};
  return value as AuthEntryLocationState;
}

function destinationState(intent: AuthResumeIntent | undefined) {
  if (!intent) return undefined;

  return {
    reviewHandoff: intent.reviewHandoff,
    decisionContext: intent.decisionContext,
    decisionContextEnabled: intent.decisionContextEnabled,
    authResumeNotice: Boolean(intent.reviewHandoff),
  };
}

/**
 * Provider-neutral Auth Entry presentation seam. Production composition only
 * presents the externally supplied result; without a driver the CTA is inert.
 */
export function AuthEntryPage({
  driver,
  financeReferenceAuth,
  fallbackCancelTarget,
  fallbackCancelLabel,
}: AuthEntryPageProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = readLocationState(location.state);
  const intent = locationState.authResumeIntent;
  const [phase, setPhase] = useState<AuthPhase>('idle');
  const [userId, setUserId] = useState('');
  const attemptRef = useRef(0);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const loginControllerRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      loginControllerRef.current?.abort();
      if (passwordInputRef.current) passwordInputRef.current.value = '';
    },
    [],
  );

  const cancelTarget = intent?.reviewHandoff
    ? intent.returnTarget
    : (fallbackCancelTarget ?? locationState.fallbackCancelTarget ?? APP_ROUTE_PATHS.journalNew);
  const cancelLabel = (
    intent?.reviewHandoff
      ? 'auth.entry.cancel'
      : (fallbackCancelLabel ?? locationState.fallbackCancelLabel ?? 'auth.entry.cancelEntry')
  ) as MessageKey;
  const targetRoute = intent?.targetRoute ?? APP_ROUTE_PATHS.appHome;

  function cancel() {
    if (phase === 'loading') return;
    navigate(cancelTarget, { replace: true });
  }

  function beginAuth() {
    if (phase === 'loading') return;
    if (!driver) {
      setPhase('unavailable');
      return;
    }

    const attempt = ++attemptRef.current;
    setPhase('loading');
    void driver
      .resolve()
      .then((state) => {
        if (attempt !== attemptRef.current) return;
        if (state !== 'authenticated' || !intent) {
          setPhase('failure');
          return;
        }
        navigate(targetRoute, {
          replace: true,
          state: destinationState(intent),
        });
      })
      .catch(() => {
        if (attempt === attemptRef.current) setPhase('failure');
      });
  }

  function beginFinanceReferenceAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phase === 'loading' || !financeReferenceAuth?.enabled) return;

    const password = passwordInputRef.current?.value ?? '';
    if (passwordInputRef.current) passwordInputRef.current.value = '';
    const credentials = { userId, password };
    const attempt = ++attemptRef.current;
    const controller = new AbortController();
    loginControllerRef.current = controller;
    setPhase('loading');

    void financeReferenceAuth
      .login(credentials, controller.signal)
      .then(() => {
        if (attempt !== attemptRef.current) return;
        navigate(targetRoute, { replace: true, state: destinationState(intent) });
      })
      .catch(() => {
        if (attempt === attemptRef.current && !controller.signal.aborted) setPhase('failure');
      })
      .finally(() => {
        if (passwordInputRef.current) passwordInputRef.current.value = '';
        if (!controller.signal.aborted) setUserId('');
      });
  }

  return (
    <div className="bg-muted flex min-h-dvh w-full justify-center px-4 py-6 sm:px-6 sm:py-10">
      <main
        className="bg-background flex min-h-[min(720px,calc(100dvh-3rem))] w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-xl"
        data-testid="auth-entry"
      >
        <header className="border-border flex items-center gap-3 border-b px-6 py-5">
          <span
            aria-hidden="true"
            className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold"
          >
            ✓
          </span>
          <span className="text-foreground text-base font-extrabold tracking-tight">
            {t('common.appName')}
          </span>
        </header>

        <section className="flex flex-1 flex-col justify-center gap-6 px-6 py-10 sm:px-12">
          <div className="flex flex-col gap-3">
            <p className="text-primary text-xs font-bold tracking-wider uppercase">
              {t('auth.entry.eyebrow')}
            </p>
            <h1 className="text-foreground text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl">
              {t('auth.entry.heading')}
            </h1>
            <p className="text-muted-foreground text-sm leading-6">{t('auth.entry.description')}</p>
            <p className="text-muted-foreground text-sm leading-6">
              {intent ? t('auth.entry.resumeDescription') : t('auth.entry.noIntent')}
            </p>
          </div>

          {phase === 'loading' && (
            <p
              role="status"
              aria-live="polite"
              aria-label={t('auth.entry.loading')}
              className="border-border bg-muted rounded-xl border p-4 text-sm font-semibold"
            >
              {t('auth.entry.loading')}
            </p>
          )}

          {phase === 'failure' && (
            <div
              role="alert"
              className="border-destructive/30 bg-destructive/5 flex flex-col gap-3 rounded-xl border p-4"
            >
              <p className="text-destructive text-sm font-semibold">{t('auth.entry.failure')}</p>
              <p className="text-muted-foreground text-sm leading-6">
                {t('auth.entry.failureDescription')}
              </p>
              {!financeReferenceAuth?.enabled && (
                <button
                  type="button"
                  onClick={beginAuth}
                  className={cn(buttonVariants(), 'min-h-11 self-start')}
                >
                  {t('auth.entry.retry')}
                </button>
              )}
            </div>
          )}

          {phase === 'unavailable' && (
            <p
              role="status"
              aria-live="polite"
              className="border-border bg-muted rounded-xl border p-4 text-sm leading-6"
            >
              <span className="font-semibold">{t('auth.entry.unavailable')}</span>{' '}
              {t('auth.entry.unavailableDescription')}
            </p>
          )}

          {financeReferenceAuth?.enabled ? (
            <form onSubmit={beginFinanceReferenceAuth} className="flex flex-col gap-3">
              <p className="border-border bg-muted rounded-xl border p-3 text-sm">
                {t('auth.entry.referenceNotice')}
              </p>
              <label className="flex flex-col gap-1 text-sm font-semibold">
                {t('auth.entry.referenceUserId')}
                <input
                  autoComplete="username"
                  className="border-input bg-background focus-visible:ring-ring min-h-11 rounded-md border px-3 outline-none focus-visible:ring-2"
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  disabled={phase === 'loading'}
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold">
                {t('auth.entry.referencePassword')}
                <input
                  ref={passwordInputRef}
                  type="password"
                  autoComplete="current-password"
                  className="border-input bg-background focus-visible:ring-ring min-h-11 rounded-md border px-3 outline-none focus-visible:ring-2"
                  disabled={phase === 'loading'}
                  required
                />
              </label>
              <button
                type="submit"
                disabled={phase === 'loading'}
                className={cn(buttonVariants({ size: 'lg' }), 'min-h-11 w-full')}
                data-testid="finance-reference-login"
              >
                {t('auth.entry.referenceAction')}
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={beginAuth}
                disabled={phase === 'loading'}
                className={cn(buttonVariants({ size: 'lg' }), 'min-h-11 w-full')}
                data-testid="auth-provider-cta"
              >
                {t('auth.entry.providerAction')}
              </button>
              <p className="text-muted-foreground text-center text-xs leading-5">
                {t('auth.entry.providerNeutralNotice')}
              </p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={cancel}
              disabled={phase === 'loading'}
              className="text-primary focus-visible:ring-ring/50 min-h-11 rounded-md text-sm font-semibold underline-offset-4 outline-none hover:underline focus-visible:ring-3"
            >
              {t(cancelLabel)}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
