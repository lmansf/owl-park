const CART_STORAGE_KEY = "critter-cove-cart";

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

const listeners = new Set();

function notify() {
  const lines = readCart();
  listeners.forEach((fn) => fn(lines));
}

export const Cart = {
  /** @returns {{id: string, qty: number}[]} */
  getLines() {
    return readCart();
  },

  addItem(productId) {
    const lines = readCart();
    const existing = lines.find((l) => l.id === productId);
    if (existing) {
      existing.qty += 1;
    } else {
      lines.push({ id: productId, qty: 1 });
    }
    writeCart(lines);
    notify();
  },

  removeItem(productId) {
    const lines = readCart().filter((l) => l.id !== productId);
    writeCart(lines);
    notify();
  },

  setQty(productId, qty) {
    const lines = readCart();
    const line = lines.find((l) => l.id === productId);
    if (!line) return;
    if (qty <= 0) {
      writeCart(lines.filter((l) => l.id !== productId));
    } else {
      line.qty = qty;
      writeCart(lines);
    }
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
