const FORECASTS = [
  { icon: "☀️", text: "72°F and sunny — perfect zoo weather!" },
  { icon: "⛅", text: "68°F with light clouds — great day to visit!" },
  { icon: "🌤️", text: "75°F, mild breeze — the otters approve." },
  {
    icon: "🌈",
    text: "70°F after a morning shower — rainbows over the aviary!",
  },
];

let intervalId = null;

export function activate({ mount }) {
  if (!mount) return;
  const iconEl = mount.querySelector(".weather-widget-icon");
  const textEl = mount.querySelector(".weather-widget-text");

  const applyRandomForecast = () => {
    const pick = FORECASTS[Math.floor(Math.random() * FORECASTS.length)];
    if (iconEl) iconEl.textContent = pick.icon;
    if (textEl) textEl.textContent = pick.text;
  };

  applyRandomForecast();
  intervalId = setInterval(applyRandomForecast, 10000);
}

export function deactivate() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
