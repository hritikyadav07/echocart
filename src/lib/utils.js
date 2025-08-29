export function guessCategory(name) {
  const n = (name || "").toLowerCase();
  if (/milk|yogurt|cheese/.test(n)) return "dairy";
  if (/apple|banana|spinach/.test(n)) return "produce";
  if (/chips|cookies|nuts|popcorn|biscuit/.test(n)) return "snacks";
  return "other";
}
export function capitalize(s) {
  return (s || "").charAt(0).toUpperCase() + (s || "").slice(1);
}
