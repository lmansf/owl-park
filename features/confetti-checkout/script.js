const COLORS = ["#e2662d", "#2f8f4e", "#0f6f7a", "#f0a02f", "#a8321f"];
const PIECE_COUNT = 60;

let observer = null;

function burst() {
  const modal = document.getElementById("checkout-modal");
  const rect = modal ? modal.getBoundingClientRect() : { left: window.innerWidth / 2, width: 0 };
  const centerX = rect.left + rect.width / 2;

  for (let i = 0; i < PIECE_COUNT; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.setAttribute("data-feature", "confetti-checkout");
    piece.style.left = `${centerX + (Math.random() - 0.5) * 400}px`;
    piece.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
    piece.style.animationDelay = `${Math.random() * 0.3}s`;
    piece.style.animationDuration = `${1.4 + Math.random() * 0.8}s`;
    document.body.appendChild(piece);
    piece.addEventListener("animationend", () => piece.remove());
    setTimeout(() => piece.remove(), 3000);
  }
}

export function activate() {
  const modal = document.getElementById("checkout-modal");
  if (!modal) return;

  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.attributeName === "class") {
        const isHidden = modal.classList.contains("hidden");
        if (!isHidden) burst();
      }
    }
  });
  observer.observe(modal, { attributes: true, attributeFilter: ["class"] });
}

export function deactivate() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  document.querySelectorAll('[data-feature="confetti-checkout"]').forEach((el) => el.remove());
}
