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
  const headingRef = useRef<HTMLHeadingElement>(null);

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
        console.error("Live Intel error:", err);
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
    <main style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#12150E', color: '#FDFCF9', padding: '24px' }}>
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 ref={headingRef} tabIndex={-1} style={{ fontSize: '1.5rem', fontFamily: 'var(--font-family-heading)', margin: 0, fontWeight: 500, color: '#FDFCF9' }}>
            Technical Interview
          </h1>
          <p style={{ color: '#808877', fontSize: '0.9rem', marginTop: '4px' }}>
            {company} · {role} · {level}
          </p>
        </div>
        
        {/* Mock Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#808877', fontFamily: 'var(--font-family-mono)', fontSize: '1.1rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>45:00</span>
        </div>
        
        <button 
          onClick={() => navigate('/results')}
          style={{
            marginLeft: '16px',
            padding: '8px 16px',
            background: 'var(--color-error, #D9534F)',
            color: '#FFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.opacity = '0.8'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}
        >
          End Interview
        </button>
      </header>

      {!problem ? (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span className="animate-safe" style={{ color: '#808877' }}>Preparing environment...</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', flex: 1, minHeight: 0 }}>
          
          {/* Left Column: Interviewer & Problem */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minHeight: 0 }}>
            <div style={{ flex: '0 0 auto', height: '380px' }}>
              <VoiceConversationPanel conversation={conversation} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <ProblemStatementPanel problem={problem} />
            </div>
          </div>

          {/* Right Column: IDE */}
          <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <CodeEditor
              code={code}
              language={problem.language}
              problemTitle={problem.title}
              onChange={setCode}
            />
          </div>

        </div>
      )}
    </main>
  );
}

