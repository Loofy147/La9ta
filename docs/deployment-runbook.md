# Deployment runbook

## Principle

The old project and domain remain untouched until the new repository has a verified Preview deployment and the operator explicitly chooses a cutover. A green build alone is not acceptance.

## Intended Vercel configuration

- Repository: Loofy147/La9ta
- Root Directory: src
- Runtime: Node.js 22 or later; the historical project used Node 24.x.
- Static assets and Vercel Functions live together under src.
- Do not configure the public production alias during initial Preview validation.
- Never paste BLOB_READ_WRITE_TOKEN or ADMIN_TOKEN into Git commits, issues, or logs.

## Required environment variables

- BLOB_READ_WRITE_TOKEN — generated/linked by a Vercel Blob store with private access.
- ADMIN_TOKEN — a high-entropy secret set in Vercel Environment Variables for Preview and Production as appropriate.

Do not reuse or expose a secret by copying its decrypted value between projects. Prefer linking/provisioning storage through Vercel's store controls. If a separate Blob store is used for Preview, treat its data as test data and keep it separate from production orders.

## Preview acceptance checklist

1. Record repository commit SHA and deployment ID.
2. Check the deployment is READY and note whether its URL is a Preview or Production URL.
3. GET / — returns HTML with expected title and Arabic RTL layout.
4. GET /catalog.json — returns eight products with unique numeric IDs and historical/reference prices.
5. GET /api/health — with storage configured, returns 200 and storage=available; with no storage config, returns a controlled 503.
6. GET /api/search?q=HOCO%20H29 — returns normalized results or a controlled provider error; no raw stack traces.
7. POST /api/order with valid test data — creates a private order; note generated order number.
8. POST /api/order with unknown ID, zero quantity, invalid phone, or honeypot value — rejected.
9. GET /api/admin-orders without/with wrong ADMIN_TOKEN — 401; with correct token — only intended order records.
10. POST /api/admin-update attempts legal and illegal transitions — legal succeeds, illegal transition returns 409.
11. Check that admin APIs and orders are not cached or available without authorization.
12. Check browser console, phone layout, cart persistence, and update behavior for service worker.
13. Confirm old production URL and its alias still resolve to the previously verified deployment.

## Cutover

Only after the checklist passes:
- Capture old domain-to-deployment mapping and old Blob store information.
- Decide separately whether to migrate orders or retain the previous storage as an archive.
- Review privacy and data retention requirements before copying customer records.
- Set the target alias to the new deployment using a reversible step.
- Immediately verify homepage, health, order acceptance, search, admin 401 behavior, and order retrieval.
- If any critical test fails, reassign the alias to the recorded stable deployment and verify again.
- Update evidence-register.json, change-register.csv, and deployment evidence with before/after IDs.

## Rollback

Rollback means assigning the public alias back to the known-good deployment; it does not mean deleting data or overwriting the only copy of an order. Do not delete the old Blob store until a separate backup, retention, and migration decision is approved.

## Current status

No Git-to-Vercel project connection, Preview environment, environment-variable setup for the new project, Blob migration, or alias cutover is claimed by this document.
