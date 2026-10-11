const { sourceUrlIsAllowed } = require("../lib/order-domain");

function respond(res, status, body) {
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.setHeader("x-content-type-options", "nosniff");
  return res.status(status).end(JSON.stringify(body));
}

function safeSourceUrl(value) {
  if (!value || !sourceUrlIsAllowed(value)) return "";
  try { return new URL(value).toString(); } catch { return ""; }
}

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
    (typeof product.category === "string" ? product.category : "");
  const haystack = new Set(normaliseText([
    product.title && (product.title.value || product.title),
    product.brand,
    category
  ].filter(Boolean).join(" ")).split(/\s+/u));
  const matches = queryTokens.filter((token) => haystack.has(token)).length;
  const required = queryTokens.length <= 3 ? queryTokens.length : Math.ceil(queryTokens.length * 0.7);
  return matches >= required;
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

module.exports = async function searchHandler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("allow", "GET");
    return respond(res, 405, { error: "Method not allowed" });
  }
  const query = String((req.query && req.query.q) || "").trim().slice(0, 80);
  if (normaliseText(query).length < 2) {
    return respond(res, 400, { error: "اكتب حرفين على الأقل للبحث" });
  }
  const queryTokens = [...new Set(normaliseText(query).split(/\s+/u).filter(Boolean))];

  try {
    const url = new URL("https://api.teno-store.com/v1/products");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "30");
    const upstream = await fetch(url.toString(), {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(7000)
    });
    if (!upstream.ok) {
      console.warn("teno_search_upstream_status", upstream.status);
      return respond(res, 502, { error: "مصدر البحث غير متاح حاليًا" });
    }
    const payload = await upstream.json();
    const sourceItems = Array.isArray(payload.data) ? payload.data : [];
    const items = sourceItems
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
        const attributeSource = attributes.sourceUrl && typeof attributes.sourceUrl.value === "string"
          ? attributes.sourceUrl.value : "";
        // Never fall back to viewUrl: it may be an API JSON endpoint, not a human listing.
        const sourceUrl = safeSourceUrl(attributeSource) || safeSourceUrl(product.snapshotUrl) || "";
        const title = String(rawTitle || "منتج بدون عنوان").trim().slice(0, 220);
        if (!title) return null;
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
      }).filter(Boolean);
    return respond(res, 200, { ok: true, query, source: "Teno Store", items });
  } catch (error) {
    const isTimeout = error && (error.name === "TimeoutError" || error.name === "AbortError");
    if (isTimeout) return respond(res, 504, { error: "انتهت مهلة البحث. حاول مجددًا." });
    console.warn("teno_search_error", error && error.name ? error.name : "unknown");
    return respond(res, 502, { error: "تعذر الاتصال بمصدر البحث حاليًا" });
  }
};
