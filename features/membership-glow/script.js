const FEATURE_ID = "membership-glow";

let featuredProduct = null;
let observer = null;

function applyHighlight() {
  if (!featuredProduct) return;

  const card = document.querySelector(
    `.product-card[data-product-id="${featuredProduct.id}"]`,
  );
  if (!card) return;
  if (card.querySelector(`[data-feature="${FEATURE_ID}"]`)) return;

  // Note: intentionally NOT tagging the pre-existing card with data-feature —
  // the loader's belt-and-suspenders cleanup removes any [data-feature=id]
  // element wholesale, which would delete this card instead of just
  // un-highlighting it. Only elements we create ourselves get tagged.
  card.classList.add("membership-glow-highlight");

  const ribbon = document.createElement("span");
  ribbon.className = "membership-glow-ribbon";
  ribbon.setAttribute("data-feature", FEATURE_ID);
  ribbon.textContent = "Recommended";
  card.appendChild(ribbon);
}

export async function activate() {
  const res = await fetch("data/products.json");
  const products = await res.json();
  featuredProduct = products.find(
    (p) => p.category === "membership" && p.featured,
  );
  if (!featuredProduct) return;

  applyHighlight();

  const grid = document.getElementById("catalog-grid");
  if (grid) {
    observer = new MutationObserver(() => applyHighlight());
    observer.observe(grid, { childList: true });
  }
}

export function deactivate() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  document
    .querySelectorAll(".membership-glow-highlight")
    .forEach((card) => card.classList.remove("membership-glow-highlight"));
  document
    .querySelectorAll(`[data-feature="${FEATURE_ID}"]`)
    .forEach((el) => el.remove());
  featuredProduct = null;
}
