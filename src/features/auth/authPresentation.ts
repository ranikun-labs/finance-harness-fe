import type { JournalEntryType } from '@/constants/routes';
import type { DecisionContextSnapshot } from '@/mocks/decisionContext';
import type { ReviewJournalHandoff } from '@/mocks/reviewResult';

/**
 * FE-local intent used by the Auth Entry presentation seam. This is navigation
 * state only: it is not an identity, persistence, or backend contract.
 */
export interface AuthResumeIntent {
  targetRoute: string;
  recordType: JournalEntryType;
  returnTarget: string;
  reviewHandoff?: ReviewJournalHandoff;
  decisionContext?: DecisionContextSnapshot;
  decisionContextEnabled?: boolean;
}

/**
 * FE presentation boundary supplied by the eventual Auth consumer. This is
 * intentionally not an identity or security protocol contract.
 */
export type AuthPresentationState = 'unknown' | 'guest' | 'authenticated';

export interface AuthPresentationConsumer {
  state: AuthPresentationState;
}

/**
 * Explicit fixture/test driver only. Production composition does not inject a
 * driver, so a provider-neutral CTA cannot manufacture an authenticated state.
 */
export interface AuthPresentationDriver {
  resolve: () => Promise<AuthPresentationState>;
}

export interface AuthEntryLocationState {
  authResumeIntent?: AuthResumeIntent;
  /** Safe FE-local fallback used when an auth-required route has no resume intent. */
  fallbackCancelTarget?: string;
  fallbackCancelLabel?: string;
}
