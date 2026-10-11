# Deployment runbook

## Separation principle

The historical project `dz-pick-store` remains the operational baseline. The repository `Loofy147/La9ta` is connected to a **separate** Vercel project `la9ta`; this does not reassign the old public domain.

## Current isolated project

- Repository: https://github.com/Loofy147/La9ta
- Project ID: `prj_cFiJcOwiK8R62DWNiZfJWCNsM7At`
- Root Directory: `src`
- Runtime: Node.js 24.x on Vercel; tests also passed independently under Node.js 22.
- Branch deployment: `dpl_fj29mcFVbeKy2e6LLKTR6eZX1Wf6`, target null.
- Preview URL: https://la9ta-kmp1ey9rp-djangos-projects-996fd933.vercel.app/
- Private test store: `la9ta-preview-orders`, `store_rAO0bQFXBAZFzJd9`, region `fra1`.

Some deployments on the `main` branch have target production **within the new La9ta project**. This is not the same as moving `dz-pick-store.vercel.app` to the new project.

## Environment variables

- `BLOB_READ_WRITE_TOKEN`: linked from the private Blob store.
- `ADMIN_TOKEN`: sensitive Vercel environment variable.

Never paste real token values into Git, docs, logs, test reports, or chat. Keep credentials separately managed, and keep Preview storage separate from historical production orders.

## Preview acceptance checklist

1. Capture commit SHA, deployment ID, target, and deployment URL.
2. GET `/` and `/catalog.json`.
3. GET `/api/health`; expect 200 and storage available when configured.
4. GET `/api/search?q=HOCO%20H29`; verify relevance and human-facing source URL, plus provider failure/timeout cases.
5. POST a valid synthetic request to `/api/order`; record the order ID. The current QA order `DZ-C3A8D87B` remains in Preview only.
6. Confirm invalid ID, zero quantity, and populated honeypot reject with 422; these checks passed.
7. Confirm anonymous admin listing returns 401; this passed.
8. With proper authorized handling of ADMIN_TOKEN, verify listing, legal update, invalid transition 409, reread and status history. This remains open.
9. Clean up synthetic records using a trusted private maintenance method; do not add a public delete endpoint to production.
10. Test cart deduplication and PWA cache/install behavior in a real browser/device.
11. Record outcomes in evidence register and change ledger.

## Cutover to the legacy public domain

Do not cut over automatically after a green CI or READY build. First:
- Capture the old alias-to-deployment mapping.
- Decide whether legacy orders are archived or migrated; preserve the old copy and document privacy/retention before any transfer.
- Complete Preview acceptance items, especially the full authenticated order lifecycle.
- Review data contracts and rollback plan.
- After an explicit cutover decision, move the alias and immediately smoke-test homepage, catalog, health, order intake, search, anonymous admin denial and authenticated listing.
- If a critical test fails, restore the saved old deployment alias and verify it.
- Update all evidence IDs and timestamps.

## Rollback

Rollback changes routing to the known-good old deployment; it does not require deleting data. Do not delete either Blob store without a separate backup/retention decision.

## Current status

La9ta is connected to its isolated Vercel project and partly runtime-verified. One synthetic QA record remains in its test store. The correct-token admin flow remains open. The old `dz-pick-store.vercel.app` alias and historical orders have not been changed or migrated.
