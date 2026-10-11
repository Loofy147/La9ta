# Deployment runbook

## Separation principle

The historical project `dz-pick-store` remains operational baseline until a separate cutover decision. The new repository `Loofy147/La9ta` is connected to a separate Vercel project named `la9ta`; this does not reassign the old production domain.

## Current isolated project

- Repository: https://github.com/Loofy147/La9ta
- Root Directory: `src`
- Project ID: `prj_cFiJcOwiK8R62DWNiZfJWCNsM7At`
- Runtime: Node.js 24.x on Vercel; domain tests were also run independently under Node.js 22.
- Branch preview tested: `dpl_5VD6iPBa5YXAQaKMPYbcNuk7Reob` / https://la9ta-kztfdt4at-djangos-projects-996fd933.vercel.app/
- The branch deployment has `target:null`; it is not the old production alias.
- Private test Blob store: `la9ta-preview-orders`, `store_rAO0bQFXBAZFzJd9`, region `fra1`.

## Environment variables

- `BLOB_READ_WRITE_TOKEN`: linked from the private Blob store for this isolated project.
- `ADMIN_TOKEN`: high-entropy secret stored as a Vercel environment variable.

Never paste the actual secret values into Git, issues, docs, logs, or a chat transcript. Do not copy a decrypted production token across projects. Use separately managed credentials and separate stores for Preview vs legacy production data.

## Preview acceptance checklist

1. Record source commit SHA, tree SHA, Vercel deployment ID and target.
2. GET `/` — expected Arabic RTL storefront and responsive layout.
3. GET `/catalog.json` — eight entries, unique IDs and explicit reference-price state.
4. GET `/api/health` — 200 when storage is configured; controlled 503 when required env is absent.
5. GET `/api/search?q=HOCO%20H29` — relevant results, approved human-facing source link, no raw API URL; test provider error, no results and timeout.
6. POST `/api/order` with synthetic test data only — record order number; verify the Blob path is private.
7. Verify invalid ID, zero/decimal quantity, bad phone, empty items and honeypot are rejected.
8. GET `/api/admin-orders` without/wrong token — 401; correct token returns only intended order records.
9. POST `/api/admin-update` — legal transition succeeds, illegal transition returns 409; reread order and verify statusHistory.
10. Test catalog/search duplicate listing in cart; no duplicate lines.
11. Test PWA install/update/cache behavior in a browser; confirm APIs and administration are not cached.
12. Record all output and any residual failures in `docs/evidence-register.json`.

## Cutover to the legacy public domain

Do not perform this automatically after a green CI or a READY build. First:
- Capture the old alias-to-deployment mapping and existing store configuration.
- Decide whether legacy orders are archived or migrated; validate retention/privacy and preserve the old copy before any transformation.
- Complete all Preview acceptance items, including order write/read/update and the correct-token admin flow.
- Review data contracts and migration/rollback plan.
- Only after explicit cutover decision, move the alias with the previous deployment ID recorded as rollback target.
- Immediately smoke-test homepage, catalog, health, order intake, search, anonymous admin denial and authenticated listing.
- If a critical acceptance test fails, revert alias to the recorded old deployment and verify the old site again.
- Update evidence, change log, deployment IDs and time of cutover.

## Rollback

Rollback changes routing back to the previous known-good deployment. It does not require deleting data and must not overwrite the only copy of an order. Do not delete either Blob store without a separate backup and retention decision.

## Current state

The isolated project is connected and partly runtime-verified. Full order persistence lifecycle and positive admin flow remain open. The old `dz-pick-store.vercel.app` alias and old order records remain untouched; no production cutover has occurred.
