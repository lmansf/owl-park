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

/** The whole-dollar discount a rate takes off a price. The one rounding, so no two shown numbers differ. */
export function discountOf(price, rate) {
  return Math.min(Math.round(price * rate), price);
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

/**
 * Feature modules cannot `import` (see README, "The `features/` plugin system"), so the pricing rules
 * above are also published on `window.OwlPark` — a feature that prices cart lines must go through
 * these rather than re-deriving its own, or its numbers will drift from the drawer and checkout.
 */
if (typeof window !== "undefined") {
  window.OwlPark = Object.assign(window.OwlPark || {}, {
    resolveLine,
    cartTotal,
    discountOf,
  });
}
