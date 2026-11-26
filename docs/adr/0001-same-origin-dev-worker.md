# ADR 0001: Serve the Finance DEV acceptance frontend same-origin through a Worker

- Status: Accepted for Seoul DEV. Not yet deployed. No Worker, Gateway or WAF change was applied from this repository.
- Scope: `worker/` (edge code, `wrangler.toml`), `e2e-same-origin/`, `playwright.same-origin.config.ts`, the `dev-acceptance` build (`VITE_FINANCE_API_BASE=/api/finance`).
- Mirrors: `ranikun-labs/carelog-fe` `docs/adr/0002-same-origin-dev-worker.md` (reviewed at `a580aa58`). Differences are listed under Decision.

## Context

- The DEV acceptance build calls `/api/finance/*` and the reference login/signup endpoints relative to the page origin.
  Without a same-origin edge, the browser would need CORS on the Gateway for the reference-auth and journal routes.
- The reference login has no refresh token and no server logout. The access token is kept in memory only
  (`src/features/auth/financeReferenceAuth.ts`), so a reload requires a password login again.
- The DEV signup route exists only in the `dev-acceptance` build (`src/main.tsx`, `src/features/auth/financeReferenceSignup.ts`).
  The production bundle guard (`scripts/verify-prod-bundle.mjs`) fails the build if `finance-reference/signup` appears in PROD output.
- No FE hosting definition existed in this repository before this ADR. This ADR introduces the Worker.

## Decision

- A Worker serves the `dist-dev-acceptance/` SPA and answers `/api` requests itself. Known Finance routes are forwarded
  to the shared Gateway at the same path. The Gateway's StripPrefix routing for `/api/finance` is unchanged.
- `PUBLIC_ORIGIN` is the exact browser origin of the Worker. It is validated on each API request (missing or malformed fails closed) but is not forwarded upstream.
  The client's `Origin` is never forwarded. `GATEWAY_ORIGIN` is the exact HTTPS origin of the DEV Gateway, with no path.
  Both are Worker secrets. Missing or malformed values answer every `/api` request with JSON 500.
- Forwarded routes (exact method and path, anything else under `/api/finance` is JSON 404, a wrong method is JSON 405 with `Allow`):

  | Method     | Path                                              | Source                                                 |
  | ---------- | ------------------------------------------------- | ------------------------------------------------------ |
  | GET, POST  | `/api/finance/journals`                           | `HttpJournalReadPort`, `HttpJournalCreatePort`         |
  | GET        | `/api/finance/journals/deleted`                   | `journalLifecyclePort`                                 |
  | GET, PATCH | `/api/finance/journals/{uuid}`                    | `HttpJournalReadPort`, `journalEditPort`               |
  | POST       | `/api/finance/journals/{uuid}/delete`, `/restore` | `journalLifecyclePort`                                 |
  | POST       | `/api/v1/auth/finance-reference/login`, `/signup` | `financeReferenceAuth.ts`, `financeReferenceSignup.ts` |

  The `{uuid}` match is lowercase canonical UUID, the same shape the FE guard uses.

- `POST .../delete` and `POST .../restore` require `Content-Type: application/json`. The FE sends it with body `{expectedRevision}`
  (`journalLifecyclePort.ts`). The Worker forwards `content-type` unchanged and does not check it. Rejecting other content types is the Gateway's and the Finance backend's job, and that is not verified here.

- Auth paths under `/api/v1/auth` accept POST on the two exact routes only. Anything else there gets JSON 405 with `Allow: POST` and never reaches the Gateway.
- Raw path guard, for every path. It reads `request.url` before URL normalization and rejects with JSON 400 if the path contains
  `%2f`, `%5c`, `%2e` (case-insensitive), `;`, `\`, `//`, a `..` segment, or a percent-encoded unreserved character. The forwarded path is taken from the same string.
- API namespace casing. `/API/...` and other casings of `/api` are JSON 404 from the edge, never the SPA fallback and never the Gateway.
- Request headers are an allowlist: `accept`, `accept-language`, `authorization`, `content-type`, `idempotency-key`.
  `idempotency-key` is not in the original request list. Journal create sends it (`HttpJournalCreatePort`), and the Gateway needs it to keep create idempotent.
  `cf-connecting-ip` becomes `x-forwarded-for`, which overwrites any client value. Cookies, `X-Finance-*`, `X-User-*`, `X-Forwarded-*` and hop-by-hop headers are dropped.
