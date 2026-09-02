import { useCallback, useState } from 'react';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useSpeechSynthesis } from './useSpeechSynthesis';
import type { TranscriptEntry } from '../types/interview';

export type ConversationStatus = 'idle' | 'listening' | 'processing' | 'speaking';

interface UseVoiceConversationOptions {
  /** Sends the candidate's text to the backend, returns the interviewer's reply text. */
  onSubmit: (text: string) => Promise<string>;
}

interface UseVoiceConversationResult {
  status: ConversationStatus;
  transcript: TranscriptEntry[];
  interimText: string;
  isSpeechSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  /** The type-instead path -- feeds the exact same processing step as a
   *  finalized voice utterance, not a separate/lesser code path. */
  submitTypedAnswer: (text: string) => void;
  /** Injects the opening interviewer line (from a session-start API call)
   *  into the transcript and speaks it, without an actual candidate turn. */
  announceOpening: (text: string) => void;
}

export function useVoiceConversation({
  onSubmit,
}: UseVoiceConversationOptions): UseVoiceConversationResult {
  const [status, setStatus] = useState<ConversationStatus>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { speak, isSupported: ttsSupported } = useSpeechSynthesis();

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
      speak(reply, () => setStatus('idle'));
    },
    [onSubmit, speak]
  );

  const { isListening, isSupported: sttSupported, interimText, start, stop } =
    useSpeechRecognition({ onFinalResult: processCandidateText });

  const startListening = useCallback(() => {
    setError(null);
    setStatus('listening');
    start();
  }, [start]);

  const stopListening = useCallback(() => {
    stop();
    setStatus('idle');
  }, [stop]);

  const submitTypedAnswer = useCallback(
    (text: string) => {
      if (isListening) stop();
      void processCandidateText(text);
    },
    [isListening, stop, processCandidateText]
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
    startListening,
    stopListening,
    submitTypedAnswer,
    announceOpening,
  };
}
