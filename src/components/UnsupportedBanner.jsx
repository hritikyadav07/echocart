export function UnsupportedBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-4xl mx-auto px-4 py-2 text-amber-800 text-sm">
        Your browser doesn’t support the Web Speech API. Use Chrome desktop or
        the text input (coming soon).
      </div>
    </div>
  );
}
