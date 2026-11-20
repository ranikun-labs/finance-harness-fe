# Local general analysis development flow

This opt-in development screen connects the existing question, checklist confirmation, and analysis endpoints. It is disabled unless Vite runs in development mode with `VITE_LOCAL_GENERAL_ANALYSIS=true`; production builds continue to use the existing presentation. It is not a production integration or release gate.

For local testing, run Finance BE with its `local` profile, `FINANCE_LOCAL_SHARED_AI_ENABLED=false`, and bind it to loopback. Set Vite's existing `FINANCE_API_PROXY_TARGET` to that loopback service and enable `VITE_LOCAL_GENERAL_ANALYSIS=true`. The backend's local deterministic adapter is used when shared AI is disabled; never enable the HTTP adapter for this fixture. The backend maintains the policy, execution and output checks, and its local in-memory state is discarded on restart. The screen's numeric lens demonstration uses invented signals, not market evidence.

The browser sends requests to the same-origin `/finance/general-analysis` paths. A failed or timed-out request keeps the question and checklist visible; changing the checklist or confirmation invalidates pending results. The backend remains authoritative for policy and output validation.
