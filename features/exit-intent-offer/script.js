const FEATURE_ID = "exit-intent-offer";

let leaveHandler = null;
let shownThisSession = false;

function showOffer() {
  if (
    shownThisSession ||
    document.querySelector(`[data-feature="${FEATURE_ID}"]`)
  )
    return;
  shownThisSession = true;

  const overlay = document.createElement("div");
  overlay.className = "exit-intent-overlay";
  overlay.setAttribute("data-feature", FEATURE_ID);
  overlay.innerHTML = `
    <div class="exit-intent-card">
      <div class="exit-intent-icon">🐾</div>
      <h3>Wait — don't go!</h3>
      <p>Use code <span class="exit-intent-code">COVE10</span> for 10% off your first membership.</p>
      <button type="button" class="exit-intent-close-btn">No thanks, I'll browse</button>
    </div>
  `;

  const close = () => overlay.remove();
  overlay
    .querySelector(".exit-intent-close-btn")
    .addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  document.body.appendChild(overlay);
}

export function activate() {
  shownThisSession = false;
  leaveHandler = (event) => {
    if (event.clientY <= 0) showOffer();
  };
  document.documentElement.addEventListener("mouseleave", leaveHandler);
}

export function deactivate() {
  if (leaveHandler) {
    document.documentElement.removeEventListener("mouseleave", leaveHandler);
    leaveHandler = null;
  }
  document
    .querySelectorAll(`[data-feature="${FEATURE_ID}"]`)
    .forEach((el) => el.remove());
}
