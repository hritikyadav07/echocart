function Navbar({
  lang,
  onLangChange,
  languages,
  fbOk,
  showFbPanel,
  setShowFbPanel,
  onRunFirestoreCheck,
  isDark,
  onToggleTheme,
}) {
  return (
    <header className="border-b border-emerald-100 bg-white dark:bg-slate-900 dark:border-slate-800">
      <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between gap-4 relative">
        <h1 className="text-xl font-semibold tracking-tight text-emerald-700 dark:text-emerald-300">
          Echocart.
        </h1>
        <div className="flex items-center gap-3">
          <label htmlFor="lang" className="sr-only">
            Language
          </label>
          <select
            id="lang"
            value={lang}
            onChange={(e) => onLangChange(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
            title="Toggle theme"
          >
            <span className="text-lg" aria-hidden="true">
              {isDark ? "🌙" : "☀️"}
            </span>
            <span className="sr-only">Toggle theme</span>
          </button>

          <button
            type="button"
            aria-label="Firebase status"
            title={
              fbOk === null
                ? "Checking Firebase…"
                : fbOk
                ? "Firebase connected"
                : "Firebase error"
            }
            onClick={() => setShowFbPanel((v) => !v)}
            className="relative inline-flex items-center justify-center h-7 w-7 rounded-full border border-gray-200 bg-white hover:shadow-sm dark:bg-slate-800 dark:border-slate-700"
          >
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                fbOk === null
                  ? "bg-gray-300"
                  : fbOk
                  ? "bg-emerald-500"
                  : "bg-red-500"
              }`}
            />
          </button>

          {showFbPanel && (
            <div
              id="fb-panel"
              className="absolute right-4 top-full mt-2 w-64 rounded-lg border border-emerald-100 bg-white shadow-md p-3 z-50 dark:bg-slate-800 dark:border-slate-700"
              role="dialog"
              aria-label="Firebase connection"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                    fbOk === null
                      ? "bg-gray-300"
                      : fbOk
                      ? "bg-emerald-500"
                      : "bg-red-500"
                  }`}
                />
                <span className="text-sm text-gray-800 dark:text-slate-200">
                  {fbOk === null
                    ? "Checking Firebase…"
                    : fbOk
                    ? "Firebase connected"
                    : "Firebase error"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={onRunFirestoreCheck}
                  className="text-xs font-medium text-emerald-700 hover:text-emerald-800 underline dark:text-emerald-300"
                >
                  Check now
                </button>
                <button
                  type="button"
                  onClick={() => setShowFbPanel(false)}
                  className="text-xs text-gray-600 hover:text-gray-800 dark:text-slate-300"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-lime-300" />
    </header>
  );
}

export default Navbar;
