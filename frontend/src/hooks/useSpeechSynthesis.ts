import { useCallback, useEffect, useState, useRef } from 'react';
import { apiPost } from '../api/client';

interface UseSpeechSynthesisResult {
  speak: (text: string, onDone?: () => void) => void;
  cancel: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

/** 
 * Wraps our custom TTS backend (Sarvam AI). 
 * Falls back to native SpeechSynthesis if the backend fails or isn't configured.
 */
export function useSpeechSynthesis(): UseSpeechSynthesisResult {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const safetyTimeoutRef = useRef<number | null>(null);
  const isSupported = true;

  const clearSafetyTimer = () => {
    if (safetyTimeoutRef.current) {
      window.clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
  };

  const cancel = useCallback(() => {
    clearSafetyTimer();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    activeUtteranceRef.current = null;
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text: string, onDone?: () => void) => {
      cancel();
      setIsSpeaking(true);

      const handleDone = () => {
        clearSafetyTimer();
        activeUtteranceRef.current = null;
        setIsSpeaking(false);
        onDone?.();
      };

      // Safety timeout based on text length (avg speaking rate ~150 words/min = ~400ms per word)
      const estimatedDurationMs = Math.max(4000, Math.min(30000, text.split(' ').length * 450 + 2000));
      safetyTimeoutRef.current = window.setTimeout(() => {
        console.warn('TTS safety timeout triggered, releasing state.');
        handleDone();
      }, estimatedDurationMs);

      try {
        const response = await apiPost<{ audio_base64: string }>('/tts', { text });
        if (response.audio_base64) {
          const audio = new Audio(`data:audio/wav;base64,${response.audio_base64}`);
          audioRef.current = audio;
          audio.onended = handleDone;
          audio.onerror = handleDone;
          await audio.play();
          return;
        }
      } catch (error) {
        // Backend TTS unavailable, use native browser synthesis
      }

      // Native SpeechSynthesis fallback
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        activeUtteranceRef.current = utterance; // Prevent V8 garbage collection

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice =
          voices.find(
            (v) =>
              v.name.includes('Google') ||
              v.name.includes('Natural') ||
              v.name.includes('Microsoft Zira') ||
              v.name.includes('Microsoft Mark') ||
              v.name.includes('Siri')
          ) || voices.find((v) => v.lang.startsWith('en'));

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        utterance.rate = 1.05;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
          setIsSpeaking(true);
        };
        utterance.onend = handleDone;
        utterance.onerror = handleDone;

        // Chromium bug workaround: force resume before speaking
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } else {
        handleDone();
      }
    },
    [cancel]
  );

  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return { speak, cancel, isSpeaking, isSupported };
}
