// Very lightweight NLP for extracting search intents and filters from text.
// Handles patterns like:
// - "find organic apples under 100 rupees"
// - "show me toothpaste under 200"
// - "find 2 liter coke bottle"

const PRICE_REGEX =
  /(?:under|below|less than|<=?)\s*(\d{1,6})\s*(?:rs|inr|rupees|₹)?/i;
const PRICE_RANGE_REGEX =
  /(between|from)\s*(\d{1,6})\s*(?:to|and|-|–)\s*(\d{1,6})\s*(?:rs|inr|rupees|₹)?/i;
const SIZE_REGEX = /(\d+(?:\.\d+)?)\s*(ml|l|g|kg|lit(er)?s?|packs?|pack|pcs?)/i;

const BRANDS = [
  "amul",
  "mother dairy",
  "nestle",
  "colgate",
  "pepsodent",
  "dabur",
  "coca-cola",
  "coca cola",
  "pepsi",
  "lays",
  "tata",
  "fortune",
  "india gate",
  "tata sampann",
  "aashirvaad",
  "nescafe",
  "britannia",
  "head & shoulders",
  "head and shoulders",
  "dettol",
  "quaker",
  "kellogg's",
  "kelloggs",
  "surf excel",
  "tide",
];

const NORMALIZE = (s) =>
  String(s || "")
    .trim()
    .toLowerCase();

export function parseSearchQuery(raw) {
  const original = String(raw || "").trim();
  const q = NORMALIZE(original);
  if (!q) return { intent: null };

  // Treat any non-empty input as a search in the SearchBar context
  // (still supports explicit verbs, but not required)
  const isSearch = true;

  // Price filters
  let minPrice = null,
    maxPrice = null;
  let m = q.match(PRICE_RANGE_REGEX);
  if (m) {
    minPrice = Number(m[2]);
    maxPrice = Number(m[3]);
  } else {
    m = q.match(PRICE_REGEX);
    if (m) {
      maxPrice = Number(m[1]);
    }
  }

  // Size
  let size = null;
  const sm = q.match(SIZE_REGEX);
  if (sm) {
    const value = sm[1];
    let unit = sm[2].toLowerCase();
    unit = unit.replace("liters", "l").replace("liter", "l");
    size = `${value}${unit}`;
  }

  // Organic / tags
  const isOrganic = /\borganic\b/.test(q);

  // Brand
  let brand = null;
  for (const b of BRANDS) {
    if (q.includes(b)) {
      brand = b;
      break;
    }
  }

  // Item name heuristic: strip common verbs and filter words
  let item = q
    .replace(/^(find|show|search|look for|get|need)\b\s*/i, "")
    .replace(PRICE_RANGE_REGEX, "")
    .replace(PRICE_REGEX, "")
    .replace(SIZE_REGEX, "")
    .replace(/\b(organic|brand|brands|bottle|pack|pcs|piece|pieces)\b/gi, "")
    .replace(/\b(of|a|the|some|any|me|to|for|please|category)\b/gi, "")
    .trim();

  // Reduce to last 3 words to avoid long tails
  const words = item.split(/\s+/).filter(Boolean);
  if (words.length > 4) item = words.slice(-4).join(" ");

  if (!item) item = null;

  return {
    intent: isSearch ? "search" : null,
    text: original,
    item,
    filters: {
      brand,
      size,
      isOrganic,
      minPrice,
      maxPrice,
    },
  };
}
