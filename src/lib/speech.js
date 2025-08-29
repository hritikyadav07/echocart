export function createSpeechController(onResult, onError, lang = "en-US") {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) {
    return {
      start: () =>
        onError(
          "Speech recognition not supported. Try Chrome desktop or use text input."
        ),
      stop: () => {},
      isSupported: false,
    };
  }
  const recognition = new Ctor();
  recognition.lang = lang;
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.onresult = (event) => {
    let text = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const res = event.results[i];
      text += res[0].transcript;
    }
    onResult(text);
  };
  recognition.onerror = (e) => {
    onError(e?.error ?? "speech-error");
  };
  return {
    start: () => recognition.start(),
    stop: () => recognition.stop(),
    isSupported: true,
  };
}

export function isSpeechSupported() {
  try {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  } catch {
    return false;
  }
}
