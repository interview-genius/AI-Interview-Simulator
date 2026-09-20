import { useEffect, useRef, useState } from 'react';
import type { useVoiceConversation } from '../../hooks/useVoiceConversation';
import { TypeInsteadInput } from './TypeInsteadInput';
import { TranscriptLog } from './TranscriptLog';

interface ConversationalInterviewLayoutProps {
  conversation: ReturnType<typeof useVoiceConversation>;
  company: string;
  role: string;
  level: string;
  roundTitle: string;
  phase: string | null;
  onEndInterview: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function ConversationalInterviewLayout({
  conversation,
  company,
  role,
  level,
  roundTitle,
  phase,
  onEndInterview,
  isFullscreen,
  onToggleFullscreen,
}: ConversationalInterviewLayoutProps) {
  const {
    status,
    transcript,
    interimText,
    isListening,
    isRecordingAudio,
    isTranscribingAudio,
    audioLevel,
    error,
    submitTypedAnswer,
    finalizeSpeech,
    resetInterim,
    startListening,
    startAudioRecording,
    stopAudioRecording,
  } = conversation;

  const busy = status === 'processing' || isTranscribingAudio;
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  // Initialize webcam video stream cleanly
  useEffect(() => {
    let isMounted = true;

    navigator.mediaDevices
      ?.getUserMedia?.({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false, // Keep video separate to avoid exclusive audio driver locking
      })
      .then((stream) => {
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCamera(true);
      })
      .catch((err) => {
        console.warn('Camera access request rejected:', err);
        if (isMounted) {
          setCameraError(true);
        }
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
        return '#B28B6A'; // Terracotta
      case 'listening':
        return '#4EAA78'; // Active Emerald
      case 'recording':
        return '#E5534B'; // Recording Red
      case 'processing':
        return '#E5A93C'; // Amber
      default:
        return '#6C7A63'; // Sage
    }
  };

  const statusColor = getStatusColor();

  const getStatusText = () => {
    if (isTranscribingAudio) {
      return 'Transcribing audio with Whisper...';
    }
    switch (status) {
      case 'speaking':
        return 'Interviewer is speaking...';
      case 'recording':
        return 'Recording audio... Speak your answer';
      case 'listening':
        return interimText
          ? 'Hearing you speak...'
          : 'Listening... (Speak or click Done Speaking)';
      case 'processing':
        return 'Evaluating your response...';
      default:
        return 'Ready · Waiting for your response';
    }
  };

  return (
    <main
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        background: '#12150E',
        color: '#FDFCF9',
        padding: '16px 24px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Top Navigation Bar */}
      <header
        style={{
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          background: '#1A1D16',
          padding: '10px 20px',
          borderRadius: '12px',
          border: '1px solid #2A3022',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <h1
            style={{
              fontSize: '1.2rem',
              fontFamily: 'var(--font-family-heading)',
              margin: 0,
              fontWeight: 600,
              color: '#FDFCF9',
              letterSpacing: '-0.01em',
            }}
          >
            {roundTitle}
          </h1>
          <span style={{ color: '#47523E' }}>|</span>
          <p style={{ color: '#808877', fontSize: '0.85rem', margin: 0, fontWeight: 500 }}>
            {company} · {role} · {level}
          </p>
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {phase && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 14px',
                background: '#252A20',
                border: '1px solid #363E2F',
                borderRadius: '16px',
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.78rem',
                color: '#8DA382',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#6C7A63',
                  boxShadow: '0 0 6px rgba(108,122,99,0.8)',
                }}
              />
              {phase.replace(/_/g, ' ')}
            </div>
          )}

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: isFullscreen ? '#2D3525' : '#252A20',
              color: isFullscreen ? '#4EAA78' : '#B6BDAD',
              border: `1px solid ${isFullscreen ? '#4EAA78' : '#363E2F'}`,
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isFullscreen ? (
                <>
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </>
              ) : (
                <>
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </>
              )}
            </svg>
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Full Screen'}</span>
          </button>

          {/* End Interview */}
          <button
            type="button"
            onClick={onEndInterview}
            style={{
              padding: '6px 16px',
              background: '#B24538',
              color: '#FFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(178, 69, 56, 0.3)',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#C95345')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#B24538')}
          >
            End Interview
          </button>
        </div>
      </header>

      {/* Main Grid: Prominent Video (Left) + Interviewer & Conversation Stream (Right) */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '20px',
          minHeight: 0,
          boxSizing: 'border-box',
        }}
      >
        {/* LEFT COLUMN: Prominent Candidate Camera Feed */}
        <section
          aria-label="Candidate Video Stream"
          style={{
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            background: '#1A1D16',
            borderRadius: '16px',
            border: `1px solid ${status === 'listening' ? 'rgba(78, 170, 120, 0.5)' : status === 'recording' ? 'rgba(229, 83, 75, 0.6)' : '#2A3022'}`,
            overflow: 'hidden',
            boxShadow: status === 'listening' ? '0 0 24px rgba(78, 170, 120, 0.15)' : status === 'recording' ? '0 0 24px rgba(229, 83, 75, 0.2)' : '0 8px 32px rgba(0,0,0,0.4)',
            transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
          }}
        >
          {/* Main Video Area */}
          <div
            style={{
              position: 'relative',
              flex: 1,
              width: '100%',
              background: '#0B0D08',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)', // Mirror mode for natural self-view
                display: hasCamera ? 'block' : 'none',
              }}
            />

            {/* Camera Fallback / Placeholder */}
            {!hasCamera && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                  color: '#808877',
                }}
              >
                <div
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    background: '#1F241A',
                    border: '2px solid #363E2F',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#B6BDAD',
                  }}
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontWeight: 500, color: '#FDFCF9', fontSize: '0.95rem' }}>Candidate Camera</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#808877' }}>
                    {cameraError ? 'Camera access not granted · Voice & typing active' : 'Connecting camera stream...'}
                  </p>
                </div>
              </div>
            )}

            {/* Top Left: Live Status Pill */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                background: 'rgba(18, 21, 14, 0.85)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: '#FDFCF9',
                zIndex: 2,
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: hasCamera ? '#4EAA78' : '#808877',
                  boxShadow: hasCamera ? '0 0 8px #4EAA78' : 'none',
                }}
              />
              <span>YOU {hasCamera ? '· LIVE' : ''}</span>
            </div>

            {/* Top Right: Live Volume Visualizer */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                background: 'rgba(18, 21, 14, 0.85)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                border: `1px solid ${audioLevel > 10 || isListening ? '#4EAA78' : 'rgba(255, 255, 255, 0.08)'}`,
                fontSize: '0.78rem',
                color: audioLevel > 10 ? '#4EAA78' : '#B6BDAD',
                zIndex: 2,
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '14px' }}>
                <span style={{ width: '2.5px', height: `${Math.max(4, (audioLevel / 100) * 14)}px`, background: 'currentColor', borderRadius: '1px', transition: 'height 0.1s' }} />
                <span style={{ width: '2.5px', height: `${Math.max(4, (audioLevel / 80) * 14)}px`, background: 'currentColor', borderRadius: '1px', transition: 'height 0.1s' }} />
                <span style={{ width: '2.5px', height: `${Math.max(4, (audioLevel / 60) * 14)}px`, background: 'currentColor', borderRadius: '1px', transition: 'height 0.1s' }} />
              </div>
              <span>{isRecordingAudio ? 'REC LIVE' : isListening ? 'MIC ACTIVE' : 'MIC READY'}</span>
            </div>

            {/* Interim Real-time Speech Subtitle overlay */}
            {interimText && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '80px',
                  maxWidth: '88%',
                  padding: '12px 20px',
                  background: 'rgba(18, 21, 14, 0.94)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: '16px',
                  border: '1px solid rgba(178, 139, 106, 0.7)',
                  color: '#FDFCF9',
                  fontSize: '0.94rem',
                  lineHeight: 1.45,
                  zIndex: 3,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div>
                  <span style={{ color: '#B28B6A', fontWeight: 600, marginRight: '6px' }}>Speaking:</span>
                  <span>"{interimText}"</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={resetInterim}
                    style={{
                      padding: '4px 10px',
                      background: '#252A20',
                      color: '#808877',
                      border: '1px solid #363E2F',
                      borderRadius: '10px',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                    }}
                  >
                    Clear ↺
                  </button>
                  <button
                    type="button"
                    onClick={finalizeSpeech}
                    style={{
                      padding: '4px 14px',
                      background: '#4EAA78',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Send Answer ↵
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Center: Action State & Mic Controls */}
            <div
              style={{
                position: 'absolute',
                bottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 18px',
                background: 'rgba(22, 25, 18, 0.92)',
                backdropFilter: 'blur(12px)',
                borderRadius: '30px',
                border: `1px solid ${statusColor}`,
                boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 16px ${statusColor}33`,
                zIndex: 2,
                transition: 'all 0.3s ease',
              }}
            >
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                ) : status === 'recording' ? (
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#E5534B' }} />
                ) : status === 'listening' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 14 14" />
                  </svg>
                )}
              </div>

              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#FDFCF9',
                  letterSpacing: '0.02em',
                }}
              >
                {getStatusText()}
              </span>

              {/* Click to send spoken answer immediately */}
              {interimText && (
                <button
                  type="button"
                  onClick={finalizeSpeech}
                  style={{
                    marginLeft: '4px',
                    padding: '5px 14px',
                    background: '#4EAA78',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '16px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Done Speaking ↵
                </button>
              )}

              {/* Push-to-Talk / Audio Recording finish button */}
              {isRecordingAudio && (
                <button
                  type="button"
                  onClick={() => stopAudioRecording()}
                  style={{
                    marginLeft: '4px',
                    padding: '5px 14px',
                    background: '#E5534B',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '16px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 0 10px rgba(229, 83, 75, 0.5)',
                  }}
                >
                  Send Recording ✓
                </button>
              )}

              {/* Record with Whisper button if user is listening but wants crystal clear Whisper */}
              {!isRecordingAudio && status !== 'speaking' && (
                <button
                  type="button"
                  onClick={() => startAudioRecording()}
                  title="Record your answer with Groq Whisper for highest accuracy"
                  style={{
                    marginLeft: '4px',
                    padding: '5px 12px',
                    background: '#252A20',
                    color: '#B6BDAD',
                    border: '1px solid #363E2F',
                    borderRadius: '16px',
                    fontSize: '0.76rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E5534B' }} />
                  Record Audio
                </button>
              )}

              {/* Tap to Speak toggle if mic is dormant */}
              {!isListening && !isRecordingAudio && status !== 'speaking' && (
                <button
                  type="button"
                  onClick={startListening}
                  style={{
                    marginLeft: '4px',
                    padding: '5px 14px',
                    background: '#4EAA78',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '16px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  🎙️ Tap to Speak
                </button>
              )}

              {/* Interrupt button if interviewer is speaking and user wants to answer now */}
              {status === 'speaking' && (
                <button
                  type="button"
                  onClick={startListening}
                  style={{
                    marginLeft: '4px',
                    padding: '5px 14px',
                    background: '#2A3022',
                    color: '#B6BDAD',
                    border: '1px solid #363E2F',
                    borderRadius: '16px',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Answer Now
                </button>
              )}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Interview Dialogue & Unified Dark Input Console */}
        <section
          aria-label="Interview Dialogue and Responses"
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#1A1D16',
            borderRadius: '16px',
            border: '1px solid #2A3022',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          {/* Header Persona Pill */}
          <div
            style={{
              padding: '14px 20px',
              background: '#161912',
              borderBottom: '1px solid #2A3022',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: '#252A20',
                  border: '1px solid #363E2F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#B28B6A',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: '0.92rem', fontWeight: 600, margin: 0, color: '#FDFCF9' }}>
                  {company} Interviewer
                </h2>
                <span style={{ fontSize: '0.78rem', color: '#808877' }}>Live Adaptive Dialogue</span>
              </div>
            </div>

            {/* Audio Wave Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span
                style={{
                  width: '3px',
                  height: status === 'speaking' || status === 'listening' || isRecordingAudio ? '18px' : '6px',
                  background: statusColor,
                  borderRadius: '2px',
                  transition: 'height 0.2s',
                }}
              />
              <span
                style={{
                  width: '3px',
                  height: status === 'speaking' || status === 'listening' || isRecordingAudio ? '24px' : '8px',
                  background: statusColor,
                  borderRadius: '2px',
                  transition: 'height 0.2s',
                }}
              />
              <span
                style={{
                  width: '3px',
                  height: status === 'speaking' || status === 'listening' || isRecordingAudio ? '14px' : '5px',
                  background: statusColor,
                  borderRadius: '2px',
                  transition: 'height 0.2s',
                }}
              />
            </div>
          </div>

          {/* Transcript Dialogue Feed */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '18px 20px',
              minHeight: 0,
            }}
          >
            <TranscriptLog entries={transcript} interimText={interimText} />
          </div>

          {/* Error banners if speech fails */}
          {error && (
            <div
              style={{
                padding: '10px 16px',
                background: '#3A1E1D',
                color: '#FFB8B0',
                fontSize: '0.8rem',
                borderTop: '1px solid #6E2D27',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={() => startAudioRecording()}
                style={{
                  padding: '3px 10px',
                  background: '#6E2D27',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Try Whisper Recording
              </button>
            </div>
          )}

          {/* Bottom Styled Dark Answer Input Console */}
          <div
            style={{
              padding: '14px 18px',
              background: '#151811',
              borderTop: '1px solid #2A3022',
            }}
          >
            <TypeInsteadInput onSubmit={submitTypedAnswer} disabled={busy} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '8px',
                padding: '0 4px',
                fontSize: '0.75rem',
                color: '#66705D',
              }}
            >
              <span>
                {isRecordingAudio
                  ? '🔴 Recording audio (Whisper STT)...'
                  : isListening
                  ? '🎙️ Mic listening · Speak anytime'
                  : 'Mic ready · Tap to Speak or type'}
              </span>
              <span>Press <strong style={{ color: '#808877' }}>Enter ↵</strong> to submit</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
