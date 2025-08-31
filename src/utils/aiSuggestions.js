import { model } from "./firebaseConfig.js";
import seasonal from "./datasets/seasonal.json";
import { getAllAggregates } from "./history.js";

// aiSuggest({ currentItems, now }) => [{ item, reason, type: 'ai', score }]
export async function aiSuggest({ currentItems = [], now = new Date() }) {
  if (!model) {
    console.log("[AI Suggestions] No model configured; skipping AI.");
    return [];
  }

  const monthKey = String((now.getMonth() + 1) | 0);
  const monthList = seasonal[monthKey] || [];
  const currentNames = new Set(
    (currentItems || []).map((i) => i.name.toLowerCase())
  );

  // Compress history aggregates: take top by (bought+adds) minus rejects, include recency
  const agg = getAllAggregates() || {};
  const histRows = Object.values(agg)
    .map((a) => ({
      name: a.name,
      adds: a.countAdds || 0,
      bought: a.countBought || 0,
      accepts: a.accepts || 0,
      rejects: a.rejects || 0,
      lastAddedAt: a.lastAddedAt || null,
      lastBoughtAt: a.lastBoughtAt || null,
      score:
        (a.countBought || 0) * 2 +
        (a.countAdds || 0) -
        (a.rejects || 0) +
        (a.accepts || 0),
    }))
    .sort((x, y) => y.score - x.score)
    .slice(0, 12);

  const sys = `You are a shopping assistant. Suggest up to 4 unique grocery items the user is likely to want next.`;
  const instructions = {
    current_list: Array.from(currentNames),
    month: monthKey,
    seasonal_candidates: monthList.slice(0, 12),
    history_top: histRows,
    rules: [
      "Return JSON array only. No prose.",
      "Each element: { item: string, reason: string }",
      "Do NOT suggest anything already in current_list.",
      "Prefer items the user frequently buys or recently bought.",
      "If little history, prefer seasonal items for this month.",
      "Avoid items the user often rejects (rejects high).",
      "Cap at 4 suggestions.",
      "Keep item names short and human-readable (Title Case).",
    ],
  };

  const result = await model.generateContent({
    contents: [
      { role: "user", parts: [{ text: sys }] },
      { role: "user", parts: [{ text: JSON.stringify(instructions) }] },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "array",
        maxItems: 4,
        items: {
          type: "object",
          properties: {
            item: { type: "string" },
            reason: { type: "string" },
          },
          required: ["item", "reason"],
        },
      },
    },
  });

  const text = await result.response.text();
  let arr;
  try {
    arr = JSON.parse(text);
  } catch {
    console.warn("[AI Suggestions] Invalid JSON from model; got:", text);
    return [];
  }

  if (!Array.isArray(arr)) return [];
  const out = [];
  const seen = new Set();
  for (const s of arr) {
    if (!s || typeof s.item !== "string") continue;
    const key = s.item.trim();
    if (!key) continue;
    const low = key.toLowerCase();
    if (currentNames.has(low) || seen.has(low)) continue;
    seen.add(low);
    out.push({
      item: titleCase(key),
      reason: s.reason || "Recommended",
      type: "ai",
      score: 80,
    });
    if (out.length >= 4) break;
  }
  return out;
}

function titleCase(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default { aiSuggest };
