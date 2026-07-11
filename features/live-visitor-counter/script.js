const FEATURE_ID = "live-visitor-counter";
const counts = new Map(); // productId -> current count

let intervalId = null;
let observer = null;

function randomStart() {
  return Math.floor(Math.random() * 13) + 3; // 3-15
}

function injectInto(card) {
  const productId = card.getAttribute("data-product-id");
  if (!productId || card.querySelector(`[data-feature="${FEATURE_ID}"]`)) return;

  if (!counts.has(productId)) counts.set(productId, randomStart());

  const line = document.createElement("div");
  line.className = "live-visitor-line";
  line.setAttribute("data-feature", FEATURE_ID);
  line.setAttribute("data-product-id", productId);
  line.innerHTML = `<span class="lv-icon">👀</span><span><span class="lv-count">${counts.get(productId)}</span> people viewing this now</span>`;

  const desc = card.querySelector(".product-desc");
  if (desc) {
    desc.insertAdjacentElement("afterend", line);
  } else {
    card.appendChild(line);
  }
}

function applyToCards() {
  document.querySelectorAll(".product-card[data-product-id]").forEach(injectInto);
}

function tick() {
  document.querySelectorAll(`.live-visitor-line[data-feature="${FEATURE_ID}"]`).forEach((line) => {
    const productId = line.getAttribute("data-product-id");
    let count = counts.get(productId) || randomStart();
    const delta = Math.random() < 0.5 ? -1 : 1;
    count = Math.max(1, count + delta);
    counts.set(productId, count);
    const countEl = line.querySelector(".lv-count");
    if (countEl) countEl.textContent = String(count);
  });
}

export function activate() {
  applyToCards();
  const grid = document.getElementById("catalog-grid");
  if (grid) {
    observer = new MutationObserver(() => applyToCards());
    observer.observe(grid, { childList: true });
  }
  intervalId = setInterval(tick, 3500);
}

export function deactivate() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  counts.clear();
  document.querySelectorAll(`[data-feature="${FEATURE_ID}"]`).forEach((el) => el.remove());
}
