# Test matrix and completion gates

## Automated results

GitHub Actions run #38 completed successfully: https://github.com/Loofy147/La9ta/actions/runs/38152744176

Independent Node.js 22 run of `npm run check && npm test`: exit code 0, 27 tests passed, 0 failed.

| Test family | Coverage | Result |
|---|---|---|
| Catalog/request domain | IDs, item limits, quantities, normalized catalog snapshots, reference subtotal semantics | PASS |
| External source offers | HTTPS allowlist, exact host restrictions, input bounds, reference-only prices | PASS |
| Order state machine | permitted/forbidden transitions | PASS |
| Search domain | query normalization, relevance filter, listing URL extraction, no API URL fallback, result cap | PASS |
| Source identity | canonical URL identity for an Ouedkniss ad, different IDs remain distinct | PASS |
| Selected security contracts | private Blob write, server-side admin token comparison, no-store, service worker exclusions | PASS |
| Static parsing/manifests | JS syntax and JSON validation | PASS |

## Live checks

- Homepage and catalog: available; eight reference products returned.
- Health: reports storage available.
- Search: HOCO H29 returns a relevant result and human-facing Ouedkniss listing URL.
- Admin page: loads; anonymous admin API request returns 401.
- Valid synthetic order request: HTTP 201; test order ID `DZ-C3A8D87B`.
- Invalid product ID, quantity zero, populated honeypot: each HTTP 422.

One clearly synthetic test record remains in the isolated Preview Blob store; it is not production data.

## Still open

- Correct-token admin list, valid status transition, illegal transition response 409, reread and status history.
- Cleanup of the synthetic record through a trusted private maintenance route.
- Post-dedup mobile browser regression and PWA install/update/cache invalidation.
- Search provider timeout, malformed response and rate-limit tests.
- Production cutover and any migration of legacy customer data.

CI is necessary but not sufficient: source presence and a green build do not prove full production readiness.
