import categories from "./datasets/categories.json";
import substitutes from "./datasets/substitutes.json";

const STOP_PHRASES = [
  "hello",
  "hi",
  "hey",
  "thanks",
  "thank you",
  "please",
  "what do you suggest",
  "what should i buy",
  "recommend",
  "any alternatives",
  "alternatives",
  "alternative",
  "instead of",
  "what are you doing",
  "are you there",
  "can you add",
  "could you add",
  "would you add",
  "how are you",
  "good morning",
  "good evening",
  "add to list",
  "remove from list",
];

const INTERROGATIVES = ["what", "why", "how", "when", "where", "who", "which"];

export function isPlausibleItemName(raw) {
  const s = String(raw || "")
    .trim()
    .toLowerCase();
  if (!s) return false;
  // Must contain at least 2 letters
  if (!/[a-z]/i.test(s)) return false;
  if ((s.match(/[a-z]/gi) || []).length < 2) return false;
  // Avoid common non-item phrases
  if (STOP_PHRASES.some((p) => s.includes(p))) return false;
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length > 4) return false;
  if (words.length === 1 && s.length <= 2) return false;
  // Reject questions and conversational patterns
  if (s.includes("?")) return false;
  if (INTERROGATIVES.some((w) => s.startsWith(w + " "))) return false;
  if (/\b(are|can|could|would|will|should)\s+you\b/.test(s)) return false;
  if (/\b(i|you|we)\b/.test(s) && words.length >= 3) return false;
  // Known items lists boost acceptance
  if (categories[s]) return true;
  if (substitutes[s]) return true;
  // Be conservative: if it's very short single token and unknown, reject
  if (words.length === 1 && s.length < 4) return false;
  return true;
}

export function toTitleCase(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default { isPlausibleItemName, toTitleCase };
