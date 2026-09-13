import { StateIndicator } from './StateIndicator';
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
  
  // Simulated Camera Stream (since this is FlowState, we show a small preview)
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }).catch(() => {
      // Ignore if no camera for mock
    });
  }, []);

  return (
    <section
      aria-label="Interviewer Panel"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <div style={{
        background: '#1A1D16',
        borderRadius: '16px',
        border: '1px solid #2A3022',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        
        {/* Header / Camera Area */}
        <div style={{ position: 'relative', background: '#000', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted 
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} // Dimmed so it's not distracting
          />
          
          {/* Interviewer State Overlay */}
          <div style={{ 
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: status === 'listening' ? 'rgba(108, 122, 99, 0.2)' : 'transparent', // Subtle sage tint when listening
            transition: 'background var(--transition-smooth)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--color-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: status === 'speaking' ? '0 0 24px var(--color-speaking)' : status === 'listening' ? '0 0 24px var(--color-accent)' : 'none',
              transition: 'box-shadow var(--transition-smooth)'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={status === 'listening' ? 'var(--color-accent)' : 'var(--color-text-secondary)'} strokeWidth="1.5">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            </div>
            
            <span style={{ 
              marginTop: 'var(--space-2)',
              fontWeight: 600, 
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontSize: 'var(--font-size-xs)'
            }}>
              {status === 'listening' ? 'Listening...' : status === 'speaking' ? 'Interviewer Speaking' : status === 'processing' ? 'Thinking...' : 'Idle'}
            </span>
          </div>
        </div>

        {/* Errors & Fallbacks */}
        {!isSpeechSupported && (
          <div style={{ padding: 'var(--space-2)', background: 'var(--color-error)', color: '#fff', fontSize: 'var(--font-size-xs)' }}>
            Voice isn't supported in this browser -- use the text field below.
          </div>
        )}
        {error && (
          <div style={{ padding: 'var(--space-2)', background: 'var(--color-error)', color: '#fff', fontSize: 'var(--font-size-xs)' }}>
            {error}
          </div>
        )}

        {/* Transcript Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', borderBottom: '1px solid #2A3022', color: '#FDFCF9' }}>
          <TranscriptLog entries={transcript} interimText={interimText} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '24px', background: '#1A1D16' }}>
          <TypeInsteadInput onSubmit={submitTypedAnswer} disabled={busy} />
        </div>

      </div>
    </section>
  );
}
