import PRODUCTS from "./datasets/products.json";

// Basic token includes check with synonyms support
function normalize(s) {
  return String(s || "").toLowerCase();
}

function matchKeywords(product, query) {
  const q = normalize(query);
  if (!q) return true;
  const fields = [product.name, product.brand, ...(product.keywords || [])]
    .map(normalize)
    .join(" ");
  return q.split(/\s+/).every((token) => fields.includes(token));
}

function matchBrand(product, brand) {
  if (!brand) return true;
  return normalize(product.brand).includes(normalize(brand));
}

function matchSize(product, size) {
  if (!size) return true;
  return normalize(product.size) === normalize(size);
}

function matchPrice(product, { minPrice = null, maxPrice = null }) {
  const p = Number(product.price);
  if (minPrice != null && p < Number(minPrice)) return false;
  if (maxPrice != null && p > Number(maxPrice)) return false;
  return true;
}

function matchOrganic(product, isOrganic) {
  if (!isOrganic) return true; // only filter when asked
  return Boolean(product.isOrganic);
}

export function searchProducts({ item, filters = {} }) {
  const list = Array.isArray(PRODUCTS) ? PRODUCTS : [];
  const results = list.filter(
    (p) =>
      matchKeywords(p, item) &&
      matchBrand(p, filters.brand) &&
      matchSize(p, filters.size) &&
      matchPrice(p, filters) &&
      matchOrganic(p, filters.isOrganic)
  );

  // simple ranking: price asc when maxPrice provided, otherwise brand/name alpha
  const ranked = [...results].sort((a, b) => {
    if (filters.maxPrice != null) return a.price - b.price;
    const an = normalize(a.name + " " + a.brand);
    const bn = normalize(b.name + " " + b.brand);
    return an.localeCompare(bn);
  });
  return ranked;
}
