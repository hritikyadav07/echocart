import { useState, forwardRef, useImperativeHandle } from "react";
import SearchBar from "./SearchBar.jsx";
import ProductCard from "./ProductCard.jsx";
import { parseSearchQuery } from "../utils/searchNlp.js";
import { searchProducts } from "../utils/searchEngine.js";

function SearchPaneImpl({ onAddToList, speakOut, onStatus }, ref) {
  const [searchResults, setSearchResults] = useState([]);
  const [lastQuery, setLastQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [inputValue, setInputValue] = useState("");

  const runSearch = (q) => {
    setInputValue(String(q || ""));
    const parsed = parseSearchQuery(q);
    if (!parsed.intent || !parsed.item) {
      const msg = "Do you want apples, or apple juice?";
      onStatus?.(msg);
      speakOut?.(msg);
      setLastQuery(q);
      setSearchResults([]);
      setActiveFilters({});
      return;
    }

    setLastQuery(parsed.item);
    const filters = parsed.filters || {};
    setActiveFilters(filters);
    const results = searchProducts({ item: parsed.item, filters });
    setSearchResults(results);
    if (results.length) {
      const pricePart = filters?.maxPrice
        ? ` under ${filters.maxPrice} rupees`
        : "";
      const brandPart = filters?.brand ? ` from ${filters.brand}` : "";
      const sizePart = filters?.size ? ` size ${filters.size}` : "";
      const sum = `I found ${results.length} ${parsed.item}${pricePart}${brandPart}${sizePart}.`;
      onStatus?.(sum);
      speakOut?.(sum);
    } else {
      const sum = `Sorry, I couldn't find ${parsed.item} with those filters.`;
      onStatus?.(sum);
      speakOut?.(sum);
    }
  };

  // Expose imperative API for voice to trigger searches
  useImperativeHandle(ref, () => ({
    runSearch,
    clear: () => {
      setLastQuery("");
      setSearchResults([]);
      setActiveFilters({});
      setInputValue("");
    },
  }));

  const requery = (nextFilters) => {
    setActiveFilters(nextFilters);
    if (!lastQuery) {
      setSearchResults([]);
      return;
    }
    const r = searchProducts({ item: lastQuery, filters: nextFilters });
    setSearchResults(r);
  };

  return (
    <div className="w-full rounded-xl border border-emerald-100 bg-white p-3 dark:bg-slate-800 dark:border-slate-700">
      <h2 className="mb-3 text-base sm:text-lg font-medium text-emerald-800 dark:text-emerald-300">
        Search products
      </h2>

      <SearchBar
        value={inputValue}
        onChange={setInputValue}
        onSubmit={runSearch}
      />

      {Boolean(lastQuery || Object.keys(activeFilters || {}).length) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {lastQuery && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-slate-700/40 dark:text-slate-200">
              Query: {lastQuery}
            </span>
          )}
          {activeFilters?.brand && (
            <button
              type="button"
              onClick={() => {
                const f = { ...activeFilters, brand: null };
                requery(f);
              }}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-200 dark:bg-slate-700/60 dark:text-slate-100"
              title="Remove brand filter"
            >
              Brand: {activeFilters.brand} ×
            </button>
          )}
          {activeFilters?.size && (
            <button
              type="button"
              onClick={() => {
                const f = { ...activeFilters, size: null };
                requery(f);
              }}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-200 dark:bg-slate-700/60 dark:text-slate-100"
              title="Remove size filter"
            >
              Size: {activeFilters.size} ×
            </button>
          )}
          {activeFilters?.isOrganic && (
            <button
              type="button"
              onClick={() => {
                const f = { ...activeFilters, isOrganic: false };
                requery(f);
              }}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-200 dark:bg-slate-700/60 dark:text-slate-100"
              title="Remove organic filter"
            >
              Organic ×
            </button>
          )}
          {(activeFilters?.minPrice != null ||
            activeFilters?.maxPrice != null) && (
            <button
              type="button"
              onClick={() => {
                const f = { ...activeFilters, minPrice: null, maxPrice: null };
                requery(f);
              }}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-200 dark:bg-slate-700/60 dark:text-slate-100"
              title="Remove price filter"
            >
              Price{" "}
              {activeFilters.minPrice != null
                ? `≥ ${activeFilters.minPrice}`
                : ""}
              {activeFilters.minPrice != null && activeFilters.maxPrice != null
                ? " & "
                : ""}
              {activeFilters.maxPrice != null
                ? `≤ ${activeFilters.maxPrice}`
                : ""}{" "}
              ×
            </button>
          )}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {searchResults.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onAdd={(prod) => onAddToList?.(prod)}
          />
        ))}
      </div>
      {searchResults.length === 0 && lastQuery && (
        <p className="mt-3 text-sm text-gray-600 dark:text-slate-300">
          No results. Try changing filters.
        </p>
      )}
    </div>
  );
}

const SearchPane = forwardRef(SearchPaneImpl);

export default SearchPane;
