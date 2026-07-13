import { loadProducts, formatPrice, resolveLine, lineNotes } from "./products.js";
import { Cart, lineKey } from "./cart.js";
import { applyEnabledFeatures } from "./feature-loader.js";

let products = [];
let activeFilter = "all";

/**
 * Categories the storefront sells directly, derived from the filter tabs. A product in a category
 * with no tab (an `addon`) is deliberately unreachable from the catalog — it is attached from the
 * cart by the `visit-addons` feature instead.
 */
function tabCategories() {
  return Array.from(document.querySelectorAll(".tab-btn[data-filter]"))
    .map((btn) => btn.getAttribute("data-filter"))
    .filter((f) => f !== "all");
}

function renderCatalog() {
  const grid = document.getElementById("catalog-grid");
  const shown = tabCategories();
  const visible = products.filter((p) =>
    activeFilter === "all"
      ? shown.includes(p.category)
      : p.category === activeFilter,
  );
  grid.innerHTML = visible
    .map(
      (p) => `
    <article class="product-row" style="--accent: ${p.accent}" data-product-id="${p.id}">
      <div class="row-header">
        <div class="row-title-group">
          <div class="product-emoji">${p.emoji}</div>
          <div>
            <div class="row-title-line">
              <h3>${p.name}</h3>
              <span class="category-pill">${p.category}</span>
            </div>
            <p class="product-tagline">${p.tagline}</p>
          </div>
        </div>
        <div class="row-actions">
          <div>
            <span class="price-amount">${formatPrice(p.price)}</span>
            <span class="price-unit">${p.unit}</span>
          </div>
          <button class="add-to-cart-btn" data-add-id="${p.id}" type="button">Add to Cart</button>
        </div>
      </div>
      <div class="row-divider"></div>
      <div class="row-body">
        <p class="product-desc">${p.description}</p>
        <div class="product-plu">PLU ${p.plu}</div>
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

/**
 * Move a line's quantity by `delta` against the cart as it is NOW, not as it was when the drawer was
 * drawn: a cart mutated elsewhere (another tab, a feature panel) must not be overwritten by a count
 * this render captured before that change.
 */
function stepQty(key, delta) {
  const line = Cart.getLines().find((l) => lineKey(l) === key);
  if (!line) return;
  Cart.setQty(key, line.qty + delta);
}

/**
 * Build one cart-drawer line. Anything that can come from storage — a custom line's name, a metadata
 * caption — is set with `textContent`, never concatenated into markup.
 */
function buildCartLine(line, resolved) {
  const key = lineKey(line);
  const subtotal = resolved.price * line.qty;

  const el = document.createElement("div");
  el.className = "cart-line";
  el.setAttribute("data-line-id", key);

  const emoji = document.createElement("div");
  emoji.className = "cart-line-emoji";
  emoji.textContent = resolved.emoji;

  const info = document.createElement("div");
  info.className = "cart-line-info";

  const name = document.createElement("div");
  name.className = "cart-line-name";
  name.textContent = resolved.name;
  info.appendChild(name);

  const plu = document.createElement("div");
  plu.className = "cart-line-plu";
  plu.textContent =
    (resolved.plu ? `PLU ${resolved.plu} · ` : "") +
    `${formatPrice(resolved.price)} ${resolved.unit}`.trim();
  info.appendChild(plu);

  for (const note of lineNotes(line)) {
    const noteEl = document.createElement("div");
    noteEl.className = "cart-line-plu";
    noteEl.setAttribute("data-line-note", "");
    noteEl.textContent = note;
    info.appendChild(noteEl);
  }

  const controls = document.createElement("div");
  controls.className = "cart-line-controls";

  if (!resolved.fixed) {
    const down = document.createElement("button");
    down.className = "qty-btn";
    down.type = "button";
    down.setAttribute("aria-label", "Decrease quantity");
    down.setAttribute("data-qty-down", key);
    down.textContent = "-";
    down.addEventListener("click", () => stepQty(key, -1));

    const qty = document.createElement("span");
    qty.className = "qty-value";
    qty.textContent = String(line.qty);

    const up = document.createElement("button");
    up.className = "qty-btn";
    up.type = "button";
    up.setAttribute("aria-label", "Increase quantity");
    up.setAttribute("data-qty-up", key);
    up.textContent = "+";
    up.addEventListener("click", () => stepQty(key, 1));

    controls.append(down, qty, up);
  }

  const remove = document.createElement("button");
  remove.className = "remove-line-btn";
  remove.type = "button";
  remove.setAttribute("data-remove", key);
  remove.textContent = "Remove";
  remove.addEventListener("click", () => Cart.removeItem(key));
  controls.appendChild(remove);

  info.appendChild(controls);

  const subtotalEl = document.createElement("div");
  subtotalEl.className = "cart-line-subtotal";
  subtotalEl.textContent = formatPrice(subtotal);

  el.append(emoji, info, subtotalEl);
  return el;
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

  itemsEl.innerHTML = "";
  let total = 0;
  for (const line of lines) {
    const resolved = resolveLine(line, products);
    if (!resolved) continue;
    total += resolved.price * line.qty;
    itemsEl.appendChild(buildCartLine(line, resolved));
  }

  totalEl.textContent = formatPrice(total);
  checkoutBtn.disabled = false;
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

function buildSummaryLine(label, amount, notes, bold) {
  const row = document.createElement("div");
  row.className = "modal-summary-line";
  if (bold) {
    row.style.fontWeight = "700";
    row.style.borderTop = "1px solid #e4ddca";
    row.style.marginTop = "0.4rem";
    row.style.paddingTop = "0.4rem";
  }

  const left = document.createElement("span");
  left.textContent = label;
  for (const note of notes || []) {
    left.appendChild(document.createElement("br"));
    const small = document.createElement("small");
    small.textContent = note;
    left.appendChild(small);
  }

  const right = document.createElement("span");
  right.textContent = formatPrice(amount);

  row.append(left, right);
  return row;
}

function setupCheckout() {
  const modal = document.getElementById("checkout-modal");
  document.getElementById("checkout-btn").addEventListener("click", () => {
    const lines = Cart.getLines();
    if (lines.length === 0) return;

    const summaryEl = document.getElementById("order-summary");
    summaryEl.innerHTML = "";
    let total = 0;
    for (const line of lines) {
      const resolved = resolveLine(line, products);
      if (!resolved) continue;
      const subtotal = resolved.price * line.qty;
      total += subtotal;
      summaryEl.appendChild(
        buildSummaryLine(
          `${resolved.name} x${line.qty}`,
          subtotal,
          lineNotes(line),
          false,
        ),
      );
    }
    summaryEl.appendChild(buildSummaryLine("Total", total, [], true));

    const orderId = `OP-${Math.floor(100000 + Math.random() * 900000)}`;
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
