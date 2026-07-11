let intervalId = null;

function nextSlot(from) {
  const next = new Date(from);
  next.setSeconds(0, 0);
  const minutes = next.getMinutes();
  const addMinutes = minutes < 30 ? 30 - minutes : 60 - minutes;
  next.setMinutes(minutes + (addMinutes === 0 ? 30 : addMinutes));
  return next;
}

function formatRemaining(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function activate({ mount }) {
  if (!mount) return;
  const timeEl = mount.querySelector(".event-countdown-time");
  let target = nextSlot(new Date());

  const tick = () => {
    const now = new Date();
    let remaining = target.getTime() - now.getTime();
    if (remaining <= 0) {
      target = nextSlot(now);
      remaining = target.getTime() - now.getTime();
    }
    if (timeEl) timeEl.textContent = formatRemaining(remaining);
  };

  tick();
  intervalId = setInterval(tick, 1000);
}

export function deactivate() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
