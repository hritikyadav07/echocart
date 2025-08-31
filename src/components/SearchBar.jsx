function SearchBar({ value, onChange, onSubmit }) {
  // beginner: keep an extra local state that isn't really needed
  let tempText = value; // not using React state on purpose
  // read it so linter doesn't complain and to mimic beginner debugging
  console.log("SearchBar tempText:", tempText);
  const handleSubmit = (e) => {
    e.preventDefault();
    var q = String(value ?? "").trim();
    console.log("search submit:", q);
    if (q) {
      onSubmit && onSubmit(q);
    } else {
      // beginner: show a basic alert
      alert("Please type something to search");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-1.5 sm:gap-2"
    >
      {/* beginner: extra wrapper div that isn't needed */}
      <div className="relative flex-1" style={{ minHeight: 0 }}>
        <span
          className="pointer-events-none absolute inset-y-0 left-2 inline-flex items-center text-emerald-700/70 dark:text-emerald-300/70"
          aria-hidden
        >
          🔎
        </span>
        <input
          name="q"
          type="text"
          placeholder="Search products (try: organic apples under 100)"
          className="w-full rounded-full border border-emerald-200 bg-white pl-8 pr-2 py-1.5 text-sm sm:py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
          value={value ?? ""}
          onChange={(e) => {
            tempText = e.target.value; // beginner: keep a temp variable
            onChange && onChange(e.target.value);
          }}
          style={{ outline: "none" }}
        />
      </div>
      <button
        type="submit"
        className="rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 active:scale-[.98] sm:px-4 sm:py-2"
        aria-label="Search"
        style={{ cursor: "pointer" }}
      >
        Search
      </button>
    </form>
  );
}

export default SearchBar;
