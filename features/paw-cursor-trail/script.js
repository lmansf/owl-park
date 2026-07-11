const THROTTLE_MS = 120;
let lastSpawn = 0;
let handler = null;

function spawnPaw(x, y) {
  const paw = document.createElement("span");
  paw.className = "paw-print";
  paw.setAttribute("data-feature", "paw-cursor-trail");
  paw.textContent = "🐾";
  paw.style.left = `${x}px`;
  paw.style.top = `${y}px`;
  document.body.appendChild(paw);
  paw.addEventListener("animationend", () => paw.remove());
  setTimeout(() => paw.remove(), 1500);
}

export function activate() {
  handler = (event) => {
    const now = Date.now();
    if (now - lastSpawn < THROTTLE_MS) return;
    lastSpawn = now;
    spawnPaw(event.clientX, event.clientY);
  };
  document.addEventListener("mousemove", handler);
}

export function deactivate() {
  if (handler) {
    document.removeEventListener("mousemove", handler);
    handler = null;
  }
  document
    .querySelectorAll('[data-feature="paw-cursor-trail"]')
    .forEach((el) => el.remove());
}
