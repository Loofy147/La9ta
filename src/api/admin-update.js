const crypto = require("crypto");
const { list, put } = require("@vercel/blob");
const { canTransition, STATUS } = require("../lib/order-domain");

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
async function findOrder(orderNo) {
  const result = await list({ prefix: "orders/" + orderNo + ".json", limit: 10 });
  const blob = (result.blobs || []).find((entry) => entry.pathname === "orders/" + orderNo + ".json");
  if (!blob) return null;
  const response = await fetch(blob.url, {
    headers: { authorization: "Bearer " + process.env.BLOB_READ_WRITE_TOKEN },
    cache: "no-store"
  });
  return response.ok ? { order: await response.json(), blob } : null;
}

module.exports = async function adminUpdateHandler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
    return respond(res, 405, { error: "Method not allowed" });
  }
  if (!process.env.ADMIN_TOKEN || !process.env.BLOB_READ_WRITE_TOKEN) {
    return respond(res, 503, { error: "خدمة الإدارة غير مهيأة" });
  }
  if (!authorized(req)) return respond(res, 401, { error: "Unauthorized" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const orderNo = String(body.orderNo || "").trim().toUpperCase();
    const nextStatus = String(body.status || "");
    if (!/^DZ-[A-F0-9]{8}$/.test(orderNo)) return respond(res, 422, { error: "رقم الطلب غير صالح" });
    if (!STATUS.includes(nextStatus)) return respond(res, 422, { error: "حالة غير صالحة" });

    const found = await findOrder(orderNo);
    if (!found) return respond(res, 404, { error: "الطلب غير موجود" });
    const current = found.order.status || "new";
    if (!canTransition(current, nextStatus)) {
      return respond(res, 409, { error: "الانتقال بين الحالتين غير مسموح", currentStatus: current });
    }

    const now = new Date().toISOString();
    found.order.status = nextStatus;
    found.order.updatedAt = now;
    found.order.statusHistory = Array.isArray(found.order.statusHistory) ? found.order.statusHistory : [];
    found.order.statusHistory.push({ status: nextStatus, at: now, note: String(body.note || "").trim().slice(0, 300) });

    await put("orders/" + orderNo + ".json", JSON.stringify(found.order), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    return respond(res, 200, { ok: true, orderNo, status: nextStatus, updatedAt: now });
  } catch (error) {
    console.error("admin_update_error", error && error.message ? error.message : "unknown");
    return respond(res, 500, { error: "تعذر تحديث الطلب" });
  }
};
