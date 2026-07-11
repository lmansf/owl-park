const STORAGE_KEY = "critter-cove-recently-viewed";
const MAX_ITEMS = 5;

let productsCache = null;
let mouseEnterHandler = null;

function readViewed() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function recordView(productId) {
  let ids = readViewed();
  ids = ids.filter((id) => id !== productId);
  ids.unshift(productId);
  ids = ids.slice(0, MAX_ITEMS);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  renderStrip();
}

async function getProducts() {
  if (productsCache) return productsCache;
  const res = await fetch("data/products.json");
  productsCache = await res.json();
  return productsCache;
}

async function renderStrip() {
  const strip = document.getElementById("recently-viewed-strip");
  const chipsEl = document.getElementById("rv-chips");
  if (!strip || !chipsEl) return;

  const ids = readViewed();
  if (ids.length === 0) {
    strip.hidden = true;
    return;
  }

  const products = await getProducts();
  chipsEl.innerHTML = ids
    .map((id) => {
      const p = products.find((prod) => prod.id === id);
      if (!p) return "";
      return `<span class="rv-chip"><span class="rv-chip-emoji">${p.emoji}</span>${p.name}</span>`;
    })
    .join("");
  strip.hidden = false;
}

export async function activate() {
  await renderStrip();
  // mouseenter doesn't bubble, but a capturing listener on document still
  // observes it as the event travels down to the actual target.
  mouseEnterHandler = (event) => {
    const card = event.target.closest && event.target.closest(".product-card[data-product-id]");
    if (card) recordView(card.getAttribute("data-product-id"));
  };
  document.addEventListener("mouseenter", mouseEnterHandler, true);
}

export function deactivate() {
  if (mouseEnterHandler) {
    document.removeEventListener("mouseenter", mouseEnterHandler, true);
    mouseEnterHandler = null;
  }
}
