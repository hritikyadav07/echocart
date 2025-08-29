export function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed bg-white p-8 text-center text-gray-600">
      <p className="mb-2 font-medium">Your list is empty</p>
      <p className="text-sm">Use the mic to add items, e.g., “add milk”.</p>
    </div>
  );
}
