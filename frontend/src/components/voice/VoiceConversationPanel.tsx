import { TranscriptLog } from './TranscriptLog';
import { TypeInsteadInput } from './TypeInsteadInput';
import type { useVoiceConversation } from '../../hooks/useVoiceConversation';
import { useEffect, useRef } from 'react';

interface VoiceConversationPanelProps {
  conversation: ReturnType<typeof useVoiceConversation>;
}

export function VoiceConversationPanel({ conversation }: VoiceConversationPanelProps) {
  const {
    status,
    transcript,
    interimText,
    isListening,
    isRecordingAudio,
    isTranscribingAudio,
    error,
    submitTypedAnswer,
    finalizeSpeech,
    startListening,
    startAudioRecording,
    stopAudioRecording,
  } = conversation;

  const busy = status === 'processing' || isTranscribingAudio;

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let isMounted = true;

    navigator.mediaDevices
      ?.getUserMedia?.({ video: true, audio: false })
      .then((stream) => {
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        // Ignore if camera permission rejected
      });

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'speaking':
        return '#B28B6A';
      case 'listening':
        return '#4EAA78';
      case 'recording':
        return '#E5534B';
      case 'processing':
        return '#E5A93C';
      default:
        return '#808877';
    }
  };

  const statusColor = getStatusColor();

  return (
    <section
      aria-label="Interviewer Panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#1A1D16',
        borderRadius: '16px',
        border: '1px solid #2A3022',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Spacious Interviewer Video & Status Area */}
      <div
        style={{
          position: 'relative',
          background: '#0E110A',
          height: '140px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #2A3022',
          overflow: 'hidden',
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.35,
            transform: 'scaleX(-1)',
          }}
        />

        {/* Ambient glow behind badge */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              status === 'speaking'
                ? 'radial-gradient(circle at center, rgba(178, 139, 106, 0.18) 0%, transparent 70%)'
                : status === 'listening'
                ? 'radial-gradient(circle at center, rgba(78, 170, 120, 0.18) 0%, transparent 70%)'
                : status === 'recording'
                ? 'radial-gradient(circle at center, rgba(229, 83, 75, 0.2) 0%, transparent 70%)'
                : 'transparent',
            transition: 'background 0.4s ease',
          }}
        />

        {/* Overlay Badge with Speaking Orb & State */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 18px',
            background: 'rgba(22, 25, 18, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '28px',
            border: `1px solid ${statusColor}`,
            boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
            transition: 'all 0.3s ease',
          }}
        >
          {/* Animated Status Icon */}
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#12150E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: statusColor,
            }}
          >
            {status === 'speaking' ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            ) : status === 'recording' ? (
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E5534B' }} />
            ) : status === 'listening' ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 14 14" />
              </svg>
            )}
          </div>

          <span
            style={{
              fontWeight: 600,
              color: '#FDFCF9',
              fontSize: '0.8rem',
              letterSpacing: '0.03em',
            }}
          >
            {isTranscribingAudio
              ? 'Transcribing audio...'
              : status === 'listening'
              ? (interimText ? 'Hearing you speak...' : 'Listening...')
              : status === 'recording'
              ? 'Recording...'
              : status === 'speaking'
              ? 'Interviewer Speaking'
              : status === 'processing'
              ? 'Evaluating...'
              : 'Ready'}
          </span>

          {interimText && (
            <button
              type="button"
              onClick={finalizeSpeech}
              style={{
                marginLeft: '4px',
                padding: '3px 10px',
                background: '#4EAA78',
                color: '#FFF',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Done ↵
            </button>
          )}

          {isRecordingAudio && (
            <button
              type="button"
              onClick={() => stopAudioRecording()}
              style={{
                marginLeft: '4px',
                padding: '3px 10px',
                background: '#E5534B',
                color: '#FFF',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Send ✓
            </button>
          )}

          {!isListening && !isRecordingAudio && status !== 'speaking' && (
            <button
              type="button"
              onClick={startListening}
              style={{
                marginLeft: '4px',
                padding: '3px 10px',
                background: '#4EAA78',
                color: '#FFF',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🎙️ Speak
            </button>
          )}
        </div>
      </div>

      {/* Errors & Fallbacks */}
      {error && (
        <div
          style={{
            padding: '8px 14px',
            background: '#3A1E1D',
            color: '#FFB8B0',
            fontSize: '0.78rem',
            borderBottom: '1px solid #6E2D27',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => startAudioRecording()}
            style={{
              padding: '2px 8px',
              background: '#6E2D27',
              color: '#FFF',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.72rem',
              cursor: 'pointer',
            }}
          >
            Record
          </button>
        </div>
      )}

      {/* Transcript Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 18px',
          borderBottom: '1px solid #2A3022',
          minHeight: 0,
        }}
      >
        <TranscriptLog entries={transcript} interimText={interimText} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '12px 16px', background: '#161912' }}>
        <TypeInsteadInput onSubmit={submitTypedAnswer} disabled={busy} />
      </div>
    </section>
  );
}
