export function LanguageSelect({ value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-gray-600" htmlFor="language">
        Lang
      </label>
      <select
        id="language"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border px-2 py-1 text-sm"
      >
        <option value="en-US">English</option>
        <option value="es-ES">Español</option>
        <option value="hi-IN">हिन्दी</option>
      </select>
    </div>
  );
}
