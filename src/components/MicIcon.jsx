export function MicIcon({ pulsing }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`h-5 w-5 ${pulsing ? "animate-pulse" : ""}`}
      aria-hidden
    >
      <path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2Zm-5 7a7.001 7.001 0 0 1-6.32-4H5.06a9 9 0 0 0 17.88 0h-.62A7.001 7.001 0 0 1 12 18Z" />
    </svg>
  );
}
