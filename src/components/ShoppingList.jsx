import Item from "./Item.jsx";

function ShoppingList({ items = [], onInc, onDec, onDelete }) {
  return (
    <div className="rounded-xl border border-emerald-100 bg-white p-4 dark:bg-slate-800 dark:border-slate-700">
      <h2 className="mb-3 text-lg font-medium text-emerald-800 dark:text-emerald-300">
        Shopping list
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-slate-300">
          Your list is empty.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <Item
              key={item.id}
              item={item}
              onInc={onInc}
              onDec={onDec}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default ShoppingList;
