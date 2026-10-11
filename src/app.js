(function () {
  "use strict";
  const CART_KEY = "la9ta-cart-v1";
  const productsHost = document.getElementById("product-grid");
  const cartHost = document.getElementById("cart-items");
  const summaryHost = document.getElementById("cart-summary");
  const form = document.getElementById("order-form");
  const submit = document.getElementById("submit-order");
  const message = document.getElementById("form-message");
  const count = document.getElementById("cart-count");
  const countLabel = document.getElementById("cart-count-label");
  let catalog = [];

  function money(value) {
    return new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(value) + " دج";
  }
  function node(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function readCart() {
    try {
      const value = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(value) ? value.filter((item) => item && Number.isInteger(Number(item.quantity)) && Number(item.quantity) >= 1 && Number(item.quantity) <= 20) : [];
    } catch { return []; }
  }
  function saveCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    renderCart(items);
  }
  function cartKey(item) {
    return item && item.externalOffer ? "e:" + item.externalOffer.sourceUrl : "c:" + String(item.id);
  }
  function addCatalog(id) {
    const cart = readCart();
    const existing = cart.find((item) => cartKey(item) === "c:" + String(id));
    if (existing) existing.quantity = Math.min(20, Number(existing.quantity) + 1);
    else cart.push({ id: Number(id), quantity: 1 });
    saveCart(cart);
    message.textContent = "أُضيف المنتج إلى طلب التوفير.";
    message.className = "form-message";
  }
  function renderProducts() {
    productsHost.replaceChildren();
    catalog.forEach((product, index) => {
      const card = node("article", "product-card");
      const art = node("div", "product-top");
      art.setAttribute("aria-hidden", "true");
      art.append(node("span", "product-symbol", ["ل", "✳", "✦", "↗"][index % 4]));
      card.append(art);
      card.append(node("p", "product-category", product.category));
      card.append(node("h3", "", product.name));
      card.append(node("p", "price-label", "سعر مرجعي — يحتاج تأكيد"));
      card.append(node("p", "product-price", money(product.priceDzd)));
      const source = node("a", "source-link", "عرض المصدر: " + product.sourceName);
      source.href = product.sourceUrl;
      source.target = "_blank";
      source.rel = "noopener noreferrer";
      card.append(source);
      const button = node("button", "add-button", "أضف لطلب التوفير +");
      button.type = "button";
      button.addEventListener("click", () => {
        addCatalog(product.id);
        button.textContent = "أُضيف ✓";
        button.classList.add("added");
      });
      card.append(button);
      productsHost.append(card);
    });
  }
  function renderCart(cart) {
    cartHost.replaceChildren();
    const totalCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    count.textContent = String(totalCount);
    countLabel.textContent = totalCount + " عناصر";
    submit.disabled = cart.length === 0;
    if (!cart.length) {
      cartHost.append(node("p", "empty-cart", "ما زلت ما اخترتش أي منتج."));
      summaryHost.hidden = true;
      return;
    }
    let catalogSubtotal = 0;
    let hasExternal = false;
    cart.forEach((item) => {
      const product = item.externalOffer ? item.externalOffer : catalog.find((entry) => Number(entry.id) === Number(item.id));
      if (!product) return;
      const external = Boolean(item.externalOffer);
      hasExternal = hasExternal || external;
      if (!external) catalogSubtotal += Number(product.priceDzd) * Number(item.quantity);
      const row = node("div", "cart-row");
      const desc = node("div", "");
      desc.append(node("div", "cart-name", product.name || product.title));
      desc.append(node("div", "cart-detail", external ? "عرض خارجي · سعر غير مؤكد" : "سعر مرجعي: " + money(product.priceDzd) + " · يحتاج تحقق"));
      const controls = node("div", "cart-controls");
      const minus = node("button", "qty-button", "−");
      minus.type = "button"; minus.setAttribute("aria-label", "تقليل الكمية");
      minus.addEventListener("click", () => {
        const next = readCart();
        const found = next.find((entry) => cartKey(entry) === cartKey(item));
        if (!found) return;
        found.quantity = Number(found.quantity) - 1;
        saveCart(next.filter((entry) => Number(entry.quantity) > 0));
      });
      const qty = node("span", "qty-number", String(item.quantity));
      const plus = node("button", "qty-button", "+");
      plus.type = "button"; plus.setAttribute("aria-label", "زيادة الكمية");
      plus.addEventListener("click", () => {
        const next = readCart();
        const found = next.find((entry) => cartKey(entry) === cartKey(item));
        if (found) found.quantity = Math.min(20, Number(found.quantity) + 1);
        saveCart(next);
      });
      const remove = node("button", "remove-button", "حذف");
      remove.type = "button";
      remove.addEventListener("click", () => saveCart(readCart().filter((entry) => cartKey(entry) !== cartKey(item))));
      controls.append(minus, qty, plus, remove);
      row.append(desc, controls);
      cartHost.append(row);
    });
    summaryHost.hidden = false;
    summaryHost.replaceChildren();
    summaryHost.append(node("span", "", "المجموع المرجعي للكتالوج: " + money(catalogSubtotal)));
    summaryHost.append(node("small", "", hasExternal ? "لا يشمل العروض الخارجية؛ ولا يُعد فاتورة أو سعرًا نهائيًا." : "السعر والتوفر يحتاجان إعادة تحقق قبل التأكيد."));
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    const items = readCart();
    if (!items.length) return;
    message.textContent = "جارٍ إرسال الطلب…";
    message.className = "form-message";
    submit.disabled = true;
    const payload = {
      name: document.getElementById("customer-name").value.trim(),
      phone: document.getElementById("customer-phone").value.trim(),
      wilaya: document.getElementById("customer-wilaya").value.trim(),
      website: document.getElementById("customer-website").value,
      items
    };
    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store"
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "تعذر إرسال الطلب");
      localStorage.removeItem(CART_KEY);
      renderCart([]);
      form.reset();
      message.textContent = "تم استلام الطلب " + result.orderNo + ". سنتحقق من المصدر والسعر والتوفر قبل التأكيد النهائي.";
      message.className = "form-message";
    } catch (error) {
      message.textContent = error.message || "تعذر الاتصال. احتفظ بمحتويات طلبك وحاول مجددًا.";
      message.className = "form-message error";
      submit.disabled = readCart().length === 0;
    }
  });

  fetch("/catalog.json", { cache: "no-store" })
    .then((response) => { if (!response.ok) throw new Error("تعذر تحميل الكتالوج"); return response.json(); })
    .then((data) => { catalog = Array.isArray(data) ? data : []; renderProducts(); renderCart(readCart()); })
    .catch(() => {
      productsHost.replaceChildren(node("p", "loading", "تعذر تحميل المنتجات الآن. أعد تحميل الصفحة."));
      renderCart(readCart());
    });
})();
