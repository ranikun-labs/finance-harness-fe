# Local general analysis development flow

This opt-in development screen connects the existing question, checklist confirmation, and analysis endpoints. It is disabled unless Vite runs in development mode with `VITE_LOCAL_GENERAL_ANALYSIS=true`; production builds continue to use the existing presentation. It is not a production integration or release gate.

For local testing, run Finance BE with its `local` profile, `FINANCE_LOCAL_SHARED_AI_ENABLED=false`, and bind it to loopback. Set Vite's existing `FINANCE_API_PROXY_TARGET` to that loopback service and enable `VITE_LOCAL_GENERAL_ANALYSIS=true`. Vite rejects non-loopback proxy targets when the screen is enabled. The dedicated backend endpoint is absent whenever shared AI is enabled. The backend's local deterministic adapter is used when shared AI is disabled; never enable the HTTP adapter for this fixture. The backend maintains the policy, execution and output checks, and its local in-memory state is discarded on restart. The screen's numeric lens demonstration uses invented signals, not market evidence.

The browser sends requests to the same-origin `/finance/local-fake-analysis` paths. A failed or timed-out request keeps the question and checklist visible; changing the checklist or confirmation invalidates pending results. The backend remains authoritative for policy and output validation.

The scenario selector invokes a backend-only synthetic lookup after the confirmed, validated analysis. The backend reads one basic fixture, chooses at most one supplemental fixture, checks provenance, snapshot freshness and checklist revision, and returns synthetic facts separately from interpretation. Weak signals stop without a supplemental lookup. Lookup counts describe attempts; no network or real market data is used.

Each user submission creates a distinct execution; the screen performs no silent retry. A single execution attempts one basic lookup and at most one supplemental lookup. Each synthetic lookup has a one-second server-side deadline and fails closed if the bounded worker is unavailable or the deadline expires.
