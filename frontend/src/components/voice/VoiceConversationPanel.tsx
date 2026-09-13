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
    isSpeechSupported,
    error,
    submitTypedAnswer,
  } = conversation;

  const busy = status === 'processing' || status === 'speaking';

  // Simulated Camera Stream
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    navigator.mediaDevices?.getUserMedia?.({ video: true }).then((stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }).catch(() => {
      // Ignore if no camera
    });
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'speaking':
        return '#B28B6A';
      case 'listening':
        return '#6C7A63';
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
      {/* Reduced Height Interviewer Indicator & Camera Area */}
      <div
        style={{
          position: 'relative',
          background: '#0E110A',
          height: '100px',
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
            opacity: 0.25,
          }}
        />

        {/* Overlay with Status & Speaking Orb */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 16px',
            background: 'rgba(26, 29, 22, 0.75)',
            backdropFilter: 'blur(8px)',
            borderRadius: '24px',
            border: `1px solid ${status === 'speaking' || status === 'listening' ? statusColor : '#2A3022'}`,
            transition: 'border-color 0.3s ease',
          }}
        >
          {/* Animated Status Orb */}
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#12150E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow:
                status === 'speaking'
                  ? '0 0 14px rgba(178, 139, 106, 0.6)'
                  : status === 'listening'
                  ? '0 0 14px rgba(108, 122, 99, 0.6)'
                  : 'none',
              transition: 'box-shadow 0.3s ease',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke={statusColor}
              strokeWidth="2"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </div>

          <span
            style={{
              fontWeight: 600,
              color: '#FDFCF9',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontSize: '0.75rem',
            }}
          >
            {status === 'listening'
              ? 'Listening...'
              : status === 'speaking'
              ? 'Interviewer Speaking'
              : status === 'processing'
              ? 'Thinking...'
              : 'Interviewer Ready'}
          </span>
        </div>
      </div>

      {/* Errors & Fallbacks */}
      {!isSpeechSupported && (
        <div style={{ padding: '6px 12px', background: 'var(--color-error)', color: '#fff', fontSize: '0.75rem' }}>
          Voice isn't supported in this browser -- use the text field below.
        </div>
      )}
      {error && (
        <div style={{ padding: '6px 12px', background: 'var(--color-error)', color: '#fff', fontSize: '0.75rem' }}>
          {error}
        </div>
      )}

      {/* Transcript Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
          borderBottom: '1px solid #2A3022',
          minHeight: 0,
        }}
      >
        <TranscriptLog entries={transcript} interimText={interimText} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '10px 14px', background: '#161912' }}>
        <TypeInsteadInput onSubmit={submitTypedAnswer} disabled={busy} />
      </div>
    </section>
  );
}
