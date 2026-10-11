# Test matrix and completion gates

## Results confirmed on branch commit de4bf6df

GitHub Actions run #37 completed successfully: https://github.com/Loofy147/La9ta/actions/runs/38152425428

An independent Node.js 22 run of `npm run check && npm test` returned exit code 0. Result: 27 tests, 27 pass, 0 fail.

| Test family | Coverage | Result |
|---|---|---|
| Catalog and request domain | Stable IDs, server-resolved catalog data, unknown IDs, item limits, quantities, reference subtotal semantics | PASS |
| External offers | HTTPS/exact host allowlist, field bounds, reference-only prices | PASS |
| Order lifecycle | Allowed and forbidden status transitions | PASS |
| Search normalization | Token normalization, relevance, Teno response field mapping, human-facing source URL, detail URL extraction, no raw API URL fallback, result cap | PASS |
| Source identity | Ouedkniss URL variants for same announcement normalize to one identity; unrelated IDs remain distinct; API host rejected | PASS |
| Privacy/security contracts | Private Blob write, ADMIN_TOKEN comparison contract, no-store admin responses, service-worker route exclusions | PASS |
| Static/runtime parsing | Node syntax checks and JSON manifests | PASS |

## Live preview checks

- Homepage and 8-product catalog available.
- `/api/health` returned 200 and `storage:available`.
- `/api/search?q=HOCO%20H29` returned the relevant Ouedkniss listing, not a raw API URL.
- `/discover.html` loaded.
- Anonymous `/api/admin-orders` returned 401.

## Required integration checks still OPEN

- Complete valid request intake into private Blob, authenticated order listing, status update and subsequent read.
- Incorrect-token 401 and correct-token success for administration.
- Mobile browser regression of the final deduplication logic.
- Service Worker install/update/cache invalidation on real device.
- Search provider timeout, malformed payload, empty responses and rate-limit handling in hosted runtime.
- Production cutover and any migration of legacy customer records.

A feature is experimentally supported only for the exact paths and environment that passed. The code or the green build alone is not proof of full production readiness.
