const catalog = require("../catalog.json");

const STATUS = Object.freeze(["new", "confirmed", "sourced", "shipped", "delivered", "rejected"]);
const TRANSITIONS = Object.freeze({
  new: ["confirmed", "rejected"],
  confirmed: ["sourced", "rejected"],
  sourced: ["shipped", "rejected"],
  shipped: ["delivered"],
  delivered: [],
  rejected: []
});
const catalogById = new Map(catalog.map((item) => [Number(item.id), item]));

function sourceUrlIsAllowed(value) {
  try {
    const u = new URL(String(value || ""));
    if (u.protocol !== "https:" || u.username || u.password) return false;
    const h = u.hostname.toLowerCase();
    return h === "teno-store.com" || h.endsWith(".teno-store.com") ||
      h === "ouedkniss.com.dz" || h.endsWith(".ouedkniss.com.dz");
  } catch {
    return false;
  }
}

function normalizeItems(input) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 20) {
    throw Object.assign(new Error("يجب اختيار منتج واحد على الأقل، وبحد أقصى 20 عنصرًا"), { statusCode: 422 });
  }
  const items = [];
  let referenceSubtotalDzd = 0;
  let hasExternal = false;

  for (const raw of input) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw Object.assign(new Error("عنصر طلب غير صالح"), { statusCode: 422 });
    }
    const quantity = Number(raw.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      throw Object.assign(new Error("الكمية يجب أن تكون عددًا صحيحًا بين 1 و20"), { statusCode: 422 });
    }

    if (raw.id !== undefined && raw.id !== null) {
      const id = Number(raw.id);
      const product = catalogById.get(id);
      if (!Number.isInteger(id) || !product) {
        throw Object.assign(new Error("معرّف منتج غير معروف"), { statusCode: 422 });
      }
      const lineReferenceDzd = product.priceDzd * quantity;
      referenceSubtotalDzd += lineReferenceDzd;
      items.push({
        kind: "catalog",
        productId: product.id,
        name: product.name,
        quantity,
        sourceName: product.sourceName,
        sourceUrl: product.sourceUrl,
        observedPriceDzd: product.priceDzd,
        referenceLineDzd: lineReferenceDzd,
        priceStatus: "needs_revalidation"
      });
      continue;
    }

    const offer = raw.externalOffer;
    if (!offer || typeof offer !== "object") {
      throw Object.assign(new Error("بيانات عرض خارجي غير صالحة"), { statusCode: 422 });
    }
    const title = String(offer.title || "").trim();
    const sourceName = String(offer.sourceName || "").trim();
    const sourceUrl = String(offer.sourceUrl || "").trim();
    const observed = offer.observedPriceDzd === null || offer.observedPriceDzd === undefined || offer.observedPriceDzd === ""
      ? null : Number(offer.observedPriceDzd);

    if (title.length < 2 || title.length > 220 ||
        !["Teno Store", "Ouedkniss"].includes(sourceName) ||
        !sourceUrlIsAllowed(sourceUrl) ||
        (observed !== null && (!Number.isFinite(observed) || observed < 0 || observed > 100000000))) {
      throw Object.assign(new Error("تعذر التحقق من بيانات العرض الخارجي"), { statusCode: 422 });
    }

    hasExternal = true;
    items.push({
      kind: "external",
      productId: null,
      name: title,
      quantity,
      sourceName,
      sourceUrl,
      observedPriceDzd: observed,
      referenceLineDzd: null,
      priceStatus: "needs_revalidation"
    });
  }

  return {
    items,
    referenceSubtotalDzd,
    referenceSubtotalComplete: !hasExternal
  };
}

function canTransition(current, next) {
  return STATUS.includes(current) && STATUS.includes(next) &&
    current !== next && TRANSITIONS[current].includes(next);
}

module.exports = { STATUS, TRANSITIONS, normalizeItems, sourceUrlIsAllowed, canTransition };
