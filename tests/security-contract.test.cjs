const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("order storage uses private blobs and never accepts a client-computed authoritative total", () => {
  const source = read("src/api/order.js");
  assert.match(source, /access:\s*"private"/);
  assert.match(source, /normalizeItems\(body\.items\)/);
  assert.match(source, /referenceSubtotalDzd/);
  assert.doesNotMatch(source, /body\.totalDzd/);
});

test("admin endpoints require the server-side admin token", () => {
  for (const file of ["src/api/admin-orders.js", "src/api/admin-update.js"]) {
    const source = read(file);
    assert.match(source, /process\.env\.ADMIN_TOKEN/);
    assert.match(source, /timingSafeEqual/);
    assert.match(source, /401/);
    assert.match(source, /no-store/);
  }
});

test("service worker excludes API, admin, and discovery routes from cache", () => {
  const source = read("src/sw.js");
  assert.match(source, /pathname\.startsWith\("\/api\/"\)/);
  assert.match(source, /\/admin\.html/);
  assert.match(source, /\/discover\.html/);
  assert.doesNotMatch(source, /caches\.open\(CACHE\).*put\(request/);
});

test("search adapter bounds query, upstream calls, and result size", () => {
  const source = read("src/api/search.js");
  assert.match(source, /slice\(0, 80\)/);
  assert.match(source, /AbortSignal\.timeout\(5000\)/);
  assert.match(source, /AbortSignal\.timeout\(4000\)/);
  assert.match(source, /normalizeSearchResults/);
  assert.match(source, /fetchSourceDetails/);
  const domain = read("src/lib/search-domain.js");
  assert.match(domain, /slice\(0, 12\)/);
  assert.match(domain, /extractProductSourceUrl/);
  assert.doesNotMatch(domain, /product\.viewUrl/);
});

test("environment secrets are not committed into source configuration", () => {
  const packageSource = read("src/package.json");
  assert.doesNotMatch(packageSource, /BLOB_READ_WRITE_TOKEN|ADMIN_TOKEN/);
});
