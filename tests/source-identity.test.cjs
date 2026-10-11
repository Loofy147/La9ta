const test = require("node:test");
const assert = require("node:assert/strict");
const { sourceIdentity } = require("../src/source-utils");

test("alternate URLs for the same Ouedkniss announcement share an identity", () => {
  const legacy = sourceIdentity("https://www.ouedkniss.com.dz/store/12078/smart-tech-algerie/annonce/56373493");
  const current = sourceIdentity("https://www.ouedkniss.com/supports-support-smartphone-hoco-h29-d56373493");
  assert.equal(legacy, "ouedkniss:56373493");
  assert.equal(current, legacy);
});

test("different source announcement IDs remain distinct", () => {
  assert.notEqual(
    sourceIdentity("https://www.ouedkniss.com/item-hoco-h29-d56373493"),
    sourceIdentity("https://www.ouedkniss.com/item-hoco-h29-d56373494")
  );
});

test("Teno snapshots have canonical identities", () => {
  assert.equal(
    sourceIdentity("https://teno-store.com/s/shared-snapshot"),
    "teno:teno-store.com/s/shared-snapshot"
  );
});

test("API hosts and untrusted schemes do not become listing identities", () => {
  assert.equal(sourceIdentity("https://api.teno-store.com/v1/products/p-1"), "");
  assert.equal(sourceIdentity("https://example.org/item"), "");
  assert.equal(sourceIdentity("http://www.ouedkniss.com/item-d56373493"), "");
});
