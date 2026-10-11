# ADR-0001: Establish La9ta as the source-controlled application baseline

- Status: Accepted for repository structure; production cutover deferred
- Date: 2026-10-11

## Context

The old Vercel deployment contains a stable storefront and private order API. A separate newer deployment tree contains search/discovery files, but those routes returned 404 on the public alias after rollback. The deployment file-content connector truncated some long files, making it unsafe to reconstruct an exact commit from those responses. The repository Loofy147/La9ta was empty when inspected.

## Decision

Create a clean source-controlled baseline in Loofy147/La9ta. Keep the application under src and configure a Git-backed Vercel project with root directory src for Preview. Add tests and durable evidence/change logs. Do not modify the old production alias during this baseline creation.

## Alternatives considered

1. Blindly paste deployment file output back into Git. Rejected because fetched long source responses were visibly truncated.
2. Keep source only in deployment snapshots. Rejected because changes are harder to diff, test, and reproduce.
3. Connect the new repository directly to old production immediately. Deferred because environment variables, Blob data ownership, API behavior, and test status must be verified first.

## Consequences

Positive:
- Each change can be reviewed as a commit.
- Tests and docs can run in CI.
- Search, order intake, and admin behavior can be changed under version control.
- Historical facts are distinct from current implementation claims.

Costs and limitations:
- The new application baseline is not asserted to be byte-for-byte identical to the prior deployment.
- A Preview environment and storage/admin secrets must be configured.
- Any migration of customer order data requires a separate plan and validation.
- The old production alias and old storage remain the current operational baseline until cutover is explicitly completed.

## Revisit when

The Preview acceptance checklist passes, a verified order record can be created and updated, and the operational implications of storage/domain cutover are documented.