- Response headers are an allowlist: `content-type`, `retry-after`, `www-authenticate`. `Set-Cookie` and `Location` are dropped.
  Every `/api` response carries `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.
- Upstream 3xx becomes JSON 502. A non-JSON upstream body (HTML error page, tunnel page) is replaced by `{status, message}` at the same status. 204 passes through.
- Request body is capped at 64 KiB. A declared `Content-Length` over the cap, or a streamed body over it, gets JSON 413 before anything is forwarded.
- Upstream timeout is `AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)`, default 10000 ms, accepted range 1 to 60000. It covers the wait for response headers. A timeout gets JSON 504.
  The client body is read before the upstream call, bounded by the size cap and not by time. Once headers arrive the body streams through without a timeout.
- Errors are JSON. No request or response content is logged by the Worker.
- Rate limiting is not in the Worker. An in-isolate counter is not a global limit. It is done at the Cloudflare WAF (see checklist 4 and 5).
- `workers_dev = false` and `preview_urls = false`. The custom domain route is the only public entry (checklist 8 and 10).

### Differences from the Carelog Worker

- No `Origin` rewrite on any finance route. Carelog's registration CORS allowlist has no finance counterpart: Gateway and Core (platform-services f9adfd3) have no CORS or Origin check on finance-reference signup.
- Route table is per-method and per-path. Carelog forwards any non-auth path under `/api` to the Gateway. Finance answers unknown `/api/finance/*` paths with 404.
- `idempotency-key` is forwarded (see above).

## Exact values to configure

| Name                                                                    | Where                                                           | Value                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PUBLIC_ORIGIN`                                                         | Worker secret                                                   | `https://<dev-finance-fe-host>` (scheme, host, port; no path). Example form only.                                                                                                                                                                                                                            |
| `GATEWAY_ORIGIN`                                                        | Worker secret                                                   | `https://<dev-api-host>` (the public hostname that maps to the Gateway, no path).                                                                                                                                                                                                                            |
| `UPSTREAM_TIMEOUT_MS`                                                   | Worker var (`[vars]`)                                           | `10000` (default when unset). Whole number, 1 to 60000. Keep it below the Tunnel and Cloudflare idle timeouts.                                                                                                                                                                                               |
| Cloudflare WAF rate-limit rule (proposed starting values, not measured) | Zone of the Worker route, and of the Gateway host (checklist 4) | Expression: `http.request.method eq "POST" and http.request.uri.path in {"/api/v1/auth/finance-reference/login" "/api/v1/auth/finance-reference/signup"}`. Per IP (`ip.src`), period 60 s, threshold 20, action Block, mitigation 600 s. Tune after DEV observation. Check plan support first (checklist 9). |
| Build                                                                   | CI or local                                                     | `pnpm build:dev-acceptance` (outputs `dist-dev-acceptance/`, mode `dev-acceptance`, loads `.env.dev-acceptance`)                                                                                                                                                                                             |
| Deploy                                                                  | `worker/`                                                       | `wrangler deploy` with the two secrets set. Not run here: no Cloudflare account access.                                                                                                                                                                                                                      |

## 배포 대상 정보 (미정)

아래 값은 모두 아직 정해지지 않았다. 실제 값은 배포 환경에서만 설정하고 저장소에 커밋하지 않는다.

- Worker 이름: 미정. `worker/wrangler.toml`의 `finance-fe-dev`는 잠정값이다.
- routes / custom domain: 미정. `routes`는 배포 환경에서 지정하며 호스트명을 커밋하지 않는다.
- `PUBLIC_ORIGIN` (Worker secret): 미정. 형식은 `https://<host>`이며 경로와 끝 슬래시를 붙이지 않는다.
- `GATEWAY_ORIGIN` (Worker secret): 미정. 형식은 `https://<host>`이며 경로를 붙이지 않는다.
- Cloudflare account / zone: 미정.
- Gateway allowed origins: 설정 불필요. Finance 경로에는 Origin 검사가 없어 `PLATFORM_GATEWAY_CARELOG_REGISTRATION_ALLOWED_ORIGINS`에 대응하는 값이 필요하지 않다(Decision 참고).
- Gateway env `FINANCE_BE_URI`: 필수. 값 미정.

## Deploy checklist (must verify before the DEV URL is shared)

1. Secrets and vars are set on the Worker: `GATEWAY_ORIGIN`, `PUBLIC_ORIGIN`. `UPSTREAM_TIMEOUT_MS` is unset or a valid value.
   A missing or malformed secret shows up as 500 JSON on every `/api` call.
2. The Gateway's `/api/finance` route is the one the Worker reaches (StripPrefix=1 behaviour confirmed against the deployed route), and the auth routes
   `/api/v1/auth/finance-reference/{login,signup}` are enabled on the DEV profile only.
3. **Trusted proxy hops (must verify).** Send one login from a known public IP through the Worker. Read the client address the Gateway logs or uses for rate limiting.
   It must be that IP, not a Cloudflare or Worker address, and not a value the client sent. Only then set the Gateway's trusted-hop count
   (for example `PLATFORM_GATEWAY_OAUTH_RATE_LIMIT_TRUSTED_PROXY_HOPS`, name to be verified against the Gateway) to the count that gives this result.
   The Worker overwrites `x-forwarded-for` with `cf-connecting-ip`, and cloudflared may append to it. Verify the actual chain.
4. **Rate limits on both public hosts (must verify).** The WAF rule must return 429 on the Worker host and on the Gateway host, for login and signup.
   Send more than the threshold from one IP to each host and confirm 429 on both. If the Gateway host cannot get the rule, restrict its ingress to the Worker only and record which option was used.
   A Worker-host pass alone is not enough.
   **Access service token variant:** if the Gateway ingress is restricted to the Worker through a Cloudflare Access service token, the Worker must inject that token
   as request headers (for example `CF-Access-Client-Id` and `CF-Access-Client-Secret`, as secrets). The current header allowlist drops them, so this is a code change
   to the Worker before that option can be used. Do not choose that option until the change is made and tested.
5. Spot checks on the deployed Worker: `GET /api/v1/auth/finance-reference/login` returns 405 JSON with `Allow: POST`. `GET /API/finance/journals` returns 404 JSON.
   `GET /api/finance/journals%2fx` returns 400 JSON. `GET /api/finance/unknown` returns JSON 404. `PUT /api/finance/journals` returns 405 JSON.
6. `run_worker_first` routing works in the deployed Worker. `/api` and `/api/finance/...` reach the Worker, not assets.
7. The deployed `dist-dev-acceptance/` was built with `pnpm build:dev-acceptance` (`VITE_FINANCE_API_BASE=/api/finance`). `pnpm verify:prod-bundle` passed on the same commit.
8. **workers.dev disabled (must verify).** `workers_dev = false` is in `wrangler.toml`. `<name>.<subdomain>.workers.dev` returns 404 or is disabled.
9. **Plan limits (must verify).** Confirm the Cloudflare plan supports the rate-limit period and mitigation values in the table. If not, use a supported period with an
   equivalent threshold and record the values used.
10. **Preview URL disabled (must verify).** `preview_urls = false` is in `wrangler.toml`. Deployed versions do not expose a preview URL that bypasses the custom domain route,
    and the Gateway host is not reachable from a Worker preview.
11. Reference login and signup are not present in the production build or environment: `pnpm verify:prod-bundle` passes, and the PROD Gateway does not enable the reference routes.

## Verification

- `worker/src/dev-edge.test.ts`: routing and namespace casing, raw path guard (including `%61pi` and `..` forms), auth POST-only allowlist and 405s,
  finance method allowlist and 405s with `Allow`, unknown `/api/finance` paths as 404, header allowlists (cookie, `X-Finance-*`, `X-User-*`, `X-Forwarded-*`),
  `cf-connecting-ip` to `X-Forwarded-For`, `Set-Cookie`/`Location` dropped, forced `no-store`, body cap (declared and streamed, 413), upstream timeout (504),
  unreachable upstream (502), 3xx (502), HTML replaced with JSON, 204, fail-closed configuration (500).
- `e2e-same-origin/same-origin-dev.spec.ts`: a DEV acceptance build served by `vite preview`, with requests answered by the Worker handler through route interception and a
  stateful mock Gateway. It covers DEV signup, password login, a journal save through the UI, reload (session lost), re-login, the same journal read back,
  logout, a 401 without a token, a second account's denial (404 on the first account's journal, and its own list excludes it), JSON 404 for an unknown
  `/api/finance` path and JSON 400 for an encoded slash. It also checks that the app's bearer never reaches `localStorage` or `sessionStorage`.
- The mock stands in for the Gateway and the Finance backend. It does not prove the live Gateway, tunnel, or WAF behaviour.

## Consequences

- Same-origin removes the need for CORS on the reference-auth and journal routes.
- The access token stays in memory. The Worker does not add storage and does not change that.
- The Worker is a trusted hop for client addresses. The Gateway must trust exactly one edge-verified address, so the hop count must match the real chain.
- The raw path guard and the method allowlist are edge policy, not a substitute for Gateway authorization. The Gateway must still enforce journal ownership.
- The DEV reference routes are reachable from the public DEV host. They are a verification surface only and are excluded from production builds (checklist 11).

## Open items

- **Signup 409 exposes account existence (open, must resolve before public DEV).** `POST /api/v1/auth/finance-reference/signup` answers 409 when the email is already
  registered, and the UI shows it (`signupExists`). Anyone who can reach the DEV host can probe which emails have accounts. Options for the DEV host: rate limit (checklist 4) only,
  a neutral response for both cases, or restricting the route to a known network. This is not decided here.
- Confirm the Gateway env-binding name and trusted-hop count against the deployed chain (checklist 2 and 3).
- Tune the WAF rate-limit values after DEV traffic is observed. The starting values above are not measured.
- The live path has not been exercised: no Worker deploy, no DEV Gateway call, no CI run on this branch.
