const seasonal = {
  spring: ["asparagus", "strawberries", "peas"],
  summer: ["mango", "watermelon", "berries"],
  autumn: ["pumpkin", "squash", "apples"],
  winter: ["oranges", "broccoli", "carrots"],
};
const substitutes = {
  milk: ["almond milk", "soy milk"],
  bread: ["whole wheat bread", "sourdough"],
  yogurt: ["greek yogurt", "plant-based yogurt"],
  chips: ["popcorn", "nuts"],
};

function getSeason(d = new Date()) {
  const m = d.getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
}

export function buildSuggestions(
  currentNames,
  history,
  now = new Date(),
  max = 6
) {
  const inList = new Set(
    (currentNames || []).map((n) => (n || "").toLowerCase())
  );
  const picked = [];
  const push = (name) => {
    const n = (name || "").toLowerCase();
    if (inList.has(n)) return;
    if (picked.some((p) => p.toLowerCase() === n)) return;
    picked.push(name.charAt(0).toUpperCase() + name.slice(1));
  };
  const frequent = Object.entries(history || {})
    .sort(
      (a, b) => b[1].count - a[1].count || b[1].lastAddedAt - a[1].lastAddedAt
    )
    .map(([name]) => name);
  for (const name of frequent) {
    if (picked.length >= max) break;
    push(name);
  }
  if (picked.length < max) {
    const season = getSeason(now);
    for (const name of seasonal[season]) {
      if (picked.length >= max) break;
      push(name);
    }
  }
  if (picked.length < max) {
    for (const n of inList) {
      const subs = substitutes[n];
      if (!subs) continue;
      for (const s of subs) {
        if (picked.length >= max) break;
        push(s);
      }
      if (picked.length >= max) break;
    }
  }
  return picked.slice(0, max);
}
