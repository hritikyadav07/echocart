const numberWords = {
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
  dozen: 12,
};
const intentKeywords = {
  add: ["add"],
  remove: ["remove", "delete"],
  search: ["find", "search"],
  unknown: [],
};

export function parseCommand(inputRaw) {
  const input = (inputRaw || "").toLowerCase().trim();
  if (!input) return { intent: "unknown", item: null, quantity: 1 };
  const tokens = input.split(/\s+/);
  let intent = "unknown";
  const first = tokens[0];
  for (const [k, words] of Object.entries(intentKeywords)) {
    if (words.includes(first)) {
      intent = k;
      break;
    }
  }
  let quantity = 1,
    qtyIndex = -1;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (/^\d+$/.test(t)) {
      quantity = parseInt(t, 10);
      qtyIndex = i;
      break;
    }
    if (t in numberWords) {
      quantity = numberWords[t];
      qtyIndex = i;
      break;
    }
  }
  const toOmit = new Set();
  if (intent !== "unknown") toOmit.add(0);
  if (qtyIndex >= 0) toOmit.add(qtyIndex);
  const itemTokens = tokens.filter((_, i) => !toOmit.has(i));
  const item = itemTokens.join(" ").trim() || null;
  try {
    console.debug("[EchoCart][parse]", {
      input: inputRaw,
      parsed: { intent, item, quantity },
    });
  } catch {}
  return { intent, item, quantity };
}
