# Deployment runbook

## Current deployment boundaries

- Repo: https://github.com/Loofy147/La9ta
- Project: `la9ta`, Vercel project ID `prj_cFiJcOwiK8R62DWNiZfJWCNsM7At`
- Git main is deployed at https://la9ta.vercel.app/ with deployment `dpl_5f7RMptU2njN669fr9L6DUx5xk53`, READY, target production within this project.
- Root Directory: `src`.
- Private Blob store for La9ta: `la9ta-preview-orders`, `store_rAO0bQFXBAZFzJd9`, region `fra1`.
- Historical project `dz-pick-store` and alias `dz-pick-store.vercel.app` remain separate and untouched.

Do not confuse the new project's production target with a migration of the old alias or its data.

## Environment variables

- `BLOB_READ_WRITE_TOKEN`: configured from the La9ta Blob store.
- `ADMIN_TOKEN`: sensitive Vercel environment variable; do not print, export into logs, or commit the value.
- The same La9ta store is linked for the environments configured in the new project. Therefore the synthetic QA order created in a branch deployment exists in the La9ta store and must not be assumed to be preview-only. Its order ID is `DZ-C3A8D87B`; it must not be represented as a real customer order.

## Accepted checks on main

- Homepage, catalog, health and HOCO H29 search were checked after deployment.
- Anonymous `/api/admin-orders` returned 401.
- CI #39 passed with 27 tests.
- A valid synthetic create request returned 201; unknown ID, zero quantity and populated honeypot each returned 422.

## Remaining acceptance checklist

1. Use a properly authorized, secret-safe process to confirm correct-token listing, valid status update, forbidden transition 409, reread and status history.
2. Remove `DZ-C3A8D87B` via a trusted private maintenance path, not a public delete endpoint.
3. Retest catalog/search dedup in a browser after the last UI change.
4. Test Service Worker installation, updates and cache invalidation on a real device.
5. Test Teno API failures, timeout, no-result responses and rate limits.
6. Capture current old alias mapping and separate legacy data-retention decision before any cutover.

## Legacy cutover

Do not change `dz-pick-store.vercel.app` merely because La9ta main is READY. Before any migration:
- Preserve old project and order-store baseline.
- Make a separate decision for historical orders and privacy/retention.
- Complete all remaining acceptance tests.
- Record deployment IDs, alias before/after and rollback target.
- Perform reversible cutover and smoke-test both site behavior and order API.
- If critical checks fail, restore the old alias and verify it.

## Rollback

Rollback is routing to a recorded known-good deployment. It does not mean deleting or overwriting order data. Keep both stores until data retention and migration decisions are documented.
