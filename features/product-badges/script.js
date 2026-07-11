const BADGES = {
  "prod-ga-ticket": { label: "Popular", cls: "popular" },
  "prod-family-day-pass": { label: "Best Value", cls: "best-value" },
  "prod-household-membership": { label: "Members' Pick", cls: "members-pick" },
};

function applyToCards() {
  document
    .querySelectorAll(".product-card[data-product-id]")
    .forEach((card) => {
      if (card.querySelector('[data-feature="product-badges"]')) return;
      const badge = BADGES[card.getAttribute("data-product-id")];
      if (!badge) return;

      const ribbon = document.createElement("span");
      ribbon.className = `pb-ribbon ${badge.cls}`;
      ribbon.setAttribute("data-feature", "product-badges");
      ribbon.textContent = badge.label;
      card.style.position = card.style.position || "relative";
      card.appendChild(ribbon);
    });
}

let observer = null;

export async function activate() {
  applyToCards();
  const grid = document.getElementById("catalog-grid");
  if (grid) {
    observer = new MutationObserver(() => applyToCards());
    observer.observe(grid, { childList: true });
  }
}

export function deactivate() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  document
    .querySelectorAll('[data-feature="product-badges"]')
    .forEach((el) => el.remove());
}
