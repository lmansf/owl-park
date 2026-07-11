import { Cart } from "../../js/cart.js";

let unsubscribe = null;
let modalEl = null;
let shownThisSession = false;
let products = [];

function removeModal() {
  if (modalEl) {
    modalEl.remove();
    modalEl = null;
  }
}

function showModal() {
  if (modalEl) return;
  shownThisSession = true;

  modalEl = document.createElement("div");
  modalEl.className = "membership-upsell-overlay";
  modalEl.setAttribute("data-feature", "membership-upsell-modal");
  modalEl.innerHTML = `
    <div class="membership-upsell-card">
      <div class="membership-upsell-icon">🦁</div>
      <h3>Visiting more than once this year?</h3>
      <p>A Family Membership pays for itself after just 2 visits — plus unlimited return trips
        all year long.</p>
      <button class="membership-upsell-dismiss" type="button">Maybe later</button>
    </div>
  `;
  document.body.appendChild(modalEl);
  modalEl.querySelector(".membership-upsell-dismiss").addEventListener("click", removeModal);
  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl) removeModal();
  });
}

async function checkCart() {
  if (shownThisSession) return;
  const lines = Cart.getLines();
  if (lines.length === 0) return;

  const ticketLines = lines.filter((line) => {
    const p = products.find((prod) => prod.id === line.id);
    return p && p.category === "ticket";
  });
  const allTickets = ticketLines.length === lines.length;
  const ticketQty = ticketLines.reduce((sum, l) => sum + l.qty, 0);

  if (allTickets && ticketQty >= 2) {
    showModal();
  }
}

export async function activate() {
  shownThisSession = false;
  const res = await fetch("data/products.json");
  products = await res.json();
  unsubscribe = Cart.onChange(checkCart);
  checkCart();
}

export function deactivate() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  removeModal();
}
