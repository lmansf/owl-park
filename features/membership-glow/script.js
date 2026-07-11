let highlightedCard = null;
let ribbonEl = null;

export async function activate() {
  const res = await fetch("data/products.json");
  const products = await res.json();
  const featured = products.find((p) => p.category === "membership" && p.featured);
  if (!featured) return;

  const card = document.querySelector(`.product-card[data-product-id="${featured.id}"]`);
  if (!card) return;

  // Note: intentionally NOT tagging the pre-existing card with data-feature —
  // the loader's belt-and-suspenders cleanup removes any [data-feature=id]
  // element wholesale, which would delete this card instead of just
  // un-highlighting it. Only elements we create ourselves get tagged.
  card.classList.add("membership-glow-highlight");

  ribbonEl = document.createElement("span");
  ribbonEl.className = "membership-glow-ribbon";
  ribbonEl.setAttribute("data-feature", "membership-glow");
  ribbonEl.textContent = "Recommended";
  card.appendChild(ribbonEl);

  highlightedCard = card;
}

export function deactivate() {
  if (highlightedCard) {
    highlightedCard.classList.remove("membership-glow-highlight");
    highlightedCard = null;
  }
  if (ribbonEl) {
    ribbonEl.remove();
    ribbonEl = null;
  }
}
