import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { startCodingSession, sendCodingTurn, sendCodingSnapshot } from '../../api/codingInterview';
import { useVoiceConversation } from '../../hooks/useVoiceConversation';
import type { CodingProblem } from '../../types/interview';
import { ProblemStatementPanel } from './ProblemStatementPanel';
import { CodeEditor } from './CodeEditor';
import { VoiceConversationPanel } from '../voice/VoiceConversationPanel';

export function CodingRoundPage() {
  const [searchParams] = useSearchParams();
  const company = searchParams.get('company') ?? 'Google';
  const role = searchParams.get('role') ?? 'Software Engineer';
  const level = searchParams.get('level') ?? 'Mid-Level';
  const navigate = useNavigate();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [problem, setProblem] = useState<CodingProblem | null>(null);
  const [code, setCode] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Toggle browser native fullscreen mode
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.warn('Error attempting to enable fullscreen:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch((err) => {
          console.warn('Error attempting to exit fullscreen:', err);
        });
      }
    }
  }, []);

  // Listen to fullscreen changes (e.g. if user presses Esc)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const onSubmit = useCallback(
    async (text: string) => {
      if (!sessionId) throw new Error('No active session');
      const turn = await sendCodingTurn(sessionId, text, code);
      return turn.interviewer_response;
    },
    [sessionId, code]
  );

  const conversation = useVoiceConversation({ onSubmit });

  useEffect(() => {
    if (!sessionId || !code) return;
    const timeout = setTimeout(async () => {
      if (conversation.status !== 'idle') return;
      try {
        const res = await sendCodingSnapshot(sessionId, code);
        if (res.status === 'triggered' && res.signal?.message_to_candidate) {
          conversation.announceOpening(res.signal.message_to_candidate);
        }
      } catch (err) {
        console.error('Live Intel error:', err);
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, [sessionId, code, conversation]);

  useEffect(() => {
    headingRef.current?.focus();

    let cancelled = false;
    startCodingSession(level, role).then((res) => {
      if (cancelled) return;
      setSessionId(res.session_id);
      setProblem(res.problem);
      setCode(res.problem.starter_code);
      conversation.announceOpening(res.opening_line);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  return (
    <main
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        background: '#12150E',
        color: '#FDFCF9',
        padding: '12px 16px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Streamlined Edge-to-Edge Top Header */}
      <header
        style={{
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          background: '#1A1D16',
          padding: '8px 16px',
          borderRadius: '12px',
          border: '1px solid #2A3022',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1
            ref={headingRef}
            tabIndex={-1}
            style={{
              fontSize: '1.15rem',
              fontFamily: 'var(--font-family-heading)',
              margin: 0,
              fontWeight: 600,
              color: '#FDFCF9',
            }}
          >
            Technical Coding Interview
          </h1>
          <span style={{ color: '#47523E' }}>|</span>
          <p style={{ color: '#808877', fontSize: '0.82rem', margin: 0 }}>
            {company} · {role} · {level}
          </p>
        </div>

        {/* Right Controls: Timer, Fullscreen Toggle, End Interview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Mock Timer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#B6BDAD',
              background: '#252A20',
              padding: '4px 12px',
              borderRadius: '16px',
              border: '1px solid #363E2F',
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.85rem',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>45:00</span>
          </div>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              background: isFullscreen ? '#2D3525' : '#252A20',
              color: isFullscreen ? '#4EAA78' : '#B6BDAD',
              border: `1px solid ${isFullscreen ? '#4EAA78' : '#363E2F'}`,
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#FDFCF9';
              e.currentTarget.style.borderColor = '#6C7A63';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = isFullscreen ? '#4EAA78' : '#B6BDAD';
              e.currentTarget.style.borderColor = isFullscreen ? '#4EAA78' : '#363E2F';
            }}
          >
            {isFullscreen ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                </svg>
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
                <span>Full Screen</span>
              </>
            )}
          </button>

          {/* End Interview Button */}
          <button
            onClick={() => {
              const sessionData = {
                sessionId,
                company,
                role,
                level,
                round_type: 'coding',
                transcript: conversation.transcript,
                code,
              };
              try {
                sessionStorage.setItem('last_interview_session', JSON.stringify(sessionData));
              } catch (e) {}
              navigate('/results', { state: sessionData });
            }}
            style={{
              padding: '5px 14px',
              background: 'var(--color-error, #D9534F)',
              color: '#FFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
          >
            End Interview
          </button>

        </div>
      </header>

      {!problem ? (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span className="animate-safe" style={{ color: '#808877' }}>
            Preparing coding environment...
          </span>
        </div>
      ) : (
        /* Full-Screen Two-Column Layout */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(420px, 38%) 1fr',
            gap: '14px',
            flex: 1,
            minHeight: 0,
            height: 'calc(100% - 56px)',
          }}
        >
          {/* Left Column: Interviewer Speaking Panel & Problem Statement */}
          <div
            style={{
              display: 'grid',
              gridTemplateRows: '1.15fr 1fr',
              gap: '14px',
              minHeight: 0,
              height: '100%',
            }}
          >
            {/* Top: Spacious Interviewer Speaking & Voice Panel */}
            <div style={{ minHeight: 0, height: '100%' }}>
              <VoiceConversationPanel conversation={conversation} />
            </div>

            {/* Bottom: Generous, fully visible Problem Statement Panel */}
            <div style={{ minHeight: 0, height: '100%' }}>
              <ProblemStatementPanel problem={problem} />
            </div>
          </div>

          {/* Right Column: Code Editor & Execution Sandbox */}
          <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <CodeEditor
              code={code}
              language={problem.language}
              problemTitle={problem.title}
              problemId={problem.id}
              onChange={setCode}
            />
          </div>
        </div>
      )}
    </main>
  );
}
