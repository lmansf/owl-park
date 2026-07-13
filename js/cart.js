const CART_STORAGE_KEY = "owl-park-cart";

/**
 * A cart line is `{ id, qty }` plus three optional fields:
 *   - `key`    a unique line key. Absent means the line is "plain" and its key IS its product id, so
 *              a cart stored before these fields existed keeps working untouched. Two lines of the
 *              same product with different metadata (two gift memberships, one ticket on two dates)
 *              get distinct keys and never merge.
 *   - `meta`   a namespaced map, one entry per feature (`{ gift: {...}, visit: {...} }`). Each entry
 *              may carry a `note` string, which the storefront renders as a caption on the line.
 *   - `custom` self-describing overrides: `price` (a discounted catalog line, or the whole price of a
 *              non-catalog line such as a donation), plus `name`/`emoji`/`unit`/`plu`/`kind`/`fixed`.
 *              `resolveLine()` in js/products.js is the single place these win over the catalog.
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

function writeCart(lines) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
}

/** The key a line is addressed by. A plain line is addressed by its product id, as before. */
export function lineKey(line) {
  return line.key || line.id;
}

let keyCounter = 0;

const listeners = new Set();

function notify() {
  const lines = readCart();
  listeners.forEach((fn) => fn(lines));
}

// Features can't `import` this module (the single-file plugin contract forbids imports), so a feature
// that mutates the cart writes localStorage directly and dispatches this event to make the page
// re-render from the new lines.
window.addEventListener("owl-park-cart-changed", notify);

export const Cart = {
  /** @returns {{id: string, qty: number, key?: string, meta?: object, custom?: object}[]} */
  getLines() {
    return readCart();
  },

  /**
   * Add a product to the cart. With no options this merges into the plain line for that product,
   * exactly as before. With `meta` and/or `custom` it always creates a new, separately addressable
   * keyed line.
   */
  addItem(productId, options) {
    const lines = readCart();
    if (!options || (!options.meta && !options.custom)) {
      const existing = lines.find((l) => lineKey(l) === productId);
      if (existing) {
        existing.qty += 1;
      } else {
        lines.push({ id: productId, qty: 1 });
      }
    } else {
      keyCounter += 1;
      const line = {
        id: productId,
        qty: options.qty || 1,
        key: `${productId}#${Date.now().toString(36)}${keyCounter}`,
      };
      if (options.meta) line.meta = options.meta;
      if (options.custom) line.custom = options.custom;
      lines.push(line);
    }
    writeCart(lines);
    notify();
  },

  removeItem(key) {
    const lines = readCart().filter((l) => lineKey(l) !== key);
    writeCart(lines);
    notify();
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
    notify();
  },

  /** Attach — or, with a null payload, drop — one namespaced metadata entry on a line. */
  setLineMeta(key, namespace, payload) {
    const lines = readCart();
    const line = lines.find((l) => lineKey(l) === key);
    if (!line) return;
    line.meta = line.meta || {};
    if (payload == null) {
      delete line.meta[namespace];
    } else {
      line.meta[namespace] = payload;
    }
    writeCart(lines);
    notify();
  },

  clear() {
    writeCart([]);
    notify();
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
