// Shopping history tracking utilities
import categories from "./datasets/categories.json";
// Structure stored in localStorage per user: events[] and aggregates by item

const LS_HISTORY = "echocart:history:v1";

// Event shapes:
// { type: 'add'|'remove'|'bought'|'accept-suggestion'|'reject-suggestion',
//   item: 'Milk', qty: 1, at: ISOString }

export function loadHistory() {
  try {
    const raw = localStorage.getItem(LS_HISTORY);
    if (!raw) return { events: [], aggregates: {} };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch (e) {
    // ignore parse errors
    void e;
  }
  return { events: [], aggregates: {} };
}

export function saveHistory(hist) {
  try {
    localStorage.setItem(LS_HISTORY, JSON.stringify(hist));
  } catch (e) {
    // ignore quota errors
    void e;
  }
}

export function recordEvent(type, item, qty = 1) {
  const now = new Date().toISOString();
  const hist = loadHistory();
  const category = categories[item] || categories[capitalize(item)] || null;
  const ev = { type, item, category, qty: Math.max(1, qty | 0), at: now };
  hist.events.push(ev);

  // update aggregates
  const key = canonical(item);
  const agg = hist.aggregates[key] || {
    name: item,
    category: category || null,
    countAdds: 0,
    countBought: 0,
    lastAddedAt: null,
    lastBoughtAt: null,
    accepts: 0,
    rejects: 0,
  };
  if (type === "add") {
    agg.countAdds += 1;
    agg.lastAddedAt = now;
  } else if (type === "bought") {
    agg.countBought += 1;
    agg.lastBoughtAt = now;
  } else if (type === "accept-suggestion") {
    agg.accepts += 1;
  } else if (type === "reject-suggestion") {
    agg.rejects += 1;
  }

  hist.aggregates[key] = agg;
  saveHistory(hist);
}

export function canonical(name) {
  return String(name || "")
    .trim()
    .toLowerCase();
}

export function getAggregate(name) {
  const hist = loadHistory();
  return hist.aggregates[canonical(name)] || null;
}

export function getAllAggregates() {
  return loadHistory().aggregates || {};
}

function capitalize(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default {
  loadHistory,
  saveHistory,
  recordEvent,
  getAggregate,
  getAllAggregates,
};
