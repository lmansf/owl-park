const CART_STORAGE_KEY = "owl-park-cart";

/**
 * A cart line is `{ id, qty }` plus three optional fields:
 *   - `key`    a unique line key. Absent means the line is "plain" and its key IS its product id, so
 *              a cart stored before these fields existed keeps working untouched. Two lines of the
 *              same product with different metadata (two gift memberships, one ticket on two dates)
 *              get distinct keys and never merge.
 *   - `meta`   a namespaced map, one entry per feature (`{ gift: {...}, visit: {...} }`). Each entry
 *              may carry a `note` string, which the storefront renders as a caption on the line.
 *   - `custom` self-describing overrides: `discountRate` (a share off the live catalog price, e.g. an
 *              off-peak ticket) or `price` (the whole price of a non-catalog line such as a donation),
 *              plus `name`/`emoji`/`unit`/`plu`/`kind`/`fixed`. `resolveLine()` in js/products.js is
 *              the single place these win over the catalog.
 */

function readCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn("Cart storage was corrupt, resetting.", err);
    return [];
  }
}

let dispatching = false;
let restated = false;

/** How many times one write may be re-announced before we stop and assume two listeners are feuding. */
const MAX_RESTATEMENTS = 5;

/**
 * Persist the lines and announce them on the same channel a feature uses, so a core mutation (Add to
 * Cart, the drawer's +/-/Remove, `clear`) reaches feature panels at once rather than up to one poll
 * interval later — a panel acting on a cart it has not seen yet acts on the wrong one.
 *
 * The event dispatches synchronously, so a listener that writes the cart back re-enters here while
 * earlier listeners have already run against the older lines. That nested write is stored and then
 * re-announced once the dispatch in flight unwinds, rather than dropped — otherwise the drawer, whose
 * listener runs first, would keep rendering lines a later listener has already replaced. Two listeners
 * writing at each other would recur forever, so the restatements are capped.
 */
function writeCart(lines) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  if (dispatching) {
    restated = true;
    return;
  }
  dispatching = true;
  try {
    for (let round = 0; round <= MAX_RESTATEMENTS; round++) {
      restated = false;
      window.dispatchEvent(new CustomEvent("owl-park-cart-changed"));
      if (!restated) return;
    }
    console.warn("Cart changes kept re-announcing; stopping to avoid a loop.");
  } finally {
    dispatching = false;
    restated = false;
  }
}

/** The key a line is addressed by. A plain line is addressed by its product id, as before. */
export function lineKey(line) {
  return line.key || line.id;
}

const listeners = new Set();

function notify() {
  const lines = readCart();
  listeners.forEach((fn) => fn(lines));
}

// Features can't `import` this module (the single-file plugin contract forbids imports), so a feature
// that mutates the cart writes localStorage directly and dispatches this event to make the page
// re-render from the new lines. `writeCart()` raises it too, so every cart change — core's or a
// feature's — travels the one channel and this is the single place a change is announced.
window.addEventListener("owl-park-cart-changed", notify);

export const Cart = {
  /** @returns {{id: string, qty: number, key?: string, meta?: object, custom?: object}[]} */
  getLines() {
    return readCart();
  },

  /** Add a product to the cart, merging into the plain line for that product. */
  addItem(productId) {
    const lines = readCart();
    const existing = lines.find((l) => lineKey(l) === productId);
    if (existing) {
      existing.qty += 1;
    } else {
      lines.push({ id: productId, qty: 1 });
    }
    writeCart(lines);
  },

  removeItem(key) {
    writeCart(readCart().filter((l) => lineKey(l) !== key));
  },

  setQty(key, qty) {
    const lines = readCart();
    const line = lines.find((l) => lineKey(l) === key);
    if (!line) return;
    if (qty <= 0) {
      writeCart(lines.filter((l) => lineKey(l) !== key));
    } else {
      line.qty = qty;
      writeCart(lines);
    }
  },

  clear() {
    writeCart([]);
  },

  totalItemCount() {
    return readCart().reduce((sum, l) => sum + l.qty, 0);
  },

  /** Subscribe to cart changes. Returns an unsubscribe function. */
  onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
