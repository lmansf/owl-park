const FEATURE_ID = "loyalty-points-estimate";

let observer = null;

function parseTotal(summaryEl) {
  const matches = summaryEl.textContent.match(/\$[\d,]+\.\d{2}/g);
  if (!matches || matches.length === 0) return 0;
  const last = matches[matches.length - 1].replace(/[$,]/g, "");
  return parseFloat(last) || 0;
}

function injectPointsLine() {
  const summaryEl = document.getElementById("order-summary");
  if (!summaryEl) return;

  // Avoid stacking a duplicate line if this fires more than once per checkout.
  const existing = summaryEl.querySelector(`[data-feature="${FEATURE_ID}"]`);
  if (existing) existing.remove();

  const total = parseTotal(summaryEl);
  if (total <= 0) return;

  const points = Math.round(total); // 1 point per $1 spent
  const line = document.createElement("div");
  line.className = "loyalty-points-line";
  line.setAttribute("data-feature", FEATURE_ID);
  line.innerHTML = `<span class="lp-icon">⭐</span><span>You'd earn approximately ${points} loyalty points on this order!</span>`;
  summaryEl.appendChild(line);
}

export function activate() {
  const modal = document.getElementById("checkout-modal");
  if (!modal) return;
  observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.attributeName === "class" && !modal.classList.contains("hidden")) {
        injectPointsLine();
      }
    }
  });
  observer.observe(modal, { attributes: true, attributeFilter: ["class"] });

  // Cover the case where the feature is toggled on while the modal is already open.
  if (!modal.classList.contains("hidden")) injectPointsLine();
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
