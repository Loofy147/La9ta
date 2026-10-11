const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeItems, sourceUrlIsAllowed, canTransition, STATUS } = require("../src/lib/order-domain");

test("catalog item is resolved on the server and its reference subtotal is calculated", () => {
  const result = normalizeItems([{ id: 1, quantity: 2 }]);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].name, "HOCO H29 — حامل مغناطيسي للسيارة");
  assert.equal(result.items[0].referenceLineDzd, 1800);
  assert.equal(result.referenceSubtotalDzd, 1800);
  assert.equal(result.referenceSubtotalComplete, true);
  assert.equal(result.items[0].priceStatus, "needs_revalidation");
});

test("unknown catalog IDs are rejected", () => {
  assert.throws(() => normalizeItems([{ id: 9999, quantity: 1 }]), { statusCode: 422 });
});

test("empty and oversized item arrays are rejected", () => {
  assert.throws(() => normalizeItems([]), { statusCode: 422 });
  assert.throws(() => normalizeItems(Array.from({ length: 21 }, () => ({ id: 1, quantity: 1 }))), { statusCode: 422 });
});

test("invalid quantities are rejected", () => {
  for (const quantity of [0, -1, 1.5, 21, "x"]) {
    assert.throws(() => normalizeItems([{ id: 1, quantity }]), { statusCode: 422 });
  }
});

test("external offers preserve observed values but are excluded from authoritative subtotal", () => {
  const result = normalizeItems([
    { id: 1, quantity: 1 },
    { externalOffer: {
      title: "Robot Vacuum",
      sourceName: "Teno Store",
      sourceUrl: "https://www.teno-store.com/products/robot-vacuum",
      observedPriceDzd: 25000
    }, quantity: 2 }
  ]);
  assert.equal(result.items.length, 2);
  assert.equal(result.items[1].priceStatus, "needs_revalidation");
  assert.equal(result.items[1].observedPriceDzd, 25000);
  assert.equal(result.referenceSubtotalDzd, 900);
  assert.equal(result.referenceSubtotalComplete, false);
});

test("external source URLs must use HTTPS and an approved host family", () => {
  assert.equal(sourceUrlIsAllowed("https://www.ouedkniss.com.dz/item"), true);
  assert.equal(sourceUrlIsAllowed("https://shop.teno-store.com/item"), true);
  assert.equal(sourceUrlIsAllowed("http://www.teno-store.com/item"), false);
  assert.equal(sourceUrlIsAllowed("https://example.org/item"), false);
  assert.equal(sourceUrlIsAllowed("https://user:pass@www.teno-store.com/item"), false);
});

test("external offer fields are validated before storage", () => {
  assert.throws(() => normalizeItems([{
    externalOffer: { title: "x", sourceName: "Teno Store", sourceUrl: "https://example.org/p", observedPriceDzd: 10 },
    quantity: 1
  }]), { statusCode: 422 });
  assert.throws(() => normalizeItems([{
    externalOffer: { title: "valid title", sourceName: "Teno Store", sourceUrl: "https://www.teno-store.com/p", observedPriceDzd: -10 },
    quantity: 1
  }]), { statusCode: 422 });
});

test("order state transitions follow the permitted workflow", () => {
  assert.equal(canTransition("new", "confirmed"), true);
  assert.equal(canTransition("new", "rejected"), true);
  assert.equal(canTransition("confirmed", "sourced"), true);
  assert.equal(canTransition("shipped", "delivered"), true);
  assert.equal(canTransition("new", "delivered"), false);
  assert.equal(canTransition("delivered", "rejected"), false);
  assert.equal(canTransition("rejected", "confirmed"), false);
  assert.equal(canTransition("new", "new"), false);
  assert.equal(STATUS.includes("sourced"), true);
});

test("catalog is stable and IDs are unique", () => {
  const catalog = require("../src/catalog.json");
  const ids = catalog.map((item) => item.id);
  assert.equal(catalog.length, 8);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(catalog.every((item) => Number.isInteger(item.priceDzd) && item.priceDzd >= 0));
  assert.ok(catalog.every((item) => item.priceStatus === "needs_revalidation"));
});
