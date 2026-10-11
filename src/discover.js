(function () {
  "use strict";
  const CART_KEY = "la9ta-cart-v1";
  const form = document.getElementById("search-form");
  const queryInput = document.getElementById("search-query");
  const message = document.getElementById("search-message");
  const results = document.getElementById("search-results");

  function node(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function money(value) {
    return new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(value) + " دج";
  }
  let catalogOffers = [];
  const catalogReady = fetch("/catalog.json", { cache: "no-store" })
    .then((response) => response.ok ? response.json() : [])
    .then((data) => { catalogOffers = Array.isArray(data) ? data : []; })
    .catch(() => { catalogOffers = []; });

  function cartKey(entry) {
    if (entry && entry.externalOffer) {
      const identity = window.La9taSourceUtils && window.La9taSourceUtils.sourceIdentity(entry.externalOffer.sourceUrl);
      return identity ? "source:" + identity : "external:" + String(entry.externalOffer.sourceUrl || "");
    }
    const product = catalogOffers.find((candidate) => Number(candidate.id) === Number(entry && entry.id));
    const identity = product && window.La9taSourceUtils && window.La9taSourceUtils.sourceIdentity(product.sourceUrl);
    return identity ? "source:" + identity : "catalog:" + String(entry && entry.id);
  }

  function dedupeCart(items) {
    const merged = [];
    const byKey = new Map();
    for (const entry of items) {
      const key = cartKey(entry);
      const existing = byKey.get(key);
      if (existing) {
        existing.quantity = Math.min(20, Number(existing.quantity || 1) + Number(entry.quantity || 1));
      } else {
        byKey.set(key, entry);
        merged.push(entry);
      }
    }
    return merged;
  }

  async function addOffer(item) {
    if (!item.sourceUrl || !["Teno Store", "Ouedkniss"].includes(item.sourceName)) {
      message.textContent = "لا يوجد رابط مصدر صالح لإضافة هذا العرض.";
      message.className = "form-message error";
      return;
    }
    await catalogReady;
    let cart = [];
    try {
      const old = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      cart = dedupeCart(Array.isArray(old) ? old : []);
    } catch { cart = []; }
    const offer = {
      externalOffer: {
        title: String(item.title || "").slice(0, 220),
        sourceName: item.sourceName,
        sourceUrl: item.sourceUrl,
        observedPriceDzd: item.priceDzd === null ? null : item.priceDzd
      },
      quantity: 1
    };
    const key = cartKey(offer);
    const current = cart.find((entry) => cartKey(entry) === key);
    if (current) current.quantity = Math.min(20, Number(current.quantity || 1) + 1);
    else cart.push(offer);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    message.textContent = current
      ? "الإعلان موجود بالفعل في الطلب؛ زدت الكمية بدل تكراره."
      : "أُضيف العرض إلى طلب التوفير. انتقل لإكمال بياناتك.";
    message.className = "form-message";
    window.setTimeout(() => { window.location.href = "/#request"; }, 450);
  }
  function render(items) {
    results.replaceChildren();
    if (!items.length) {
      results.append(node("p", "loading", "لم تظهر نتائج. جرب كلمة بحث أخرى."));
      return;
    }
    items.forEach((item) => {
      const card = node("article", "search-card");
      card.append(node("span", "source", item.sourceName || "مصدر خارجي"));
      card.append(node("h2", "", item.title));
      card.append(node("div", "price", item.priceDzd === null ? "السعر غير ظاهر" : money(item.priceDzd)));
      card.append(node("p", "note", item.inStock ? "المصدر يذكر أن المنتج متوفر؛ يلزم تأكيد مستقل." : "التوفر غير مؤكد محليًا."));
      const source = node("a", "source-link", item.sourceUrl ? "فتح العرض الأصلي ↗" : "رابط المصدر غير متاح");
      if (item.sourceUrl) { source.href = item.sourceUrl; source.target = "_blank"; source.rel = "noopener noreferrer"; }
      else source.setAttribute("aria-disabled", "true");
      card.append(source);
      const add = node("button", "add-button", "أضف لطلب التوفير +");
      add.type = "button";
      add.disabled = !item.sourceUrl;
      add.addEventListener("click", () => addOffer(item));
      card.append(add);
      results.append(card);
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const query = queryInput.value.trim();
    if (query.length < 2) return;
    results.replaceChildren();
    message.textContent = "جارٍ البحث في المصدر الخارجي…";
    message.className = "form-message";
    const button = form.querySelector("button");
    button.disabled = true;
    try {
      const response = await fetch("/api/search?q=" + encodeURIComponent(query), { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "تعذر البحث");
      render(Array.isArray(body.items) ? body.items : []);
      message.textContent = "نتائج من " + (body.source || "مصدر خارجي") + ". البيانات والأسعار تحتاج تأكيدًا قبل أي التزام.";
    } catch (error) {
      message.textContent = error.message || "مصدر البحث غير متاح مؤقتًا.";
      message.className = "form-message error";
    } finally {
      button.disabled = false;
    }
  });
})();
