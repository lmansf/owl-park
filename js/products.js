let cachedProducts = null;

export async function loadProducts() {
  if (cachedProducts) return cachedProducts;
  const res = await fetch("data/products.json");
  if (!res.ok) throw new Error(`Failed to load products.json: ${res.status}`);
  cachedProducts = await res.json();
  return cachedProducts;
}

export function formatPrice(amount) {
  return `$${amount.toFixed(2)}`;
}

/**
 * A line's price, in the one order that keeps every shown number honest: a `custom.discountRate` is
 * re-applied to the *live* catalog price (so an off-peak ticket sitting in a persisted cart re-prices
 * itself when the catalog does), a `custom.price` is an absolute for a line with no catalog product
 * at all (a donation), and everything else is simply the catalog price.
 */
function priceOf(product, custom) {
  if (product && typeof custom.discountRate === "number") {
    return Math.max(0, product.price - discountOf(product.price, custom.discountRate));
  }
  if (typeof custom.price === "number") return custom.price;
  return product && product.price;
}

/**
 * The whole-dollar discount a rate takes off a price. The one rounding, so no two shown numbers
 * differ. A rate is read back from a persisted, user-writable line, so it is clamped to [0, 1] here:
 * a discount basis can only ever price a line below catalog, never above it.
 */
export function discountOf(price, rate) {
  const share = Math.min(Math.max(Number(rate) || 0, 0), 1);
  return Math.min(Math.round(price * share), price);
}

/**
 * The single place a cart line's display fields and price are decided: the catalog product for
 * `line.id`, with anything in `line.custom` winning over it. A line with a `custom.discountRate` (an
 * off-peak ticket) prices below catalog; a line with no catalog product at all (a donation) is
 * described entirely by `custom`. Returns null for a line that resolves to neither.
 */
export function resolveLine(line, products) {
  const product = products.find((p) => p.id === line.id) || null;
  const custom = line.custom || {};
  const price = priceOf(product, custom);
  const name = custom.name || (product && product.name);
  if (typeof price !== "number" || !name) return null;

  return {
    product,
    name,
    price,
    emoji: custom.emoji || (product && product.emoji) || "•",
    plu: custom.plu || (product && product.plu) || "",
    unit: custom.unit || (product && product.unit) || "",
    fixed: !!custom.fixed,
  };
}

/** The metadata captions a line carries. Plain strings — rendered as text, never as markup. */
export function lineNotes(line) {
  if (!line.meta) return [];
  return Object.values(line.meta)
    .map((entry) => entry && entry.note)
    .filter((note) => typeof note === "string" && note.length > 0);
}

/** What a set of cart lines costs. Lines that resolve to no price at all are worth nothing. */
export function cartTotal(lines, products) {
  return lines.reduce((sum, line) => {
    const resolved = resolveLine(line, products);
    return resolved ? sum + resolved.price * line.qty : sum;
  }, 0);
}

/** A charitable gift is given, not bought, so it is not one of the items a shopper is carrying. */
export function isPurchasedItem(line) {
  return !(line.custom && line.custom.kind === "donation");
}

/** How many items a set of cart lines holds — the one place "how many items" is decided. */
export function itemCount(lines) {
  return lines.reduce(
    (sum, line) => (isPurchasedItem(line) ? sum + line.qty : sum),
    0,
  );
}

/**
 * A cart carrying a gift and nothing else. It holds no items, but it does hold money, so "0 items"
 * beside a real total would be a small untruth — a caller shows the gift for what it is instead.
 */
export function isGiftOnly(lines) {
  return lines.length > 0 && !lines.some(isPurchasedItem);
}

/**
 * The lines a cart really holds. A round-up gift was an offer to bring one purchase to a whole $5, so
 * it dies with that purchase: once nothing is left to round, there is no order to carry it and a
 * shopper who emptied their cart must not still be charged for it. A tier gift promised nothing about
 * a total — it is a deliberate standalone donation and stands alone. Dropping is not recomputing: a
 * pinned amount is still never quietly changed. This is a cart rule, not a plug-in's, so it lives here
 * and holds no matter which features are switched on.
 */
export function withoutOrphanedGifts(lines) {
  if (lines.some(isPurchasedItem)) return lines;
  const kept = lines.filter(
    (line) => !(line.custom && line.custom.source === "roundup"),
  );
  return kept.length === lines.length ? lines : kept;
}

/**
 * Feature modules cannot `import` (see README, "The `features/` plugin system"), so the pricing rules
 * above are also published on `window.OwlPark` — a feature that prices cart lines must go through
 * these rather than re-deriving its own, or its numbers will drift from the drawer and checkout.
 */
if (typeof window !== "undefined") {
  window.OwlPark = Object.assign(window.OwlPark || {}, {
    resolveLine,
    cartTotal,
    itemCount,
    isGiftOnly,
    discountOf,
  });
}
