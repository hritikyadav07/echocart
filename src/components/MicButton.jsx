import { MicIcon } from "./MicIcon.jsx";

export function MicButton({ listening, onToggle }) {
  return (
    <button
      aria-pressed={listening}
      aria-label={listening ? "Stop listening" : "Start listening"}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 transform z-40 shadow-lg rounded-full p-5 text-white ${
        listening ? "bg-emerald-600" : "bg-gray-900 hover:bg-gray-800"
      }`}
      onClick={onToggle}
    >
      <MicIcon pulsing={listening} />
    </button>
  );
}
