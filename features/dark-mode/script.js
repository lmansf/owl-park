let buttonEl = null;

function updateLabel() {
  if (!buttonEl) return;
  const active = document.body.classList.contains("dark-mode-active");
  buttonEl.textContent = active ? "☀️ Light Mode" : "🌙 Dark Mode";
}

export function activate() {
  const actions = document.querySelector(".header-actions");
  if (!actions) return;

  buttonEl = document.createElement("button");
  buttonEl.type = "button";
  buttonEl.className = "dark-mode-btn";
  buttonEl.setAttribute("data-feature", "dark-mode");
  actions.prepend(buttonEl);
  updateLabel();

  buttonEl.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode-active");
    updateLabel();
  });
}

export function deactivate() {
  document.body.classList.remove("dark-mode-active");
  if (buttonEl) {
    buttonEl.remove();
    buttonEl = null;
  }
}
