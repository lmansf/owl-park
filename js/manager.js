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

function render() {
  const list = document.getElementById("feature-list");
  if (features.length === 0) {
    list.innerHTML = `<div class="manager-empty">No feature modules found under features/.</div>`;
    return;
  }

  list.innerHTML = features
    .map((f) => {
      const enabled = isEnabled(f);
      return `
      <div class="feature-row" data-feature-row="${f.id}">
        <div class="feature-row-info">
          <div class="feature-row-name">
            ${f.name}
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
