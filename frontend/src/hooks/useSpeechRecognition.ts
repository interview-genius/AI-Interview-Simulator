import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSpeechRecognitionOptions {
  onFinalResult: (text: string) => void;
  silenceTimeoutMs?: number;
}

interface UseSpeechRecognitionResult {
  isListening: boolean;
  isSupported: boolean;
  interimText: string;
  start: () => void;
  stop: () => void;
}

/**
 * Wraps the browser's native SpeechRecognition. Endpointing is a simple
 * silence-timeout: after `silenceTimeoutMs` with no new interim result, the
 * accumulated text is treated as one finished utterance. `isSupported` is
 * surfaced explicitly (not swallowed) so the UI can visibly fall back to
 * typed input on browsers without support, rather than silently doing
 * nothing when a user taps the mic.
 */
export function useSpeechRecognition({
  onFinalResult,
  silenceTimeoutMs = 1500,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const accumulatedRef = useRef('');

  const RecognitionCtor =
    typeof window !== 'undefined'
      ? window.SpeechRecognition ?? window.webkitSpeechRecognition
      : undefined;
  const isSupported = Boolean(RecognitionCtor);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current !== null) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const finalizeUtterance = useCallback(() => {
    const text = accumulatedRef.current.trim();
    accumulatedRef.current = '';
    setInterimText('');
    if (text) {
      onFinalResult(text);
    }
  }, [onFinalResult]);

  const start = useCallback(() => {
    if (!RecognitionCtor || isListening) return;

    const recognition = new RecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          accumulatedRef.current += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimText(accumulatedRef.current + interim);

      clearSilenceTimer();
      silenceTimerRef.current = window.setTimeout(finalizeUtterance, silenceTimeoutMs);
    };

    // "no-speech" fires routinely during normal pauses -- not a real
    // failure. The silence timer, not this handler, ends a turn.
    recognition.onerror = () => {};
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [RecognitionCtor, isListening, clearSilenceTimer, finalizeUtterance, silenceTimeoutMs]);

  const stop = useCallback(() => {
    clearSilenceTimer();
    recognitionRef.current?.stop();
    setIsListening(false);
  }, [clearSilenceTimer]);

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      recognitionRef.current?.stop();
    };
  }, [clearSilenceTimer]);

  return { isListening, isSupported, interimText, start, stop };
}
