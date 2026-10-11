# Test matrix and completion gates

## Automated local/CI checks

| Test | Protects | Current implementation |
|---|---|---|
| Catalog IDs are unique and price values numeric | Order/catalog consistency | Added |
| Valid catalog order normalized from server catalog | Client cannot choose authoritative catalog price | Added |
| Unknown IDs rejected | Catalog boundary | Added |
| Empty or excessive order items rejected | Resource and payload bounds | Added |
| Quantities must be integer 1-20 | Quantity validation | Added |
| External source URL is HTTPS and approved host family | Prevent malformed/untrusted source links | Added |
| External source values are stored as reference-only | Prevent client price becoming a bill | Added |
| State transition matrix | Prevent illegal order lifecycle jumps | Added |
| Admin functions reference server-side ADMIN_TOKEN and timing-safe comparison | Admin authorization contract | Added static checks |
| Service worker excludes API and internal routes | Avoid caching private responses | Added static checks |
| Search query/result/timeout bounds | Bound upstream dependency | Added static checks |
| JavaScript syntax checks | Catch parse errors | Added |

The tests are committed; their CI result must be queried. Do not mark these as passing merely because the files exist.

## Required integration tests not yet verified

- Vercel Preview build from this repository and root directory src.
- Blob private write and subsequent admin read.
- Admin 401 behavior with absent and wrong token.
- Legal/illegal state transitions against persisted records.
- Search provider success, no results, timeout, malformed payload, and source URL restrictions.
- Customer-visible workflow in a mobile browser, including external-search cart and order submit.
- Service worker install/update behavior on a real browser.
- No secret leakage in browser responses, logs, repository history, or generated artifacts.

## Definition of done for a feature

A feature reaches EXPERIMENTALLY_SUPPORTED only after the code is deployed to a controlled environment and the intended path and negative cases pass. It reaches production-ready only after compatibility, privacy/security effects, rollback, and post-deploy smoke checks are recorded. File presence is implementation evidence, not runtime success evidence.
