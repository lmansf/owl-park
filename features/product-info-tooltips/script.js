const TICKET_FINE_PRINT =
  "Valid for one calendar day from date of purchase. Non-transferable. Rain-check policy applies for closures.";
const MEMBERSHIP_FINE_PRINT =
  "12-month term from purchase date. Includes 10% gift shop discount. Auto-renewal reminder sent 30 days prior.";

export async function activate() {
  const res = await fetch("data/products.json");
  const products = await res.json();
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));

  document.querySelectorAll(".product-card[data-product-id]").forEach((card) => {
    const product = byId[card.getAttribute("data-product-id")];
    if (!product) return;

    const finePrint = product.category === "membership" ? MEMBERSHIP_FINE_PRINT : TICKET_FINE_PRINT;

    const wrap = document.createElement("div");
    wrap.className = "pit-info-wrap";
    wrap.setAttribute("data-feature", "product-info-tooltips");
    wrap.innerHTML = `
      <button type="button" class="pit-info-icon" aria-label="Product details">i</button>
      <div class="pit-tooltip" role="tooltip">${finePrint}</div>
    `;
    card.style.position = card.style.position || "relative";
    card.appendChild(wrap);
  });
}

export function deactivate() {
  document.querySelectorAll('[data-feature="product-info-tooltips"]').forEach((el) => el.remove());
}
