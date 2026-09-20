import { useCallback, useRef, useState, useEffect } from 'react';
import { transcribeAudioBlob } from '../api/stt';

interface UseAudioRecorderOptions {
  onTranscriptionComplete?: (text: string) => void;
  stream?: MediaStream | null;
}

interface UseAudioRecorderResult {
  isRecording: boolean;
  isTranscribing: boolean;
  startRecording: () => Promise<boolean>;
  stopAndTranscribe: (prompt?: string) => Promise<string>;
  cancelRecording: () => void;
  audioLevel: number;
}

export function useAudioRecorder({
  onTranscriptionComplete,
  stream: externalStream,
}: UseAudioRecorderOptions = {}): UseAudioRecorderResult {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const internalStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const cleanupAudioMeter = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setAudioLevel(0);
  };

  const setupAudioMeter = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          sum += data[i];
        }
        const avg = sum / data.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch (e) {
      console.warn('Could not setup audio level meter:', e);
    }
  };

  const startRecording = useCallback(async (): Promise<boolean> => {
    if (isRecording) return true;
    audioChunksRef.current = [];

    try {
      let activeStream = externalStream;
      if (!activeStream || !activeStream.getAudioTracks().length) {
        if (!internalStreamRef.current || !internalStreamRef.current.active) {
          internalStreamRef.current = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
        }
        activeStream = internalStreamRef.current;
      }

      if (!activeStream) return false;

      setupAudioMeter(activeStream);

      // Determine best supported mime type
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/aac',
      ];
      let selectedMime = '';
      for (const m of mimeTypes) {
        if (MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }

      const recorder = selectedMime
        ? new MediaRecorder(activeStream, { mimeType: selectedMime })
        : new MediaRecorder(activeStream);

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250); // Slice every 250ms
      setIsRecording(true);
      return true;
    } catch (err) {
      console.error('Failed to start audio recording:', err);
      cleanupAudioMeter();
      setIsRecording(false);
      return false;
    }
  }, [externalStream, isRecording]);

  const stopAndTranscribe = useCallback(
    async (prompt?: string): Promise<string> => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        setIsRecording(false);
        cleanupAudioMeter();
        return '';
      }

      setIsTranscribing(true);
      setIsRecording(false);

      return new Promise<string>((resolve) => {
        recorder.onstop = async () => {
          cleanupAudioMeter();
          try {
            const blob = new Blob(audioChunksRef.current, {
              type: recorder.mimeType || 'audio/webm',
            });
            audioChunksRef.current = [];

            if (blob.size < 100) {
              setIsTranscribing(false);
              resolve('');
              return;
            }

            const text = await transcribeAudioBlob(blob, prompt);
            setIsTranscribing(false);
            if (text && onTranscriptionComplete) {
              onTranscriptionComplete(text);
            }
            resolve(text);
          } catch (err) {
            console.error('Audio transcription error:', err);
            setIsTranscribing(false);
            resolve('');
          }
        };

        try {
          recorder.stop();
        } catch (e) {
          cleanupAudioMeter();
          setIsTranscribing(false);
          resolve('');
        }
      });
    },
    [onTranscriptionComplete]
  );

  const cancelRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch (e) {}
    }
    audioChunksRef.current = [];
    cleanupAudioMeter();
    setIsRecording(false);
    setIsTranscribing(false);
  }, []);

  useEffect(() => {
    return () => {
      cancelRecording();
      if (internalStreamRef.current) {
        internalStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cancelRecording]);

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopAndTranscribe,
    cancelRecording,
    audioLevel,
  };
}
