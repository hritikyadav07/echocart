import { useEffect, useRef } from "react";
import { createSpeechController } from "../lib/speech.js";

export function SpeechWire({ language, onTranscript, onFinal, onController }) {
  const onTranscriptRef = useRef(onTranscript);
  const onFinalRef = useRef(onFinal);
  const onControllerRef = useRef(onController);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);
  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);
  useEffect(() => {
    onControllerRef.current = onController;
  }, [onController]);

  useEffect(() => {
    const controller = createSpeechController(
      (text) => {
        onTranscriptRef.current(text);
        if (/\.\s*$/.test(text)) onFinalRef.current(text.replace(/\.$/, ""));
      },
      (err) => {
        console.error("[EchoCart][ui] speech error", err);
      },
      language
    );
    onControllerRef.current(controller);
    return () => controller.stop();
  }, [language]);
  return null;
}
