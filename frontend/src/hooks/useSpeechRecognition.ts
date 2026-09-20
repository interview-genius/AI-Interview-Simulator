import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSpeechRecognitionOptions {
  onFinalResult: (text: string) => void;
  silenceTimeoutMs?: number;
}

interface UseSpeechRecognitionResult {
  isListening: boolean;
  isSupported: boolean;
  interimText: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  finalizeUtterance: () => void;
  resetInterim: () => void;
}

export function useSpeechRecognition({
  onFinalResult,
  silenceTimeoutMs = 5000,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const restartTimerRef = useRef<number | null>(null);
  const accumulatedRef = useRef('');
  const currentInterimRef = useRef('');
  const latestTranscriptRef = useRef('');
  const shouldBeListeningRef = useRef(false);
  const onFinalResultRef = useRef(onFinalResult);

  // Keep latest callback ref to prevent stale closures
  useEffect(() => {
    onFinalResultRef.current = onFinalResult;
  }, [onFinalResult]);

  const RecognitionCtor =
    typeof window !== 'undefined'
      ? (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
      : undefined;
  const isSupported = Boolean(RecognitionCtor);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current !== null) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const finalizeUtterance = useCallback(() => {
    clearSilenceTimer();
    const text = latestTranscriptRef.current.trim();
    accumulatedRef.current = '';
    currentInterimRef.current = '';
    latestTranscriptRef.current = '';
    setInterimText('');
    if (text) {
      onFinalResultRef.current(text);
    }
  }, [clearSilenceTimer]);

  const resetInterim = useCallback(() => {
    clearSilenceTimer();
    accumulatedRef.current = '';
    currentInterimRef.current = '';
    latestTranscriptRef.current = '';
    setInterimText('');
  }, [clearSilenceTimer]);

  const createAndStartRecognition = useCallback(() => {
    if (!RecognitionCtor || !shouldBeListeningRef.current) return;

    // Clean up any existing instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }

    try {
      const recognition = new RecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        if (shouldBeListeningRef.current) {
          setIsListening(true);
          setError(null);
        }
      };

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptChunk = result[0].transcript;
          if (result.isFinal) {
            accumulatedRef.current = (accumulatedRef.current + ' ' + transcriptChunk).trim();
            currentInterimRef.current = '';
          } else {
            currentInterimRef.current = transcriptChunk;
          }
        }

        const fullText = (accumulatedRef.current + ' ' + currentInterimRef.current).trim();
        latestTranscriptRef.current = fullText;
        setInterimText(fullText);

        clearSilenceTimer();
        if (fullText) {
          // Generous silence timeout (5s) so the user is never cut off while thinking/pausing
          silenceTimerRef.current = window.setTimeout(() => {
            finalizeUtterance();
          }, silenceTimeoutMs);
        }
      };

      recognition.onerror = (event: any) => {
        const errType = event.error;
        console.warn('[SpeechRecognition error]:', errType);

        if (errType === 'no-speech') {
          // Normal timeout when candidate doesn't speak. Keep accumulated speech intact!
          return;
        }

        if (errType === 'aborted') {
          return;
        }

        if (errType === 'not-allowed') {
          setError('Microphone permission blocked. Please allow microphone access in browser.');
          shouldBeListeningRef.current = false;
          setIsListening(false);
          return;
        }

        if (errType === 'audio-capture') {
          setError('Microphone not detected or busy. You can use Whisper recording or type below.');
          shouldBeListeningRef.current = false;
          setIsListening(false);
          return;
        }

        if (errType === 'network' || errType === 'service-not-allowed') {
          setError('Browser speech service network issue. You can use Whisper recording or type below.');
          return;
        }
      };

      recognition.onend = () => {
        if (shouldBeListeningRef.current) {
          clearRestartTimer();
          // Spawn a fresh instance while keeping accumulatedRef.current intact!
          restartTimerRef.current = window.setTimeout(() => {
            if (shouldBeListeningRef.current) {
              createAndStartRecognition();
            } else {
              setIsListening(false);
            }
          }, 150);
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Failed to start SpeechRecognition:', err);
      if (shouldBeListeningRef.current) {
        clearRestartTimer();
        restartTimerRef.current = window.setTimeout(() => {
          if (shouldBeListeningRef.current) {
            createAndStartRecognition();
          }
        }, 500);
      } else {
        setIsListening(false);
      }
    }
  }, [RecognitionCtor, clearRestartTimer, clearSilenceTimer, finalizeUtterance, silenceTimeoutMs]);

  const start = useCallback(() => {
    shouldBeListeningRef.current = true;
    clearRestartTimer();
    createAndStartRecognition();
  }, [clearRestartTimer, createAndStartRecognition]);

  const stop = useCallback(() => {
    shouldBeListeningRef.current = false;
    clearRestartTimer();
    clearSilenceTimer();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, [clearRestartTimer, clearSilenceTimer]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isListening,
    isSupported,
    interimText,
    error,
    start,
    stop,
    finalizeUtterance,
    resetInterim,
  };
}
