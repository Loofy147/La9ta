(function () {
  "use strict";
  const TOKEN_KEY = "la9ta-admin-token-session";
  const login = document.getElementById("admin-login");
  const tokenInput = document.getElementById("admin-token");
  const message = document.getElementById("admin-message");
  const listHost = document.getElementById("admin-orders");
  const detailHost = document.getElementById("admin-detail");
  const labels = {
    new: "جديد", confirmed: "تم التأكيد المبدئي", sourced: "تم التحقق من المصدر",
    shipped: "تم الشحن", delivered: "تم التسليم", rejected: "مرفوض / متعذر"
  };
  const transitions = {
    new: ["confirmed", "rejected"], confirmed: ["sourced", "rejected"],
    sourced: ["shipped", "rejected"], shipped: ["delivered"], delivered: [], rejected: []
  };
  let orders = [];
  let selected = null;

  function node(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function token() { return tokenInput.value || sessionStorage.getItem(TOKEN_KEY) || ""; }
  async function api(url, options) {
    const response = await fetch(url, Object.assign({}, options || {}, {
      headers: Object.assign({ "x-admin-token": token(), "cache-control": "no-store" }, (options && options.headers) || {}),
      cache: "no-store"
    }));
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "فشل الطلب");
    return data;
  }
  function renderList() {
    listHost.replaceChildren();
    if (!orders.length) { listHost.append(node("p", "admin-muted", "لا توجد طلبات ظاهرة.")); return; }
    orders.forEach((order) => {
      const button = node("button", "admin-order-button");
      button.type = "button";
      button.append(node("strong", "", order.orderNo + " · " + (labels[order.status] || order.status)));
      button.append(node("span", "", (order.customer && order.customer.name || "بدون اسم") + " · " + new Date(order.createdAt).toLocaleString("ar-DZ")));
      button.addEventListener("click", () => renderDetail(order));
      listHost.append(button);
    });
  }
  function renderDetail(order) {
    selected = order;
    detailHost.replaceChildren();
    detailHost.append(node("h2", "", order.orderNo));
    detailHost.append(node("p", "", "العميل: " + (order.customer && order.customer.name || "—")));
    detailHost.append(node("p", "", "الهاتف: " + (order.customer && order.customer.phone || "—")));
    detailHost.append(node("p", "", "الولاية: " + (order.customer && order.customer.wilaya || "—")));
    detailHost.append(node("p", "", "الحالة: " + (labels[order.status] || order.status)));
    detailHost.append(node("p", "", "تنبيه السعر: يحتاج إعادة تحقق قبل تأكيد أي قيمة نهائية."));
    const itemList = node("ul", "");
    (order.items || []).forEach((item) => {
      const price = item.observedPriceDzd === null || item.observedPriceDzd === undefined ? "السعر غير ظاهر" :
        new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(item.observedPriceDzd) + " دج (مرجعي)";
      itemList.append(node("li", "", (item.name || "منتج") + " × " + item.quantity + " — " + price));
    });
    detailHost.append(itemList);
    const history = node("div", "");
    history.append(node("h3", "", "سجل الحالات"));
    (order.statusHistory || []).forEach((event) => {
      history.append(node("p", "admin-muted", (labels[event.status] || event.status) + " · " + new Date(event.at).toLocaleString("ar-DZ") + (event.note ? " · " + event.note : "")));
    });
    detailHost.append(history);

    const allowed = transitions[order.status] || [];
    if (allowed.length) {
      const controls = node("div", "admin-controls");
      const select = node("select", "");
      select.setAttribute("aria-label", "الحالة الجديدة");
      allowed.forEach((status) => {
        const option = node("option", "", labels[status] || status);
        option.value = status;
        select.append(option);
      });
      const note = node("input", "");
      note.placeholder = "ملاحظة داخلية اختيارية";
      note.maxLength = 300;
      const save = node("button", "", "حفظ الحالة");
      save.type = "button";
      save.addEventListener("click", async () => {
        save.disabled = true;
        try {
          await api("/api/admin-update", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ orderNo: order.orderNo, status: select.value, note: note.value })
          });
          message.textContent = "تم تحديث الحالة وتسجيل الحدث.";
          await loadOrders();
          const updated = orders.find((item) => item.orderNo === order.orderNo);
          if (updated) renderDetail(updated);
        } catch (error) {
          message.textContent = error.message;
          message.className = "admin-error";
        } finally { save.disabled = false; }
      });
      controls.append(select, note, save);
      detailHost.append(controls);
    } else {
      detailHost.append(node("p", "admin-muted", "هذه الحالة نهائية ولا تسمح بانتقال آخر."));
    }
  }
  async function loadOrders() {
    message.textContent = "جارٍ تحميل الطلبات…";
    message.className = "admin-muted";
    const data = await api("/api/admin-orders", { method: "GET" });
    orders = Array.isArray(data.orders) ? data.orders : [];
    renderList();
    message.textContent = "تم تحميل " + orders.length + " طلبًا.";
  }
  login.addEventListener("submit", async (event) => {
    event.preventDefault();
    sessionStorage.setItem(TOKEN_KEY, tokenInput.value);
    try { await loadOrders(); }
    catch (error) { message.textContent = error.message; message.className = "admin-error"; }
  });
  tokenInput.value = sessionStorage.getItem(TOKEN_KEY) || "";
  if (tokenInput.value) loadOrders().catch((error) => { message.textContent = error.message; message.className = "admin-error"; });
})();
