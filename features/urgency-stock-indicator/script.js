const TARGET_PRODUCT_IDS = ["prod-family-day-pass", "prod-twilight-ticket"];
const FEATURE_ID = "urgency-stock-indicator";

function randomCount() {
  return Math.floor(Math.random() * 7) + 3; // 3-9
}

function injectInto(card) {
  if (card.querySelector(`[data-feature="${FEATURE_ID}"]`)) return;
  const line = document.createElement("div");
  line.className = "urgency-stock-line";
  line.setAttribute("data-feature", FEATURE_ID);
  line.innerHTML = `<span class="urgency-icon">🔥</span><span>Only ${randomCount()} left for today's date!</span>`;
  const plu = card.querySelector(".product-plu");
  const footer = card.querySelector(".product-footer");
  if (plu && footer) {
    card.insertBefore(line, footer);
  } else {
    card.appendChild(line);
  }
}

function applyToCards() {
  TARGET_PRODUCT_IDS.forEach((id) => {
    const card = document.querySelector(
      `.product-card[data-product-id="${id}"]`,
    );
    if (card) injectInto(card);
  });
}

let observer = null;

export function activate() {
  applyToCards();
  // The catalog grid re-renders on tab switches, so watch for new cards
  // and re-apply the urgency line whenever a target card reappears.
  const grid = document.getElementById("catalog-grid");
  if (grid) {
    observer = new MutationObserver(() => applyToCards());
    observer.observe(grid, { childList: true });
  }
}

export function deactivate() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  document
    .querySelectorAll(`[data-feature="${FEATURE_ID}"]`)
    .forEach((el) => el.remove());
}
