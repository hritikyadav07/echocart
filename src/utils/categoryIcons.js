import categories from "./datasets/categories.json";

const iconMap = {
  Produce: "🥬",
  Dairy: "🥛",
  Bakery: "🥖",
  Snacks: "🍪",
  Beverages: "🧃",
  Meat: "🥩",
  Pantry: "🧂",
  Frozen: "🧊",
  PersonalCare: "🧼",
  Household: "🧽",
  Other: "🛒",
};

export function getCategoryFor(name) {
  const n = String(name || "").trim();
  return categories[n] || categories[capitalize(n)] || "Other";
}

export function getIconForCategory(cat) {
  return iconMap[cat] || iconMap.Other;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export default { getCategoryFor, getIconForCategory };
