import { useEffect, useRef, useState } from "react";

const useSpeechRecognition = (lang = "en-US") => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(false);
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef(null);

  // Initialize recognition once on mount (client only)
  useEffect(() => {
    const hasWindow = typeof window !== "undefined";
    const SR =
      hasWindow && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (SR) {
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = lang;
      setSupported(true);

      // Basic lifecycle handlers
      recognitionRef.current.onresult = (event) => {
        const res = event.results;
        let interimText = "";
        let finalText = "";
        for (let i = event.resultIndex; i < res.length; i++) {
          const t = res[i][0].transcript;
          if (res[i].isFinal) finalText += t;
          else interimText += t;
        }
        if (interimText) setInterim(interimText);
        if (finalText) {
          setTranscript(finalText);
          setInterim("");
          setListening(false);
        }
      };
      recognitionRef.current.onerror = () => {
        setListening(false);
      };
      recognitionRef.current.onend = () => {
        setListening(false);
      };
    } else {
      setSupported(false);
    }
    // no cleanup instance to keep between calls
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update recognition language when `lang` changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang;
    }
  }, [lang]);

  const startListening = () => {
    if (!recognitionRef.current) return false;
    setTranscript("");
    setInterim("");
    recognitionRef.current.start();
    setListening(true);
    return true;
  };

  return { transcript, interim, listening, startListening, supported };
};

export default useSpeechRecognition;
