const MIN_PX = 14;
const MAX_PX = 22;
const STEP_PX = 2;
const DEFAULT_PX = 16;

let currentPx = DEFAULT_PX;
let previousInlineSize = "";

function apply() {
  document.documentElement.style.fontSize = `${currentPx}px`;
}

export function activate({ mount }) {
  if (!mount) return;
  previousInlineSize = document.documentElement.style.fontSize;
  currentPx = DEFAULT_PX;

  mount.querySelector("#fsa-increase").addEventListener("click", () => {
    currentPx = Math.min(MAX_PX, currentPx + STEP_PX);
    apply();
  });
  mount.querySelector("#fsa-decrease").addEventListener("click", () => {
    currentPx = Math.max(MIN_PX, currentPx - STEP_PX);
    apply();
  });
  mount.querySelector("#fsa-reset").addEventListener("click", () => {
    currentPx = DEFAULT_PX;
    apply();
  });
}

export function deactivate() {
  document.documentElement.style.fontSize = previousInlineSize;
}
