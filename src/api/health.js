const { list } = require("@vercel/blob");

module.exports = async function healthHandler(req, res) {
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.setHeader("x-content-type-options", "nosniff");
  if (req.method !== "GET") {
    res.setHeader("allow", "GET");
    return res.status(405).end(JSON.stringify({ error: "Method not allowed" }));
  }
  try {
    await list({ limit: 1 });
    return res.status(200).end(JSON.stringify({ ok: true, storage: "available" }));
  } catch (error) {
    console.error("health_error", error && error.message ? error.message : "unknown");
    return res.status(503).end(JSON.stringify({ ok: false, storage: "unavailable" }));
  }
};
