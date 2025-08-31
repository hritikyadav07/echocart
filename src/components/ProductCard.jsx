function ProductCard({ product, onAdd }) {
  return (
    <div
      className="group rounded-xl border border-emerald-100 bg-white p-2.5 sm:p-3 shadow-sm transition hover:shadow-md dark:bg-slate-800 dark:border-slate-700"
      style={{ width: "100%" }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-semibold text-emerald-900 truncate dark:text-slate-100">
                {product.name}
              </div>
              <div className="text-xs text-gray-600 dark:text-slate-300 truncate">
                {product.brand} • {product.size}
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-700/60">
              ₹{product.price}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-2 sm:mt-3">
        <button
          type="button"
          onClick={() => {
            console.log("add click", product && product.name);
            onAdd && onAdd(product);
          }}
          className="w-full rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 active:scale-[.98]"
        >
          {/* beginner: fragment + extra span */}
          <>
            <span>Add to List</span>
          </>
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
