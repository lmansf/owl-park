const MESSAGES = [
  "☀️ Summer Safari is here — extended evening hours through August!",
  "🎆 Weekend Wild Nights — keeper talks under the stars, Fri & Sat.",
  "🍂 Members save 15% on Twilight Explorer tickets this month.",
];

let intervalId = null;

export function activate({ mount }) {
  if (!mount) return;
  let i = 0;
  const textEl = mount.querySelector(".seasonal-banner-text");
  intervalId = setInterval(() => {
    i = (i + 1) % MESSAGES.length;
    if (textEl) textEl.textContent = MESSAGES[i].replace(/^\S+\s/, "");
  }, 4000);
}

export function deactivate() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
