let buttonEl = null;

function updateLabel() {
  if (!buttonEl) return;
  const active = document.body.classList.contains("high-contrast-active");
  buttonEl.textContent = active ? "◐ Standard Contrast" : "◐ High Contrast";
}

export function activate() {
  const actions = document.querySelector(".header-actions");
  if (!actions) return;

  buttonEl = document.createElement("button");
  buttonEl.type = "button";
  buttonEl.className = "a11y-contrast-btn";
  buttonEl.setAttribute("data-feature", "accessibility-contrast");
  actions.prepend(buttonEl);
  updateLabel();

  buttonEl.addEventListener("click", () => {
    document.body.classList.toggle("high-contrast-active");
    updateLabel();
  });
}

export function deactivate() {
  document.body.classList.remove("high-contrast-active");
  if (buttonEl) {
    buttonEl.remove();
    buttonEl = null;
  }
}
