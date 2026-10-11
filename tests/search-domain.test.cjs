const test = require("node:test");
const assert = require("node:assert/strict");
const { normaliseText, isRelevant, normalizeSearchResults } = require("../src/lib/search-domain");

test("query normalization handles accents and punctuation", () => {
  assert.equal(normaliseText("HOCO — H29!"), "hoco h29");
  assert.deepEqual(normaliseText("Café, ÉCOLE").split(" "), ["cafe", "ecole"]);
});

test("short multi-token queries require all tokens to match", () => {
  assert.equal(isRelevant(["hoco", "h29"], {
    title: { value: "Support Smartphone HOCO H29" }
  }), true);
  assert.equal(isRelevant(["hoco", "h29"], {
    title: { value: "Promo Jordanie, séjour du 29 octobre" }
  }), false);
  assert.equal(isRelevant(["hoco", "h29"], {
    title: { value: "Bluetooth earhook HOCO EQ29" }
  }), false);
});

test("normalizes Teno search results to the human-facing source listing", () => {
  const [item] = normalizeSearchResults({
    data: [{
      productId: "p-1",
      title: { value: "Support Smartphone Auto HOCO H29" },
      priceMinor: "90000",
      currency: "DZD",
      inStock: true,
      attributes: {
        sourceUrl: {
          value: "https://www.ouedkniss.com/supports-support-smartphone-hoco-h29-d123"
        }
      },
      viewUrl: "https://api.teno-store.com/v1/products/p-1"
    }]
  }, "HOCO H29");
  assert.equal(item.title, "Support Smartphone Auto HOCO H29");
  assert.equal(item.priceDzd, 900);
  assert.equal(item.sourceUrl, "https://www.ouedkniss.com/supports-support-smartphone-hoco-h29-d123");
  assert.equal(item.sourceName, "Ouedkniss");
  assert.equal(item.inStock, true);
});

test("does not expose raw API URLs as listing links", () => {
  const [item] = normalizeSearchResults({
    data: [{
      productId: "p-2",
      title: { value: "Support Smartphone Auto HOCO H29" },
      priceMinor: "90000",
      viewUrl: "https://api.teno-store.com/v1/products/p-2"
    }]
  }, "HOCO H29");
  assert.equal(item.sourceUrl, "");
  assert.equal(item.sourceName, "مصدر غير محدد");
});

test("uses a valid Teno snapshot URL only when original listing URL is absent", () => {
  const [item] = normalizeSearchResults({
    data: [{
      productId: "p-3",
      title: { value: "Support Smartphone Auto HOCO H29" },
      priceMinor: "90000",
      snapshotUrl: "https://teno-store.com/s/shareable-snapshot"
    }]
  }, "HOCO H29");
  assert.equal(item.sourceUrl, "https://teno-store.com/s/shareable-snapshot");
  assert.equal(item.sourceName, "Teno Store");
});

test("filters irrelevant results and caps the normalized result count at twelve", () => {
  const data = Array.from({ length: 25 }, (_, index) => ({
    productId: "p-" + index,
    title: { value: "Support Smartphone HOCO H29 type " + index },
    priceMinor: "90000",
    attributes: { sourceUrl: { value: "https://www.ouedkniss.com/ads/" + index } },
    viewUrl: "https://api.teno-store.com/v1/products/p-" + index
  }));
  data.push({
    productId: "unrelated",
    title: { value: "Séjour en Jordanie pour le 29 octobre" },
    priceMinor: "27699000",
    viewUrl: "https://api.teno-store.com/v1/products/unrelated"
  });
  const results = normalizeSearchResults({ data }, "HOCO H29");
  assert.equal(results.length, 12);
  assert.ok(results.every((item) => item.title.includes("HOCO H29")));
});

test("malformed upstream payload safely becomes an empty result set", () => {
  assert.deepEqual(normalizeSearchResults({ data: "invalid" }, "HOCO H29"), []);
  assert.deepEqual(normalizeSearchResults(null, "HOCO H29"), []);
});
