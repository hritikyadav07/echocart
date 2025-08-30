// Shared local fallback parser for shopping commands.
// Returns an object: { action, item, normalized_item, quantity }
// item: original-ish phrase with first letter uppercased (if present)
// normalized_item: canonical singular english noun phrase, lowercase

const NUM_WORDS = {
  // English
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  // Hindi (common)
  ek: 1,
  do: 2,
  teen: 3,
  char: 4,
  paanch: 5,
  chhe: 6,
  saat: 7,
  aath: 8,
  nau: 9,
  dus: 10,
  // Spanish
  uno: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
};

const ACTION_KEYWORDS = {
  add: ["add", "buy", "get", "need", "include", "add to", "add me"],
  remove: [
    "remove",
    "delete",
    "take off",
    "take",
    "remove from",
    "हटाओ",
    "निकालो",
    "हटाना",
  ],
  search: [
    "find",
    "search",
    "show",
    "look for",
    "suggest",
    "recommend",
    "alternative",
    "alternatives",
    "substitute",
    "instead of",
    "what do you suggest",
    "खोजो",
    "खोजें",
  ],
};

function detectAction(lower) {
  for (const a of Object.keys(ACTION_KEYWORDS)) {
    for (const kw of ACTION_KEYWORDS[a]) {
      if (lower.includes(kw)) return a;
    }
  }
  return null;
}

function parseQuantity(textLower) {
  // digits first
  const digitMatch = textLower.match(/\b(\d+(?:[.,]\d+)?)\b/);
  if (digitMatch) {
    const n = Number(digitMatch[1].replace(",", "."));
    return Math.max(1, Math.ceil(n));
  }

  // dozen/half dozen
  if (/half\s+dozen|half\s+a\s+dozen|a\s+half\s+dozen/.test(textLower))
    return 6;
  if (/dozen/.test(textLower)) return 12;

  // word numbers (simple)
  const words = textLower.split(/[^\p{L}]+/u).filter(Boolean);
  for (const w of words) {
    const num = NUM_WORDS[w];
    if (typeof num === "number") return Math.max(1, Math.ceil(num));
  }

  // fractions like "half" not followed by dozen -> treat as 1
  if (/half\b/.test(textLower)) return 1;

  return 1;
}

function singularize(phrase) {
  // Keep adjectives, singularize the last word naively
  if (!phrase) return "";
  let p = phrase.toLowerCase().trim();
  // remove price/filters
  p = p.split(" under ")[0].split(" $")[0].split("$")[0];
  p = p
    .replace(/[^\p{L}\s,-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!p) return "";
  const parts = p.split(/\s+/);
  let last = parts.pop();
  if (last.endsWith("ies")) last = last.replace(/ies$/, "y");
  else if (/(ses|xes|ches|shes)$/.test(last))
    last = last.replace(/(ses|xes|ches|shes)$/, (s) => s.slice(0, -2));
  else if (last.endsWith("s") && !last.endsWith("ss")) last = last.slice(0, -1);
  parts.push(last);
  return parts.join(" ").trim();
}

export function parseFallback(transcript, lang = "auto") {
  const raw = (transcript ?? "").toString().trim();
  // referencing lang to avoid unused var warnings in some linters
  void lang;
  if (!raw) return { action: null, item: "", normalized_item: "", quantity: 1 };

  const lower = raw.toLowerCase();
  const action = detectAction(lower);
  const quantity = parseQuantity(lower);

  // Remove leading/common verbs and helper phrases in multiple languages
  let name = raw
    .replace(/^\s*(add|buy|get|need|include|remove|delete)\b\s*/i, "")
    .replace(/\b(to\s+(my\s+)?(cart|list|bag))\b/i, "")
    .replace(/\b(from\s+(my\s+)?(cart|list|bag))\b/i, "")
    .replace(/\b(please|pls|kindly)\b/gi, "")
    .replace(/\b(under|less than)\b[^,\n]*/gi, "")
    .replace(/\bfor\b\s*\$?\d+[\d.]*\b/gi, "")
    .replace(/\b\d+\b/g, "")
    .replace(/[.,!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // If detection of action was null but phrase clearly says remove in some languages
  if (!action) {
    // look for Hindi remove verbs
    if (/हटाओ|निकालो|हटाना/.test(lower))
      return {
        action: "remove",
        item: capitalize(name),
        normalized_item: singularize(name),
        quantity: 1,
      };
    // fallback to add if phrase starts with name (e.g., "milk")
    if (/^\p{L}+/u.test(raw)) {
      // ambiguous: treat as add
      return {
        action: "add",
        item: capitalize(name),
        normalized_item: singularize(name),
        quantity,
      };
    }
    return { action: null, item: "", normalized_item: "", quantity: 1 };
  }

  return {
    action,
    item: capitalize(name),
    normalized_item: singularize(name),
    quantity,
  };
}

function capitalize(s) {
  if (!s) return "";
  const st = s.trim();
  return st.charAt(0).toUpperCase() + st.slice(1);
}

export default parseFallback;
