# Current audit and cutover baseline

Audit date: 2026-10-11  
Target currently in production: https://dz-pick-store.vercel.app/  
New source repository: https://github.com/Loofy147/La9ta

## What was verified live during this audit

| Check | Result | Evidence status |
|---|---|---|
| Homepage / | HTTP/page fetch succeeded; Arabic storefront describes a request-to-source-confirmation model | FACT |
| /api/health | Returned ok=true, storage=available, countHint=1 on the old deployment | FACT for that response only |
| /api/search?q=HOCO%20H29 | 404 on public alias | FACT |
| /discover.html | 404 on public alias | FACT |
| /admin.html | Page shell loaded and showed internal operations UI | FACT for page load only |
| Admin auth and full order/update flow | Not tested end-to-end in this audit | UNKNOWN |
| Latest listed Vercel deployment | dpl_9NmQgvXgQqbmvfDF7Cxu4M468zcu, state READY, target production | FACT about platform status |
| Deployment previously observed on public alias | dpl_13XeojEZRzN6Yk8ZfMNFxgkGiX1Q | FACT at time of that lookup; re-check alias before changes |
| File tree of stable deployment | Contains catalog/order/health/admin source paths; lacks search.js and discover.html | FACT from deployment file tree |
| File tree of latest deployment | Contains search.js and discover.html | FACT from deployment file tree |
| Recent runtime log query | No error/warning records returned for the last 30-minute filter | Limited FACT, not proof of zero defects |
| Seven-day runtime logs | Vercel Hobby retention rejected the query | FACT about tool query failure, not about prior incidents |

## Important interpretation

READY indicates a deployment completed, not that the public alias points to it. The current evidence explains why search was not available on the public alias after rollback: its stable file tree has neither search.js nor discover.html.

The previous Vercel file-content connector returned truncated/corrupted strings for some long source files. Those strings must not be treated as canonical source and must not be copied back into deployment. This repository therefore starts a clean, source-controlled reconstruction of the known product behavior rather than claiming a byte-for-byte source recovery.

## Existing project identifiers

- Vercel project: dz-pick-store
- Project ID: prj_n2wvKCZwzoKrwc4LEIbHPXFkgX2G
- Team ID: team_ixI6xM0ZnsxZlgukDx9StXSn
- Private Blob store reported previously: dz-pick-orders, store_PZXLgAcY0utZBfXi
- Previously linked private Blob token was attached to the old Vercel project; its secret value must not be copied into Git or printed in audit files.

These are historical platform identifiers. Before any production mutation, retrieve current project details, current alias assignment, environment-variable presence, and Blob linkage again.

## Original product facts carried into this source baseline

The prior catalog had eight entries and the following reference prices: HOCO H29 900 DZD, PLOKAMA U20 1,200 DZD, HOCO K28 1,900 DZD, YESIDO C70 2,400 DZD, Goji G7 2,500 DZD, K007 650 DZD, SilverCrest Mixeur 7,200 DZD, and Anker Eufy G50 Hybrid 34,000 DZD. They are historical reference prices from third-party listings and require revalidation before customer confirmation.

## New repository status

This repository was empty on discovery. Its first commits establish a structured codebase and audit records. The old Vercel project has not yet been switched to GitHub source, its production domain has not been moved, and no new production deployment is claimed.

The correct cutover sequence is: inspect repository/CI → link a separate Preview project with root directory src → add storage and admin environment variables without exposing secrets → test health/order/admin/search in Preview → decide on migration/alias cutover separately.
