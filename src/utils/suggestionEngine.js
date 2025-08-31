// Suggestion engine that generates suggestions with reasons
import seasonal from "./datasets/seasonal.json";
import substitutes from "./datasets/substitutes.json";
import categories from "./datasets/categories.json";
import { getAllAggregates, getAggregate, recordEvent } from "./history.js";

// Public API
// generateSuggestions({ currentItems: [{name, qty, bought}], now?: Date }) => [
//   { item, reason, type: 'history'|'seasonal'|'substitute', score }
// ]

export function generateSuggestions({ currentItems = [], now = new Date() }) {
  const CAP = 4;
  const historyCandidates = [];
  const seasonalCandidates = [];
  const subsCandidates = [];
  const currentNames = new Set(
    (currentItems || []).map((i) => i.name.toLowerCase())
  );
  const agg = getAllAggregates();

  // 1) History-based: items bought/added frequently and not currently in list
  for (const key of Object.keys(agg)) {
    const a = agg[key];
    if (!a || !a.name) continue;
    const inList = currentNames.has(a.name.toLowerCase());
    if (inList) continue;

    const freq = a.countBought || a.countAdds || 0;
    const last = a.lastBoughtAt || a.lastAddedAt;
    const daysSince = last ? daysBetween(new Date(last), now) : 999;

    // Heuristic: suggest if used often and not in list recently
    if (freq >= 2 && daysSince >= 5) {
      const score = 50 + Math.min(30, freq * 5) + Math.min(20, daysSince);
      const reason = makeReason(
        `You often buy ${a.name.toLowerCase()} — last time was ${daysSince} day${
          daysSince === 1 ? "" : "s"
        } ago.`,
        "history"
      );
      historyCandidates.push({ item: a.name, reason, type: "history", score });
    }
  }

  // 2) Seasonal
  const monthKey = String((now.getMonth() + 1) | 0);
  const monthList = seasonal[monthKey] || [];
  for (const s of monthList) {
    const name = s.item;
    if (!name || currentNames.has(name.toLowerCase())) continue;

    // down-rank if user often rejects this suggestion
    const ag = getAggregate(name);
    const penalty = ag ? Math.min(20, ag.rejects * 5) : 0;
    const bonus = ag ? Math.min(20, ag.accepts * 5) : 0;
    const score = 40 + bonus - penalty;
    const reason = makeReason(
      s.reason || `${name} is in season this month.`,
      "seasonal"
    );
    seasonalCandidates.push({ item: name, reason, type: "seasonal", score });
  }

  // 3) Substitutes: for items removed recently or dietary alternatives
  // If the user removed an item currently or in past day, suggest alternatives
  // We approximate by: for any item in current list, include its subs (dietary prompts)
  // and for common removed items, we'll expose an API to pass removedName to suggestSubstitutes.
  for (const i of currentItems) {
    const list = substitutes[i.name] || substitutes[titleCase(i.name)] || [];
    for (const alt of list) {
      if (currentNames.has(alt.toLowerCase())) continue;
      const ag = getAggregate(alt);
      const bonus = ag ? Math.min(20, ag.accepts * 5) : 0;
      const penalty = ag ? Math.min(20, ag.rejects * 5) : 0;
      const score = 25 + bonus - penalty;
      const reason = makeReason(
        `Alternative to ${i.name.toLowerCase()}.`,
        "substitute"
      );
      subsCandidates.push({ item: alt, reason, type: "substitute", score });
    }
  }

  // Rank within each bucket
  historyCandidates.sort((a, b) => b.score - a.score);
  seasonalCandidates.sort((a, b) => b.score - a.score);
  subsCandidates.sort((a, b) => b.score - a.score);

  // Pick a balanced set: up to 2 from history, up to 2 from seasonal
  const picks = [];
  const seen = new Set();
  const pushPick = (s) => {
    const key = s.item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    picks.push(s);
    return true;
  };

  for (let i = 0; i < historyCandidates.length && picks.length < 2; i++) {
    pushPick(historyCandidates[i]);
  }
  for (let i = 0; i < seasonalCandidates.length && picks.length < 4; i++) {
    // allow up to 2 seasonal in first pass
    if (picks.filter((p) => p.type === "seasonal").length >= 2) break;
    pushPick(seasonalCandidates[i]);
  }

  // If still not enough, fill from remaining highest scored across all
  if (picks.length < CAP) {
    const pool = [
      ...historyCandidates,
      ...seasonalCandidates,
      ...subsCandidates,
    ].sort((a, b) => b.score - a.score);
    for (const s of pool) {
      if (picks.length >= CAP) break;
      pushPick(s);
    }
  }

  return picks.slice(0, CAP);
}

export function suggestSubstitutesFor(itemName, currentItems = []) {
  const currentNames = new Set(
    (currentItems || []).map((i) => i.name.toLowerCase())
  );
  const list = substitutes[itemName] || substitutes[titleCase(itemName)] || [];
  return list
    .filter((n) => !currentNames.has(n.toLowerCase()))
    .map((alt) => ({
      item: alt,
      type: "substitute",
      reason: makeReason(
        `Since you removed ${itemName.toLowerCase()}, try ${alt.toLowerCase()}?`,
        "substitute"
      ),
      score: 60,
    }));
}

export function getCategory(itemName) {
  return categories[itemName] || categories[titleCase(itemName)] || null;
}

export function acceptSuggestion(itemName) {
  recordEvent("accept-suggestion", itemName, 1);
}

export function rejectSuggestion(itemName) {
  recordEvent("reject-suggestion", itemName, 1);
}

function daysBetween(a, b) {
  const ms = Math.abs(b.getTime() - a.getTime());
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function titleCase(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function makeReason(text, tag) {
  // Ensure reason carries a tag for UX (optional)
  return text + (tag ? "" : "");
}

export default {
  generateSuggestions,
  suggestSubstitutesFor,
  getCategory,
  acceptSuggestion,
  rejectSuggestion,
};
