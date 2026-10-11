const { sourceUrlIsAllowed } = require("./order-domain");

function normaliseText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function isRelevant(queryTokens, product) {
  if (!queryTokens.length) return false;
  const category = Array.isArray(product.category) ? product.category.join(" ") :
    (typeof product.category === "string" ? product.category :
      (Array.isArray(product.categoryIds) ? product.categoryIds.join(" ") : ""));
  const title = product.title && typeof product.title === "object" ? product.title.value : product.title;
  const haystack = new Set(normaliseText([title, product.brand, category].filter(Boolean).join(" ")).split(/\s+/u));
  const matches = queryTokens.filter((token) => haystack.has(token)).length;
  const required = queryTokens.length <= 3 ? queryTokens.length : Math.ceil(queryTokens.length * 0.7);
  return matches >= required;
}

function safeSourceUrl(value) {
  if (!value || !sourceUrlIsAllowed(value)) return "";
  try { return new URL(value).toString(); } catch { return ""; }
}

function sourceNameFor(url) {
  if (!url) return "مصدر غير محدد";
  const hostname = new URL(url).hostname.toLowerCase();
  if (hostname === "ouedkniss.com" || hostname === "www.ouedkniss.com" ||
      hostname === "ouedkniss.com.dz" || hostname === "www.ouedkniss.com.dz") {
    return "Ouedkniss";
  }
  return "Teno Store";
}

function normalizeSearchResults(payload, query) {
  const queryTokens = [...new Set(normaliseText(query).split(/\s+/u).filter(Boolean))];
  const sourceItems = payload && Array.isArray(payload.data) ? payload.data : [];
  return sourceItems
    .filter((product) => product && typeof product === "object" && isRelevant(queryTokens, product))
    .slice(0, 12)
    .map((product) => {
      const rawTitle = typeof product.title === "string" ? product.title :
        (product.title && typeof product.title.value === "string" ? product.title.value : "");
      const variants = Array.isArray(product.variants) ? product.variants : [];
      const rawPrice = product.priceFromMinor ?? product.priceMinor ??
        (variants[0] ? variants[0].priceMinor : null);
      const numericPrice = rawPrice === null || rawPrice === undefined ? null : Number(rawPrice) / 100;
      const attributes = product.attributes && typeof product.attributes === "object" ? product.attributes : {};
      const sourceUrlField = attributes.sourceUrl;
      const sourceValue = sourceUrlField && typeof sourceUrlField === "object"
        ? sourceUrlField.value : sourceUrlField;
      // Never fall back to viewUrl: it may be a raw API JSON endpoint.
      const sourceUrl = safeSourceUrl(sourceValue) || safeSourceUrl(product.snapshotUrl) || "";
      const title = String(rawTitle || "منتج بدون عنوان").trim().slice(0, 220);
      if (title.length < 2) return null;
      return {
        id: String(product.productId || "").slice(0, 120),
        title,
        priceDzd: Number.isFinite(numericPrice) && numericPrice >= 0 ? numericPrice : null,
        currency: String(product.currency || (variants[0] && variants[0].currency) || "DZD").slice(0, 12),
        inStock: product.inStock === true || variants.some((variant) => variant && variant.inStock === true),
        brand: String(typeof product.brand === "string" ? product.brand : "").slice(0, 80),
        sourceName: sourceNameFor(sourceUrl),
        sourceUrl
      };
    })
    .filter(Boolean);
}

module.exports = { normaliseText, isRelevant, safeSourceUrl, sourceNameFor, normalizeSearchResults };
