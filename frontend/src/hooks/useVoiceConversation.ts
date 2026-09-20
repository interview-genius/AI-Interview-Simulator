import { useCallback, useState, useEffect } from 'react';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useSpeechSynthesis } from './useSpeechSynthesis';
import { useAudioRecorder } from './useAudioRecorder';
import type { TranscriptEntry } from '../types/interview';

export type ConversationStatus = 'idle' | 'listening' | 'recording' | 'processing' | 'speaking';

interface UseVoiceConversationOptions {
  onSubmit: (text: string) => Promise<string>;
  stream?: MediaStream | null;
}

interface UseVoiceConversationResult {
  status: ConversationStatus;
  transcript: TranscriptEntry[];
  interimText: string;
  isListening: boolean;
  isRecordingAudio: boolean;
  isTranscribingAudio: boolean;
  isSpeechSupported: boolean;
  audioLevel: number;
  error: string | null;
  submitTypedAnswer: (text: string) => void;
  finalizeSpeech: () => void;
  resetInterim: () => void;
  announceOpening: (text: string) => void;
  startListening: () => void;
  stopListening: () => void;
  startAudioRecording: () => Promise<boolean>;
  stopAudioRecording: () => Promise<void>;
  cancelTTS: () => void;
}

export function useVoiceConversation({
  onSubmit,
  stream,
}: UseVoiceConversationOptions): UseVoiceConversationResult {
  const [status, setStatus] = useState<ConversationStatus>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [turnError, setTurnError] = useState<string | null>(null);

  const { speak, cancel: cancelTTS, isSupported: ttsSupported, isSpeaking } = useSpeechSynthesis();

  const processCandidateText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setTurnError(null);
      setTranscript((prev) => [...prev, { speaker: 'candidate', text: trimmed }]);
      setStatus('processing');

      let reply: string;
      try {
        reply = await onSubmit(trimmed);
      } catch (err: any) {
        console.error('Error in onSubmit turn:', err);
        setTurnError('Failed to receive response from interviewer. Please try again or type below.');
        setStatus('idle');
        return;
      }

      setTranscript((prev) => [...prev, { speaker: 'interviewer', text: reply }]);
      setStatus('speaking');
      speak(reply, () => {
        setStatus('listening');
      });
    },
    [onSubmit, speak]
  );

  const {
    isListening,
    isSupported: sttSupported,
    interimText,
    error: recognitionError,
    start: startSTT,
    stop: stopSTT,
    finalizeUtterance,
    resetInterim,
  } = useSpeechRecognition({
    onFinalResult: processCandidateText,
    silenceTimeoutMs: 5000,
  });

  const {
    isRecording: isRecordingAudio,
    isTranscribing: isTranscribingAudio,
    startRecording,
    stopAndTranscribe,
    cancelRecording,
    audioLevel,
  } = useAudioRecorder({
    stream,
    onTranscriptionComplete: (text) => {
      if (text) {
        processCandidateText(text);
      }
    },
  });

  // State-driven SpeechRecognition management
  useEffect(() => {
    if (status === 'listening') {
      startSTT();
    } else if (status === 'processing' || status === 'speaking' || status === 'recording') {
      stopSTT();
    }
  }, [status, startSTT, stopSTT]);

  // When TTS stops speaking, automatically transition to listening
  useEffect(() => {
    if (status === 'speaking' && !isSpeaking) {
      setStatus('listening');
    }
  }, [isSpeaking, status]);

  const submitTypedAnswer = useCallback(
    (text: string) => {
      stopSTT();
      cancelRecording();
      cancelTTS();
      resetInterim();
      void processCandidateText(text);
    },
    [stopSTT, cancelRecording, cancelTTS, resetInterim, processCandidateText]
  );

  const finalizeSpeech = useCallback(() => {
    finalizeUtterance();
  }, [finalizeUtterance]);

  const startAudioRecording = useCallback(async (): Promise<boolean> => {
    cancelTTS();
    stopSTT();
    setStatus('recording');
    const started = await startRecording();
    if (!started) {
      setStatus('listening');
    }
    return started;
  }, [cancelTTS, stopSTT, startRecording]);

  const stopAudioRecording = useCallback(async () => {
    setStatus('processing');
    const transcribedText = await stopAndTranscribe();
    if (!transcribedText) {
      setStatus('listening');
    }
  }, [stopAndTranscribe]);

  const announceOpening = useCallback(
    (text: string) => {
      setTranscript((prev) => [...prev, { speaker: 'interviewer', text }]);
      setStatus('speaking');
      speak(text, () => {
        setStatus('listening');
      });
    },
    [speak]
  );

  const startListening = useCallback(() => {
    cancelTTS();
    setStatus('listening');
    startSTT();
  }, [cancelTTS, startSTT]);

  const stopListening = useCallback(() => {
    stopSTT();
    cancelRecording();
    setStatus('idle');
  }, [stopSTT, cancelRecording]);

  const activeError = turnError || recognitionError;

  return {
    status,
    transcript,
    interimText,
    isListening,
    isRecordingAudio,
    isTranscribingAudio,
    isSpeechSupported: sttSupported && ttsSupported,
    audioLevel,
    error: activeError,
    submitTypedAnswer,
    finalizeSpeech,
    resetInterim,
    announceOpening,
    startListening,
    stopListening,
    startAudioRecording,
    stopAudioRecording,
    cancelTTS,
  };
}
