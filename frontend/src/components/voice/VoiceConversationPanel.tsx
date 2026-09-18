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
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let isMounted = true;

    navigator.mediaDevices
      ?.getUserMedia?.({ video: true })
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
        // Ignore if no camera or permission denied
      });

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
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
      {/* Spacious Interviewer Video & Status Area */}
      <div
        style={{
          position: 'relative',
          background: '#0E110A',
          height: '135px',
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
                ? 'radial-gradient(circle at center, rgba(108, 122, 99, 0.18) 0%, transparent 70%)'
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
            padding: '10px 20px',
            background: 'rgba(22, 25, 18, 0.85)',
            backdropFilter: 'blur(10px)',
            borderRadius: '28px',
            border: `1px solid ${status === 'speaking' || status === 'listening' ? statusColor : '#363E2F'}`,
            boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
            transition: 'all 0.3s ease',
          }}
        >
          {/* Animated Status Orb */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#12150E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow:
                status === 'speaking'
                  ? '0 0 16px rgba(178, 139, 106, 0.7)'
                  : status === 'listening'
                  ? '0 0 16px rgba(108, 122, 99, 0.7)'
                  : 'none',
              transition: 'box-shadow 0.3s ease',
            }}
          >
            <svg
              width="18"
              height="18"
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
              fontSize: '0.8rem',
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

      {/* Transcript Area - Full height with comfortable spacing */}
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
