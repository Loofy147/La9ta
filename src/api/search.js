const { normaliseText, normalizeSearchResults, extractProductSourceUrl, sourceNameFor } = require("../lib/search-domain");

function respond(res, status, body) {
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.setHeader("x-content-type-options", "nosniff");
  return res.status(status).end(JSON.stringify(body));
}

async function fetchSourceDetails(productId) {
  if (!productId) return "";
  try {
    const url = new URL("https://api.teno-store.com/v1/products/" + encodeURIComponent(productId));
    const response = await fetch(url.toString(), {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(4000)
    });
    if (!response.ok) return "";
    const raw = await response.json();
    const product = raw && raw.data && typeof raw.data === "object" ? raw.data : raw;
    return extractProductSourceUrl(product);
  } catch (error) {
    console.warn("teno_product_detail_unavailable", error && error.name ? error.name : "unknown");
    return "";
  }
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

  try {
    const url = new URL("https://api.teno-store.com/v1/products");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "30");
    const upstream = await fetch(url.toString(), {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000)
    });
    if (!upstream.ok) {
      console.warn("teno_search_upstream_status", upstream.status);
      return respond(res, 502, { error: "مصدر البحث غير متاح حاليًا" });
    }
    const payload = await upstream.json();
    // Detail lookups are capped to six products per query to bound load.
    const candidates = normalizeSearchResults(payload, query).slice(0, 6);
    await Promise.all(candidates.map(async (item) => {
      if (item.sourceUrl || !item.id) return;
      const listingUrl = await fetchSourceDetails(item.id);
      if (listingUrl) {
        item.sourceUrl = listingUrl;
        item.sourceName = sourceNameFor(listingUrl);
      }
    }));
    // Do not advertise a result as actionable when there is no validated
    // human-facing source link. In particular, never link to viewUrl/API JSON.
    const items = candidates.filter((item) => Boolean(item.sourceUrl));
    return respond(res, 200, { ok: true, query, source: "Teno Store", items });
  } catch (error) {
    const isTimeout = error && (error.name === "TimeoutError" || error.name === "AbortError");
    if (isTimeout) return respond(res, 504, { error: "انتهت مهلة البحث. حاول مجددًا." });
    console.warn("teno_search_error", error && error.name ? error.name : "unknown");
    return respond(res, 502, { error: "تعذر الاتصال بمصدر البحث حاليًا" });
  }
};
