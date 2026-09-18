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
  const isSupported = true; // Our backend is always supported

  const speak = useCallback(
    async (text: string, onDone?: () => void) => {
      setIsSpeaking(true);
      try {
        const response = await apiPost<{ audio_base64: string }>('/tts', { text });
        if (response.audio_base64) {
          const audio = new Audio(`data:audio/wav;base64,${response.audio_base64}`);
          audioRef.current = audio;
          audio.onended = () => {
            setIsSpeaking(false);
            onDone?.();
          };
          audio.onerror = () => {
            console.error("Audio playback error");
            setIsSpeaking(false);
            onDone?.();
          };
          await audio.play();
        } else {
          throw new Error("No audio returned");
        }
      } catch (error) {
        console.error("TTS Backend failed, falling back to native:", error);
        // Fallback to native speech synthesis
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          
          const voices = window.speechSynthesis.getVoices();
          const preferredVoice = voices.find(v => 
            v.name.includes('Google') || 
            v.name.includes('Microsoft Zira') || 
            v.name.includes('Microsoft Mark') ||
            v.name.includes('Siri')
          ) || voices.find(v => v.lang.startsWith('en'));
          
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
          
          utterance.onstart = () => setIsSpeaking(true);
          utterance.onend = () => {
            setIsSpeaking(false);
            onDone?.();
          };
          utterance.onerror = () => {
            setIsSpeaking(false);
            onDone?.();
          };
          window.speechSynthesis.speak(utterance);
        } else {
          setIsSpeaking(false);
          onDone?.();
        }
      }
    },
    []
  );

  const cancel = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return { speak, cancel, isSpeaking, isSupported };
}
