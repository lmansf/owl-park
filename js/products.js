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
