// Lightweight helpers to check and request microphone permission
// Note: Permission prompts must be triggered by a user gesture on most browsers.

function getUserMediaCompat(constraints) {
  if (navigator?.mediaDevices?.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }
  const legacy =
    navigator?.getUserMedia ||
    navigator?.webkitGetUserMedia ||
    navigator?.mozGetUserMedia ||
    navigator?.msGetUserMedia;
  if (legacy) {
    return new Promise((resolve, reject) =>
      legacy.call(navigator, constraints, resolve, reject)
    );
  }
  return null;
}

export async function checkMicPermission() {
  try {
    if (!navigator?.mediaDevices) return "unavailable";
    // Permissions API isn't supported everywhere (iOS Safari). Fall back to unknown.
    if (!navigator.permissions || !navigator.permissions.query)
      return "unknown";
    const status = await navigator.permissions.query({ name: "microphone" });
    return status.state; // 'granted' | 'denied' | 'prompt'
  } catch {
    return "unknown";
  }
}

export async function requestMicAccess() {
  if (!window.isSecureContext) {
    throw new Error(
      "Microphone requires a secure context (HTTPS). Open the site over HTTPS or use a dev tunnel."
    );
  }
  const gumPromise = getUserMediaCompat({ audio: true });
  if (!gumPromise || typeof gumPromise.then !== "function") {
    throw new Error("Microphone API unavailable");
  }
  let stream;
  try {
    stream = await gumPromise;
    // Immediately stop the tracks; we only wanted the permission grant.
    try {
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      // ignore
    }
    return true;
  } catch (err) {
    // Normalize common errors
    const name = err && err.name ? String(err.name) : "Error";
    let msg = err && err.message ? String(err.message) : "";
    if (name === "NotAllowedError") msg = "Microphone permission denied";
    else if (name === "NotFoundError") msg = "No microphone device found";
    else if (name === "SecurityError")
      msg = "Blocked by browser security policy (check HTTPS and settings)";
    const e = new Error(name + (msg ? ": " + msg : ""));
    e.name = name;
    throw e;
  }
}
