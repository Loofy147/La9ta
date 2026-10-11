const crypto = require("crypto");
const { list } = require("@vercel/blob");

function respond(res, status, body) {
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "private, no-store");
  res.setHeader("x-content-type-options", "nosniff");
  return res.status(status).end(JSON.stringify(body));
}
function authorized(req) {
  const provided = String(req.headers["x-admin-token"] || "");
  const expected = String(process.env.ADMIN_TOKEN || "");
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
async function readPrivateBlob(blob) {
  const response = await fetch(blob.url, {
    headers: { authorization: "Bearer " + process.env.BLOB_READ_WRITE_TOKEN },
    cache: "no-store"
  });
  if (!response.ok) return null;
  return response.json();
}

module.exports = async function adminOrdersHandler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("allow", "GET");
    return respond(res, 405, { error: "Method not allowed" });
  }
  if (!process.env.ADMIN_TOKEN || !process.env.BLOB_READ_WRITE_TOKEN) {
    return respond(res, 503, { error: "خدمة الإدارة غير مهيأة" });
  }
  if (!authorized(req)) return respond(res, 401, { error: "Unauthorized" });

  try {
    let cursor;
    const blobs = [];
    for (let page = 0; page < 10; page++) {
      const result = await list({ prefix: "orders/", limit: 100, cursor });
      blobs.push(...(result.blobs || []));
      if (!result.hasMore || !result.cursor) break;
      cursor = result.cursor;
    }
    const results = await Promise.all(blobs.map(async (blob) => {
      try { return await readPrivateBlob(blob); } catch { return null; }
    }));
    const orders = results.filter(Boolean).sort((a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    return respond(res, 200, { ok: true, orders });
  } catch (error) {
    console.error("admin_orders_error", error && error.message ? error.message : "unknown");
    return respond(res, 500, { error: "تعذر تحميل الطلبات" });
  }
};
