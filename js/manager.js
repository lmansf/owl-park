import {
  discoverFeatures,
  isEnabled,
  toggleFeature,
  applyEnabledFeatures,
} from "./feature-loader.js";
// Features activated on this page price cart lines through `window.OwlPark`, which js/products.js
// publishes as a side effect. Without this import the pricing API is missing here but present on the
// storefront, so a feature would work on one page and not the other.
import "./products.js";

let features = [];

// Estimated potential financial impact of each module, 5 (adds items / raises
// order value / captures otherwise-lost sales) down to 1 (comfort, delight, or
// post-purchase polish). This is a curation heuristic used ONLY to order the
// list below — not a measured figure — so adjust it freely. A module not listed
// here falls back to a per-category baseline.
const IMPACT = {
  // 5 — direct revenue: add-ons, upsells, donations, yield capture
  "visit-addons": 5,
  "smart-cart-savings": 5,
  "membership-upsell-modal": 5,
  "conservation-roundup": 5,
  "gift-mode": 5,
  "offpeak-date-nudge": 5,
  // 4 — strong conversion & cart-recovery levers
  "exit-intent-offer": 4,
  "promo-code-field": 4,
  "flash-sale-timer": 4,
  "sticky-mini-cart-bar": 4,
  "cart-reminder-toast": 4,
  "urgency-stock-indicator": 4,
  "membership-glow": 4,
  "loyalty-points-estimate": 4,
  // 3 — merchandising & decision nudges
  "product-badges": 3,
  "discount-badge-strikethrough": 3,
  "ticket-comparison-table": 3,
  "product-info-tooltips": 3,
  "recently-viewed": 3,
  "live-visitor-counter": 3,
  "wishlist-favorites": 3,
  // 2 — engagement, trust, planning (indirect)
  "seasonal-banner": 2,
  "event-countdown": 2,
  "weather-widget": 2,
  "add-to-calendar-button": 2,
  "share-your-visit": 2,
  "park-guide-tour": 2,
  "park-map-modal": 2,
  "animal-spotlight": 2,
  "species-fact-ticker": 2,
  "order-history-log": 2,
  // 1 — comfort, delight, post-purchase utility
  "dark-mode": 1,
  "accessibility-contrast": 1,
  "font-size-adjuster": 1,
  "keyboard-shortcuts-helper": 1,
  "ambient-park-sounds": 1,
  "paw-cursor-trail": 1,
  "confetti-checkout": 1,
  "printable-receipt": 1,
  "copy-order-id-button": 1,
};
const CATEGORY_BASELINE = { behavioral: 3, visual: 2, utility: 1 };
const IMPACT_LABEL = { 5: "Highest", 4: "High", 3: "Medium", 2: "Low", 1: "Minimal" };

function impactScore(feature) {
  if (Object.prototype.hasOwnProperty.call(IMPACT, feature.id)) {
    return IMPACT[feature.id];
  }
  return CATEGORY_BASELINE[feature.category] || 2;
}

function render() {
  const list = document.getElementById("feature-list");
  if (features.length === 0) {
    list.innerHTML = `<div class="manager-empty">No feature modules found under features/.</div>`;
    return;
  }

  list.innerHTML = features
    .map((f) => {
      const enabled = isEnabled(f);
      const score = impactScore(f);
      return `
      <div class="feature-row" data-feature-row="${f.id}">
        <div class="feature-row-info">
          <div class="feature-row-name">
            ${f.name}
            <span class="feature-impact impact-${score}" title="Estimated potential financial impact (Highest → Minimal)">💵 ${IMPACT_LABEL[score]}</span>
            ${f.requiresReload ? '<span class="feature-tag reload">reload required</span>' : ""}
          </div>
          <p class="feature-row-desc">${f.description}</p>
        </div>
        <span class="feature-status ${enabled ? "on" : "off"}">${enabled ? "ON" : "OFF"}</span>
        <label class="switch">
          <input type="checkbox" data-toggle="${f.id}" ${enabled ? "checked" : ""} />
          <span class="switch-slider"></span>
        </label>
      </div>
    `;
    })
    .join("");

  list.querySelectorAll("[data-toggle]").forEach((input) => {
    input.addEventListener("change", async () => {
      const id = input.getAttribute("data-toggle");
      const feature = features.find((f) => f.id === id);
      await toggleFeature(feature, input.checked);
      if (feature.requiresReload) {
        window.location.reload();
        return;
      }
      render();
    });
  });
}

async function setAll(enabled) {
  for (const f of features) {
    await toggleFeature(f, enabled);
  }
  render();
}

async function resetDefaults() {
  // Deactivate everything currently on, then reapply defaults from scratch.
  for (const f of features) {
    await toggleFeature(f, false);
  }
  localStorage.removeItem("owl-park-enabled-features");
  await applyEnabledFeatures();
  render();
}

async function init() {
  features = await discoverFeatures();
  // Order the manager by estimated financial impact (highest first); ties fall
  // back to alphabetical order so the list is stable.
  features.sort(
    (a, b) => impactScore(b) - impactScore(a) || a.name.localeCompare(b.name),
  );
  await applyEnabledFeatures();
  render();

  document
    .getElementById("enable-all-btn")
    .addEventListener("click", () => setAll(true));
  document
    .getElementById("disable-all-btn")
    .addEventListener("click", () => setAll(false));
  document
    .getElementById("reset-defaults-btn")
    .addEventListener("click", resetDefaults);
}

init();
