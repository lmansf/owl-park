import { Cart } from "../../js/cart.js";

const REMINDER_DELAY_MS = 20000;
const AUTO_DISMISS_MS = 6000;

let reminderTimeoutId = null;
let dismissTimeoutId = null;
let toastEl = null;

function showToast() {
  if (toastEl) return;

  toastEl = document.createElement("div");
  toastEl.className = "cart-reminder-toast";
  toastEl.setAttribute("data-feature", "cart-reminder-toast");
  toastEl.innerHTML = `
    <span>🐾 Your cart is waiting — ready to checkout?</span>
    <button class="cart-reminder-toast-dismiss" type="button" aria-label="Dismiss">&times;</button>
  `;
  document.body.appendChild(toastEl);

  const remove = () => {
    if (toastEl) {
      toastEl.remove();
      toastEl = null;
    }
    if (dismissTimeoutId) {
      clearTimeout(dismissTimeoutId);
      dismissTimeoutId = null;
    }
  };

  toastEl
    .querySelector(".cart-reminder-toast-dismiss")
    .addEventListener("click", remove);
  dismissTimeoutId = setTimeout(remove, AUTO_DISMISS_MS);
}

export function activate() {
  reminderTimeoutId = setTimeout(() => {
    const cartOpen = document
      .getElementById("cart-drawer")
      ?.classList.contains("open");
    if (Cart.getLines().length > 0 && !cartOpen) {
      showToast();
    }
  }, REMINDER_DELAY_MS);
}

export function deactivate() {
  if (reminderTimeoutId) {
    clearTimeout(reminderTimeoutId);
    reminderTimeoutId = null;
  }
  if (dismissTimeoutId) {
    clearTimeout(dismissTimeoutId);
    dismissTimeoutId = null;
  }
  if (toastEl) {
    toastEl.remove();
    toastEl = null;
  }
}
