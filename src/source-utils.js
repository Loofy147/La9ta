(function (root, factory) {
  const utilities = factory();
  if (typeof module === "object" && module.exports) module.exports = utilities;
  if (root) root.La9taSourceUtils = utilities;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const OUEDKNISS_HOSTS = new Set([
    "ouedkniss.com",
    "www.ouedkniss.com",
    "ouedkniss.com.dz",
    "www.ouedkniss.com.dz"
  ]);

  // Normalise alternate URLs for the same Ouedkniss announcement, e.g.
  // /annonce/56373493 and a readable slug ending in -d56373493.
  function sourceIdentity(value) {
    try {
      const url = new URL(String(value || ""));
      if (url.protocol !== "https:" || url.username || url.password) return "";
      const host = url.hostname.toLowerCase().replace(/\.$/, "");
      if (OUEDKNISS_HOSTS.has(host)) {
        const match = url.pathname.match(/(\d{6,})\/?$/);
        if (match) return "ouedkniss:" + match[1];
      }
      if (host === "teno-store.com" || host === "www.teno-store.com") {
        return "teno:" + host + url.pathname.replace(/\/+$/, "");
      }
      return "";
    } catch {
      return "";
    }
  }

  return { sourceIdentity };
});
