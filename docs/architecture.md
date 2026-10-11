# Architecture and data contracts

Date: 2026-10-11. This document describes the source-controlled implementation in this repository. It does not claim the old Vercel deployment is byte-for-byte identical.

## Product boundary

La9ta is a product discovery and request-to-source-confirmation service. A request is a request for follow-up, not a reservation, confirmed purchase, or price guarantee. In this baseline, there is no payment gateway and no courier API integration.

## Runtime layout

Vercel project root is intended to be src/.

- index.html, styles.css, app.js: public storefront and catalog request form.
- catalog.json: curated local offers displayed in the storefront.
- discover.html, discover.js: external search UI.
- api/health.js: minimal availability check for private Blob storage.
- api/order.js: validates customer and requested items, snapshots the source data, and writes a private order record.
- api/admin-orders.js: authenticated read path for internal order management.
- api/admin-update.js: authenticated status transition and history append.
- api/search.js: bounded adapter for Teno Store search results.
- admin.html, admin.js: internal operations UI. Route obscurity and noindex are not authorization; the APIs require ADMIN_TOKEN.
- sw.js: allowlisted public static caching only; APIs, administration and search routes are not cached.
- lib/order-domain.js: pure validation/state-transition rules for automated tests.

## Data flow

~~~text
Public storefront
  ├─ GET catalog.json
  ├─ GET /api/health (diagnostic only)
  └─ POST /api/order
       ├─ validate identity/phone/wilaya/honeypot
       ├─ validate catalog IDs or approved external offer URL
       ├─ calculate reference subtotal only for local catalog items
       └─ write private orders/DZ-XXXXXXXX.json to Vercel Blob

External discovery
  └─ GET /api/search?q=...
       └─ Teno Store API
            └─ normalized, capped result fields
                 └─ browser renders with textContent
                      └─ user adds source snapshot to request cart

Internal operations
  ├─ GET /api/admin-orders (ADMIN_TOKEN)
  └─ POST /api/admin-update (ADMIN_TOKEN)
       ├─ enforce the status transition matrix
       └─ append status history and overwrite the same private order path
~~~

## Product and source offer are different concepts

A catalog product has a stable local ID and curated display properties. A source offer is a claim that a third-party source currently lists a product. The source offer can become stale. External search results therefore cannot silently become confirmed catalog inventory.

For an external offer, the browser may submit a title, source name, URL, and observed price snapshot. The server validates the fields and source URL host family. The observed price is stored as unverified metadata; it is excluded from the reference subtotal. The server does not fetch the submitted URL, avoiding an SSRF path through order intake.

## Order data contract

- schemaVersion: integer for future migrations.
- orderNo: DZ- followed by eight uppercase hexadecimal characters.
- createdAt / updatedAt: ISO timestamps.
- customer: name, phone, wilaya.
- items: product snapshot, quantity, source, observed price, price status.
- referenceSubtotalDzd: reference amount for local-catalog items only.
- referenceSubtotalComplete: false if any external item is present.
- priceStatus: needs_revalidation until human/source verification is completed.
- status: new, confirmed, sourced, shipped, delivered, or rejected.
- statusHistory: append-only-by-application event history, each event has status, timestamp, and optional note.

The subtotal is a reference only, not an amount due or final quotation.

## Status state machine

- new → confirmed or rejected
- confirmed → sourced or rejected
- sourced → shipped or rejected
- shipped → delivered
- delivered and rejected are terminal in this initial model

Real operational policy may eventually need separate customer confirmation, courier assignment, cancellation reason, and delivery-failure states. Those are not silently folded into this initial model.

## Trust boundaries

1. The browser is untrusted: server validates every item, quantity and customer field.
2. External API response fields are untrusted: server limits query/result size and the UI uses textContent rather than injecting source HTML.
3. Blob order records are private. Responses must be no-store; Blob URLs and tokens must never reach the public UI.
4. Admin authorization is server-side and constant-time for equal-length token buffers.
5. Secrets belong in Vercel Environment Variables, never in the repository.
6. PWA cache is an explicit allowlist of public static paths. Do not add private or API routes to it.

## Known limitations

- Search provider is Teno Store only in this implementation.
- Source data and prices are not continuously synchronized.
- There is no payment, supplier checkout, shipping-label creation, or courier web hook integration.
- Blob stores JSON files rather than using relational constraints or transactions. If concurrent edits, reporting, or higher throughput become important, evaluate a database migration with an explicit data migration/rollback plan.
- Automated tests validate domain rules and selected privacy contracts; they do not prove end-to-end operation in Vercel until preview credentials and browser tests are configured.
