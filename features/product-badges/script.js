const BADGES = {
  "prod-ga-ticket": { label: "Popular", cls: "popular" },
  "prod-family-day-pass": { label: "Best Value", cls: "best-value" },
  "prod-household-membership": { label: "Members' Pick", cls: "members-pick" },
};

export async function activate() {
  document.querySelectorAll(".product-card[data-product-id]").forEach((card) => {
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

export function deactivate() {
  document.querySelectorAll('[data-feature="product-badges"]').forEach((el) => el.remove());
}
