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
 * The single place a cart line's display fields and price are decided: the catalog product for
 * `line.id`, with anything in `line.custom` winning over it. A line with a `custom.price` (an
 * off-peak ticket) prices below catalog; a line with no catalog product at all (a donation) is
 * described entirely by `custom`. Returns null for a line that resolves to neither.
 */
export function resolveLine(line, products) {
  const product = products.find((p) => p.id === line.id) || null;
  const custom = line.custom || {};
  const price =
    typeof custom.price === "number" ? custom.price : product && product.price;
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
