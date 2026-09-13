import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function PrepScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const company = searchParams.get('company');
  const role = searchParams.get('role');
  const level = searchParams.get('level');
  const mode = searchParams.get('mode') || 'coding';
  
  const [micGranted, setMicGranted] = useState<boolean | null>(null);
  const [cameraGranted, setCameraGranted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const requestPermissions = async () => {
    setLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMicGranted(true);
      setCameraGranted(true);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Permission denied or device not found", err);
      // Determine what failed if possible, for now just set false
      setMicGranted(false);
      setCameraGranted(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestPermissions();
    return () => {
      // Clean up video stream when leaving prep screen
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleEnter = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    // Navigate to the actual interview mode
    navigate(`/${mode}?${searchParams.toString()}`);
  };

  const allReady = micGranted && cameraGranted;

  const expectations = [
    { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>, text: 'Conversational interview with follow-ups' },
    { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, text: 'Realistic pacing and time pressure' },
    { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>, text: 'Resume-aware questions' },
    { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, text: 'Detailed performance feedback afterward' },
  ];

  return (
    <div className="fs-prep">
      {/* Background organic shapes */}
      <div style={{ position: 'fixed', top: '-20%', right: '-10%', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,122,99,0.03) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div className="fs-prep__inner">
        <header className="fs-prep__header">
          <span className="fs-prep__eyebrow">Almost there</span>
          <h1 className="fs-prep__title">Interview Ready</h1>
          <div className="fs-prep__meta">
            <span className="fs-prep__meta-tag">{company}</span>
            <span className="fs-prep__meta-sep">·</span>
            <span className="fs-prep__meta-tag">{role}</span>
            <span className="fs-prep__meta-sep">·</span>
            <span className="fs-prep__meta-tag">{level}</span>
            <span className="fs-prep__meta-sep">·</span>
            <span className="fs-prep__meta-tag">{mode === 'coding' ? 'Technical' : 'ML'}</span>
          </div>
        </header>

        <div className="fs-prep__grid">
          {/* Expectations */}
          <section className="fs-prep__card">
            <h2 className="fs-prep__card-title">What to expect</h2>
            <div className="fs-prep__expectations">
              {expectations.map((e, i) => (
                <div key={i} className="fs-prep__expect-item">
                  <span className="fs-prep__expect-icon">{e.icon}</span>
                  <span className="fs-prep__expect-text">{e.text}</span>
                </div>
              ))}
            </div>
            <div className="fs-prep__camera-notice">
              <h3>Camera Feedback</h3>
              <p>FlowState uses observable visual cues during the interview (e.g., eye contact, face visibility) to provide feedback on interview presence and communication.</p>
            </div>
          </section>

          {/* Device Check */}
          <section className="fs-prep__card fs-prep__card--device">
            <h2 className="fs-prep__card-title">Device Check</h2>
            
            <div className="fs-prep__video-wrap">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="fs-prep__video"
              />
              {loading && <span className="fs-prep__video-status">Checking devices...</span>}
              {!loading && !cameraGranted && <span className="fs-prep__video-status fs-prep__video-status--error">Camera not found</span>}
              {!loading && cameraGranted && (
                <div className="fs-prep__video-badge">
                  <div className="fs-prep__video-badge-dot" />
                  LIVE
                </div>
              )}
            </div>

            <div className="fs-prep__devices">
              <div className="fs-prep__device-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>
                  Microphone
                </span>
                <span className={`fs-prep__device-status ${micGranted ? 'ready' : 'error'}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {micGranted ? (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Ready</>
                  ) : (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Check Access</>
                  )}
                </span>
              </div>
              <div className="fs-prep__device-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  Camera
                </span>
                <span className={`fs-prep__device-status ${cameraGranted ? 'ready' : 'error'}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {cameraGranted ? (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Ready</>
                  ) : (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Check Access</>
                  )}
                </span>
              </div>
            </div>

            {!allReady && !loading && (
              <button className="fs-prep__retry-btn" onClick={requestPermissions}>
                Retry Permissions
              </button>
            )}

            <button 
              className={`fs-prep__enter-btn ${allReady ? '' : 'disabled'}`}
              onClick={handleEnter}
              disabled={!allReady}
            >
              Enter interview room
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
