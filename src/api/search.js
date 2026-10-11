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

module.exports = async function searchHandler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("allow", "GET");
    return respond(res, 405, { error: "Method not allowed" });
  }
  const query = String((req.query && req.query.q) || "").trim().slice(0, 80);
  if (query.length < 2) return respond(res, 400, { error: "اكتب حرفين على الأقل للبحث" });

  try {
    const url = new URL("https://api.teno-store.com/v1/products");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "12");
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
    const items = sourceItems.slice(0, 12).map((product) => {
      const rawTitle = typeof product.title === "string" ? product.title :
        (product.title && typeof product.title.value === "string" ? product.title.value : "");
      const rawPrice = product.priceFromMinor ?? product.priceMinor ??
        (Array.isArray(product.variants) && product.variants[0] ? product.variants[0].priceMinor : null);
      const numericPrice = rawPrice === null || rawPrice === undefined ? null : Number(rawPrice) / 100;
      const attributes = product.attributes && typeof product.attributes === "object" ? product.attributes : {};
      const sourceUrl = safeSourceUrl((attributes.sourceUrl && attributes.sourceUrl.value) || product.viewUrl || "");
      const title = String(rawTitle || "منتج بدون عنوان").trim().slice(0, 220);
      if (!title) return null;
      return {
        id: String(product.productId || "").slice(0, 120),
        title,
        priceDzd: Number.isFinite(numericPrice) && numericPrice >= 0 ? numericPrice : null,
        currency: String(product.currency || "DZD").slice(0, 12),
        inStock: product.inStock === true,
        brand: String(typeof product.brand === "string" ? product.brand : "").slice(0, 80),
        sourceName: sourceUrl && new URL(sourceUrl).hostname.endsWith("ouedkniss.com.dz") ? "Ouedkniss" : "Teno Store",
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
