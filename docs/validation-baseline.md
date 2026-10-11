# Validation run record

Audit window: 2026-10-11  
Repository: https://github.com/Loofy147/La9ta  
Old storefront left unchanged: https://dz-pick-store.vercel.app/

## Reproducible automated checks

The GitHub Actions workflow executes:
- JavaScript syntax checks for browser modules, serverless handlers, and domain modules.
- Domain tests for catalog/offer normalization, unknown products, item/quantity limits, source URL allowlisting, reference subtotal behavior, status transition rules, and catalog integrity.
- Search-domain regression tests for query normalization, relevance filtering, source URL extraction, API URL exclusion, Teno snapshot fallback, and result limits.
- Static privacy/cache contract checks for private Blob writes, admin token enforcement, no-store responses, and Service Worker exclusions.
- Source identity tests for canonicalizing two different Ouedkniss URL formats to the same announcement ID.

A file being present is not a passing test. The actual workflow run and conclusion must be recorded after GitHub Actions executes.

## Runtime evidence collected before this record

- The isolated Vercel project has ID `prj_cFiJcOwiK8R62DWNiZfJWCNsM7At`; the original `dz-pick-store` project was not modified.
- A live check of `/api/health` returned `ok:true` and `storage:available` in the isolated project.
- A live check of `/api/admin-orders` without an admin token returned HTTP 401.
- Searching `HOCO H29` returned a relevant Teno result, a 900 DZD observed price, and a human-facing Ouedkniss URL ending in the listing identifier `d56373493`; it did not return the API JSON endpoint as its source link.
- Searching `robot vacuum` returned six relevant Ouedkniss listings with human-facing URLs.
- A browser automation run on an earlier deployment verified the homepage rendered eight catalog items, adding a catalog item worked, search returned the relevant HOCO H29 listing, and the result could be added to the request cart. It also showed the same announcement could be present through both curated catalog and discovery; the source-identity deduplication fix was added afterwards. The post-fix version still needs a fresh interactive regression run.
- No order was submitted during the browser acceptance run, and no customer information was entered.
- No old-production alias was reassigned and no old order records were migrated.

## Deployment interpretation

The repository-backed `la9ta` Vercel project is isolated from the prior `dz-pick-store` project. Its main-branch deployments have Vercel target `production` within the new project; this is **not** the same as promoting the new project to the old public domain. The public domain `dz-pick-store.vercel.app` remains unchanged.

## Completion status

- Source implementation: committed to GitHub.
- Automated tests: authored; workflow result pending.
- Isolated Vercel deployment: runtime routes partly checked.
- Private order creation/read/update end-to-end: not yet tested with a persisted synthetic order.
- Final interactive cart dedup regression: not yet tested.
- Production cutover / migration: not performed.
