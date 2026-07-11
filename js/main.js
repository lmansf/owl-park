import { loadProducts, formatPrice } from "./products.js";
import { Cart } from "./cart.js";
import { applyEnabledFeatures } from "./feature-loader.js";

let products = [];
let activeFilter = "all";

function productById(id) {
  return products.find((p) => p.id === id);
}

function renderCatalog() {
  const grid = document.getElementById("catalog-grid");
  const visible = products.filter(
    (p) => activeFilter === "all" || p.category === activeFilter,
  );
  grid.innerHTML = visible
    .map(
      (p) => `
    <article class="product-card" style="--accent: ${p.accent}" data-product-id="${p.id}">
      <span class="category-pill">${p.category}</span>
      <div class="card-top">
        <div class="product-emoji">${p.emoji}</div>
        <div>
          <h3>${p.name}</h3>
          <p class="product-tagline">${p.tagline}</p>
        </div>
      </div>
      <p class="product-desc">${p.description}</p>
      <div class="product-plu">PLU ${p.plu}</div>
      <div class="product-footer">
        <div class="product-price">
          <span class="price-amount">${formatPrice(p.price)}</span>
          <span class="price-unit">${p.unit}</span>
        </div>
        <button class="add-to-cart-btn" data-add-id="${p.id}" type="button">Add to Cart</button>
      </div>
    </article>
  `,
    )
    .join("");

  grid.querySelectorAll("[data-add-id]").forEach((btn) => {
    btn.addEventListener("click", () =>
      Cart.addItem(btn.getAttribute("data-add-id")),
    );
  });
}

function renderCart() {
  const lines = Cart.getLines();
  const itemsEl = document.getElementById("cart-items");
  const countEl = document.getElementById("cart-count");
  const totalEl = document.getElementById("cart-total");
  const checkoutBtn = document.getElementById("checkout-btn");

  countEl.textContent = String(Cart.totalItemCount());

  if (lines.length === 0) {
    itemsEl.innerHTML = `<div class="cart-empty">Your cart is empty. Add a ticket or membership to get started.</div>`;
    totalEl.textContent = formatPrice(0);
    checkoutBtn.disabled = true;
    return;
  }

  let total = 0;
  itemsEl.innerHTML = lines
    .map((line) => {
      const p = productById(line.id);
      if (!p) return "";
      const subtotal = p.price * line.qty;
      total += subtotal;
      return `
      <div class="cart-line" data-line-id="${p.id}">
        <div class="cart-line-emoji">${p.emoji}</div>
        <div class="cart-line-info">
          <div class="cart-line-name">${p.name}</div>
          <div class="cart-line-plu">PLU ${p.plu} · ${formatPrice(p.price)} ${p.unit}</div>
          <div class="cart-line-controls">
            <button class="qty-btn" data-qty-down="${p.id}" type="button" aria-label="Decrease quantity">-</button>
            <span class="qty-value">${line.qty}</span>
            <button class="qty-btn" data-qty-up="${p.id}" type="button" aria-label="Increase quantity">+</button>
            <button class="remove-line-btn" data-remove="${p.id}" type="button">Remove</button>
          </div>
        </div>
        <div class="cart-line-subtotal">${formatPrice(subtotal)}</div>
      </div>
    `;
    })
    .join("");

  totalEl.textContent = formatPrice(total);
  checkoutBtn.disabled = false;

  itemsEl.querySelectorAll("[data-qty-up]").forEach((btn) => {
    const id = btn.getAttribute("data-qty-up");
    btn.addEventListener("click", () => {
      const line = Cart.getLines().find((l) => l.id === id);
      Cart.setQty(id, (line ? line.qty : 0) + 1);
    });
  });
  itemsEl.querySelectorAll("[data-qty-down]").forEach((btn) => {
    const id = btn.getAttribute("data-qty-down");
    btn.addEventListener("click", () => {
      const line = Cart.getLines().find((l) => l.id === id);
      Cart.setQty(id, (line ? line.qty : 0) - 1);
    });
  });
  itemsEl.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () =>
      Cart.removeItem(btn.getAttribute("data-remove")),
    );
  });
}

function setupTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.getAttribute("data-filter");
      renderCatalog();
    });
  });
}

function setupCartDrawer() {
  const drawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("cart-overlay");
  const open = () => {
    drawer.classList.add("open");
    overlay.classList.add("open");
  };
  const close = () => {
    drawer.classList.remove("open");
    overlay.classList.remove("open");
  };
  document.getElementById("open-cart-btn").addEventListener("click", open);
  document.getElementById("close-cart-btn").addEventListener("click", close);
  overlay.addEventListener("click", close);
}

function setupCheckout() {
  const modal = document.getElementById("checkout-modal");
  document.getElementById("checkout-btn").addEventListener("click", () => {
    const lines = Cart.getLines();
    if (lines.length === 0) return;

    let total = 0;
    const summaryHtml = lines
      .map((line) => {
        const p = productById(line.id);
        if (!p) return "";
        const subtotal = p.price * line.qty;
        total += subtotal;
        return `<div class="modal-summary-line"><span>${p.name} x${line.qty}</span><span>${formatPrice(subtotal)}</span></div>`;
      })
      .join("");

    document.getElementById("order-summary").innerHTML =
      summaryHtml +
      `<div class="modal-summary-line" style="font-weight:700;border-top:1px solid #e4ddca;margin-top:0.4rem;padding-top:0.4rem;"><span>Total</span><span>${formatPrice(total)}</span></div>`;

    const orderId = `CC-${Math.floor(100000 + Math.random() * 900000)}`;
    document.getElementById("order-id").textContent =
      `Order ${orderId} · ${new Date().toLocaleDateString()}`;

    modal.classList.remove("hidden");
    Cart.clear();
    document.getElementById("cart-drawer").classList.remove("open");
    document.getElementById("cart-overlay").classList.remove("open");
  });

  document.getElementById("close-modal-btn").addEventListener("click", () => {
    modal.classList.add("hidden");
  });
}

async function init() {
  products = await loadProducts();
  renderCatalog();
  renderCart();
  setupTabs();
  setupCartDrawer();
  setupCheckout();
  Cart.onChange(renderCart);
  await applyEnabledFeatures();
}

init();
