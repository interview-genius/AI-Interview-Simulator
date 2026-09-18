import { useCallback, useState, useEffect, useRef } from 'react';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useSpeechSynthesis } from './useSpeechSynthesis';
import type { TranscriptEntry } from '../types/interview';

export type ConversationStatus = 'idle' | 'listening' | 'processing' | 'speaking';

interface UseVoiceConversationOptions {
  onSubmit: (text: string) => Promise<string>;
}

interface UseVoiceConversationResult {
  status: ConversationStatus;
  transcript: TranscriptEntry[];
  interimText: string;
  isSpeechSupported: boolean;
  error: string | null;
  submitTypedAnswer: (text: string) => void;
  announceOpening: (text: string) => void;
}

export function useVoiceConversation({
  onSubmit,
}: UseVoiceConversationOptions): UseVoiceConversationResult {
  const [status, setStatus] = useState<ConversationStatus>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { speak, isSupported: ttsSupported, isSpeaking } = useSpeechSynthesis();

  const processCandidateText = useCallback(
    async (text: string) => {
      setError(null);
      setTranscript((prev) => [...prev, { speaker: 'candidate', text }]);
      setStatus('processing');

      let reply: string;
      try {
        reply = await onSubmit(text);
      } catch {
        setError('Something went wrong reaching the interviewer -- please try again.');
        setStatus('idle');
        return;
      }

      setTranscript((prev) => [...prev, { speaker: 'interviewer', text: reply }]);
      setStatus('speaking');
      speak(reply, () => {
        setStatus('idle');
      });
    },
    [onSubmit, speak]
  );

  const { isSupported: sttSupported, interimText, start, stop } =
    useSpeechRecognition({ onFinalResult: processCandidateText, silenceTimeoutMs: 8000 });

  // Auto-manage listening state
  useEffect(() => {
    if (status === 'idle') {
      setStatus('listening');
      start();
    } else if (status === 'processing' || status === 'speaking') {
      stop();
    }
  }, [status, start, stop]);

  // When TTS stops, if we were speaking, go back to idle (which triggers listening)
  useEffect(() => {
    if (status === 'speaking' && !isSpeaking) {
      setStatus('idle');
    }
  }, [isSpeaking, status]);

  const proactiveSilenceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (status === 'listening') {
      const resetTimer = () => {
        if (proactiveSilenceTimerRef.current) window.clearTimeout(proactiveSilenceTimerRef.current);
        proactiveSilenceTimerRef.current = window.setTimeout(() => {
          stop();
          void processCandidateText('[SILENCE]');
        }, 15000); // 15 seconds of silence
      };

      resetTimer();

      return () => {
        if (proactiveSilenceTimerRef.current) window.clearTimeout(proactiveSilenceTimerRef.current);
      };
    }
  }, [status, interimText, stop, processCandidateText]);

  const submitTypedAnswer = useCallback(
    (text: string) => {
      stop();
      void processCandidateText(text);
    },
    [stop, processCandidateText]
  );

  const announceOpening = useCallback(
    (text: string) => {
      setTranscript((prev) => [...prev, { speaker: 'interviewer', text }]);
      setStatus('speaking');
      speak(text, () => setStatus('idle'));
    },
    [speak]
  );

  return {
    status,
    transcript,
    interimText,
    isSpeechSupported: sttSupported && ttsSupported,
    error,
    submitTypedAnswer,
    announceOpening,
  };
}
