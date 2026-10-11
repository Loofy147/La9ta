const crypto = require("crypto");
const { put } = require("@vercel/blob");
const { normalizeItems } = require("../lib/order-domain");

function respond(res, status, body) {
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.setHeader("x-content-type-options", "nosniff");
  return res.status(status).end(JSON.stringify(body));
}

function normalizePhone(value) {
  return String(value || "").replace(/[\s().-]/g, "");
}

module.exports = async function orderHandler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
    return respond(res, 405, { error: "Method not allowed" });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return respond(res, 503, { error: "خدمة استقبال الطلبات غير مهيأة حاليًا" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    if (String(body.website || "").trim()) {
      return respond(res, 422, { error: "تعذر قبول الطلب" });
    }
    const name = String(body.name || "").trim();
    const phone = normalizePhone(body.phone);
    const wilaya = String(body.wilaya || "").trim();
    if (name.length < 2 || name.length > 100) {
      return respond(res, 422, { error: "الاسم مطلوب (من حرفين إلى 100 حرف)" });
    }
    if (!/^\+?[0-9]{9,15}$/.test(phone)) {
      return respond(res, 422, { error: "رقم الهاتف غير صالح" });
    }
    if (wilaya.length < 2 || wilaya.length > 60) {
      return respond(res, 422, { error: "الولاية مطلوبة" });
    }

    const normalized = normalizeItems(body.items);
    const orderNo = "DZ-" + crypto.randomBytes(4).toString("hex").toUpperCase();
    const createdAt = new Date().toISOString();
    const order = {
      schemaVersion: 1,
      orderNo,
      createdAt,
      updatedAt: createdAt,
      customer: { name, phone, wilaya },
      items: normalized.items,
      referenceSubtotalDzd: normalized.referenceSubtotalDzd,
      referenceSubtotalComplete: normalized.referenceSubtotalComplete,
      priceStatus: "needs_revalidation",
      status: "new",
      statusHistory: [{ status: "new", at: createdAt, note: "طلب توفير جديد" }]
    };

    await put("orders/" + orderNo + ".json", JSON.stringify(order), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: "application/json",
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    return respond(res, 201, {
      ok: true,
      orderNo,
      status: "new",
      priceStatus: "needs_revalidation",
      message: "وصل طلب التوفير. سنتحقق من المصدر والسعر والتوفر قبل أي تأكيد نهائي."
    });
  } catch (error) {
    const code = Number(error && error.statusCode);
    if (code === 422) return respond(res, 422, { error: error.message });
    console.error("order_intake_error", error && error.message ? error.message : "unknown");
    return respond(res, 500, { error: "تعذر حفظ الطلب. حاول مرة أخرى." });
  }
};
