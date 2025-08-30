import { useCallback, useEffect, useState } from "react";

const useSpeechSynthesis = () => {
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    const hasWindow = typeof window !== "undefined";
    setSupported(Boolean(hasWindow && window.speechSynthesis));
  }, []);

  const speak = useCallback(
    (text) => {
      if (!text || !supported) return false;
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        // Use default voice; browsers decide. Avoid long queues.
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        return true;
      } catch {
        return false;
      }
    },
    [supported]
  );

  return { speak, supported };
};

export default useSpeechSynthesis;
