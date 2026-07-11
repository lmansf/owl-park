const ANIMALS = [
  { emoji: "🐼", name: "Red Panda", fact: "Red pandas use their bushy tails as blankets in cold weather." },
  { emoji: "🦦", name: "River Otter", fact: "Otters hold hands while sleeping so they don't drift apart." },
  { emoji: "🦩", name: "Flamingo", fact: "Flamingos are born gray — their pink color comes from their diet." },
  { emoji: "🦁", name: "African Lion", fact: "A lion's roar can be heard from up to 5 miles away." },
];

let intervalId = null;

function render(mount, index) {
  const animal = ANIMALS[index];
  mount.querySelector("#as-emoji").textContent = animal.emoji;
  mount.querySelector("#as-name").textContent = animal.name;
  mount.querySelector("#as-fact").textContent = animal.fact;
}

export function activate({ mount }) {
  if (!mount) return;
  let index = 0;
  render(mount, index);
  intervalId = setInterval(() => {
    index = (index + 1) % ANIMALS.length;
    render(mount, index);
  }, 6000);
}

export function deactivate() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
