function SearchBar({ value, onChange, onSubmit }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const q = String(value ?? "").trim();
    if (q) onSubmit?.(q);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        name="q"
        type="text"
        placeholder="Search products (try: organic apples under 100)"
        className="flex-1 rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
      />
      <button
        type="submit"
        className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        aria-label="Search"
      >
        Search
      </button>
    </form>
  );
}

export default SearchBar;
